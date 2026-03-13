import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

type UnsubscribeBody = {
    endpoint?: string;
};

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();

        if (authErr || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const body = (await req.json().catch(() => ({}))) as UnsubscribeBody;
        const endpoint = body.endpoint?.trim();

        let query = supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id);

        if (endpoint) {
            query = query.eq('endpoint', endpoint);
        }

        const { error } = await query;
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error al desuscribir push';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
