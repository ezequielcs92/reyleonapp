'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, Trash2, Search, Clock, Instagram, Globe, Phone, CheckCircle2, XCircle } from 'lucide-react';

type BusinessRow = Omit<Business, 'owner_name'>;
type UserNameRow = { uid: string; full_name: string };

type Business = {
    id: string;
    name: string;
    description: string;
    category_id: string;
    owner_id?: string;
    user_id?: string;
    owner_name?: string;
    is_active: boolean;
    contact_phone?: string;
    instagram_url?: string;
    website_url?: string;
    created_at: string;
};

export default function AdminBusinessesPage() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBusinesses();
    }, []);

    async function loadBusinesses() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading businesses:', error);
                setBusinesses([]);
                return;
            }

            if (data) {
                const businessRows = data as BusinessRow[];
                const ownerIds = Array.from(
                    new Set(
                        businessRows
                            .map((b) => b.owner_id || b.user_id)
                            .filter(Boolean)
                    )
                );

                let usersById: Record<string, string> = {};
                if (ownerIds.length > 0) {
                    const { data: usersData, error: usersError } = await supabase
                        .from('users')
                        .select('uid, full_name')
                        .in('uid', ownerIds);

                    if (usersError) {
                        console.error('Error loading owners:', usersError);
                    } else if (usersData) {
                        usersById = Object.fromEntries((usersData as UserNameRow[]).map((u) => [u.uid, u.full_name]));
                    }
                }

                setBusinesses(
                    businessRows.map((b) => {
                        const ownerId = b.owner_id || b.user_id || '';
                        return {
                            ...b,
                            owner_name: usersById[ownerId] || 'Desconocido',
                        };
                    })
                );
            }
        } catch (error) {
            console.error('Error loading businesses:', error);
        } finally {
            setLoading(false);
        }
    }

    async function toggleActive(id: string, currentStatus: boolean) {
        try {
            const { error } = await supabase
                .from('businesses')
                .update({ is_active: !currentStatus })
                .eq('id', id);
            
            if (error) throw error;
            
            setBusinesses(prev => prev.map(b => 
                b.id === id ? { ...b, is_active: !currentStatus } : b
            ));
        } catch {
            alert('Error al actualizar estado');
        }
    }

    async function deleteBusiness(id: string) {
        if (!confirm('¿Estás seguro de que quieres eliminar este emprendimiento? Esta acción no se puede deshacer.')) return;
        
        try {
            const { error } = await supabase.from('businesses').delete().eq('id', id);
            if (error) throw error;
            setBusinesses(prev => prev.filter(b => b.id !== id));
        } catch {
            alert('Error al eliminar');
        }
    }

    const filtered = businesses.filter(b => 
        b.name.toLowerCase().includes(search.toLowerCase()) || 
        (b.owner_name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="admin-businesses">
            <header className="page-header">
                <div>
                    <h2 className="home-title">Moderación de Negocios</h2>
                    <p className="home-subtitle">{businesses.length} emprendimientos registrados</p>
                </div>
                <div className="search-box">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o dueño..." 
                        value={search}
                        title="Buscar emprendimientos"
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </header>

            {loading ? (
                <div className="loading-state">
                    <div className="loader"></div>
                    <p>Cargando negocios...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">No se encontraron negocios.</div>
            ) : (
                <div className="businesses-grid">
                    {filtered.map(b => (
                        <div key={b.id} className={`business-card ${!b.is_active ? 'inactive' : ''}`}>
                            <div className="card-header">
                                <div className="biz-icon">
                                    <Store size={22} />
                                </div>
                                <div className="biz-main">
                                    <h4 className="biz-name">{b.name}</h4>
                                    <p className="biz-owner">Dueño: <b>{b.owner_name || 'Desconocido'}</b></p>
                                </div>
                                <div className={`status-badge ${b.is_active ? 'active' : 'inactive'}`}>
                                    {b.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                    {b.is_active ? 'Activo' : 'Inactivo'}
                                </div>
                            </div>
                            
                            <div className="biz-desc">{b.description}</div>
                            
                            <div className="biz-links">
                                {b.contact_phone && (
                                    <span title="Teléfono"><Phone size={14} /> {b.contact_phone}</span>
                                )}
                                {b.instagram_url && (
                                    <span title="Instagram"><Instagram size={14} /> @{b.instagram_url.split('/').pop() || 'link'}</span>
                                )}
                                {b.website_url && (
                                    <span title="Web"><Globe size={14} /> Web</span>
                                )}
                            </div>

                            <div className="card-footer">
                                <div className="biz-date">
                                    <Clock size={12} />
                                    {new Date(b.created_at).toLocaleDateString()}
                                </div>
                                <div className="biz-actions">
                                    <button 
                                        className={`toggle-btn ${b.is_active ? 'deactivate' : 'activate'}`}
                                        onClick={() => toggleActive(b.id, b.is_active)}
                                        title={b.is_active ? "Desactivar negocio" : "Activar negocio"}
                                    >
                                        {b.is_active ? 'Desactivar' : 'Activar'}
                                    </button>
                                    <button 
                                        className="del-btn" 
                                        onClick={() => deleteBusiness(b.id)}
                                        title="Eliminar permanentemente"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .admin-businesses { max-width: 1200px; padding-bottom: 40px; }
                .page-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 32px;
                    gap: 20px;
                }
                .search-box {
                    flex: 1;
                    max-width: 400px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px;
                    padding: 0 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: border 0.2s;
                }
                .search-box:focus-within { border-color: #d4a017; }
                .search-box input {
                    background: transparent; border: none; padding: 12px 0;
                    color: #fff; width: 100%; outline: none; font-size: 0.9rem;
                }

                .businesses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
                .business-card {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 24px;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .business-card:hover { transform: translateY(-4px); background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
                .business-card.inactive { opacity: 0.7; }
                
                .card-header { display: flex; align-items: flex-start; gap: 16px; }
                .biz-icon {
                    width: 48px; height: 48px; border-radius: 14px;
                    background: rgba(212,160,23,0.1);
                    display: flex; align-items: center; justify-content: center;
                    color: #d4a017;
                }
                .biz-main { flex: 1; }
                .biz-name { font-size: 1.15rem; font-weight: 700; color: #fff; margin: 0 0 2px; }
                .biz-owner { font-size: 0.85rem; color: rgba(255,255,255,0.4); }
                .biz-owner b { color: rgba(255,255,255,0.7); }

                .status-badge {
                    display: flex; align-items: center; gap: 6px;
                    padding: 4px 10px; border-radius: 8px;
                    font-size: 0.75rem; font-weight: 700;
                }
                .status-badge.active { background: rgba(34,197,94,0.1); color: #22c55e; }
                .status-badge.inactive { background: rgba(239,68,68,0.1); color: #ef4444; }

                .biz-desc { 
                    font-size: 0.9rem; color: rgba(255,255,255,0.6); 
                    line-height: 1.5; height: 3em;
                    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .biz-links { display: flex; flex-wrap: wrap; gap: 12px; }
                .biz-links span {
                    display: flex; align-items: center; gap: 6px;
                    font-size: 0.8rem; color: rgba(255,255,255,0.3);
                    background: rgba(255,255,255,0.03); padding: 4px 10px; border-radius: 8px;
                }

                .card-footer { 
                    display: flex; justify-content: space-between; align-items: center;
                    padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.04);
                    margin-top: auto;
                }
                .biz-date { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.2); font-size: 0.75rem; }
                
                .biz-actions { display: flex; align-items: center; gap: 10px; }
                .toggle-btn {
                    padding: 8px 16px; border-radius: 10px; border: none; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
                }
                .toggle-btn.activate { background: rgba(34,197,94,0.1); color: #22c55e; }
                .toggle-btn.activate:hover { background: #22c55e; color: #fff; }
                .toggle-btn.deactivate { background: rgba(239,68,68,0.1); color: #ef4444; }
                .toggle-btn.deactivate:hover { background: #ef4444; color: #fff; }

                .del-btn {
                    background: transparent; border: none; cursor: pointer;
                    padding: 8px; border-radius: 10px; color: rgba(255,255,255,0.1);
                    transition: all 0.2s;
                }
                .del-btn:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

                .loading-state, .empty-state { padding: 100px; text-align: center; color: rgba(255,255,255,0.3); }
                .loader { width: 30px; height: 30px; border: 3px solid rgba(212,160,23,0.1); border-top-color: #d4a017; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 640px) {
                    .page-header { flex-direction: column; align-items: stretch; gap: 12px; }
                    .search-box { max-width: 100%; }
                    .businesses-grid { grid-template-columns: 1fr; }
                    .home-title { font-size: 1.45rem; }
                    .card-header { flex-wrap: wrap; gap: 10px; }
                    .status-badge { font-size: 0.7rem; }
                }

                .home-title { font-size: 1.8rem; font-weight: 800; margin: 0 0 4px; color: #fff; }
                .home-subtitle { color: rgba(255,255,255,0.4); font-size: 0.95rem; }
            `}</style>
        </div>
    );
}
