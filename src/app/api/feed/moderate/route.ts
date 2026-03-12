import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
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
            return NextResponse.json({ error: 'Solo admin puede moderar el feed.' }, { status: 403 });
        }

        const body = await request.json();
        const itemType = body.itemType as 'post' | 'poll';
        const id = body.id as string;
        const action = body.action as 'hide' | 'restore' | 'delete';

        if (!id || !['post', 'poll'].includes(itemType) || !['hide', 'restore', 'delete'].includes(action)) {
            return NextResponse.json({ error: 'Datos invalidos para moderar.' }, { status: 400 });
        }

        const table = itemType === 'post' ? 'posts' : 'polls';
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        if (action === 'delete') {
            const { error } = await adminSupabase.from(table).delete().eq('id', id);
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        } else {
            const hidden = action === 'hide';
            const { error } = await adminSupabase.from(table).update({ hidden_by_admin: hidden }).eq('id', id);
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { error: logError } = await supabase.from('admin_feed_actions').insert({
            admin_id: user.id,
            target_type: itemType,
            target_id: id,
            action,
        });

        if (logError) {
            console.error('Admin feed action log error:', logError);
        }

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al moderar contenido.';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
