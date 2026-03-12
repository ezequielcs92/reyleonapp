'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar as CalendarIcon, Plus, Trash2, Clock, MapPin, Search } from 'lucide-react';

type Event = {
    id: string;
    title: string;
    description: string | null;
    start_time: string;
    location: string | null;
    type: string;
};

export default function AdminCalendarPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadEvents();
    }, []);

    async function loadEvents() {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('calendar_events')
                .select('*')
                .order('start_time', { ascending: false });
            if (data) setEvents(data);
        } catch (err) {
            console.error('Error loading events:', err);
        } finally {
            setLoading(false);
        }
    }

    async function deleteEvent(id: string) {
        if (!confirm('¿Eliminar este evento definitivamente?')) return;
        try {
            await supabase.from('calendar_events').delete().eq('id', id);
            setEvents(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            alert('Error al eliminar');
        }
    }

    const filtered = events.filter(e => 
        e.title.toLowerCase().includes(search.toLowerCase()) || 
        (e.location || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="admin-calendar">
            <header className="page-header">
                <div>
                    <h2 className="home-title">Gestión de Calendario</h2>
                    <p className="home-subtitle">{events.length} eventos programados</p>
                </div>
                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar eventos..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="loading-state">Cargando calendario...</div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">No hay eventos para mostrar.</div>
            ) : (
                <div className="events-list">
                    {filtered.map(e => (
                        <div key={e.id} className="event-row">
                            <div className="event-date-cell">
                                <div className="date-month">{new Date(e.start_time).toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}</div>
                                <div className="date-day">{new Date(e.start_time).getDate()}</div>
                            </div>
                            <div className="event-main-cell">
                                <div className="event-badge" style={{ 
                                    background: e.type === 'rehearsal' ? 'rgba(212,160,23,0.1)' : 'rgba(59,130,246,0.1)',
                                    color: e.type === 'rehearsal' ? '#d4a017' : '#3b82f6'
                                }}>
                                    {e.type === 'rehearsal' ? 'Ensayo' : 'Evento'}
                                </div>
                                <h4 className="event-title">{e.title}</h4>
                                <div className="event-meta">
                                    <span><Clock size={14} /> {new Date(e.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                    {e.location && <span><MapPin size={14} /> {e.location}</span>}
                                </div>
                            </div>
                            <button className="event-del-btn" onClick={() => deleteEvent(e.id)}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .admin-calendar { max-width: 1000px; }
                .page-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 32px;
                    gap: 20px;
                }
                .search-box {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px;
                    padding: 0 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 300px;
                }
                .search-box input {
                    background: transparent; border: none; padding: 12px 0;
                    color: #fff; width: 100%; outline: none; font-size: 0.9rem;
                }

                .events-list { display: flex; flex-direction: column; gap: 12px; }
                .event-row {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 16px;
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 24px;
                }
                .event-date-cell {
                    text-align: center; width: 50px;
                    border-right: 1px solid rgba(255,255,255,0.06);
                    padding-right: 24px;
                }
                .date-month { font-size: 0.7rem; font-weight: 700; color: #d4a017; letter-spacing: 0.05em; }
                .date-day { font-size: 1.4rem; font-weight: 800; color: #fff; line-height: 1; }

                .event-main-cell { flex: 1; display: flex; flex-direction: column; gap: 6px; }
                .event-badge { 
                    align-self: flex-start;
                    font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
                    padding: 2px 8px; border-radius: 6px; letter-spacing: 0.02em;
                }
                .event-title { font-size: 1rem; font-weight: 700; color: #fff; margin: 0; }
                .event-meta { display: flex; gap: 16px; color: rgba(255,255,255,0.35); font-size: 0.85rem; }
                .event-meta span { display: flex; align-items: center; gap: 4px; }

                .event-del-btn {
                    background: transparent; border: none; cursor: pointer;
                    padding: 10px; border-radius: 10px; color: rgba(255,255,255,0.15);
                    transition: all 0.2s;
                }
                .event-del-btn:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

                .loading-state, .empty-state { padding: 80px; text-align: center; color: rgba(255,255,255,0.3); }

                @media (max-width: 640px) {
                    .page-header { flex-direction: column; align-items: stretch; }
                    .search-box { width: 100%; }
                    .event-row { gap: 16px; padding: 12px 16px; }
                    .event-date-cell { padding-right: 16px; width: 40px; }
                    .date-day { font-size: 1.2rem; }
                    .event-meta { flex-direction: column; gap: 4px; }
                }

                .home-title { font-size: 1.8rem; font-weight: 800; margin: 0 0 4px; color: #fff; }
                .home-subtitle { color: rgba(255,255,255,0.4); font-size: 0.95rem; }
            `}</style>
        </div>
    );
}
