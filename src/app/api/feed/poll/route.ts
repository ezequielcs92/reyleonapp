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
        const question = (body.question as string)?.trim();
        if (!question) {
            return NextResponse.json({ error: 'La pregunta no puede estar vacía' }, { status: 400 });
        }

        const options = (body.options as string[]).map((o: string) => o.trim()).filter(Boolean);
        if (options.length < 2) {
            return NextResponse.json({ error: 'Se necesitan al menos 2 opciones' }, { status: 400 });
        }

        const { data: profile } = await supabase
            .from('users').select('full_name').eq('uid', user.id).single();

        const { data: poll, error: pollError } = await supabase
            .from('polls')
            .insert({
                creator_id: user.id,
                creator_name: profile?.full_name || user.user_metadata?.full_name || 'Usuario',
                question,
                type: body.type || 'single',
                is_anonymous: body.isAnonymous === true,
                show_results: 'always',
                closes_at: body.closesAt || null,
                pinned: false,
                total_votes: 0,
            })
            .select().single();

        if (pollError) {
            return NextResponse.json({ error: pollError.message, code: pollError.code }, { status: 500 });
        }

        const { error: optErr } = await supabase.from('poll_options').insert(
            options.map((text: string, i: number) => ({ poll_id: poll.id, text, votes_count: 0, position: i }))
        );
        if (optErr) {
            return NextResponse.json({ error: optErr.message, code: optErr.code }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al crear encuesta';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
