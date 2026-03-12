'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { addBusiness, deleteBusiness } from '@/actions/businesses';
import { Plus, X, Phone, Instagram, Globe, Trash2, Store } from 'lucide-react';

type Category = { id: string; name: string; icon: string };
type Business = {
    id: string;
    name: string;
    description: string;
    contact_phone: string | null;
    instagram_url: string | null;
    website_url: string | null;
    owner_id: string;
    category_id: string;
    created_at: string;
    owner_name?: string; // from joined users
};

// Sheet component reusable
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

export default function NegociosPage() {
    const { user } = useAuth();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCat, setSelectedCat] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    // Create Modal
    const [createOpen, setCreateOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [createError, setCreateError] = useState('');
    const [form, setForm] = useState({ name: '', description: '', category_id: '', contact_phone: '', instagram_url: '', website_url: '' });

    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const [catsRes, busRes] = await Promise.all([
            supabase.from('business_categories').select('*').order('name'),
            supabase.from('businesses').select('*, users(full_name)').order('created_at', { ascending: false })
        ]);

        if (catsRes.error) console.error('Cats Error:', catsRes.error);
        if (busRes.error) console.error('Bus Error:', busRes.error);

        if (catsRes.data) setCategories(catsRes.data);

        if (busRes.data) {
            const mapped = busRes.data.map((b: any) => ({
                ...b,
                owner_name: b.users?.full_name || 'Miembro del elenco'
            }));
            setBusinesses(mapped);
        }

        if (catsRes.data && catsRes.data.length > 0 && !form.category_id) {
            setForm(f => ({ ...f, category_id: catsRes.data[0].id }));
        }

        setLoading(false);
    }, [user, form.category_id]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleCreate = async () => {
        if (!form.name.trim() || !form.description.trim() || !form.category_id) return;
        setSubmitting(true); setCreateError('');
        
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        
        const res = await addBusiness(fd);
        setSubmitting(false);

        if (res.error) {
            setCreateError(res.error);
        } else {
            setCreateOpen(false);
            setForm({ name: '', description: '', category_id: categories[0]?.id || '', contact_phone: '', instagram_url: '', website_url: '' });
            loadData(); // refresh list
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`¿Seguro que querés eliminar el local "${name}"?`)) {
            await deleteBusiness(id);
            setBusinesses(prev => prev.filter(b => b.id !== id));
        }
    };

    const filteredBusinesses = selectedCat === 'all' 
        ? businesses 
        : businesses.filter(b => b.category_id === selectedCat);

    return (
        <div className="b-root">
            <header className="b-header">
                <span className="b-icon">🏬</span>
                <span className="b-title">Negocios y Emprendimientos</span>
                <button className="b-fab" onClick={() => { setCreateError(''); setCreateOpen(true); }}>
                    <Plus size={20} />
                </button>
            </header>

            {/* Filter as a dropdown selector */}
            <div className="b-filters-container">
                <select 
                    className="b-category-select"
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(e.target.value)}
                >
                    <option value="all">Todas las categorías</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            <main className="b-content">
                {loading ? (
                    <div className="b-loading">Cargando directorio...</div>
                ) : businesses.length === 0 ? (
                    <div className="b-empty">
                        <Store size={48} opacity={0.3} color="#d4a017" />
                        <h3>Aún no hay emprendimientos</h3>
                        <p>Sé el primero en compartir tu negocio con el elenco.</p>
                    </div>
                ) : filteredBusinesses.length === 0 ? (
                    <div className="b-empty">
                        <p>No hay negocios en esta categoría todavía.</p>
                    </div>
                ) : (
                    <div className="b-grid">
                        {filteredBusinesses.map(bus => {
                            const isMine = bus.owner_id === user?.id;
                            const cat = categories.find(c => c.id === bus.category_id);
                            
                            return (
                                <article key={bus.id} className="b-card">
                                    <div className="b-card-top">
                                        <div className="b-card-header">
                                            <span className="b-card-cat">{cat?.icon} {cat?.name}</span>
                                            {isMine && (
                                                <button className="b-del-btn" onClick={() => handleDelete(bus.id, bus.name)}>
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                        <h2 className="b-card-name">{bus.name}</h2>
                                        <div className="b-card-owner">por {bus.owner_name}</div>
                                        <p className="b-card-desc">{bus.description}</p>
                                    </div>

                                    <div className="b-card-links">
                                        {bus.contact_phone && (
                                            <a href={`https://wa.me/${bus.contact_phone.replace(/[^0-9]/g, '')}`} target="_blank" className="b-link wa">
                                                <Phone size={14} /> Contacto
                                            </a>
                                        )}
                                        {bus.instagram_url && (
                                            <a href={bus.instagram_url} target="_blank" className="b-link ig">
                                                <Instagram size={14} /> Instagram
                                            </a>
                                        )}
                                        {bus.website_url && (
                                            <a href={bus.website_url} target="_blank" className="b-link web">
                                                <Globe size={14} /> Sitio Web
                                            </a>
                                        )}
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                )}
            </main>

            <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Anunciar tu Emprendimiento">
                <label className="sheet-label">Nombre del local / marca *</label>
                <input className="sheet-input" placeholder="Ej: La Posta del Simba" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                
                <label className="sheet-label">Categoría *</label>
                <select className="sheet-select" value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>

                <label className="sheet-label">¿Qué ofrecen? *</label>
                <textarea className="sheet-textarea" placeholder="Describí brevemente los productos o servicios." rows={3}
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

                <label className="sheet-label">Teléfono / WhatsApp (opcional)</label>
                <input className="sheet-input" placeholder="Ej: +54 9 11 1234-5678" value={form.contact_phone}
                    onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />

                <label className="sheet-label">Instagram URL (opcional)</label>
                <input className="sheet-input" placeholder="https://instagram.com/..." value={form.instagram_url}
                    onChange={e => setForm(f => ({ ...f, instagram_url: e.target.value }))} />

                <label className="sheet-label">Sitio Web (opcional)</label>
                <input className="sheet-input" placeholder="https://..." value={form.website_url}
                    onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} />

                {createError && <p className="sheet-error">{createError}</p>}
                
                <button className="sheet-submit" onClick={handleCreate} disabled={submitting || !form.name.trim() || !form.description.trim()}>
                    {submitting ? 'Publicando...' : 'Publicar Negocio'}
                </button>
            </Sheet>

            <style>{pageStyles}</style>
        </div>
    );
}

const pageStyles = `
  .b-root { min-height: 100dvh; background: #0c0a08; font-family: 'Poppins', sans-serif; padding-bottom: 20px; }
  
  .b-header {
    position: sticky; top: 0; z-index: 20;
    display: flex; align-items: center; gap: 8px;
    padding: 0 16px; height: 52px;
    background: rgba(12,10,8,0.92);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    backdrop-filter: blur(12px);
  }
  .b-icon { font-size: 1.1rem; color: #d4a017; }
  .b-title { font-size: 1rem; font-weight: 600; color: #fff; flex: 1; }
  .b-fab {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, #d4a017, #b8860b);
    border: none; color: #0c0a08; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(212,160,23,0.3);
  }

  .b-filters-container {
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .b-category-select {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 12px 14px;
    color: #fff;
    font-size: 0.9rem;
    font-family: 'Poppins', sans-serif;
    outline: none;
    appearance: none;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
  }
  .b-category-select option {
    background: #161210;
    color: #fff;
  }

  .b-content { padding: 16px; }
  .b-loading { text-align: center; color: rgba(255,255,255,0.4); font-size: 0.9rem; margin-top: 40px; }
  .b-empty { text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.4); }
  .b-empty h3 { color: #fff; margin: 16px 0 8px; font-weight: 500; }
  .b-empty p { font-size: 0.85rem; }

  .b-grid { display: flex; flex-direction: column; gap: 16px; }
  .b-card {
    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px; overflow: hidden; display: flex; flex-direction: column;
  }
  .b-card-top { padding: 16px; }
  .b-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .b-card-cat {
    display: inline-flex; align-items: center; gap: 4px;
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7);
    padding: 3px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: 500;
  }
  .b-del-btn {
    background: transparent; border: none; color: rgba(239,68,68,0.5); cursor: pointer; padding: 4px; border-radius: 4px;
  }
  .b-del-btn:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
  .b-card-name { font-size: 1.1rem; color: #fff; margin: 0; font-weight: 600; line-height: 1.2; }
  .b-card-owner { font-size: 0.75rem; color: #d4a017; margin-top: 4px; }
  .b-card-desc { font-size: 0.85rem; color: rgba(255,255,255,0.6); margin: 10px 0 0; line-height: 1.5; }
  
  .b-card-links { 
    display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 16px; 
    background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.03); 
  }
  .b-link {
    display: inline-flex; align-items: center; gap: 5px; text-decoration: none;
    font-size: 0.75rem; font-weight: 500; padding: 6px 10px; border-radius: 8px;
    background: rgba(255,255,255,0.05); color: #fff; transition: background 0.2s;
  }
  .b-link.wa { background: rgba(37, 211, 102, 0.15); color: #4ade80; }
  .b-link.ig { background: rgba(225, 48, 108, 0.15); color: #f472b6; }
  .b-link.web { background: rgba(212, 160, 23, 0.15); color: #d4a017; }

  /* Default Sheet Styles - Reusing standard from your design system */
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
  .sheet-submit:disabled { opacity: 0.4; cursor: not-allowed; }
`;
