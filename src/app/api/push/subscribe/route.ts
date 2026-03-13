import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

type SubscriptionBody = {
    subscription?: {
        endpoint?: string;
        keys?: {
            p256dh?: string;
            auth?: string;
        };
    };
};

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();

        if (authErr || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const body = (await req.json()) as SubscriptionBody;
        const endpoint = body.subscription?.endpoint?.trim();
        const p256dh = body.subscription?.keys?.p256dh?.trim();
        const auth = body.subscription?.keys?.auth?.trim();

        if (!endpoint || !p256dh || !auth) {
            return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
        }

        const userAgent = req.headers.get('user-agent') || null;

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert(
                {
                    user_id: user.id,
                    endpoint,
                    p256dh,
                    auth,
                    user_agent: userAgent,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'endpoint' }
            );

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error guardando suscripción push';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
