import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();

        if (authErr || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const [{ data, error }, { count, error: countError }] = await Promise.all([
            supabase
                .from('notifications')
                .select('id, type, title, message, link, read, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(40),
            supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('read', false),
        ]);

        if (error) {
            if (/notifications/i.test(error.message) && /does not exist/i.test(error.message)) {
                return NextResponse.json({ notifications: [], unread: 0 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (countError) {
            if (/notifications/i.test(countError.message) && /does not exist/i.test(countError.message)) {
                return NextResponse.json({ notifications: data || [], unread: 0 });
            }
            return NextResponse.json({ error: countError.message }, { status: 500 });
        }

        return NextResponse.json({
            notifications: data || [],
            unread: count || 0,
        });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al cargar notificaciones';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
