'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Info, Plus, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import type { DbInfoLink } from '@/types';

function errorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) return error.message;
    return fallback;
}
type Draft = {
    title: string;
    url: string;
    description: string;
};

export default function AdminInfoPage() {
    const [links, setLinks] = useState<DbInfoLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [draft, setDraft] = useState<Draft>({ title: '', url: '', description: '' });

    const hasDraft = useMemo(() => {
        return !!draft.title.trim() && !!draft.url.trim();
    }, [draft]);

    const loadLinks = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/info-links', { method: 'GET' });
            const data = await res.json();
            if (!res.ok || data?.error) {
                throw new Error(data?.error || 'No se pudieron cargar los enlaces.');
            }
            setLinks(Array.isArray(data?.links) ? data.links : []);
        } catch (e: unknown) {
            setError(errorMessage(e, 'No se pudieron cargar los enlaces.'));
            setLinks([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLinks();
    }, [loadLinks]);

    async function createLink() {
        if (!hasDraft || saving) return;
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/info-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: draft.title,
                    url: draft.url,
                    description: draft.description,
                }),
            });
            const data = await res.json();
            if (!res.ok || data?.error) {
                throw new Error(data?.error || 'No se pudo crear el enlace.');
            }

            setDraft({ title: '', url: '', description: '' });
            await loadLinks();
        } catch (e: unknown) {
            setError(errorMessage(e, 'No se pudo crear el enlace.'));
        } finally {
            setSaving(false);
        }
    }

    async function updateLink(id: string, payload: Partial<DbInfoLink>) {
        try {
            const res = await fetch('/api/info-links', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...payload }),
            });
            const data = await res.json();
            if (!res.ok || data?.error) {
                throw new Error(data?.error || 'No se pudo guardar el enlace.');
            }
            setLinks((prev) => prev.map((item) => (item.id === id ? { ...item, ...data.link } : item)));
        } catch (e: unknown) {
            setError(errorMessage(e, 'No se pudo guardar el enlace.'));
        }
    }

    async function removeLink(id: string) {
        if (!confirm('¿Eliminar este enlace de info?')) return;
        try {
            const res = await fetch(`/api/info-links?id=${encodeURIComponent(id)}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok || data?.error) {
                throw new Error(data?.error || 'No se pudo eliminar el enlace.');
            }
            setLinks((prev) => prev.filter((item) => item.id !== id));
        } catch (e: unknown) {
            setError(errorMessage(e, 'No se pudo eliminar el enlace.'));
        }
    }

    async function moveLink(item: DbInfoLink, direction: 'up' | 'down') {
        const ordered = [...links].sort((a, b) => a.order_index - b.order_index);
        const idx = ordered.findIndex((x) => x.id === item.id);
        if (idx < 0) return;

        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= ordered.length) return;

        const target = ordered[targetIdx];
        const currentOrder = item.order_index;
        const targetOrder = target.order_index;

        setLinks((prev) =>
            prev.map((link) => {
                if (link.id === item.id) return { ...link, order_index: targetOrder };
                if (link.id === target.id) return { ...link, order_index: currentOrder };
                return link;
            })
        );

        await Promise.all([
            updateLink(item.id, { order_index: targetOrder }),
            updateLink(target.id, { order_index: currentOrder }),
        ]);

        await loadLinks();
    }

    return (
        <div className="admin-info-page">
            <header className="page-header">
                <div>
                    <h2 className="home-title">Gestion de Info</h2>
                    <p className="home-subtitle">Publica enlaces importantes para todo el elenco.</p>
                </div>
                <button className="refresh-btn" onClick={loadLinks} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    Actualizar
                </button>
            </header>

            <section className="composer glass-box">
                <div className="composer-head">
                    <Info size={16} />
                    <span>Nuevo enlace</span>
                </div>
                <div className="composer-grid">
                    <input
                        type="text"
                        placeholder="Titulo del enlace"
                        value={draft.title}
                        onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                    />
                    <input
                        type="text"
                        placeholder="URL (https://...)"
                        value={draft.url}
                        onChange={(e) => setDraft((prev) => ({ ...prev, url: e.target.value }))}
                    />
                    <input
                        type="text"
                        placeholder="Descripcion corta (opcional)"
                        value={draft.description}
                        onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                    />
                </div>
                <div className="composer-actions">
                    <button className="save-btn" onClick={createLink} disabled={!hasDraft || saving}>
                        <Plus size={16} />
                        {saving ? 'Guardando...' : 'Agregar enlace'}
                    </button>
                </div>
            </section>

            {error && <div className="error-box">{error}</div>}

            <section className="list-section">
                {loading ? (
                    <div className="empty-box glass-box">Cargando enlaces...</div>
                ) : links.length === 0 ? (
                    <div className="empty-box glass-box">Aun no hay enlaces publicados en Info.</div>
                ) : (
                    <div className="list-grid">
                        {[...links]
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((item, index, ordered) => (
                                <article key={item.id} className="link-item glass-box">
                                    <div className="item-top">
                                        <input
                                            className="title-input"
                                            value={item.title}
                                            onChange={(e) =>
                                                setLinks((prev) =>
                                                    prev.map((l) => (l.id === item.id ? { ...l, title: e.target.value } : l))
                                                )
                                            }
                                            onBlur={(e) => updateLink(item.id, { title: e.target.value })}
                                        />
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="open-link" title="Abrir enlace">
                                            <ExternalLink size={15} />
                                        </a>
                                    </div>

                                    <input
                                        className="url-input"
                                        value={item.url}
                                        onChange={(e) =>
                                            setLinks((prev) =>
                                                prev.map((l) => (l.id === item.id ? { ...l, url: e.target.value } : l))
                                            )
                                        }
                                        onBlur={(e) => updateLink(item.id, { url: e.target.value })}
                                    />

                                    <textarea
                                        rows={2}
                                        className="desc-input"
                                        value={item.description || ''}
                                        onChange={(e) =>
                                            setLinks((prev) =>
                                                prev.map((l) => (l.id === item.id ? { ...l, description: e.target.value } : l))
                                            )
                                        }
                                        onBlur={(e) => updateLink(item.id, { description: e.target.value })}
                                        placeholder="Descripcion opcional"
                                    />

                                    <div className="item-actions">
                                        <div className="order-actions">
                                            <button onClick={() => moveLink(item, 'up')} disabled={index === 0}>Subir</button>
                                            <button onClick={() => moveLink(item, 'down')} disabled={index === ordered.length - 1}>Bajar</button>
                                        </div>
                                        <button className="delete-btn" onClick={() => removeLink(item.id)}>
                                            <Trash2 size={15} />
                                            Eliminar
                                        </button>
                                    </div>
                                </article>
                            ))}
                    </div>
                )}
            </section>

            <style jsx>{`
                .admin-info-page { padding-bottom: 40px; }
                .glass-box {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 20px;
                }
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 16px;
                    margin-bottom: 22px;
                }
                .home-title { margin: 0 0 6px; font-size: 1.9rem; font-weight: 800; color: #fff; }
                .home-subtitle { margin: 0; color: rgba(255,255,255,0.45); font-size: 0.95rem; }
                .refresh-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    border: 1px solid rgba(212,160,23,0.25);
                    background: rgba(212,160,23,0.08);
                    color: #d4a017;
                    border-radius: 12px;
                    padding: 10px 14px;
                    cursor: pointer;
                    font-weight: 700;
                }
                .spin { animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                .composer { padding: 16px; margin-bottom: 16px; }
                .composer-head {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #d4a017;
                    font-size: 0.85rem;
                    font-weight: 700;
                    margin-bottom: 10px;
                }
                .composer-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 10px;
                }
                input, textarea {
                    width: 100%;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: #fff;
                    border-radius: 10px;
                    padding: 10px 12px;
                    font-size: 0.86rem;
                    outline: none;
                    font-family: inherit;
                }
                textarea { resize: vertical; }
                input:focus, textarea:focus { border-color: rgba(212,160,23,0.45); }

                .composer-actions { display: flex; justify-content: flex-end; margin-top: 12px; }
                .save-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    border: none;
                    border-radius: 10px;
                    padding: 10px 14px;
                    background: #d4a017;
                    color: #0c0a08;
                    font-weight: 700;
                    cursor: pointer;
                }
                .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .error-box {
                    margin-bottom: 14px;
                    background: rgba(239,68,68,0.08);
                    border: 1px solid rgba(239,68,68,0.2);
                    color: #fca5a5;
                    border-radius: 14px;
                    padding: 12px 14px;
                }
                .empty-box { padding: 28px; text-align: center; color: rgba(255,255,255,0.5); }
                .list-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 14px;
                }
                .link-item {
                    padding: 14px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .item-top {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .title-input {
                    font-weight: 700;
                    border-color: rgba(212,160,23,0.22);
                }
                .open-link {
                    width: 34px;
                    height: 34px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.03);
                    color: rgba(255,255,255,0.75);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                    flex-shrink: 0;
                }
                .url-input { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
                .item-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                }
                .order-actions { display: flex; gap: 8px; }
                .order-actions button {
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px;
                    padding: 7px 10px;
                    background: rgba(255,255,255,0.03);
                    color: rgba(255,255,255,0.78);
                    cursor: pointer;
                    font-size: 0.78rem;
                }
                .order-actions button:disabled { opacity: 0.45; cursor: not-allowed; }
                .delete-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    border: 1px solid rgba(239,68,68,0.26);
                    border-radius: 10px;
                    padding: 7px 10px;
                    background: rgba(239,68,68,0.08);
                    color: #fca5a5;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                @media (max-width: 720px) {
                    .page-header { flex-direction: column; align-items: stretch; }
                    .refresh-btn { justify-content: center; }
                    .list-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
