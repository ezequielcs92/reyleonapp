'use server';
import { createClient } from '@/lib/supabase-server';

export async function createPost(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return { error: 'No autenticado' };

        const description = (formData.get('description') as string)?.trim();
        if (!description) return { error: 'El mensaje no puede estar vacío' };

        const { data: profile } = await supabase
            .from('users').select('full_name, photo_url').eq('uid', user.id).single();

        const { error } = await supabase.from('posts').insert({
            author_id: user.id,
            author_name: profile?.full_name || user.user_metadata?.full_name || 'Usuario',
            author_photo_url: profile?.photo_url || null,
            description,
            likes_count: 0,
            pinned: false,
        });

        if (error) return { error: error.message };
        return { success: true };
    } catch (e: any) {
        return { error: e?.message || 'Error al publicar' };
    }
}

export async function createPoll(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return { error: 'No autenticado' };

        const question = (formData.get('question') as string)?.trim();
        if (!question) return { error: 'La pregunta no puede estar vacía' };

        const options = (formData.getAll('option') as string[]).map(o => o.trim()).filter(Boolean);
        if (options.length < 2) return { error: 'Se necesitan al menos 2 opciones' };

        const { data: profile } = await supabase
            .from('users').select('full_name').eq('uid', user.id).single();

        const { data: poll, error: pollError } = await supabase
            .from('polls')
            .insert({
                creator_id: user.id,
                creator_name: profile?.full_name || user.user_metadata?.full_name || 'Usuario',
                question,
                type: (formData.get('type') as string) || 'single',
                is_anonymous: formData.get('isAnonymous') === 'true',
                show_results: 'always',
                pinned: false,
                total_votes: 0,
            })
            .select().single();

        if (pollError) return { error: pollError.message };

        const { error: optErr } = await supabase.from('poll_options').insert(
            options.map((text, i) => ({ poll_id: poll.id, text, votes_count: 0, position: i }))
        );
        if (optErr) return { error: optErr.message };
        return { success: true };
    } catch (e: any) {
        return { error: e?.message || 'Error al crear encuesta' };
    }
}
