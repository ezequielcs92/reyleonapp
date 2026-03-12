'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Calendar, Store, ArrowRight, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
    const { isAdmin } = useAuth();
    const [stats, setStats] = useState({ users: 0, events: 0, businesses: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            const [u, e, b] = await Promise.all([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('events').select('*', { count: 'exact', head: true }),
                supabase.from('businesses').select('*', { count: 'exact', head: true }),
            ]);
            setStats({
                users: u.count || 0,
                events: e.count || 0,
                businesses: b.count || 0,
            });
            setLoading(false);
        }
        loadStats();
    }, []);

    const statCards = [
        { label: 'Elenco Total', value: stats.users, Icon: Users, color: '#d4a017', trend: '+2 esta semana' },
        { label: 'Eventos Activos', value: stats.events, Icon: Calendar, color: '#3b82f6', trend: 'Próximo ensayo: Hoy 18hs' },
        { label: 'Emprendimientos', value: stats.businesses, Icon: Store, color: '#10b981', trend: '1 pendiente de revisión' },
    ];

    return (
        <div className="admin-home">
            <header className="home-header">
                <div className="greeting-pill">Gestión de Elenco</div>
                <h1 className="home-title">Hola, {isAdmin ? 'Admin' : 'Usuario'}</h1>
                <p className="home-subtitle">Esto es lo que está pasando en la plataforma hoy.</p>
            </header>

            <div className="stats-grid">
                {statCards.map((s, i) => (
                    <div key={i} className="stat-card" style={{ '--accent': s.color } as any}>
                        <div className="card-top">
                            <div className="stat-icon-bg">
                                <s.Icon size={24} />
                            </div>
                            <div className="stat-trend">
                                <TrendingUp size={14} />
                                <span>{s.trend}</span>
                            </div>
                        </div>
                        <div className="card-bottom">
                            <span className="stat-value">{loading ? '...' : s.value}</span>
                            <span className="stat-label">{s.label}</span>
                        </div>
                        <div className="card-overlay"></div>
                    </div>
                ))}
            </div>

            <div className="sections-grid">
                <section className="dashboard-section glass-box">
                    <div className="section-header">
                        <div className="header-icon"><Clock size={18} /></div>
                        <h2>Acciones Recientes</h2>
                    </div>
                    <div className="activity-list">
                        <div className="activity-item">
                            <div className="activity-dot blue"></div>
                            <div className="activity-content">
                                <p><strong>Nuevo integrante</strong> se sumó al elenco</p>
                                <span>Hace 2 horas</span>
                            </div>
                        </div>
                        <div className="activity-item">
                            <div className="activity-dot green"></div>
                            <div className="activity-content">
                                <p><strong>Emprendimiento "Simba Props"</strong> fue aprobado</p>
                                <span>Hace 5 horas</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="dashboard-section glass-box quick-actions">
                    <div className="section-header">
                        <div className="header-icon"><AlertCircle size={18} /></div>
                        <h2>Accesos Directos</h2>
                    </div>
                    <div className="actions-grid">
                        <Link href="/admin/calendario" className="action-card">
                            <span>Programar Ensayo</span>
                            <ArrowRight size={16} />
                        </Link>
                        <Link href="/admin/usuarios" className="action-card">
                            <span>Gestionar Elenco</span>
                            <ArrowRight size={16} />
                        </Link>
                        <Link href="/feed" className="action-card outline">
                            <span>Ir al App público</span>
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>
            </div>

            <style jsx>{`
                .admin-home { animation: fadeIn 0.6s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                .home-header { margin-bottom: 40px; }
                .greeting-pill { 
                    display: inline-block; background: rgba(212,160,23,0.1); color: #d4a017; padding: 4px 12px; 
                    border-radius: 30px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; border: 1px solid rgba(212,160,23,0.3);
                }
                .home-title { font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 8px; letter-spacing: -0.5px; }
                .home-subtitle { color: rgba(255,255,255,0.4); font-size: 1rem; }

                .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 40px; }
                
                .stat-card {
                    background: #110e0c; border: 1px solid rgba(255,255,255,0.05); padding: 28px; border-radius: 28px;
                    position: relative; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .stat-card:hover { transform: translateY(-5px); border-color: var(--accent); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5), 0 0 20px -5px var(--accent); }
                
                .card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
                .stat-icon-bg { width: 48px; height: 48px; border-radius: 16px; background: rgba(255,255,255,0.03); color: var(--accent); display: flex; align-items: center; justify-content: center; }
                .stat-trend { display: flex; align-items: center; gap: 4px; color: rgba(255,255,255,0.3); font-size: 0.75rem; font-weight: 500; }
                
                .card-bottom { display: flex; flex-direction: column; }
                .stat-value { font-size: 2.5rem; font-weight: 800; color: #fff; line-height: 1; margin-bottom: 4px; }
                .stat-label { font-size: 0.9rem; font-weight: 500; color: rgba(255,255,255,0.4); }
                
                .card-overlay { position: absolute; bottom: -50px; right: -50px; width: 150px; height: 150px; background: var(--accent); filter: blur(100px); opacity: 0.05; }

                .sections-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
                .glass-box { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 28px; padding: 32px; backdrop-filter: blur(10px); }
                
                .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
                .header-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: #d4a017; }
                h2 { font-size: 1.1rem; font-weight: 700; color: #fff; }

                .activity-list { display: flex; flex-direction: column; gap: 20px; }
                .activity-item { display: flex; gap: 16px; align-items: flex-start; }
                .activity-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; box-shadow: 0 0 10px currentColor; }
                .activity-dot.blue { color: #3b82f6; background: #3b82f6; }
                .activity-dot.green { color: #10b981; background: #10b981; }
                .activity-content p { font-size: 0.9rem; color: rgba(255,255,255,0.7); margin-bottom: 4px; }
                .activity-content span { font-size: 0.75rem; color: rgba(255,255,255,0.3); }

                .actions-grid { display: flex; flex-direction: column; gap: 12px; }
                .action-card { 
                    display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: #d4a017; color: #000; border-radius: 16px; 
                    text-decoration: none; font-weight: 700; font-size: 0.9rem; transition: all 0.2s; 
                }
                .action-card:hover { transform: scale(1.02); filter: brightness(1.1); }
                .action-card.outline { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #fff; }
                .action-card.outline:hover { background: rgba(255,255,255,0.05); border-color: #d4a017; color: #d4a017; }

                @media (max-width: 1280px) {
                    .stats-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 768px) {
                    .home-title { font-size: 1.8rem; }
                    .stats-grid { grid-template-columns: 1fr; }
                    .sections-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
