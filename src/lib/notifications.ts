import { createClient as createAdminClient } from '@supabase/supabase-js';

type NotifyAllUsersInput = {
    type: 'post_pinned' | 'poll_pinned' | 'event_created' | 'birthday';
    title: string;
    message: string;
    link?: string | null;
    actorId?: string | null;
    dedupeKey?: string | null;
};

function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error('Faltan variables de entorno de Supabase para notificaciones');
    }

    return createAdminClient(url, serviceKey);
}

export async function notifyAllUsers(input: NotifyAllUsersInput) {
    const adminSupabase = getAdminSupabase();

    const { data: users, error: usersError } = await adminSupabase
        .from('users')
        .select('uid');

    if (usersError) {
        throw new Error(usersError.message);
    }

    const recipients = (users || []).filter(u => !input.actorId || u.uid !== input.actorId);
    if (recipients.length === 0) return;

    const rows = recipients.map((u) => ({
        user_id: u.uid,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link || null,
        read: false,
        dedupe_key: input.dedupeKey ? `${input.dedupeKey}:${u.uid}` : null,
    }));

    const { error: insertError } = await adminSupabase
        .from('notifications')
        .upsert(rows, { onConflict: 'dedupe_key', ignoreDuplicates: true });

    if (insertError) {
        throw new Error(insertError.message);
    }
}

export async function syncBirthdayNotificationsForToday() {
    const adminSupabase = getAdminSupabase();

    const { data: users, error } = await adminSupabase
        .from('users')
        .select('uid, full_name, birthdate')
        .not('birthdate', 'is', null);

    if (error) {
        throw new Error(error.message);
    }

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();
    const dateKey = now.toISOString().slice(0, 10);

    const birthdays = (users || []).filter((u) => {
        const birth = new Date(`${u.birthdate}T12:00:00Z`);
        return birth.getUTCMonth() === month && birth.getUTCDate() === day;
    });

    for (const birthdayUser of birthdays) {
        await notifyAllUsers({
            type: 'birthday',
            title: 'Cumpleanos del elenco',
            message: `Hoy cumple ${birthdayUser.full_name}. Saludalo cuando lo veas en el teatro.`,
            link: '/feed',
            dedupeKey: `birthday:${dateKey}:${birthdayUser.uid}:${year}`,
        });
    }
}
