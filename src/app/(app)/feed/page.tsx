'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Heart, Plus, X, BarChart2, RefreshCw, Image as ImageIcon, MessageSquare, Send } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
type PollOption = { id: string; text: string; votes_count: number; position: number };

type PostComment = {
    id: string;
    user_id: string;
    user_name: string;
    user_photo_url: string | null;
    content: string;
    created_at: string;
};

type PostItem = {
    itemType: 'post';
    id: string; author_id: string; author_name: string;
    author_photo_url: string | null; description: string;
    image_url: string | null;
    likes_count: number; pinned: boolean; created_at: string;
    isLiked: boolean;
};

type PollItem = {
    itemType: 'poll';
    id: string; creator_id: string; creator_name: string;
    question: string; type: 'single' | 'multi';
    is_anonymous: boolean; show_results: string;
    closes_at: string | null; pinned: boolean;
    total_votes: number; created_at: string;
    poll_options: PollOption[];
    hasVoted: boolean; myVoteIds: string[];
};

type FeedItem = PostItem | PollItem;

// ── Helpers ────────────────────────────────────────────────────
function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return 'ahora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
}
function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({ name, url }: { name: string; url?: string | null }) {
    if (url) return <img src={url} alt={name} className="c-avatar-img" />;
    return <div className="c-avatar">{initials(name)}</div>;
}

// ── Post Card ──────────────────────────────────────────────────
function PostCard({ item, onLike }: { item: PostItem; onLike: (id: string, liked: boolean) => void }) {
    const [showHeartAnim, setShowHeartAnim] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<PostComment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);

    const handleDoubleTap = () => {
        if (!item.isLiked) {
            onLike(item.id, false);
        }
        setShowHeartAnim(true);
        setTimeout(() => setShowHeartAnim(false), 800);
    };

    const toggleComments = async () => {
        if (!showComments) {
            setShowComments(true);
            setLoadingComments(true);
            try {
                const { data, error } = await supabase
                    .from('post_comments')
                    .select('*')
                    .eq('post_id', item.id)
                    .order('created_at', { ascending: true });
                if (!error && data) {
                    setComments(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingComments(false);
            }
        } else {
            setShowComments(false);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        setPostingComment(true);
        try {
            const res = await fetch('/api/feed/comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: item.id, content: newComment }),
            });
            const data = await res.json();
            if (data.success && data.comment) {
                setComments(prev => [...prev, data.comment]);
                setNewComment('');
            } else {
                alert(data.error || 'Error al comentar. Verifica que la tabla post_comments existe.');
            }
        } catch (e) {
            alert('Error de red al comentar.');
        } finally {
            setPostingComment(false);
        }
    };

    return (
        <article className="feed-card">
            <div className="card-avatar-col">
                <Avatar name={item.author_name} url={item.author_photo_url} />
            </div>
            <div className="card-body">
                <div className="card-meta">
                    <span className="card-name">{item.author_name}</span>
                    <span className="card-dot">·</span>
                    <span className="card-time">{timeAgo(item.created_at)}</span>
                    {item.pinned && <span className="card-pin">📌</span>}
                </div>
                <p className="card-text">{item.description}</p>
                {item.image_url && (
                    <div className="card-image-wrap" onDoubleClick={handleDoubleTap}>
                        <img src={item.image_url} alt="Imagen" className="card-image" loading="lazy" />
                        {showHeartAnim && (
                            <div className="anim-heart">
                                <Heart size={80} fill="#fff" color="#fff" />
                            </div>
                        )}
                    </div>
                )}
                <div className="card-actions">
                    <button
                        className={`card-like${item.isLiked ? ' liked' : ''}`}
                        onClick={() => onLike(item.id, item.isLiked)}
                    >
                        <Heart size={16} fill={item.isLiked ? '#ef4444' : 'none'} color={item.isLiked ? '#ef4444' : 'rgba(255,255,255,0.4)'} />
                        {item.likes_count > 0 && <span>{item.likes_count}</span>}
                    </button>
                    <button className="card-action-btn" onClick={toggleComments}>
                        <MessageSquare size={16} />
                    </button>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="comments-section">
                        {loadingComments ? (
                            <p className="comments-loading">Cargando comentarios...</p>
                        ) : comments.length === 0 ? (
                            <p className="comments-empty">Sé el primero en comentar.</p>
                        ) : (
                            <div className="comments-list">
                                {comments.map(c => (
                                    <div key={c.id} className="comment-item">
                                        <div className="comment-avatar"><Avatar name={c.user_name} url={c.user_photo_url} /></div>
                                        <div className="comment-content">
                                            <span className="comment-name">{c.user_name}</span>
                                            <p className="comment-text">{c.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="comment-input-wrap">
                            <input
                                className="comment-input"
                                placeholder="Escribe un comentario..."
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                            />
                            <button className="comment-send" onClick={handlePostComment} disabled={!newComment.trim() || postingComment}>
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </article>
    );
}

// ── Poll Card ──────────────────────────────────────────────────
function PollCard({ item, onVote }: { item: PollItem; onVote: (pollId: string, optionId: string) => void }) {
    const isExpired = item.closes_at ? new Date(item.closes_at) < new Date() : false;
    const canVote = !item.hasVoted && !isExpired;
    const showResults = item.hasVoted || item.show_results === 'always';
    const displayName = item.is_anonymous ? 'Anónimo' : item.creator_name;

    return (
        <article className="feed-card">
            <div className="card-avatar-col">
                <Avatar name={displayName} />
            </div>
            <div className="card-body">
                <div className="card-meta">
                    <span className="card-name">{displayName}</span>
                    <span className="card-dot">·</span>
                    <span className="card-time">{timeAgo(item.created_at)}</span>
                    {item.pinned && <span className="card-pin">📌</span>}
                    <span className="card-poll-badge"><BarChart2 size={11} /> Encuesta</span>
                </div>
                <p className="card-text" style={{ fontWeight: 500 }}>{item.question}</p>
                <div className="poll-options-list">
                    {[...item.poll_options]
                        .sort((a, b) => a.position - b.position)
                        .map(opt => {
                            const total = item.total_votes || 1;
                            const pct = Math.round((opt.votes_count / total) * 100);
                            const isMine = item.myVoteIds.includes(opt.id);
                            return (
                                <button
                                    key={opt.id}
                                    className={`poll-opt${isMine ? ' mine' : ''}${!canVote ? ' no-vote' : ''}`}
                                    onClick={() => canVote && onVote(item.id, opt.id)}
                                    disabled={!canVote}
                                >
                                    {showResults && (
                                        <div className="poll-bar" style={{ width: `${pct}%` }} />
                                    )}
                                    <span className="poll-opt-text">{opt.text}</span>
                                    {showResults && <span className="poll-pct">{pct}%</span>}
                                </button>
                            );
                        })}
                </div>
                <p className="poll-footer">
                    {item.total_votes} {item.total_votes === 1 ? 'voto' : 'votos'}
                    {isExpired && <span className="poll-closed"> · Cerrada</span>}
                </p>
            </div>
        </article>
    );
}

// ── Main Page ──────────────────────────────────────────────────
export default function FeedPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [composeOpen, setComposeOpen] = useState(false);
    const [tab, setTab] = useState<'post' | 'poll'>('post');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Post compose state
    const [postText, setPostText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    // Poll compose state
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [pollType, setPollType] = useState<'single' | 'multi'>('single');
    const [isAnon, setIsAnon] = useState(false);

    const loadFeed = useCallback(async (quiet = false) => {
        if (!user) return;
        if (!quiet) setLoading(true); else setRefreshing(true);

        const [postsRes, pollsRes, likesRes, votesRes] = await Promise.all([
            supabase.from('posts').select('*')
                .order('pinned', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(100),
            supabase.from('polls').select('*, poll_options(*)')
                .order('pinned', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(100),
            supabase.from('post_likes').select('post_id').eq('user_id', user.id),
            supabase.from('poll_votes').select('poll_id, option_id').eq('user_id', user.id),
        ]);

        const likedIds = new Set(likesRes.data?.map(l => l.post_id) || []);
        const votedMap: Record<string, string[]> = {};
        votesRes.data?.forEach(v => {
            if (!votedMap[v.poll_id]) votedMap[v.poll_id] = [];
            votedMap[v.poll_id].push(v.option_id);
        });

        const posts: PostItem[] = (postsRes.data || []).map(p => ({
            ...p, itemType: 'post', isLiked: likedIds.has(p.id),
        }));
        const polls: PollItem[] = (pollsRes.data || []).map(p => ({
            ...p, itemType: 'poll',
            hasVoted: !!votedMap[p.id],
            myVoteIds: votedMap[p.id] || [],
        }));

        const merged = [...posts, ...polls].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setItems(merged);
        setLoading(false);
        setRefreshing(false);
    }, [user]);

    useEffect(() => { loadFeed(); }, [loadFeed]);

    async function handleLike(postId: string, isLiked: boolean) {
        // Like solo suma: si ya esta likeado, no hacemos nada.
        if (isLiked) return;

        // Optimistic
        setItems(prev => prev.map(i =>
            i.itemType === 'post' && i.id === postId
                ? { ...i, isLiked: !isLiked, likes_count: i.likes_count + (isLiked ? -1 : 1) }
                : i
        ));
        const { error } = await supabase.rpc('toggle_post_like', { p_post_id: postId });
        if (error) {
            // Revert
            setItems(prev => prev.map(i =>
                i.itemType === 'post' && i.id === postId
                    ? { ...i, isLiked, likes_count: i.likes_count + (isLiked ? 1 : -1) }
                    : i
            ));
        }
    }

    async function handleVote(pollId: string, optionId: string) {
        // Optimistic
        setItems(prev => prev.map(i => {
            if (i.itemType !== 'poll' || i.id !== pollId) return i;
            return {
                ...i, hasVoted: true, myVoteIds: [optionId],
                total_votes: i.total_votes + 1,
                poll_options: i.poll_options.map(o =>
                    o.id === optionId ? { ...o, votes_count: o.votes_count + 1 } : o
                ),
            };
        }));
        const { error } = await supabase.rpc('vote_on_poll', { p_poll_id: pollId, p_option_id: optionId });
        if (error) loadFeed(true); // Revert on error
    }

    async function handlePost() {
        if (!postText.trim() && !imageFile) return;
        setSubmitting(true); setSubmitError('');
        try {
            const fd = new FormData();
            if (postText.trim()) fd.append('description', postText);
            else fd.append('description', 'Imagen adjuunta'); // Fallback text if empty

            if (imageFile) {
                fd.append('image', imageFile);
            }

            const res = await fetch('/api/feed/post', {
                method: 'POST',
                body: fd,
            });
            const data = await res.json();
            if (data?.error) { setSubmitError(data.error); return; }
            setPostText('');
            handleRemoveImage();
            setComposeOpen(false);
            loadFeed(true);
        } catch {
            setSubmitError('No se pudo publicar. Reintentá en unos segundos.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handlePoll() {
        const validOpts = options.filter(o => o.trim());
        if (!question.trim() || validOpts.length < 2) return;
        setSubmitting(true); setSubmitError('');
        try {
            const res = await fetch('/api/feed/poll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    options: validOpts,
                    type: pollType,
                    isAnonymous: isAnon,
                }),
            });
            const data = await res.json();
            if (data?.error) { setSubmitError(data.error); return; }
            setQuestion('');
            setOptions(['', '']);
            setComposeOpen(false);
            loadFeed(true);
        } catch {
            setSubmitError('No se pudo crear la encuesta. Reintentá en unos segundos.');
        } finally {
            setSubmitting(false);
        }
    }

    function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    }

    function handleRemoveImage() {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function closeCompose() {
        setComposeOpen(false);
        setSubmitError('');
        setPostText('');
        handleRemoveImage();
    }

    return (
        <div className="fp-root">
            {/* Sticky header */}
            <header className="fp-header">
                <span className="fp-crown">♛</span>
                <span className="fp-title">Rey León</span>
                <div className="fp-header-actions">
                    <button className="fp-refresh" onClick={() => loadFeed(true)} disabled={refreshing}>
                        <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                    </button>
                    <button className="fp-fab" onClick={() => { setComposeOpen(true); setSubmitError(''); }}>
                        <Plus size={20} />
                    </button>
                </div>
            </header>

            {/* Feed list */}
            <main className="fp-list">
                {loading ? (
                    <div className="fp-skeletons">
                        {[0, 1, 2].map(i => <div key={i} className="fp-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="fp-empty">
                        <div className="fp-empty-icon">♛</div>
                        <p>No hay publicaciones aún.</p>
                        <p className="fp-empty-sub">¡Sé el primero en compartir algo!</p>
                    </div>
                ) : (
                    items.map(item =>
                        item.itemType === 'post'
                            ? <PostCard key={item.id} item={item} onLike={handleLike} />
                            : <PollCard key={item.id} item={item} onVote={handleVote} />
                    )
                )}
            </main>

            {/* Compose sheet */}
            {composeOpen && (
                <div className="compose-overlay" onClick={closeCompose}>
                    <div className="compose-sheet" onClick={e => e.stopPropagation()}>
                        <div className="compose-handle" />
                        <div className="compose-top">
                            <div className="compose-tabs">
                                <button className={`compose-tab${tab === 'post' ? ' on' : ''}`} onClick={() => setTab('post')}>
                                    Publicación
                                </button>
                                <button className={`compose-tab${tab === 'poll' ? ' on' : ''}`} onClick={() => setTab('poll')}>
                                    <BarChart2 size={13} /> Encuesta
                                </button>
                            </div>
                            <button className="compose-close" onClick={closeCompose}><X size={20} /></button>
                        </div>

                        {tab === 'post' ? (
                            <div className="compose-body">
                                <textarea
                                    className="compose-textarea"
                                    placeholder="¿Qué quieres compartir con el elenco?"
                                    value={postText}
                                    onChange={e => setPostText(e.target.value)}
                                    maxLength={500}
                                    autoFocus
                                    rows={4}
                                />
                                {imagePreview && (
                                    <div className="compose-img-preview">
                                        <img src={imagePreview} alt="Preview" />
                                        <button className="preview-rm" onClick={handleRemoveImage}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                                {submitError && <p className="compose-error">{submitError}</p>}
                                <div className="compose-footer">
                                    <div className="compose-left-actions">
                                        <input
                                            type="file"
                                            accept="image/jpeg, image/jpg, image/png, image/webp"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            onChange={handleImagePick}
                                        />
                                        <button className="compose-img-btn" onClick={() => fileInputRef.current?.click()}>
                                            <ImageIcon size={18} />
                                        </button>
                                        <span className="compose-count">{postText.length}/500</span>
                                    </div>
                                    <button className="compose-submit" onClick={handlePost}
                                        disabled={(!postText.trim() && !imageFile) || submitting}>
                                        {submitting ? '...' : 'Publicar'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="compose-body">
                                <input className="compose-input" placeholder="¿Cuál es tu pregunta?"
                                    value={question} onChange={e => setQuestion(e.target.value)} autoFocus />

                                <div className="compose-options-list">
                                    {options.map((opt, i) => (
                                        <div key={i} className="compose-opt-row">
                                            <input className="compose-input" placeholder={`Opción ${i + 1}`}
                                                value={opt} onChange={e => {
                                                    const n = [...options]; n[i] = e.target.value; setOptions(n);
                                                }} />
                                            {options.length > 2 && (
                                                <button className="compose-rm-opt"
                                                    onClick={() => setOptions(options.filter((_, j) => j !== i))}>
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {options.length < 5 && (
                                        <button className="compose-add-opt" onClick={() => setOptions([...options, ''])}>
                                            + Agregar opción
                                        </button>
                                    )}
                                </div>

                                <div className="compose-poll-settings">
                                    <label className="compose-toggle-label">
                                        <input type="checkbox" checked={pollType === 'multi'}
                                            onChange={e => setPollType(e.target.checked ? 'multi' : 'single')} />
                                        Múltiple respuesta
                                    </label>
                                    <label className="compose-toggle-label">
                                        <input type="checkbox" checked={isAnon}
                                            onChange={e => setIsAnon(e.target.checked)} />
                                        Anónima
                                    </label>
                                </div>

                                {submitError && <p className="compose-error">{submitError}</p>}
                                <div className="compose-footer">
                                    <span />
                                    <button className="compose-submit" onClick={handlePoll}
                                        disabled={!question.trim() || options.filter(o => o.trim()).length < 2 || submitting}>
                                        {submitting ? '...' : 'Crear encuesta'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{pageStyles}</style>
        </div>
    );
}

const pageStyles = `
  .fp-root { min-height: 100dvh; background: #0c0a08; font-family: 'Poppins', sans-serif; }

  /* Header */
  .fp-header {
    position: sticky; top: 0; z-index: 20;
    display: flex; align-items: center; gap: 8px;
    padding: 0 16px;
    height: 52px;
    background: rgba(12,10,8,0.92);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    backdrop-filter: blur(12px);
  }
  .fp-crown { font-size: 1.1rem; color: #d4a017; text-shadow: 0 0 10px rgba(212,160,23,0.4); }
  .fp-title { font-size: 1rem; font-weight: 600; color: #fff; flex: 1; letter-spacing: 0.01em; }
  .fp-header-actions { display: flex; align-items: center; gap: 8px; }
  .fp-refresh {
    background: transparent; border: none; color: rgba(255,255,255,0.4);
    cursor: pointer; padding: 8px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .fp-refresh:hover { color: #fff; }
  .spinning { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .fp-fab {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, #d4a017, #b8860b);
    border: none; color: #0c0a08; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(212,160,23,0.3);
    transition: transform 0.15s, opacity 0.15s;
  }
  .fp-fab:hover { transform: scale(1.06); }

  /* Skeletons */
  .fp-skeletons { padding: 8px 0; }
  .fp-skeleton {
    margin: 0 16px 12px;
    height: 80px; border-radius: 14px;
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }
  @keyframes shimmer { to { background-position: -200% 0; } }

  /* Empty */
  .fp-empty { text-align: center; padding: 64px 24px; color: rgba(255,255,255,0.3); font-size: 0.9rem; }
  .fp-empty-icon { font-size: 2.5rem; color: rgba(212,160,23,0.3); margin-bottom: 12px; }
  .fp-empty-sub { font-size: 0.8rem; margin-top: 4px; }

  /* Cards */
  .feed-card {
    display: flex; gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    transition: background 0.15s;
  }
  .feed-card:active { background: rgba(255,255,255,0.02); }
  .card-avatar-col { flex-shrink: 0; }
  .c-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, #d4a017, #7a5500);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; font-weight: 700; color: #0c0a08;
  }
  .c-avatar-img {
    width: 40px; height: 40px; border-radius: 50%;
    object-fit: cover; border: 1px solid rgba(255,255,255,0.08);
  }
  .card-body { flex: 1; min-width: 0; }
  .card-meta { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; flex-wrap: wrap; }
  .card-name { font-size: 0.85rem; font-weight: 600; color: #fff; }
  .card-dot { color: rgba(255,255,255,0.25); font-size: 0.7rem; }
  .card-time { font-size: 0.78rem; color: rgba(255,255,255,0.4); }
  .card-pin { font-size: 0.75rem; }
  .card-poll-badge {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 0.65rem; color: #d4a017; font-weight: 500;
    background: rgba(212,160,23,0.1); border-radius: 20px;
    padding: 1px 7px; margin-left: 2px;
  }
  .card-text { font-size: 0.9rem; color: rgba(255,255,255,0.9); line-height: 1.5; margin: 0 0 10px; word-break: break-word; }
  .card-image-wrap { margin-bottom: 12px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: #000; position: relative; user-select: none; }
  .card-image { width: 100%; max-height: 400px; object-fit: contain; display: block; }
  .card-actions { display: flex; gap: 16px; }
  .card-like, .card-action-btn {
    display: flex; align-items: center; gap: 5px;
    background: transparent; border: none; cursor: pointer;
    color: rgba(255,255,255,0.4); font-size: 0.8rem;
    font-family: 'Poppins', sans-serif;
    padding: 4px 0; min-height: 32px;
    transition: color 0.15s;
  }
  .card-like:hover, .card-action-btn:hover { color: #ef4444; }
  .card-like.liked { color: #ef4444; cursor: default; }
  .anim-heart {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0);
    opacity: 0; pointer-events: none; animation: popHeart 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));
  }
  @keyframes popHeart {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    15% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
    30% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    70% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
  }

  /* Comments */
  .comments-section { margin-top: 12px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.06); }
  .comments-loading, .comments-empty { font-size: 0.8rem; color: rgba(255,255,255,0.3); text-align: center; margin-bottom: 12px; }
  .comments-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; max-height: 300px; overflow-y: auto; }
  .comment-item { display: flex; gap: 8px; }
  .comment-avatar .c-avatar, .comment-avatar .c-avatar-img { width: 28px; height: 28px; font-size: 0.55rem; }
  .comment-content { flex: 1; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 0 12px 12px 12px; }
  .comment-name { display: block; font-size: 0.75rem; font-weight: 600; color: #d4a017; margin-bottom: 2px; }
  .comment-text { font-size: 0.8rem; color: #fff; margin: 0; line-height: 1.4; word-break: break-word; }
  .comment-input-wrap { display: flex; gap: 8px; align-items: center; }
  .comment-input {
    flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px; padding: 8px 14px; color: #fff; font-size: 0.8rem; outline: none; transition: border-color 0.15s;
    font-family: 'Poppins', sans-serif;
  }
  .comment-input:focus { border-color: rgba(212,160,23,0.4); }
  .comment-send {
    background: #d4a017; color: #000; border: none; width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.1s;
  }
  .comment-send:disabled { opacity: 0.4; cursor: not-allowed; }
  .comment-send:not(:disabled):hover { transform: scale(1.05); }

  /* Poll options */
  .poll-options-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
  .poll-opt {
    position: relative; overflow: hidden;
    width: 100%; text-align: left;
    padding: 10px 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px; cursor: pointer;
    display: flex; justify-content: space-between; align-items: center;
    gap: 8px; transition: border-color 0.15s;
    min-height: 44px;
  }
  .poll-opt:not(.no-vote):hover { border-color: rgba(212,160,23,0.4); }
  .poll-opt.mine { border-color: rgba(212,160,23,0.5); }
  .poll-opt.no-vote { cursor: default; }
  .poll-bar {
    position: absolute; left: 0; top: 0; bottom: 0;
    background: rgba(212,160,23,0.12);
    border-radius: 10px; z-index: 0;
    transition: width 0.4s ease;
  }
  .poll-opt-text { position: relative; z-index: 1; font-size: 0.85rem; color: #fff; font-family: 'Poppins', sans-serif; }
  .poll-pct { position: relative; z-index: 1; font-size: 0.75rem; font-weight: 600; color: rgba(212,160,23,0.8); flex-shrink: 0; font-family: 'Poppins', sans-serif; }
  .poll-footer { font-size: 0.75rem; color: rgba(255,255,255,0.35); margin: 4px 0 0; }
  .poll-closed { color: rgba(239,68,68,0.6); }

  /* Compose overlay */
  .compose-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    z-index: 50; display: flex; align-items: flex-end;
  }
  .compose-sheet {
    width: 100%;
    background: #161210;
    border-radius: 20px 20px 0 0;
    border-top: 1px solid rgba(255,255,255,0.1);
    max-height: 85svh;
    overflow-y: auto;
    padding-bottom: env(safe-area-inset-bottom, 16px);
    animation: slideUp 0.28s cubic-bezier(0.32,0.72,0,1) forwards;
  }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .compose-handle { width: 36px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.15); margin: 10px auto 0; }
  .compose-top {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px 8px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .compose-tabs { display: flex; gap: 4px; }
  .compose-tab {
    display: flex; align-items: center; gap: 5px;
    background: transparent; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px; padding: 6px 14px;
    color: rgba(255,255,255,0.5); font-size: 0.8rem; font-weight: 500;
    font-family: 'Poppins', sans-serif; cursor: pointer; transition: all 0.15s;
  }
  .compose-tab.on { background: rgba(212,160,23,0.12); border-color: rgba(212,160,23,0.4); color: #d4a017; }
  .compose-close {
    background: transparent; border: none; color: rgba(255,255,255,0.4);
    cursor: pointer; padding: 6px; display: flex; align-items: center;
  }
  .compose-body { padding: 12px 16px 16px; display: flex; flex-direction: column; gap: 12px; }
  .compose-textarea {
    width: 100%; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
    padding: 12px; color: #fff; font-family: 'Poppins', sans-serif;
    font-size: 0.92rem; resize: none; outline: none;
    transition: border-color 0.15s; box-sizing: border-box; line-height: 1.5;
  }
  .compose-textarea:focus { border-color: rgba(212,160,23,0.4); }
  .compose-textarea::placeholder { color: rgba(255,255,255,0.25); }
  .compose-input {
    width: 100%; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
    padding: 11px 12px; color: #fff; font-family: 'Poppins', sans-serif;
    font-size: 0.88rem; outline: none; transition: border-color 0.15s;
    box-sizing: border-box;
  }
  .compose-input:focus { border-color: rgba(212,160,23,0.4); }
  .compose-input::placeholder { color: rgba(255,255,255,0.25); }
  .compose-options-list { display: flex; flex-direction: column; gap: 8px; }
  .compose-opt-row { display: flex; gap: 8px; align-items: center; }
  .compose-opt-row .compose-input { flex: 1; }
  .compose-rm-opt {
    flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255,255,255,0.06); border: none;
    color: rgba(255,255,255,0.5); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .compose-add-opt {
    background: transparent; border: 1px dashed rgba(255,255,255,0.15);
    border-radius: 10px; padding: 10px; color: rgba(255,255,255,0.4);
    font-family: 'Poppins', sans-serif; font-size: 0.82rem; cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .compose-add-opt:hover { border-color: rgba(212,160,23,0.4); color: #d4a017; }
  .compose-poll-settings { display: flex; gap: 16px; flex-wrap: wrap; }
  .compose-toggle-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.82rem; color: rgba(255,255,255,0.5);
    cursor: pointer; font-family: 'Poppins', sans-serif;
  }
  .compose-toggle-label input[type=checkbox] { accent-color: #d4a017; width: 16px; height: 16px; cursor: pointer; }
  .compose-error {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
    border-radius: 8px; padding: 8px 12px;
    color: #fca5a5; font-size: 0.78rem; margin: 0;
  }
  .compose-img-preview { position: relative; display: inline-block; margin-top: 4px; border-radius: 12px; overflow: hidden; max-height: 150px; background: #000; border: 1px solid rgba(255,255,255,0.1); }
  .compose-img-preview img { height: 100%; max-height: 150px; width: auto; display: block; object-fit: cover; }
  .preview-rm { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.6); border: none; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; backdrop-filter: blur(4px); transition: background 0.15s; }
  .preview-rm:hover { background: rgba(239,68,68,0.8); }
  .compose-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
  .compose-left-actions { display: flex; align-items: center; gap: 12px; }
  .compose-img-btn { background: transparent; border: none; color: #d4a017; padding: 6px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; margin-left: -6px; }
  .compose-img-btn:hover { background: rgba(212,160,23,0.1); }
  .compose-count { font-size: 0.75rem; color: rgba(255,255,255,0.25); }
  .compose-submit {
    background: linear-gradient(135deg, #d4a017, #b8860b);
    border: none; border-radius: 20px;
    padding: 10px 24px; color: #0c0a08;
    font-family: 'Poppins', sans-serif; font-size: 0.85rem; font-weight: 600;
    cursor: pointer; transition: opacity 0.15s, transform 0.1s;
    min-width: 90px;
  }
  .compose-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .compose-submit:not(:disabled):hover { opacity: 0.9; transform: scale(1.02); }
`;
