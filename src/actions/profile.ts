'use server';
import { createClient } from '@/lib/supabase-server';

export async function updateProfile(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return { error: 'No autenticado' };

        const full_name = (formData.get('full_name') as string)?.trim();
        if (!full_name) return { error: 'El nombre es obligatorio' };

        const { error } = await supabase.from('users').update({
            full_name,
            stage_name: (formData.get('stage_name') as string)?.trim() || null,
            bio: (formData.get('bio') as string)?.trim() || null,
            role_in_show: (formData.get('role_in_show') as string)?.trim() || null,
            birthdate: (formData.get('birthdate') as string)?.trim() || null,
        }).eq('uid', user.id);

        if (error) return { error: error.message };
        return { success: true };
    } catch (e: any) {
        return { error: e?.message || 'Error al actualizar perfil' };
    }
}

export async function addLink(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return { error: 'No autenticado' };

        const type = (formData.get('type') as string)?.trim();
        const label = (formData.get('label') as string)?.trim();
        const url = (formData.get('url') as string)?.trim();

        if (!type || !label || !url) return { error: 'Todos los campos son obligatorios' };

        const { error } = await supabase.from('user_links').insert({
            user_id: user.id, type, label, url,
        });

        if (error) return { error: error.message };
        return { success: true };
    } catch (e: any) {
        return { error: e?.message || 'Error al agregar link' };
    }
}

export async function deleteLink(linkId: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return { error: 'No autenticado' };

        const { error } = await supabase.from('user_links')
            .delete().eq('id', linkId).eq('user_id', user.id);

        if (error) return { error: error.message };
        return { success: true };
    } catch (e: any) {
        return { error: e?.message || 'Error al eliminar link' };
    }
}

export async function addWork(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return { error: 'No autenticado' };

        const title = (formData.get('title') as string)?.trim();
        const year = parseInt(formData.get('year') as string, 10);
        const company = (formData.get('company') as string)?.trim();
        const role = (formData.get('role') as string)?.trim();
        const link = (formData.get('link') as string)?.trim() || null;

        if (!title || !year || !company || !role) return { error: 'Completá los campos obligatorios' };

        const { error } = await supabase.from('user_work').insert({
            user_id: user.id, title, year, company, role, link,
        });

        if (error) return { error: error.message };
        return { success: true };
    } catch (e: any) {
        return { error: e?.message || 'Error al agregar trabajo' };
    }
}

export async function deleteWork(workId: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return { error: 'No autenticado' };

        const { error } = await supabase.from('user_work')
            .delete().eq('id', workId).eq('user_id', user.id);

        if (error) return { error: error.message };
        return { success: true };
    } catch (e: any) {
        return { error: e?.message || 'Error al eliminar trabajo' };
    }
}
