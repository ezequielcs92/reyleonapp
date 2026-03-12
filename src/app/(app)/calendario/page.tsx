'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { addCalendarEvent, deleteCalendarEvent } from '@/actions/calendar';
import Link from 'next/link';
import { 
    ChevronLeft, 
    ChevronRight, 
    Plus, 
    Calendar as CalendarIcon, 
    Clock, 
    Info, 
    Trash2, 
    Cake, 
    Music, 
    Star,
    X,
    User as UserIcon
} from 'lucide-react';

type CalendarEvent = {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    type: string;
    created_at: string;
};

type BirthdayEvent = {
    id: string;
    full_name: string;
    birthdate: string;
    photo_url?: string | null;
};

// Reusable Sheet Component
function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="sheet-overlay" onClick={onClose} style={{ zIndex: 100 }}>
            <div className="sheet-panel" onClick={e => e.stopPropagation()}>
                <div className="sheet-handle" />
                <div className="sheet-header">
                    <span className="sheet-title">{title}</span>
                    <button className="sheet-close" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="sheet-body">{children}</div>
            </div>
        </div>
    );
}

export default function CalendarPage() {
    const { isAdmin, user } = useAuth();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [birthdays, setBirthdays] = useState<BirthdayEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [createOpen, setCreateOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [createError, setCreateError] = useState('');
    const [form, setForm] = useState({ 
        title: '', 
        description: '', 
        event_date: '', 
        type: 'ensayo' 
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        const [eventsRes, birthdaysRes] = await Promise.all([
            supabase.from('calendar_events').select('*').order('event_date'),
            supabase.from('users').select('uid, full_name, birthdate, photo_url').not('birthdate', 'is', null)
        ]);

        if (eventsRes.data) setEvents(eventsRes.data);
        if (birthdaysRes.data) {
            setBirthdays(birthdaysRes.data.map(b => ({
                id: b.uid,
                full_name: b.full_name,
                birthdate: b.birthdate,
                photo_url: b.photo_url
            })));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreate = async () => {
        if (!form.title || !form.event_date || !form.type) return;
        setSubmitting(true);
        setCreateError('');
        
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        
        const res = await addCalendarEvent(fd);
        setSubmitting(false);

        if (res.error) {
            setCreateError(res.error);
        } else {
            setCreateOpen(false);
            setForm({ title: '', description: '', event_date: '', type: 'ensayo' });
            loadData();
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!isAdmin) return;
        if (confirm(`¿Seguro que querés eliminar el evento "${title}"?`)) {
            const res = await deleteCalendarEvent(id);
            if (!res.error) {
                setEvents(prev => prev.filter(e => e.id !== id));
            }
        }
    };

    // Calendar logic
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const days = [];
    const totalDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    for (let i = 0; i < firstDay; i++) { days.push(null); }
    for (let i = 1; i <= totalDays; i++) { days.push(i); }

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const getEventsForDay = (day: number) => {
        const d = new Date(year, month, day);
        const dayStr = d.toISOString().split('T')[0];
        const dayEvents = events.filter(e => e.event_date.split('T')[0] === dayStr);
        const dayBirthdays = birthdays.filter(b => {
            const bDate = new Date(b.birthdate);
            return bDate.getUTCDate() === day && bDate.getUTCMonth() === month;
        });
        return { dayEvents, dayBirthdays };
    };

    return (
        <div className="cal-root">
            <header className="cal-header">
                <CalendarIcon className="cal-icon-header" size={20} />
                <h1 className="cal-title">Calendario del Elenco</h1>
                {isAdmin && (
                    <button className="cal-fab" onClick={() => setCreateOpen(true)}>
                        <Plus size={20} />
                    </button>
                ) }
            </header>

            <div className="cal-nav">
                <button onClick={prevMonth} className="cal-nav-btn"><ChevronLeft size={20} /></button>
                <h2 className="cal-current-month">{monthNames[month]} {year}</h2>
                <button onClick={nextMonth} className="cal-nav-btn"><ChevronRight size={20} /></button>
            </div>

            <div className="cal-grid-header">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                    <div key={d} className="cal-day-label">{d}</div>
                ))}
            </div>

            <div className="cal-grid">
                {days.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} className="cal-day empty" />;
                    const { dayEvents, dayBirthdays } = getEventsForDay(day);
                    const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                    const dateSlug = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                    return (
                        <div key={day} className={`cal-day ${isToday ? 'today' : ''}`}>
                            <Link href={`/calendario/dia/${dateSlug}`} className="cal-day-num-link">
                              <span className="cal-day-num">{day}</span>
                            </Link>
                            <div className="cal-day-content">
                                {dayBirthdays.map(b => (
                                    <Link key={b.id} href={`/calendario/cumple/${b.id}`} className="cal-ev-item bday" title={`Cumple de ${b.full_name}`}>
                                        <Cake size={10} />
                                    </Link>
                                ))}
                                {dayEvents.map(e => (
                                    <Link 
                                        key={e.id} 
                                        href={`/calendario/${e.id}`}
                                        className={`cal-ev-item ${e.type}`} 
                                        title={e.title}
                                    >
                                        {e.type === 'ensayo' ? <Music size={10} /> : <Star size={10} />}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="cal-legend">
                <div className="leg-item"><div className="dot ensayo" /> Ensayo</div>
                <div className="leg-item"><div className="dot fecha_importante" /> Imp.</div>
                <div className="leg-item"><div className="dot bday" /> Cumple</div>
            </div>

            <section className="cal-list-section">
                <div className="section-header-row">
                  <h3 className="section-title">Cumpleaños del mes</h3>
                  <span className="section-subtitle">{monthNames[month]}</span>
                </div>
                <div className="bday-strip">
                    {birthdays.filter(b => new Date(b.birthdate).getUTCMonth() === month).length > 0 ? (
                        birthdays.filter(b => new Date(b.birthdate).getUTCMonth() === month)
                        .sort((a,b) => new Date(a.birthdate).getUTCDate() - new Date(b.birthdate).getUTCDate())
                        .map(b => (
                            <Link href={`/calendario/cumple/${b.id}`} key={b.id} className="bday-card-link">
                                <div className="bday-card">
                                    <div className="bday-avatar-wrapper">
                                        {b.photo_url ? (
                                            <img src={b.photo_url} alt={b.full_name} className="bday-avatar" />
                                        ) : (
                                            <div className="bday-avatar-placeholder"><UserIcon size={16} /></div>
                                        )}
                                        <div className="bday-mini-badge">🎂</div>
                                    </div>
                                    <span className="bday-name">{b.full_name.split(' ')[0]}</span>
                                    <span className="bday-date">{new Date(b.birthdate).getUTCDate()} {monthNames[month].substring(0,3)}</span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <p className="no-bdays">No hay cumpleaños este mes.</p>
                    )}
                </div>

                <div className="section-header-row" style={{ marginTop: '24px' }}>
                  <h3 className="section-title">Próximos eventos</h3>
                  <span className="section-subtitle">{monthNames[month]}</span>
                </div>
                <div className="cal-list">
                    {loading ? (
                        <p className="loading-text">Cargando eventos...</p>
                    ) : (
                        events.filter(e => {
                            const d = new Date(e.event_date);
                            return d.getMonth() === month && d.getFullYear() === year;
                        }).map(e => (
                            <Link href={`/calendario/${e.id}`} key={e.id} className="cal-list-item-link">
                                <div className="cal-list-item">
                                    <div className={`cal-list-tag ${e.type}`}>
                                        {new Date(e.event_date).getDate()}
                                    </div>
                                    <div className="cal-list-info">
                                        <span className="cal-list-title">{e.title}</span>
                                        {e.description && <p className="cal-list-desc">{e.description}</p>}
                                    </div>
                                    <ChevronRight size={18} className="cal-list-arrow" />
                                    {isAdmin && (
                                        <button className="cal-list-del" onClick={(e_click) => {
                                            e_click.preventDefault(); e_click.stopPropagation();
                                            handleDelete(e.id, e.title);
                                        }}>
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </section>

            <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo Evento / Ensayo">
                <label className="sheet-label">Título *</label>
                <input className="sheet-input" placeholder="Ej: Ensayo General Acto 1" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                
                <label className="sheet-label">Tipo de Evento *</label>
                <select className="sheet-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="ensayo">🎵 Ensayo</option>
                    <option value="fecha_importante">⭐ Fecha Importante</option>
                    <option value="evento">📅 Evento General</option>
                </select>

                <label className="sheet-label">Fecha *</label>
                <input type="date" className="sheet-input" value={form.event_date}
                    onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />

                <label className="sheet-label">Descripción (opcional)</label>
                <textarea className="sheet-textarea" placeholder="Detalles..." rows={3}
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

                {createError && <p className="sheet-error">{createError}</p>}
                <button className="sheet-submit" onClick={handleCreate} disabled={submitting || !form.title.trim() || !form.event_date}>
                    {submitting ? 'Creando...' : 'Guardar en Calendario'}
                </button>
            </Sheet>

            <style>{calStyles}</style>
        </div>
    );
}

const calStyles = `
    .cal-root { min-height: 100dvh; background: #0c0a08; font-family: 'Poppins', sans-serif; padding-bottom: 80px; color: #fff; }
    .cal-header { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 10px; padding: 0 16px; height: 56px; background: rgba(12,10,8,0.92); border-bottom: 1px solid rgba(255,255,255,0.06); backdrop-filter: blur(12px); }
    .cal-icon-header { color: #d4a017; }
    .cal-title { font-size: 1.1rem; font-weight: 700; flex: 1; margin: 0; }
    .cal-fab { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #d4a017, #b8860b); border: none; color: #0c0a08; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(212,160,23,0.3); }
    .cal-nav { display: flex; align-items: center; justify-content: space-between; padding: 16px; }
    .cal-nav-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 10px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .cal-current-month { font-size: 1.1rem; font-weight: 600; margin: 0; color: #d4a017; }
    
    .cal-grid-header { display: grid; grid-template-columns: repeat(7, 1fr); padding: 0 16px; margin-bottom: 8px; }
    .cal-day-label { text-align: center; font-size: 0.75rem; color: rgba(255,255,255,0.4); font-weight: 500; }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: rgba(255,255,255,0.05); padding: 1px; margin: 0 16px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
    .cal-day { aspect-ratio: 1; background: #0c0a08; display: flex; flex-direction: column; align-items: center; padding: 4px; position: relative; }
    .cal-day.empty { background: rgba(255,255,255,0.02); }
    .cal-day-num-link { text-decoration: none; z-index: 2; }
    .cal-day-num { font-size: 0.85rem; color: rgba(255,255,255,0.3); font-weight: 400; transition: color 0.2s; }
    .cal-day:active .cal-day-num { color: #d4a017; }
    .cal-day.today .cal-day-num { color: #0c0a08; background: #d4a017; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; }
    
    .cal-day-content { display: flex; flex-wrap: wrap; gap: 2px; justify-content: center; margin-top: 4px; max-width: 100%; }
    .cal-ev-item { width: 14px; height: 14px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; text-decoration: none; }
    .cal-ev-item.ensayo { background: #4285F4; color: #fff; }
    .cal-ev-item.fecha_importante { background: #EA4335; color: #fff; }
    .cal-ev-item.bday { background: #FBBC05; color: #0c0a08; }
    .cal-ev-item.evento { background: #34A853; color: #fff; }
    
    .cal-legend { display: flex; justify-content: center; gap: 16px; padding: 16px; }
    .leg-item { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: rgba(255,255,255,0.5); }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot.ensayo { background: #4285F4; }
    .dot.fecha_importante { background: #EA4335; }
    .dot.bday { background: #FBBC05; }
    
    .cal-list-section { padding: 16px; }
    .section-header-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; }
    .section-title { font-size: 0.9rem; font-weight: 700; color: #fff; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .section-subtitle { font-size: 0.75rem; color: #d4a017; font-weight: 600; }
    
    /* Birthday Strip Styling */
    .bday-strip { display: flex; gap: 12px; overflow-x: auto; padding: 4px 0 12px; scrollbar-width: none; }
    .bday-strip::-webkit-scrollbar { display: none; }
    .bday-card-link { text-decoration: none; }
    .bday-card { 
        min-width: 85px; display: flex; flex-direction: column; align-items: center; 
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); 
        padding: 12px 8px; border-radius: 20px; text-align: center;
    }
    .bday-avatar-wrapper { position: relative; margin-bottom: 8px; }
    .bday-avatar { width: 44px; height: 44px; border-radius: 16px; object-fit: cover; border: 1.5px solid #d4a017; }
    .bday-avatar-placeholder { width: 44px; height: 44px; border-radius: 16px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.2); }
    .bday-mini-badge { position: absolute; bottom: -2px; right: -2px; font-size: 10px; background: #fff; border-radius: 4px; padding: 1px; }
    .bday-name { font-size: 0.75rem; font-weight: 600; color: #fff; display: block; margin-bottom: 2px; }
    .bday-date { font-size: 0.65rem; color: rgba(255,255,255,0.4); text-transform: uppercase; }

    .cal-list { display: flex; flex-direction: column; gap: 10px; }
    .cal-list-item-link { text-decoration: none; }
    .cal-list-item { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 12px; transition: background 0.2s; }
    .cal-list-item:active { background: rgba(255,255,255,0.08); }
    .cal-list-tag { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; }
    .cal-list-tag.ensayo { background: rgba(66, 133, 244, 0.15); color: #4285F4; }
    .cal-list-tag.fecha_importante { background: rgba(234, 67, 53, 0.15); color: #ea4335; }
    .cal-list-tag.evento { background: rgba(52, 168, 83, 0.15); color: #34a853; }
    .cal-list-info { flex: 1; }
    .cal-list-title { display: block; font-size: 0.9rem; font-weight: 600; color: #fff; }
    .cal-list-desc { font-size: 0.75rem; color: rgba(255,255,255,0.4); margin: 2px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cal-list-arrow { color: rgba(255,255,255,0.1); }
    .cal-list-del { background: transparent; border: none; color: rgba(239, 68, 68, 0.4); cursor: pointer; padding: 4px; }
    
    .sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; }
    .sheet-panel { width: 100%; background: #161210; border-radius: 20px 20px 0 0; border-top: 1px solid rgba(255,255,255,0.1); max-height: 85svh; overflow-y: auto; padding-bottom: env(safe-area-inset-bottom, 16px); animation: sheetUp 0.28s cubic-bezier(0.32,0.72,0,1) forwards; }
    @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .sheet-handle { width: 36px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.15); margin: 10px auto 0; }
    .sheet-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .sheet-title { font-size: 0.95rem; font-weight: 600; color: #fff; }
    .sheet-close { background: transparent; border: none; color: rgba(255,255,255,0.4); cursor: pointer; padding: 4px; }
    .sheet-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .sheet-label { font-size: 0.75rem; font-weight: 500; color: rgba(255,255,255,0.45); margin-bottom: -4px; }
    .sheet-input, .sheet-select, .sheet-textarea { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 11px 12px; color: #fff; font-family: 'Poppins', sans-serif; font-size: 0.88rem; outline: none; }
    .sheet-select { appearance: none; } .sheet-select option { background: #161210; }
    .sheet-textarea { resize: none; }
    .sheet-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 8px 12px; color: #fca5a5; font-size: 0.78rem; margin: 0; }
    .sheet-submit { width: 100%; background: linear-gradient(135deg, #d4a017, #b8860b); border: none; border-radius: 12px; padding: 13px; color: #0c0a08; font-family: 'Poppins', sans-serif; font-size: 0.9rem; font-weight: 600; cursor: pointer; margin-top: 4px; }
`;
