'use server';

import { createClient } from '@/lib/supabase-server';

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

        const { data, error } = await supabase.from('businesses').insert({
            owner_id: user.id,
            name,
            description,
            category_id,
            contact_phone: contact_phone || null,
            instagram_url: instagram_url || null,
            website_url: website_url || null,
        }).select().single();

        if (error) return { error: error.message };
        return { success: true, data };
    } catch (e: any) {
        return { error: e?.message || 'Error al agregar negocio' };
    }
}

export async function deleteBusiness(id: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return { error: 'No autenticado' };

        const { error } = await supabase.from('businesses').delete()
            .eq('id', id).eq('owner_id', user.id);

        if (error) return { error: error.message };
        return { success: true };
    } catch (e: any) {
        return { error: e?.message || 'Error al eliminar el negocio' };
    }
}
