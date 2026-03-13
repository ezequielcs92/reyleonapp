'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i += 1) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

export default function PushNotificationsInit() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
            return;
        }

        if (window.localStorage.getItem('push-disabled') === '1') {
            return;
        }

        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) return;

        const setupPush = async () => {
            const registration = await navigator.serviceWorker.register('/sw.js');

            let permission = Notification.permission;
            if (permission === 'default') {
                const alreadyAsked = window.localStorage.getItem('push-permission-asked') === '1';
                if (!alreadyAsked) {
                    permission = await Notification.requestPermission();
                    window.localStorage.setItem('push-permission-asked', '1');
                }
            }

            if (permission !== 'granted') return;

            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
                });
            }

            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: subscription.toJSON() }),
            });
        };

        setupPush().catch((error) => {
            console.error('Push setup error:', error);
        });
    }, [user]);

    return null;
}
