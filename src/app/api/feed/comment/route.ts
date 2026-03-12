import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const body = await request.json();
        const content = (body.content as string)?.trim();
        const postId = body.postId as string;

        if (!content) {
            return NextResponse.json({ error: 'El comentario no puede estar vacío' }, { status: 400 });
        }
        if (!postId) {
            return NextResponse.json({ error: 'ID de publicación es requerido' }, { status: 400 });
        }

        const { data: profile } = await supabase
            .from('users').select('full_name, photo_url').eq('uid', user.id).single();

        const { data: comment, error } = await supabase.from('post_comments').insert({
            post_id: postId,
            user_id: user.id,
            user_name: profile?.full_name || user.user_metadata?.full_name || 'Usuario',
            user_photo_url: profile?.photo_url || null,
            content,
        }).select().single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, comment });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al comentar';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
