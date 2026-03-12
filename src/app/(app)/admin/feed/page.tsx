'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';
import type { DbPostCommentPreview } from '@/types';
import { MessageSquareText, BarChart2, Search, Pin, PinOff, EyeOff, Eye, Trash2, RefreshCw, X, History } from 'lucide-react';

type AdminPostRow = Omit<AdminPost, 'itemType'>;
type AdminPollRow = Omit<AdminPoll, 'itemType'>;
type AdminActionRow = {
    id: string;
    admin_id: string;
    action: ActionHistoryItem['action'];
    created_at: string;
};
type UserNameRow = {
    uid: string;
    full_name: string;
};

function errorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) return error.message;
    return fallback;
}

type AdminPost = {
    id: string;
    itemType: 'post';
    author_name: string;
    description: string;
    image_url: string | null;
    pinned: boolean;
    hidden_by_admin?: boolean;
    created_at: string;
};

type AdminPoll = {
    id: string;
    itemType: 'poll';
    creator_name: string;
    question: string;
    total_votes: number;
    pinned: boolean;
    hidden_by_admin?: boolean;
    created_at: string;
};

type AdminFeedItem = AdminPost | AdminPoll;

type PollOptionItem = {
    id: string;
    text: string;
    votes_count: number;
    position: number;
};

type ActionHistoryItem = {
    id: string;
    action: 'pin' | 'unpin' | 'hide' | 'restore' | 'delete';
    admin_name: string;
    created_at: string;
};

export default function AdminFeedPage() {
    const [items, setItems] = useState<AdminFeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'post' | 'poll'>('all');
    const [stateFilter, setStateFilter] = useState<'all' | 'visible' | 'hidden' | 'pinned'>('all');
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] = useState<AdminFeedItem | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailComments, setDetailComments] = useState<DbPostCommentPreview[]>([]);
    const [detailOptions, setDetailOptions] = useState<PollOptionItem[]>([]);
    const [detailHistory, setDetailHistory] = useState<ActionHistoryItem[]>([]);

    const loadItems = useCallback(async (quiet = false) => {
        if (quiet) setRefreshing(true);
        else setLoading(true);
        setError('');

        try {
            const [postsRes, pollsRes] = await Promise.all([
                supabase
                    .from('posts')
                    .select('id, author_name, description, image_url, pinned, hidden_by_admin, created_at')
                    .order('created_at', { ascending: false })
                    .limit(200),
                supabase
                    .from('polls')
                    .select('id, creator_name, question, total_votes, pinned, hidden_by_admin, created_at')
                    .order('created_at', { ascending: false })
                    .limit(200),
            ]);

            if (postsRes.error) throw new Error(postsRes.error.message);
            if (pollsRes.error) throw new Error(pollsRes.error.message);

            const postRows = (postsRes.data || []) as AdminPostRow[];
            const pollRows = (pollsRes.data || []) as AdminPollRow[];

            const posts: AdminPost[] = postRows.map((item) => ({
                ...item,
                itemType: 'post',
            }));

            const polls: AdminPoll[] = pollRows.map((item) => ({
                ...item,
                itemType: 'poll',
            }));

            const merged = [...posts, ...polls].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setItems(merged);
        } catch (e: unknown) {
            setError(errorMessage(e, 'No se pudo cargar el feed admin'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase();

        return items.filter((item) => {
            if (typeFilter !== 'all' && item.itemType !== typeFilter) return false;

            if (stateFilter === 'hidden' && !item.hidden_by_admin) return false;
            if (stateFilter === 'visible' && item.hidden_by_admin) return false;
            if (stateFilter === 'pinned' && !item.pinned) return false;

            if (!query) return true;

            if (item.itemType === 'post') {
                return (
                    item.author_name.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query)
                );
            }

            return (
                item.creator_name.toLowerCase().includes(query) ||
                item.question.toLowerCase().includes(query)
            );
        });
    }, [items, search, typeFilter, stateFilter]);

    async function handlePin(item: AdminFeedItem) {
        try {
            const res = await fetch('/api/feed/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemType: item.itemType, id: item.id, pinned: !item.pinned }),
            });
            const data = await res.json();
            if (!res.ok || data?.error) throw new Error(data?.error || 'No se pudo actualizar fijado');
            await loadItems(true);
        } catch (e: unknown) {
            setError(errorMessage(e, 'No se pudo actualizar fijado'));
        }
    }

    async function handleModeration(item: AdminFeedItem, action: 'hide' | 'restore' | 'delete') {
        const actionLabel = action === 'hide' ? 'ocultar' : action === 'restore' ? 'restaurar' : 'eliminar';
        if (!confirm(`¿Querés ${actionLabel} este ${item.itemType === 'post' ? 'post' : 'encuesta'}?`)) return;

        try {
            const res = await fetch('/api/feed/moderate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemType: item.itemType, id: item.id, action }),
            });
            const data = await res.json();
            if (!res.ok || data?.error) throw new Error(data?.error || 'No se pudo moderar');
            await loadItems(true);
            if (selectedItem && selectedItem.id === item.id && selectedItem.itemType === item.itemType) {
                if (action === 'delete') {
                    setSelectedItem(null);
                    setDetailComments([]);
                    setDetailOptions([]);
                    setDetailHistory([]);
                } else {
                    setSelectedItem({ ...item, hidden_by_admin: action === 'hide' });
                    await loadDetail(item.itemType, item.id);
                }
            }
        } catch (e: unknown) {
            setError(errorMessage(e, 'No se pudo moderar'));
        }
    }

    const loadDetail = useCallback(async (itemType: 'post' | 'poll', id: string) => {
        setDetailLoading(true);
        try {
            const historyRes = await supabase
                .from('admin_feed_actions')
                .select('id, admin_id, action, created_at')
                .eq('target_type', itemType)
                .eq('target_id', id)
                .order('created_at', { ascending: false })
                .limit(20);

            let commentRows: DbPostCommentPreview[] = [];
            let optionRows: PollOptionItem[] = [];

            if (itemType === 'post') {
                const commentsRes = await supabase
                    .from('post_comments')
                    .select('id, user_name, content, created_at')
                    .eq('post_id', id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (commentsRes.error) throw new Error(commentsRes.error.message);
                commentRows = (commentsRes.data || []) as DbPostCommentPreview[];
            } else {
                const optionsRes = await supabase
                    .from('poll_options')
                    .select('id, text, votes_count, position')
                    .eq('poll_id', id)
                    .order('position', { ascending: true });

                if (optionsRes.error) throw new Error(optionsRes.error.message);
                optionRows = (optionsRes.data || []) as PollOptionItem[];
            }

            if (historyRes.error) throw new Error(historyRes.error.message);

            const historyRows = (historyRes.data || []) as AdminActionRow[];
            const adminIds = Array.from(new Set(historyRows.map((item) => item.admin_id).filter(Boolean)));
            let adminNames: Record<string, string> = {};

            if (adminIds.length > 0) {
                const adminsRes = await supabase
                    .from('users')
                    .select('uid, full_name')
                    .in('uid', adminIds);

                if (adminsRes.error) throw new Error(adminsRes.error.message);
                adminNames = Object.fromEntries(((adminsRes.data || []) as UserNameRow[]).map((admin) => [admin.uid, admin.full_name]));
            }

            setDetailComments(commentRows);
            setDetailOptions(optionRows);
            setDetailHistory(
                historyRows.map((item) => ({
                    id: item.id,
                    action: item.action,
                    admin_name: adminNames[item.admin_id] || 'Admin',
                    created_at: item.created_at,
                }))
            );
        } catch (e: unknown) {
            setError(errorMessage(e, 'No se pudo cargar el detalle'));
        } finally {
            setDetailLoading(false);
        }
    }, []);

    async function openDetail(item: AdminFeedItem) {
        setSelectedItem(item);
        setDetailComments([]);
        setDetailOptions([]);
        setDetailHistory([]);
        await loadDetail(item.itemType, item.id);
    }

    return (
        <div className="admin-feed-page">
            <header className="page-header-row">
                <div>
                    <h2 className="home-title">Moderacion del Feed</h2>
                    <p className="home-subtitle">Controla posts y encuestas del elenco desde un solo lugar.</p>
                </div>
                <button className="refresh-btn" onClick={() => loadItems(true)} disabled={refreshing}>
                    <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                    Actualizar
                </button>
            </header>

            <section className="toolbar glass-box">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por autor, creador o contenido..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="filters-row">
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | 'post' | 'poll')}>
                        <option value="all">Todo</option>
                        <option value="post">Posts</option>
                        <option value="poll">Encuestas</option>
                    </select>
                    <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value as 'all' | 'visible' | 'hidden' | 'pinned')}>
                        <option value="all">Todos los estados</option>
                        <option value="visible">Visibles</option>
                        <option value="hidden">Ocultos</option>
                        <option value="pinned">Fijados</option>
                    </select>
                </div>
            </section>

            {error && <div className="error-box">{error}</div>}

            <section className="results-section">
                {loading ? (
                    <div className="empty-box glass-box">Cargando contenido...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="empty-box glass-box">No hay contenido que coincida con los filtros actuales.</div>
                ) : (
                    <div className="items-grid">
                        {filteredItems.map((item) => {
                            const isPost = item.itemType === 'post';
                            const title = isPost ? item.author_name : item.creator_name;
                            const body = isPost ? item.description : item.question;

                            return (
                                <article key={`${item.itemType}-${item.id}`} className={`feed-item-card glass-box${item.hidden_by_admin ? ' hidden' : ''}`}>
                                    <div className="item-top-row">
                                        <div className="item-kind-badge">
                                            {isPost ? <MessageSquareText size={14} /> : <BarChart2 size={14} />}
                                            <span>{isPost ? 'Post' : 'Encuesta'}</span>
                                        </div>
                                        <div className="item-statuses">
                                            {item.pinned && <span className="status pinned">Fijado</span>}
                                            {item.hidden_by_admin && <span className="status hidden">Oculto</span>}
                                        </div>
                                    </div>

                                    <div className="item-meta">
                                        <strong>{title}</strong>
                                        <span>{timeAgo(item.created_at, { withAgo: false })}</span>
                                    </div>

                                    <p className="item-body">{body}</p>

                                    {!isPost && (
                                        <p className="item-extra">Votos acumulados: {item.total_votes}</p>
                                    )}

                                    <div className="item-actions">
                                        <button className="action-chip" onClick={() => openDetail(item)}>
                                            <History size={14} />
                                            Ver detalle
                                        </button>
                                        <button className="action-chip" onClick={() => handlePin(item)}>
                                            {item.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                                            {item.pinned ? 'Desfijar' : 'Fijar'}
                                        </button>
                                        <button className="action-chip" onClick={() => handleModeration(item, item.hidden_by_admin ? 'restore' : 'hide')}>
                                            {item.hidden_by_admin ? <Eye size={14} /> : <EyeOff size={14} />}
                                            {item.hidden_by_admin ? 'Restaurar' : 'Ocultar'}
                                        </button>
                                        <button className="action-chip danger" onClick={() => handleModeration(item, 'delete')}>
                                            <Trash2 size={14} />
                                            Eliminar
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {selectedItem && (
                <div className="detail-overlay" onClick={() => setSelectedItem(null)}>
                    <aside className="detail-panel glass-box" onClick={(e) => e.stopPropagation()}>
                        <div className="detail-head">
                            <div>
                                <div className="detail-kicker">{selectedItem.itemType === 'post' ? 'Detalle del post' : 'Detalle de la encuesta'}</div>
                                <h3>{selectedItem.itemType === 'post' ? selectedItem.author_name : selectedItem.creator_name}</h3>
                            </div>
                            <button className="detail-close" onClick={() => setSelectedItem(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="detail-body">
                            <section className="detail-section">
                                <h4>Contenido</h4>
                                <p>{selectedItem.itemType === 'post' ? selectedItem.description : selectedItem.question}</p>
                            </section>

                            {selectedItem.itemType === 'post' ? (
                                <section className="detail-section">
                                    <h4>Comentarios</h4>
                                    {detailLoading ? (
                                        <p className="detail-empty">Cargando comentarios...</p>
                                    ) : detailComments.length === 0 ? (
                                        <p className="detail-empty">Este post no tiene comentarios.</p>
                                    ) : (
                                        <div className="detail-list">
                                            {detailComments.map((comment) => (
                                                <div key={comment.id} className="detail-card">
                                                    <div className="detail-card-top">
                                                        <strong>{comment.user_name}</strong>
                                                        <span>{timeAgo(comment.created_at, { withAgo: false })}</span>
                                                    </div>
                                                    <p>{comment.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            ) : (
                                <section className="detail-section">
                                    <h4>Opciones y votos</h4>
                                    {detailLoading ? (
                                        <p className="detail-empty">Cargando opciones...</p>
                                    ) : detailOptions.length === 0 ? (
                                        <p className="detail-empty">Esta encuesta no tiene opciones cargadas.</p>
                                    ) : (
                                        <div className="detail-list">
                                            {detailOptions.map((option) => (
                                                <div key={option.id} className="detail-card compact">
                                                    <div className="detail-card-top">
                                                        <strong>{option.text}</strong>
                                                        <span>{option.votes_count} votos</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}

                            <section className="detail-section">
                                <h4>Historial de moderacion</h4>
                                {detailLoading ? (
                                    <p className="detail-empty">Cargando historial...</p>
                                ) : detailHistory.length === 0 ? (
                                    <p className="detail-empty">Todavia no hay acciones registradas para este contenido.</p>
                                ) : (
                                    <div className="detail-list">
                                        {detailHistory.map((history) => (
                                            <div key={history.id} className="detail-card compact">
                                                <div className="detail-card-top">
                                                    <strong>{history.admin_name}</strong>
                                                    <span>{timeAgo(history.created_at, { withAgo: false })}</span>
                                                </div>
                                                <p>{history.admin_name} realizo la accion <b>{history.action}</b>.</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </aside>
                </div>
            )}

            <style jsx>{`
                .admin-feed-page { padding-bottom: 40px; }
                .page-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .home-title { font-size: 1.9rem; font-weight: 800; color: #fff; margin: 0 0 6px; }
                .home-subtitle { color: rgba(255,255,255,0.4); font-size: 0.95rem; margin: 0; }
                .glass-box {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 24px;
                    backdrop-filter: blur(10px);
                }
                .toolbar {
                    padding: 18px;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    justify-content: space-between;
                }
                .search-box {
                    flex: 1;
                    max-width: 460px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 14px;
                    padding: 0 14px;
                }
                .search-box input {
                    width: 100%;
                    background: transparent;
                    border: none;
                    color: #fff;
                    padding: 12px 0;
                    outline: none;
                    font-size: 0.9rem;
                }
                .filters-row {
                    display: flex;
                    gap: 12px;
                }
                .filters-row select {
                    background: #181411;
                    color: #fff;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    padding: 10px 12px;
                    font-size: 0.85rem;
                    outline: none;
                }
                .refresh-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    border: 1px solid rgba(212,160,23,0.25);
                    background: rgba(212,160,23,0.08);
                    color: #d4a017;
                    border-radius: 12px;
                    padding: 11px 14px;
                    cursor: pointer;
                    font-weight: 700;
                }
                .spin { animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .error-box {
                    margin-bottom: 16px;
                    background: rgba(239,68,68,0.08);
                    border: 1px solid rgba(239,68,68,0.2);
                    color: #fca5a5;
                    border-radius: 14px;
                    padding: 12px 14px;
                }
                .empty-box {
                    padding: 42px;
                    text-align: center;
                    color: rgba(255,255,255,0.45);
                }
                .items-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 18px;
                }
                .feed-item-card {
                    padding: 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .feed-item-card.hidden {
                    border-color: rgba(239,68,68,0.16);
                    background: rgba(239,68,68,0.03);
                }
                .item-top-row {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    align-items: center;
                }
                .item-kind-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    background: rgba(255,255,255,0.05);
                    color: rgba(255,255,255,0.8);
                    padding: 6px 10px;
                    border-radius: 999px;
                    font-size: 0.78rem;
                    font-weight: 700;
                }
                .item-statuses {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .status {
                    padding: 4px 8px;
                    border-radius: 999px;
                    font-size: 0.7rem;
                    font-weight: 700;
                }
                .status.pinned {
                    background: rgba(212,160,23,0.12);
                    color: #d4a017;
                }
                .status.hidden {
                    background: rgba(239,68,68,0.12);
                    color: #f87171;
                }
                .item-meta {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    align-items: center;
                    color: rgba(255,255,255,0.55);
                    font-size: 0.82rem;
                }
                .item-meta strong {
                    color: #fff;
                    font-size: 0.9rem;
                }
                .item-body {
                    margin: 0;
                    color: rgba(255,255,255,0.82);
                    line-height: 1.55;
                    font-size: 0.92rem;
                    word-break: break-word;
                }
                .item-extra {
                    margin: -4px 0 0;
                    color: rgba(255,255,255,0.42);
                    font-size: 0.8rem;
                }
                .item-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: auto;
                }
                .action-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.82);
                    border-radius: 12px;
                    padding: 9px 12px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.82rem;
                }
                .action-chip:hover { border-color: rgba(212,160,23,0.35); color: #d4a017; }
                .action-chip.danger:hover { border-color: rgba(239,68,68,0.35); color: #f87171; }
                .detail-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.55);
                    z-index: 120;
                    display: flex;
                    justify-content: flex-end;
                }
                .detail-panel {
                    width: min(520px, 100%);
                    height: 100%;
                    border-radius: 0;
                    border-left: 1px solid rgba(255,255,255,0.06);
                    padding: 22px;
                    overflow-y: auto;
                }
                .detail-head {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 16px;
                    margin-bottom: 22px;
                }
                .detail-kicker {
                    font-size: 0.75rem;
                    color: #d4a017;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    font-weight: 700;
                    margin-bottom: 6px;
                }
                .detail-head h3 {
                    margin: 0;
                    color: #fff;
                    font-size: 1.25rem;
                }
                .detail-close {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: rgba(255,255,255,0.03);
                    color: rgba(255,255,255,0.7);
                    cursor: pointer;
                }
                .detail-body {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }
                .detail-section h4 {
                    margin: 0 0 10px;
                    color: #fff;
                    font-size: 0.95rem;
                }
                .detail-section > p {
                    margin: 0;
                    color: rgba(255,255,255,0.78);
                    line-height: 1.6;
                }
                .detail-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .detail-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 14px;
                    padding: 12px 14px;
                }
                .detail-card.compact p { margin-top: 6px; }
                .detail-card-top {
                    display: flex;
                    justify-content: space-between;
                    gap: 10px;
                    align-items: center;
                }
                .detail-card-top strong { color: #fff; font-size: 0.88rem; }
                .detail-card-top span { color: rgba(255,255,255,0.4); font-size: 0.75rem; }
                .detail-card p {
                    margin: 8px 0 0;
                    color: rgba(255,255,255,0.75);
                    font-size: 0.84rem;
                    line-height: 1.5;
                }
                .detail-empty {
                    color: rgba(255,255,255,0.45);
                    font-size: 0.85rem;
                    margin: 0;
                }
                @media (max-width: 900px) {
                    .toolbar {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .search-box { max-width: none; }
                    .filters-row { width: 100%; }
                    .filters-row select { flex: 1; }
                    .page-header-row {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .detail-panel {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
