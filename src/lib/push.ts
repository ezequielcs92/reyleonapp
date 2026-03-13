import 'server-only';

import webpush from 'web-push';
import { createClient as createAdminClient } from '@supabase/supabase-js';

type PushPayload = {
    title: string;
    body: string;
    url: string;
};

function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error('Faltan variables de entorno de Supabase para push');
    }

    return createAdminClient(url, serviceKey);
}

function configureWebPush() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

    if (!publicKey || !privateKey) {
        throw new Error('Faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY');
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
}

async function sendPushToAllUsers(payload: PushPayload, excludeUserId?: string) {
    configureWebPush();
    const adminSupabase = getAdminSupabase();

    const query = adminSupabase
        .from('push_subscriptions')
        .select('id, user_id, endpoint, p256dh, auth');

    const { data: subscriptions, error } = excludeUserId
        ? await query.neq('user_id', excludeUserId)
        : await query;

    if (error) {
        throw new Error(error.message);
    }

    if (!subscriptions || subscriptions.length === 0) return;

    const serializedPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url,
        icon: '/web-app-manifest-192x192.svg',
        badge: '/web-app-manifest-192x192.svg',
    });

    const staleIds: string[] = [];

    await Promise.all(
        subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        },
                    },
                    serializedPayload
                );
            } catch (error: unknown) {
                const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
                    ? Number((error as { statusCode?: number }).statusCode)
                    : 0;

                if (statusCode === 404 || statusCode === 410) {
                    staleIds.push(sub.id);
                }
            }
        })
    );

    if (staleIds.length > 0) {
        await adminSupabase
            .from('push_subscriptions')
            .delete()
            .in('id', staleIds);
    }
}

export async function sendCalendarEventPush(title: string, eventId: string | null, actorId?: string) {
    await sendPushToAllUsers(
        {
            title: 'Nuevo evento en calendario',
            body: `Se agregó "${title}" al calendario del elenco.`,
            url: eventId ? `/calendario/${eventId}` : '/calendario',
        },
        actorId
    );
}
