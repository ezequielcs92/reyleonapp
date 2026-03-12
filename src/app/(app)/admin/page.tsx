'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { supabase } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';
import type { DbAdminFeedAction } from '@/types';
import { Users, Calendar, Store, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type AdminActionRow = {
    id: string;
    admin_id: string;
    target_type: 'post' | 'poll';
    action: 'pin' | 'unpin' | 'hide' | 'restore' | 'delete';
    created_at: string;
};

type UserNameRow = {
    uid: string;
    full_name: string;
};

export default function AdminPage() {
    const { isAdmin } = useAuth();
    const [stats, setStats] = useState({ users: 0, events: 0, businesses: 0 });
    const [recentActivity, setRecentActivity] = useState<DbAdminFeedAction[]>([]);
    const [actionFilter, setActionFilter] = useState<'all' | 'pin' | 'unpin' | 'hide' | 'restore' | 'delete'>('all');
    const [adminFilter, setAdminFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            const [u, e, b, actionsRes] = await Promise.all([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('calendar_events').select('*', { count: 'exact', head: true }),
                supabase.from('businesses').select('*', { count: 'exact', head: true }),
                supabase.from('admin_feed_actions').select('id, admin_id, target_type, action, created_at').order('created_at', { ascending: false }).limit(8),
            ]);

            if (u.error) console.error('Admin users stats error:', u.error);
            if (e.error) console.error('Admin events stats error:', e.error);
            if (b.error) console.error('Admin businesses stats error:', b.error);
            if (actionsRes.error) console.error('Admin feed actions error:', actionsRes.error);

            setStats({
                users: u.count || 0,
                events: e.count || 0,
                businesses: b.count || 0,
            });

            const actionRows = (actionsRes.data || []) as AdminActionRow[];
            const adminIds = Array.from(new Set(actionRows.map((item) => item.admin_id).filter(Boolean)));
            let adminNames: Record<string, string> = {};

            if (adminIds.length > 0) {
                const { data: adminsData, error: adminsError } = await supabase
                    .from('users')
                    .select('uid, full_name')
                    .in('uid', adminIds);

                if (adminsError) {
                    console.error('Admin names error:', adminsError);
                } else if (adminsData) {
                    adminNames = Object.fromEntries((adminsData as UserNameRow[]).map((admin) => [admin.uid, admin.full_name]));
                }
            }

            const actionLabels: Record<string, string> = {
                pin: 'fijo',
                unpin: 'desfijo',
                hide: 'oculto',
                restore: 'restauro',
                delete: 'elimino',
            };

            const targetLabels: Record<string, string> = {
                post: 'post',
                poll: 'encuesta',
            };

            setRecentActivity(
                actionRows.map((item) => ({
                    id: item.id,
                    kind: item.action,
                    adminName: adminNames[item.admin_id] || 'Un admin',
                    title: `${adminNames[item.admin_id] || 'Un admin'} ${actionLabels[item.action] || 'modero'} un ${targetLabels[item.target_type] || 'contenido'}`,
                    created_at: item.created_at,
                }))
            );
            setLoading(false);
        }
        loadStats();
    }, []);

    const adminOptions = useMemo(() => {
        return Array.from(new Set(recentActivity.map((activity) => activity.adminName))).sort((a, b) => a.localeCompare(b));
    }, [recentActivity]);

    const filteredActivity = useMemo(() => {
        return recentActivity.filter((activity) => {
            if (actionFilter !== 'all' && activity.kind !== actionFilter) return false;
            if (adminFilter !== 'all' && activity.adminName !== adminFilter) return false;
            return true;
        });
    }, [recentActivity, actionFilter, adminFilter]);

    const statCards = [
        { label: 'Elenco Total', value: stats.users, Icon: Users, color: '#d4a017' },
        { label: 'Eventos Activos', value: stats.events, Icon: Calendar, color: '#3b82f6' },
        { label: 'Emprendimientos', value: stats.businesses, Icon: Store, color: '#10b981' },
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
                    <div key={i} className="stat-card" style={{ '--accent': s.color } as CSSProperties & Record<'--accent', string>}>
                        <div className="card-top">
                            <div className="stat-icon-bg">
                                <s.Icon size={24} />
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
                    <div className="activity-filters">
                        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value as 'all' | 'pin' | 'unpin' | 'hide' | 'restore' | 'delete')}>
                            <option value="all">Todas las acciones</option>
                            <option value="pin">Fijados</option>
                            <option value="unpin">Desfijados</option>
                            <option value="hide">Ocultados</option>
                            <option value="restore">Restaurados</option>
                            <option value="delete">Eliminados</option>
                        </select>
                        <select value={adminFilter} onChange={(e) => setAdminFilter(e.target.value)}>
                            <option value="all">Todos los admins</option>
                            {adminOptions.map((adminName) => (
                                <option key={adminName} value={adminName}>{adminName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="activity-list">
                        {loading ? (
                            <div className="activity-empty">Cargando actividad...</div>
                        ) : filteredActivity.length === 0 ? (
                            <div className="activity-empty">Todavia no hay acciones de moderacion registradas.</div>
                        ) : (
                            filteredActivity.map((activity) => (
                                <div key={activity.id} className="activity-item">
                                    <div className={`activity-dot ${activity.kind === 'delete' ? 'red' : activity.kind === 'hide' ? 'orange' : 'gold'}`}></div>
                                    <div className="activity-content">
                                        <p>{activity.title}</p>
                                        <span>{timeAgo(activity.created_at)}</span>
                                    </div>
                                </div>
                            ))
                        )}
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
                        <Link href="/admin/info" className="action-card">
                            <span>Gestionar Info</span>
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
                .card-bottom { display: flex; flex-direction: column; }
                .stat-value { font-size: 2.5rem; font-weight: 800; color: #fff; line-height: 1; margin-bottom: 4px; }
                .stat-label { font-size: 0.9rem; font-weight: 500; color: rgba(255,255,255,0.4); }
                
                .card-overlay { position: absolute; bottom: -50px; right: -50px; width: 150px; height: 150px; background: var(--accent); filter: blur(100px); opacity: 0.05; }

                .sections-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
                .glass-box { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 28px; padding: 32px; backdrop-filter: blur(10px); }
                
                .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
                .header-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: #d4a017; }
                h2 { font-size: 1.1rem; font-weight: 700; color: #fff; }

                .activity-filters {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 18px;
                }
                .activity-filters select {
                    background: #181411;
                    color: #fff;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    padding: 10px 12px;
                    font-size: 0.82rem;
                    outline: none;
                }

                .activity-list { display: flex; flex-direction: column; gap: 20px; }
                .activity-item { display: flex; gap: 16px; align-items: flex-start; }
                .activity-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; box-shadow: 0 0 10px currentColor; }
                .activity-dot.blue { color: #3b82f6; background: #3b82f6; }
                .activity-dot.green { color: #10b981; background: #10b981; }
                .activity-dot.gold { color: #d4a017; background: #d4a017; }
                .activity-dot.orange { color: #f59e0b; background: #f59e0b; }
                .activity-dot.red { color: #ef4444; background: #ef4444; }
                .activity-content p { font-size: 0.9rem; color: rgba(255,255,255,0.7); margin-bottom: 4px; }
                .activity-content span { font-size: 0.75rem; color: rgba(255,255,255,0.3); }
                .activity-empty { color: rgba(255,255,255,0.4); font-size: 0.9rem; }

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
                    .activity-filters { flex-direction: column; }
                }
            `}</style>
        </div>
    );
}
