import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { syncBirthdayNotificationsForToday } from '@/lib/notifications';

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();

        if (authErr || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        await syncBirthdayNotificationsForToday();

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al sincronizar cumpleanos';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
