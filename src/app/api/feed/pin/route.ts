import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { notifyAllUsers } from '@/lib/notifications';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();

        if (authErr || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { data: adminData } = await supabase
            .from('admins')
            .select('uid')
            .eq('uid', user.id)
            .single();

        if (!adminData) {
            return NextResponse.json({ error: 'Solo admin puede fijar o desfijar.' }, { status: 403 });
        }

        const body = await request.json();
        const itemType = body.itemType as 'post' | 'poll';
        const id = body.id as string;
        const pinned = Boolean(body.pinned);

        if (!id || (itemType !== 'post' && itemType !== 'poll')) {
            return NextResponse.json({ error: 'Datos invalidos para fijar.' }, { status: 400 });
        }

        const table = itemType === 'post' ? 'posts' : 'polls';
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error: updateError } = await adminSupabase
            .from(table)
            .update({ pinned })
            .eq('id', id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        const { error: logError } = await supabase.from('admin_feed_actions').insert({
            admin_id: user.id,
            target_type: itemType,
            target_id: id,
            action: pinned ? 'pin' : 'unpin',
        });

        if (logError) {
            console.error('Admin pin log error:', logError);
        }

        if (pinned) {
            try {
                await notifyAllUsers({
                    type: itemType === 'post' ? 'post_pinned' : 'poll_pinned',
                    title: itemType === 'post' ? 'Publicacion fijada' : 'Encuesta fijada',
                    message: itemType === 'post'
                        ? 'Un administrador fijo una publicacion importante en el feed.'
                        : 'Un administrador fijo una encuesta importante en el feed.',
                    link: '/feed',
                    actorId: user.id,
                });
            } catch (notifyError) {
                console.error('Error enviando notificacion de pin:', notifyError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al fijar/desfijar.';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
