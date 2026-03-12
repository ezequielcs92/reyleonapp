'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, Trash2, ExternalLink, Search, Clock, MapPin } from 'lucide-react';

type Business = {
    id: string;
    name: string;
    description: string;
    category_id: string;
    owner_id: string;
    owner_name?: string;
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
                .select('*, users!owner_id(full_name)')
                .order('created_at', { ascending: false });

            if (data) {
                setBusinesses(data.map(b => ({
                    ...b,
                    owner_name: (b.users as any)?.full_name
                })));
            }
        } catch (err) {
            console.error('Error loading businesses:', err);
        } finally {
            setLoading(false);
        }
    }

    async function deleteBusiness(id: string) {
        if (!confirm('¿Estás seguro de que quieres eliminar este emprendimiento? Esta acción no se puede deshacer.')) return;
        
        try {
            await supabase.from('businesses').delete().eq('id', id);
            setBusinesses(prev => prev.filter(b => b.id !== id));
        } catch (err) {
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
                    <p className="home-subtitle">{businesses.length} emprendimientos activos</p>
                </div>
                <div className="search-box">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o dueño..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </header>

            {loading ? (
                <div className="loading-state">Cargando negocios...</div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">No se encontraron negocios.</div>
            ) : (
                <div className="businesses-list">
                    {filtered.map(b => (
                        <div key={b.id} className="business-item">
                            <div className="biz-header">
                                <div className="biz-icon">
                                    <Store size={20} />
                                </div>
                                <div className="biz-info">
                                    <h4 className="biz-name">{b.name}</h4>
                                    <p className="biz-owner">Dueño: <b>{b.owner_name}</b></p>
                                </div>
                                <button className="biz-del-btn" onClick={() => deleteBusiness(b.id)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="biz-desc">{b.description}</div>
                            <div className="biz-footer">
                                <span className="biz-date">
                                    <Clock size={12} />
                                    {new Date(b.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .admin-businesses { max-width: 1000px; }
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
                }
                .search-box input {
                    background: transparent; border: none; padding: 12px 0;
                    color: #fff; width: 100%; outline: none; font-size: 0.9rem;
                }

                .businesses-list { display: flex; flex-direction: column; gap: 16px; }
                .business-item {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 20px;
                    padding: 24px;
                }
                .biz-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
                .biz-icon {
                    width: 44px; height: 44px; border-radius: 12px;
                    background: rgba(255,255,255,0.05);
                    display: flex; align-items: center; justify-content: center;
                    color: #d4a017;
                }
                .biz-info { flex: 1; }
                .biz-name { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0 0 4px; }
                .biz-owner { font-size: 0.85rem; color: rgba(255,255,255,0.4); }
                .biz-owner b { color: rgba(255,255,255,0.7); }

                .biz-del-btn {
                    background: transparent; border: none; cursor: pointer;
                    padding: 10px; border-radius: 10px; color: rgba(239,68,68,0.5);
                    transition: all 0.2s;
                }
                .biz-del-btn:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

                .biz-desc { 
                    font-size: 0.9rem; color: rgba(255,255,255,0.7); 
                    line-height: 1.5; margin-bottom: 16px;
                    padding-left: 60px;
                }
                .biz-footer { 
                    padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.04);
                    padding-left: 60px; display: flex; gap: 20px;
                }
                .biz-date { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.3); font-size: 0.75rem; }

                .loading-state, .empty-state { padding: 80px; text-align: center; color: rgba(255,255,255,0.3); }

                @media (max-width: 640px) {
                    .page-header { flex-direction: column; align-items: stretch; }
                    .search-box { max-width: 100%; }
                    .biz-desc, .biz-footer { padding-left: 0; }
                }

                .home-title { font-size: 1.8rem; font-weight: 800; margin: 0 0 4px; color: #fff; }
                .home-subtitle { color: rgba(255,255,255,0.4); font-size: 0.95rem; }
            `}</style>
        </div>
    );
}
