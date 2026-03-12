import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import BottomNav from '@/components/layout/BottomNav';
import ErrorBoundary from '@/components/ErrorBoundary';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/login');
    }

    return (
        <div style={{ minHeight: '100dvh', background: '#0c0a08' }}>
            <div style={{ paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}>
                <ErrorBoundary>{children}</ErrorBoundary>
            </div>
            <BottomNav />
        </div>
    );
}
