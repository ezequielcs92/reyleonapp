'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Clock, MapPin, Search, CalendarDays } from 'lucide-react';

function errorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) return error.message;
    return fallback;
}
import Modal from '@/components/ui/Modal';
import { addCalendarEvent, deleteCalendarEvent } from '@/actions/calendar';

type Event = {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    location: string | null;
    type: string;
};

export default function AdminCalendarPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [formTitle, setFormTitle] = useState('');
    const [formDate, setFormDate] = useState('');
    const [formType, setFormType] = useState('evento');
    const [formLocation, setFormLocation] = useState('');
    const [formDesc, setFormDesc] = useState('');

    useEffect(() => {
        loadEvents();
    }, []);

    async function loadEvents() {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('calendar_events')
                .select('*')
                .order('event_date', { ascending: false });
            if (data) setEvents(data);
        } catch (err) {
            console.error('Error loading events:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar este evento definitivamente?')) return;
        try {
            const res = await deleteCalendarEvent(id);
            if (res.error) throw new Error(res.error);
            setEvents(prev => prev.filter(e => e.id !== id));
        } catch (err: unknown) {
            alert('Error al eliminar: ' + errorMessage(err, 'Error inesperado'));
        }
    }

    async function handleAddEvent(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('title', formTitle);
            formData.append('event_date', formDate);
            formData.append('type', formType);
            formData.append('location', formLocation);
            formData.append('description', formDesc);

            const res = await addCalendarEvent(formData);
            if (res.error) throw new Error(res.error);

            setIsModalOpen(false);
            resetForm();
            loadEvents();
        } catch (err: unknown) {
            alert('Error: ' + errorMessage(err, 'Error inesperado'));
        } finally {
            setIsSaving(false);
        }
    }

    function resetForm() {
        setFormTitle('');
        setFormDate('');
        setFormType('evento');
        setFormLocation('');
        setFormDesc('');
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
                    <button className="add-btn" onClick={() => setIsModalOpen(true)}>
                        <Plus size={20} />
                        <span>Nuevo Evento</span>
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="loading-state">
                    <div className="loader"></div>
                    <p>Cargando calendario...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <CalendarDays size={48} className="empty-icon" />
                    <p>No hay eventos para mostrar.</p>
                    <button className="add-btn-empty" onClick={() => setIsModalOpen(true)}>Crear el primer evento</button>
                </div>
            ) : (
                <div className="events-list">
                    {filtered.map(e => (
                        <div key={e.id} className={`event-row type-${e.type}`}>
                            <div className="event-date-cell">
                                <div className="date-month">{new Date(e.event_date).toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}</div>
                                <div className="date-day">{new Date(e.event_date).getDate()}</div>
                            </div>
                            <div className="event-main-cell">
                                <div className="event-badge">
                                    {e.type === 'ensayo'
                                        ? 'Ensayo'
                                        : e.type === 'fecha_importante'
                                            ? 'Fecha Importante'
                                            : e.type === 'funcion'
                                                ? 'Función'
                                                : 'Evento'}
                                </div>
                                <h4 className="event-title">{e.title}</h4>
                                <div className="event-meta">
                                    <span><Clock size={14} /> {new Date(e.event_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs</span>
                                    {e.location && <span><MapPin size={14} /> {e.location}</span>}
                                </div>
                            </div>
                            <button className="event-del-btn" onClick={() => handleDelete(e.id)} title="Eliminar">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="Crear Nuevo Evento"
            >
                <form className="event-form" onSubmit={handleAddEvent}>
                    <div className="form-group">
                        <label htmlFor="event-title">Título del Evento *</label>
                        <input 
                            id="event-title"
                            type="text" 
                            required 
                            placeholder="Ej: Ensayo General, Función..."
                            title="Título del Evento"
                            value={formTitle}
                            onChange={e => setFormTitle(e.target.value)}
                        />
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="event-date">Fecha y Hora *</label>
                            <input 
                                id="event-date"
                                type="datetime-local" 
                                required 
                                title="Fecha y Hora del Evento"
                                value={formDate}
                                onChange={e => setFormDate(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="event-type">Tipo *</label>
                            <select 
                                id="event-type"
                                value={formType} 
                                title="Tipo de Evento"
                                onChange={e => setFormType(e.target.value)}
                            >
                                <option value="evento">Evento</option>
                                <option value="ensayo">Ensayo</option>
                                <option value="funcion">Función</option>
                                <option value="fecha_importante">Fecha Importante</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="event-location">Ubicación</label>
                        <input 
                            id="event-location"
                            type="text" 
                            placeholder="Ej: Teatro Opera, Sala 3..."
                            title="Ubicación del Evento"
                            value={formLocation}
                            onChange={e => setFormLocation(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="event-desc">Descripción</label>
                        <textarea 
                            id="event-desc"
                            rows={3}
                            placeholder="Detalles adicionales..."
                            title="Descripción del Evento"
                            value={formDesc}
                            onChange={e => setFormDesc(e.target.value)}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="save-btn" disabled={isSaving}>
                            {isSaving ? 'Guardando...' : 'Crear Evento'}
                        </button>
                    </div>
                </form>
            </Modal>

            <style jsx>{`
                .admin-calendar { max-width: 1000px; padding-bottom: 40px; }
                .page-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 32px;
                    gap: 20px;
                }
                .header-actions { display: flex; align-items: center; gap: 16px; }
                .search-box {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px;
                    padding: 0 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 300px;
                    transition: all 0.2s;
                }
                .search-box:focus-within { border-color: #d4a017; background: rgba(212,160,23,0.05); }
                .search-box input {
                    background: transparent; border: none; padding: 12px 0;
                    color: #fff; width: 100%; outline: none; font-size: 0.9rem;
                }

                .add-btn {
                    display: flex; align-items: center; gap: 8px;
                    background: #d4a017; color: #000; border: none;
                    padding: 12px 20px; border-radius: 12px;
                    font-weight: 700; cursor: pointer; transition: all 0.2s;
                }
                .add-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(212,160,23,0.3); }

                .events-list { display: flex; flex-direction: column; gap: 12px; }
                .event-row {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 20px;
                    padding: 16px 24px;
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    transition: all 0.2s;
                }
                .event-row:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); transform: translateX(4px); }
                
                .event-date-cell {
                    text-align: center; width: 50px;
                    border-right: 1px solid rgba(255,255,255,0.06);
                    padding-right: 24px;
                }
                .date-month { font-size: 0.7rem; font-weight: 700; color: #d4a017; letter-spacing: 0.05em; }
                .date-day { font-size: 1.6rem; font-weight: 800; color: #fff; line-height: 1; }

                .event-main-cell { flex: 1; display: flex; flex-direction: column; gap: 4px; }
                .event-badge { 
                    align-self: flex-start;
                    font-size: 0.6rem; font-weight: 800; text-transform: uppercase;
                    padding: 3px 10px; border-radius: 6px; letter-spacing: 0.05em;
                    background: rgba(255,255,255,0.05); color: #fff;
                }

                .type-ensayo .event-badge { background: rgba(212,160,23,0.12); color: #d4a017; }
                .type-ensayo .date-month { color: #d4a017; }
                
                .type-fecha_importante .event-badge { background: rgba(239,68,68,0.12); color: #ef4444; }
                .type-fecha_importante .date-month { color: #ef4444; }

                .type-funcion .event-badge { background: rgba(245,158,11,0.12); color: #f59e0b; }
                .type-funcion .date-month { color: #f59e0b; }
                
                .type-evento .event-badge { background: rgba(59,130,246,0.12); color: #3b82f6; }
                .type-evento .date-month { color: #3b82f6; }

                .event-title { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0; }
                .event-meta { display: flex; gap: 16px; color: rgba(255,255,255,0.35); font-size: 0.85rem; }
                .event-meta span { display: flex; align-items: center; gap: 6px; }

                .event-del-btn {
                    background: transparent; border: none; cursor: pointer;
                    padding: 12px; border-radius: 12px; color: rgba(255,255,255,0.1);
                    transition: all 0.2s;
                }
                .event-del-btn:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

                /* Form Styles */
                .event-form { display: flex; flex-direction: column; gap: 20px; }
                .form-group { display: flex; flex-direction: column; gap: 8px; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .form-group label { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; }
                .form-group input, .form-group select, .form-group textarea {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: #fff;
                    font-size: 0.95rem;
                    outline: none;
                    transition: all 0.2s;
                }
                .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
                    border-color: #d4a017;
                    background: rgba(212,160,23,0.05);
                }
                .form-group select option {
                    background: #f6f2e9;
                    color: #201a13;
                }
                .form-actions { display: flex; gap: 12px; margin-top: 10px; }
                .save-btn { flex: 1; background: #d4a017; color: #000; border: none; padding: 14px; border-radius: 14px; font-weight: 700; cursor: pointer; }
                .cancel-btn { background: rgba(255,255,255,0.05); color: #fff; border: none; padding: 14px 24px; border-radius: 14px; font-weight: 600; cursor: pointer; }
                .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .loading-state, .empty-state { 
                    padding: 100px 40px; text-align: center; 
                    background: rgba(255,255,255,0.02); border-radius: 30px;
                    border: 1px dashed rgba(255,255,255,0.05);
                    display: flex; flex-direction: column; align-items: center; gap: 16px;
                }
                .empty-icon { color: rgba(255,255,255,0.1); margin-bottom: 8px; }
                .empty-state p { color: rgba(255,255,255,0.3); font-size: 1.1rem; }
                .add-btn-empty { background: rgba(212,160,23,0.1); color: #d4a017; border: 1px solid rgba(212,160,23,0.2); padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; }

                .loader { width: 30px; height: 30px; border: 3px solid rgba(212,160,23,0.1); border-top-color: #d4a017; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 640px) {
                    .page-header { flex-direction: column; align-items: stretch; }
                    .header-actions { flex-direction: column; }
                    .search-box { width: 100%; }
                    .add-btn { width: 100%; justify-content: center; }
                    .event-row { gap: 16px; padding: 16px; flex-wrap: wrap; }
                    .event-date-cell { padding-right: 16px; width: 40px; border: none; }
                    .date-day { font-size: 1.4rem; }
                    .event-meta { flex-direction: column; gap: 4px; }
                    .form-row { grid-template-columns: 1fr; }
                    .event-del-btn { margin-left: auto; }
                }

                .home-title { font-size: 1.8rem; font-weight: 800; margin: 0 0 4px; color: #fff; }
                .home-subtitle { color: rgba(255,255,255,0.4); font-size: 0.95rem; }
            `}</style>
        </div>
    );
}
