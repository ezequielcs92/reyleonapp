'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { notifyAllUsers } from '@/lib/notifications';
import { sendCalendarEventPush } from '@/lib/push';

function errorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) return error.message;
    return fallback;
}

export async function addCalendarEvent(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return { error: 'No autenticado' };

        // Verificar si es admin
        const { data: adminData } = await supabase
            .from('admins')
            .select('uid')
            .eq('uid', user.id)
            .single();

        if (!adminData) return { error: 'No tenés permisos de administrador' };

        const title = (formData.get('title') as string)?.trim();
        const description = (formData.get('description') as string)?.trim();
        const event_date = (formData.get('event_date') as string)?.trim();
        const type = (formData.get('type') as string)?.trim();

        if (!title || !event_date || !type) {
            return { error: 'Por favor completá los campos obligatorios.' };
        }

        const { data: createdEvent, error } = await supabase.from('calendar_events').insert({
            title,
            description: description || null,
            event_date,
            type,
            created_by: user.id
        }).select('id').single();

        if (error) return { error: error.message };

        try {
            await notifyAllUsers({
                type: 'event_created',
                title: 'Nuevo evento en calendario',
                message: `Se agrego "${title}" al calendario del elenco.`,
                link: createdEvent?.id ? `/calendario/${createdEvent.id}` : '/calendario',
                actorId: user.id,
            });
        } catch (notifyError) {
            console.error('Error notificando nuevo evento:', notifyError);
        }

        try {
            await sendCalendarEventPush(title, createdEvent?.id || null, user.id);
        } catch (pushError) {
            console.error('Error enviando push de evento:', pushError);
        }
        
        revalidatePath('/calendario');
        return { success: true };
    } catch (e: unknown) {
        return { error: errorMessage(e, 'Error al agregar evento') };
    }
}

export async function deleteCalendarEvent(id: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return { error: 'No autenticado' };

        // Verificar si es admin
        const { data: adminData } = await supabase
            .from('admins')
            .select('uid')
            .eq('uid', user.id)
            .single();

        if (!adminData) return { error: 'No tenés permisos de administrador' };

        const { error } = await supabase.from('calendar_events').delete().eq('id', id);

        if (error) return { error: error.message };
        
        revalidatePath('/calendario');
        return { success: true };
    } catch (e: unknown) {
        return { error: errorMessage(e, 'Error al eliminar el evento') };
    }
}
