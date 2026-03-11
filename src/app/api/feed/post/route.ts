import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const formData = await request.formData();
        const description = (formData.get('description') as string)?.trim();
        const imageFile = formData.get('image') as File | null;

        if (!description) {
            return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 });
        }

        let imageUrl = null;

        // Upload image if provided
        if (imageFile && imageFile.name) {
            // Use admin client to bypass storage RLS for uploading
            const adminSupabase = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `posts/${fileName}`; // Changed to a folder to keep it organized

            const arrayBuffer = await imageFile.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);

            const { data: uploadData, error: uploadError } = await adminSupabase.storage
                .from('post-images')
                .upload(filePath, buffer, {
                    contentType: imageFile.type,
                    upsert: true,
                });

            if (uploadError) {
                console.error('Image upload error:', uploadError);
                return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 });
            }

            const { data: urlData } = adminSupabase.storage
                .from('post-images')
                .getPublicUrl(filePath);

            imageUrl = urlData.publicUrl;
        }

        const { data: profile } = await supabase
            .from('users').select('full_name, photo_url').eq('uid', user.id).single();

        const { error } = await supabase.from('posts').insert({
            author_id: user.id,
            author_name: profile?.full_name || user.user_metadata?.full_name || 'Usuario',
            author_photo_url: profile?.photo_url || null,
            description,
            image_url: imageUrl,
            likes_count: 0,
            pinned: false,
        });

        if (error) {
            console.error('Insert post error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, image_url: imageUrl });
    } catch (e: any) {
        console.error('Create post exception:', e);
        return NextResponse.json({ error: e?.message || 'Error al publicar' }, { status: 500 });
    }
}
