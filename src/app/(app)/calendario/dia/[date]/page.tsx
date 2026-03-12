'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
    Calendar as CalendarIcon, 
    ArrowLeft, 
    Music, 
    Star, 
    Cake,
    ChevronRight,
    Search
} from 'lucide-react';

type CalendarEvent = {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    type: string;
};

type UserProfile = {
    uid: string;
    full_name: string;
    photo_url: string | null;
};

export default function DayViewPage() {
    const { date } = useParams();
    const router = useRouter();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [birthdays, setBirthdays] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!date) return;

        (async () => {
            setLoading(true);
            
            // Load events for this specific day
            const { data: evData } = await supabase
                .from('calendar_events')
                .select('*')
                .gte('event_date', `${date}T00:00:00`)
                .lte('event_date', `${date}T23:59:59`);

            if (evData) setEvents(evData);

            // Load birthdays
            const [, m, d] = (date as string).split('-');
            const { data: bData } = await supabase
                .from('users')
                .select('uid, full_name, photo_url, birthdate')
                .not('birthdate', 'is', null);

            if (bData) {
                const dayBirthdays = bData.filter(u => {
                    const bDate = new Date(u.birthdate);
                    // Compare UTC day and month to match the calendar logic
                    return bDate.getUTCDate() === parseInt(d) && bDate.getUTCMonth() === (parseInt(m) - 1);
                });
                setBirthdays(dayBirthdays as UserProfile[]);
            }

            setLoading(false);
        })();
    }, [date]);

    // Use split to avoid timezone off-by-one errors in display
    const getFormattedDate = () => {
        if (!date) return '';
        const [y, m, d] = (date as string).split('-');
        const localDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        return localDate.toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    const formattedDate = getFormattedDate();

    return (
        <div className="day-view-root">
            <header className="day-header">
                <button onClick={() => router.back()} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <div className="header-info">
                    <span className="header-label">Eventos del día</span>
                    <h1 className="header-date">{formattedDate}</h1>
                </div>
            </header>

            <main className="day-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="loader"></div>
                        <p>Buscando actividades...</p>
                    </div>
                ) : (
                    <div className="results-list">
                        {events.length === 0 && birthdays.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon"><Search size={40} /></div>
                                <p>No hay eventos ni cumpleaños programados para este día.</p>
                                <button onClick={() => router.push('/calendario')} className="return-btn">Volver al Calendario</button>
                            </div>
                        ) : (
                            <>
                                {birthdays.length > 0 && (
                                    <section className="day-section">
                                        <h3 className="section-title">🎂 Cumpleaños</h3>
                                        <div className="cards-grid">
                                            {birthdays.map(b => (
                                                <Link href={`/calendario/cumple/${b.uid}`} key={b.uid} className="result-card-link">
                                                    <div className="result-card bday">
                                                        <div className="card-icon"><Cake size={20} /></div>
                                                        <div className="card-info">
                                                            <span className="card-title">¡Cumple de {b.full_name}!</span>
                                                            <span className="card-subtitle">Ver perfil de integrante</span>
                                                        </div>
                                                        <ChevronRight size={20} className="card-arrow" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {events.length > 0 && (
                                    <section className="day-section">
                                        <h3 className="section-title">📅 Actividades</h3>
                                        <div className="cards-grid">
                                            {events.map(e => (
                                                <Link href={`/calendario/${e.id}`} key={e.id} className="result-card-link">
                                                    <div className={`result-card ${e.type}`}>
                                                        <div className="card-icon">
                                                            {e.type === 'ensayo' ? <Music size={20} /> : e.type === 'funcion' ? <CalendarIcon size={20} /> : <Star size={20} />}
                                                        </div>
                                                        <div className="card-info">
                                                            <span className="card-title">{e.title}</span>
                                                            <span className="card-subtitle">{e.type.replace('_',' ').toUpperCase()}</span>
                                                        </div>
                                                        <ChevronRight size={20} className="card-arrow" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </>
                        )}
                    </div>
                )}
            </main>

            <style>{dayStyles}</style>
        </div>
    );
}

const dayStyles = `
    .day-view-root { min-height: 100dvh; background: #0c0a08; color: #fff; font-family: 'Poppins', sans-serif; padding-bottom: 40px; }
    .day-header {
        position: sticky; top: 0; z-index: 20;
        display: flex; align-items: center; gap: 16px;
        padding: 0 16px; height: 72px;
        background: rgba(12,10,8,0.9); backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .back-btn { background: transparent; border: none; color: #fff; cursor: pointer; padding: 8px; border-radius: 12px; }
    .header-info { display: flex; flex-direction: column; }
    .header-label { font-size: 0.7rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; }
    .header-date { font-size: 1rem; font-weight: 700; margin: 0; color: #d4a017; text-transform: capitalize; }

    .day-content { padding: 20px 16px; }
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 60px; }
    .loader { width: 30px; height: 30px; border: 2px solid rgba(212,160,23,0.1); border-top-color: #d4a017; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .day-section { margin-bottom: 30px; }
    .section-title { font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.3); margin-bottom: 12px; padding-left: 4px; border-left: 3px solid #d4a017; padding-left: 10px; }
    
    .results-list { display: flex; flex-direction: column; gap: 12px; }
    .cards-grid { display: flex; flex-direction: column; gap: 12px; }
    .result-card-link { text-decoration: none; display: block; }
    .result-card {
        display: flex; align-items: center; gap: 16px;
        padding: 16px; border-radius: 18px;
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        transition: all 0.2s ease;
    }
    .result-card:active { transform: scale(0.98); background: rgba(255,255,255,0.05); }
    
    .card-icon {
        width: 44px; height: 44px; border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
    }
    .ensayo .card-icon { background: rgba(66, 133, 244, 0.15); color: #4285f4; }
    .funcion .card-icon { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .fecha_importante .card-icon { background: rgba(234, 67, 53, 0.15); color: #ea4335; }
    .bday .card-icon { background: rgba(255, 188, 5, 0.15); color: #FBBC05; }
    .evento .card-icon { background: rgba(52, 168, 83, 0.15); color: #34a853; }

    .card-info { flex: 1; display: flex; flex-direction: column; }
    .card-title { font-size: 0.95rem; font-weight: 600; color: #fff; }
    .card-subtitle { font-size: 0.75rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
    .card-arrow { color: rgba(255,255,255,0.15); }

    .empty-state {
        display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 40px;
    }
    .empty-icon { color: rgba(255,255,255,0.05); margin-bottom: 20px; }
    .empty-state p { color: rgba(255,255,255,0.4); font-size: 0.9rem; line-height: 1.5; margin-bottom: 24px; }
    .return-btn {
        background: rgba(212,160,23,0.1); border: 1px solid rgba(212,160,23,0.3);
        color: #d4a017; padding: 10px 20px; border-radius: 30px; font-weight: 600; font-size: 0.9rem;
        cursor: pointer;
    }
`;
