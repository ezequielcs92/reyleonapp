import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/feed';

    // Construir la base URL de manera segura para Vercel
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
    const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : requestUrl.origin;

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${baseUrl}${next}`);
        }
    }

    return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_failed`);
}
