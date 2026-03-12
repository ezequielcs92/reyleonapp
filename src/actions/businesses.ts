'use server';

import { createClient } from '@/lib/supabase-server';

function errorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) return error.message;
    return fallback;
}

export async function addBusiness(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return { error: 'No autenticado' };

        const name = (formData.get('name') as string)?.trim();
        const description = (formData.get('description') as string)?.trim();
        const category_id = (formData.get('category_id') as string)?.trim();
        const contact_phone = (formData.get('contact_phone') as string)?.trim();
        const instagram_url = (formData.get('instagram_url') as string)?.trim();
        const website_url = (formData.get('website_url') as string)?.trim();

        if (!name || !description || !category_id) {
            return { error: 'Por favor completá los campos obligatorios (*).' };
        }

        let { data, error } = await supabase.from('businesses').insert({
            owner_id: user.id,
            name,
            description,
            category_id,
            contact_phone: contact_phone || null,
            instagram_url: instagram_url || null,
            website_url: website_url || null,
        }).select().single();

        // Compatibilidad con esquema antiguo que usa user_id en vez de owner_id
        if (error && /owner_id/i.test(error.message)) {
            const retry = await supabase.from('businesses').insert({
                user_id: user.id,
                name,
                description,
                category_id,
                contact_phone: contact_phone || null,
                instagram_url: instagram_url || null,
                website_url: website_url || null,
            }).select().single();

            data = retry.data;
            error = retry.error;
        }

        if (error) return { error: error.message };
        return { success: true, data };
    } catch (e: unknown) {
        return { error: errorMessage(e, 'Error al agregar negocio') };
    }
}

export async function deleteBusiness(id: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return { error: 'No autenticado' };

        let { error } = await supabase.from('businesses').delete()
            .eq('id', id).eq('owner_id', user.id);

        // Compatibilidad con esquema antiguo que usa user_id en vez de owner_id
        if (error && /owner_id/i.test(error.message)) {
            const retry = await supabase.from('businesses').delete()
                .eq('id', id).eq('user_id', user.id);
            error = retry.error;
        }

        if (error) return { error: error.message };
        return { success: true };
    } catch (e: unknown) {
        return { error: errorMessage(e, 'Error al eliminar el negocio') };
    }
}
