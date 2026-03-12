'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
    Calendar as CalendarIcon, 
    Clock, 
    ArrowLeft, 
    Info, 
    Trash2,
    Music,
    Star
} from 'lucide-react';
import { deleteCalendarEvent } from '@/actions/calendar';

type CalendarEvent = {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    type: string;
    created_at: string;
};

export default function EventDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { isAdmin } = useAuth();
    const [event, setEvent] = useState<CalendarEvent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        
        (async () => {
            setLoading(true);
            const { data } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('id', id)
                .single();

            if (data) setEvent(data);
            setLoading(false);
        })();
    }, [id]);

    const handleDelete = async () => {
        if (!event || !isAdmin) return;
        if (confirm(`¿Seguro que querés eliminar el evento "${event.title}"?`)) {
            const res = await deleteCalendarEvent(event.id);
            if (!res.error) {
                router.push('/calendario');
            }
        }
    };

    if (loading) return (
        <div className="ev-detail-root loading">
            <div className="loader"></div>
            <p>Cargando detalles del evento...</p>
            <style>{detailStyles}</style>
        </div>
    );

    if (!event) return (
        <div className="ev-detail-root empty">
            <ArrowLeft onClick={() => router.back()} className="back-btn" />
            <h2>Evento no encontrado</h2>
            <p>Es posible que haya sido eliminado o el link sea incorrecto.</p>
            <style>{detailStyles}</style>
        </div>
    );

    // Fix off-by-one by parsing date string accurately
    const parseEventDate = (dateStr: string) => {
        if (dateStr.includes('T')) return new Date(dateStr);
        const [y, m, d] = dateStr.split('-');
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    };

    const date = parseEventDate(event.event_date);
    const dateStr = date.toLocaleDateString('es-AR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    
    // Format time only if it exists
    const hasTime = event.event_date.includes('T');
    const timeStr = hasTime ? date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : null;

    return (
        <div className="ev-detail-root">
            <header className="ev-detail-header">
                <button onClick={() => router.back()} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                     <div className="header-type">
                         {event.type === 'ensayo'
                                ? 'Ensayo Musical'
                                : event.type === 'funcion'
                                     ? 'Función'
                                     : event.type === 'evento'
                                          ? 'Evento General'
                                          : 'Fecha Especial'}
                     </div>
                {isAdmin && (
                    <button onClick={handleDelete} className="del-btn">
                        <Trash2 size={20} />
                    </button>
                )}
            </header>

            <main className="ev-detail-content">
                <div className={`ev-type-badge ${event.type}`}>
                    {event.type === 'ensayo' ? <Music size={16} /> : event.type === 'funcion' ? <CalendarIcon size={16} /> : <Star size={16} />}
                    {event.type.replace('_', ' ').toUpperCase()}
                </div>

                <h1 className="ev-title">{event.title}</h1>
                
                <div className="ev-meta">
                    <div className="meta-item">
                        <div className="meta-icon"><CalendarIcon size={20} /></div>
                        <div className="meta-text">
                            <span className="meta-label">Fecha</span>
                            <span className="meta-value">{dateStr}</span>
                        </div>
                    </div>

                    <div className="meta-item">
                        <div className="meta-icon"><Clock size={20} /></div>
                        <div className="meta-text">
                            <span className="meta-label">Horario aproximado</span>
                            <span className="meta-value">{timeStr} hs</span>
                        </div>
                    </div>
                </div>

                <div className="ev-description">
                    <h3>Descripción</h3>
                    <p>{event.description || 'Sin descripción adicional para este evento.'}</p>
                </div>

                <div className="ev-warning">
                    <Info size={18} />
                    <p>Recordá estar 15 minutos antes de la hora citada para calentar y preparar el espacio.</p>
                </div>
            </main>

            <style>{detailStyles}</style>
        </div>
    );
}

const detailStyles = `
    .ev-detail-root {
        min-height: 100dvh;
        background: #0c0a08;
        color: #fff;
        font-family: 'Poppins', sans-serif;
        padding-bottom: 40px;
    }
    .ev-detail-root.loading, .ev-detail-root.empty {
        display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center;
    }
    .loader {
        width: 40px; height: 40px; border: 3px solid rgba(212,160,23,0.1); border-top-color: #d4a017; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .ev-detail-header {
        position: sticky; top: 0; z-index: 30;
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 16px; height: 64px;
        background: rgba(12,10,8,0.9); backdrop-filter: blur(10px);
    }
    .back-btn { background: transparent; border: none; color: #fff; cursor: pointer; padding: 8px; border-radius: 12px; }
    .header-type { font-size: 0.9rem; font-weight: 500; color: rgba(255,255,255,0.5); letter-spacing: 0.05em; }
    .del-btn { background: rgba(239,68,68,0.1); border: none; color: #ef4444; padding: 8px; border-radius: 12px; cursor: pointer; }

    .ev-detail-content { padding: 16px 24px; }
    
    .ev-type-badge {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 6px 14px; border-radius: 30px;
        font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em;
        margin-bottom: 16px;
    }
    .ev-type-badge.ensayo { background: rgba(66, 133, 244, 0.15); color: #4285f4; }
    .ev-type-badge.funcion { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .ev-type-badge.fecha_importante { background: rgba(234, 67, 53, 0.15); color: #ea4335; }
    .ev-type-badge.evento { background: rgba(52, 168, 83, 0.15); color: #34a853; }

    .ev-title { font-size: 1.8rem; font-weight: 800; line-height: 1.1; margin: 0 0 24px; color: #fff; }

    .ev-meta { display: flex; flex-direction: column; gap: 20px; margin-bottom: 30px; }
    .meta-item { display: flex; align-items: center; gap: 16px; }
    .meta-icon { 
        width: 48px; height: 48px; border-radius: 16px; 
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
        display: flex; align-items: center; justify-content: center; color: #d4a017;
    }
    .meta-text { display: flex; flex-direction: column; }
    .meta-label { font-size: 0.7rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
    .meta-value { font-size: 0.95rem; font-weight: 500; color: #fff; }

    .ev-description {
        background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
        border-radius: 20px; padding: 20px; margin-bottom: 24px;
    }
    .ev-description h3 { font-size: 0.9rem; font-weight: 600; color: #d4a017; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    .ev-description p { font-size: 1rem; color: rgba(255,255,255,0.7); line-height: 1.6; margin: 0; white-space: pre-wrap; }

    .ev-warning {
        display: flex; gap: 12px; padding: 16px;
        background: rgba(212,160,23,0.05); border: 1px solid rgba(212,160,23,0.2);
        border-radius: 16px; color: #d4a017; align-items: flex-start;
    }
    .ev-warning p { font-size: 0.8rem; margin: 0; line-height: 1.4; font-weight: 500; }
`;
