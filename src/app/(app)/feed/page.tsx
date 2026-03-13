'use client';
import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { initials, timeAgo } from '@/lib/utils';
import type { DbNotificationItem, DbPostComment } from '@/types';
import Link from 'next/link';
import { Heart, Plus, X, BarChart2, RefreshCw, Image as ImageIcon, MessageSquare, Send, Pin, PinOff, Bell, EyeOff, Eye, Trash2, Search } from 'lucide-react';
import './feed.css';

// ── Types ──────────────────────────────────────────────────────
type PollOption = { id: string; text: string; votes_count: number; position: number };

type PostItem = {
    itemType: 'post';
    id: string; author_id: string; author_name: string;
    author_photo_url: string | null; description: string;
    image_url: string | null;
    likes_count: number; pinned: boolean; created_at: string;
    comments_count: number;
    hidden_by_admin?: boolean;
    isLiked: boolean;
};

type PollItem = {
    itemType: 'poll';
    id: string; creator_id: string; creator_name: string;
    question: string; type: 'single' | 'multi';
    is_anonymous: boolean; show_results: string;
    closes_at: string | null; pinned: boolean;
    hidden_by_admin?: boolean;
    total_votes: number; created_at: string;
    poll_options: PollOption[];
    hasVoted: boolean; myVoteIds: string[];
};

type BirthdayItem = {
    itemType: 'birthday';
    id: string;
    full_name: string;
    photo_url: string | null;
    birthdate: string;
};

type FeedItem = PostItem | PollItem | BirthdayItem;

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({ name, url }: { name: string; url?: string | null }) {
    if (url) return <img src={url} alt={name} className="c-avatar-img" />;
    return <div className="c-avatar">{initials(name)}</div>;
}

// ── Post Card ──────────────────────────────────────────────────
const PostCard = memo(function PostCard({ item, onLike, canPin, onTogglePin, canModerate, onModerate }: { item: PostItem; onLike: (id: string, liked: boolean) => void; canPin: boolean; onTogglePin: (itemType: 'post' | 'poll', id: string, pinned: boolean) => void; canModerate: boolean; onModerate: (itemType: 'post' | 'poll', id: string, action: 'hide' | 'restore' | 'delete') => void; }) {
    const [showHeartAnim, setShowHeartAnim] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<DbPostComment[]>([]);
    const [commentCount, setCommentCount] = useState(item.comments_count || 0);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);

    useEffect(() => {
        setCommentCount(item.comments_count || 0);
    }, [item.comments_count]);

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
                    setCommentCount(data.length);
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
                setCommentCount(prev => prev + 1);
                setNewComment('');
            } else {
                alert(data.error || 'Error al comentar. Verifica que la tabla post_comments existe.');
            }
        } catch {
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
                    <span className="card-time">{timeAgo(item.created_at, { compact: true })}</span>
                    {item.pinned && <span className="card-pin">📌</span>}
                    {canPin && (
                        <button className={`card-pin-btn${item.pinned ? ' pinned' : ''}`} onClick={() => onTogglePin('post', item.id, item.pinned)}>
                            {item.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                            {item.pinned ? 'Desfijar' : 'Fijar'}
                        </button>
                    )}
                    {item.hidden_by_admin && <span className="card-hidden-badge">Oculto</span>}
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
                        {commentCount > 0 && <span>{commentCount}</span>}
                    </button>
                    {canModerate && (
                        <>
                            <button className="card-action-btn admin-mod" onClick={() => onModerate('post', item.id, item.hidden_by_admin ? 'restore' : 'hide')}>
                                {item.hidden_by_admin ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                            <button className="card-action-btn admin-mod delete" onClick={() => onModerate('post', item.id, 'delete')}>
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
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
});

// ── Poll Card ──────────────────────────────────────────────────
const PollCard = memo(function PollCard({ item, onVote, canPin, onTogglePin, canModerate, onModerate }: { item: PollItem; onVote: (pollId: string, optionId: string) => void; canPin: boolean; onTogglePin: (itemType: 'post' | 'poll', id: string, pinned: boolean) => void; canModerate: boolean; onModerate: (itemType: 'post' | 'poll', id: string, action: 'hide' | 'restore' | 'delete') => void; }) {
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
                    <span className="card-time">{timeAgo(item.created_at, { compact: true })}</span>
                    {item.pinned && <span className="card-pin">📌</span>}
                    {canPin && (
                        <button className={`card-pin-btn${item.pinned ? ' pinned' : ''}`} onClick={() => onTogglePin('poll', item.id, item.pinned)}>
                            {item.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                            {item.pinned ? 'Desfijar' : 'Fijar'}
                        </button>
                    )}
                    {item.hidden_by_admin && <span className="card-hidden-badge">Oculta</span>}
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
                {canModerate && (
                    <div className="card-actions admin-actions-row">
                        <button className="card-action-btn admin-mod" onClick={() => onModerate('poll', item.id, item.hidden_by_admin ? 'restore' : 'hide')}>
                            {item.hidden_by_admin ? <Eye size={16} /> : <EyeOff size={16} />}
                            {item.hidden_by_admin ? 'Restaurar' : 'Ocultar'}
                        </button>
                        <button className="card-action-btn admin-mod delete" onClick={() => onModerate('poll', item.id, 'delete')}>
                            <Trash2 size={16} /> Eliminar
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
});

// ── Birthday Banner ───────────────────────────────────────────
function BirthdayBanner({ item }: { item: BirthdayItem }) {
    return (
        <article className="feed-card" style={{ background: 'linear-gradient(135deg, rgba(212,160,23,0.15), rgba(212,160,23,0.05))', borderColor: 'rgba(212,160,23,0.4)', alignItems: 'center' }}>
            <div className="card-avatar-col" style={{ position: 'relative' }}>
                <Avatar name={item.full_name} url={item.photo_url} />
                <span style={{ position: 'absolute', bottom: -5, right: -5, fontSize: '1rem' }}>🎉</span>
            </div>
            <div className="card-body">
                <div className="card-meta">
                    <span className="card-name" style={{ color: '#d4a017' }}>¡Cumpleaños de {item.full_name}! 🎂</span>
                </div>
                <p className="card-text" style={{ fontSize: '0.85rem' }}>Deseale un feliz día cuando te lo cruces en el teatro.</p>
            </div>
        </article>
    );
}

// ── Main Page ──────────────────────────────────────────────────
export default function FeedPage() {
    const { user, isAdmin } = useAuth();
    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [composeOpen, setComposeOpen] = useState(false);
    const [tab, setTab] = useState<'post' | 'poll'>('post');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<DbNotificationItem[]>([]);
    const [notifUnread, setNotifUnread] = useState(0);
    const [notifLoading, setNotifLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const feedReloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

        const [postsRes, pollsRes, likesRes, votesRes, usersRes] = await Promise.all([
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
            supabase.from('users').select('uid, full_name, photo_url, birthdate').not('birthdate', 'is', null)
        ]);

        const likedIds = new Set(likesRes.data?.map(l => l.post_id) || []);
        const votedMap: Record<string, string[]> = {};
        votesRes.data?.forEach(v => {
            if (!votedMap[v.poll_id]) votedMap[v.poll_id] = [];
            votedMap[v.poll_id].push(v.option_id);
        });

        const postIds = (postsRes.data || []).map(p => p.id);
        const commentCountMap = new Map<string, number>();

        if (postIds.length > 0) {
            const { data: commentRows } = await supabase
                .from('post_comments')
                .select('post_id')
                .in('post_id', postIds);

            for (const row of commentRows || []) {
                const current = commentCountMap.get(row.post_id) ?? 0;
                commentCountMap.set(row.post_id, current + 1);
            }
        }

        const posts: PostItem[] = (postsRes.data || []).map(p => ({
            ...p,
            itemType: 'post',
            isLiked: likedIds.has(p.id),
            comments_count: commentCountMap.get(p.id) ?? 0,
        }));
        const polls: PollItem[] = (pollsRes.data || []).map(p => ({
            ...p, itemType: 'poll',
            hasVoted: !!votedMap[p.id],
            myVoteIds: votedMap[p.id] || [],
        }));

        let birthdays: BirthdayItem[] = [];
        if (usersRes.data) {
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentDate = today.getDate();
            
            birthdays = usersRes.data.filter(u => {
                if (!u.birthdate) return false;
                // Extraer el mes y dia (timezone utc trick sumando 12h)
                const d = new Date(u.birthdate + 'T12:00:00Z');
                return d.getMonth() === currentMonth && d.getDate() === currentDate;
            }).map(u => ({
                itemType: 'birthday',
                id: `bday-${u.uid}`,
                full_name: u.full_name,
                photo_url: u.photo_url,
                birthdate: u.birthdate,
            }));
        }

        const visiblePosts = isAdmin ? posts : posts.filter(p => !p.hidden_by_admin);
        const visiblePolls = isAdmin ? polls : polls.filter(p => !p.hidden_by_admin);

        const merged = [...birthdays, ...visiblePosts, ...visiblePolls].sort((a, b) => {
            if (a.itemType === 'birthday' && b.itemType !== 'birthday') return -1;
            if (a.itemType !== 'birthday' && b.itemType === 'birthday') return 1;

            if ('pinned' in a && 'pinned' in b) {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            return 0;
        });

        setItems(merged);
        setLoading(false);
        setRefreshing(false);
    }, [user, isAdmin]);

    useEffect(() => { loadFeed(); }, [loadFeed]);

    const scheduleFeedReload = useCallback(() => {
        if (feedReloadTimerRef.current) {
            clearTimeout(feedReloadTimerRef.current);
        }

        feedReloadTimerRef.current = setTimeout(() => {
            loadFeed(true);
        }, 250);
    }, [loadFeed]);

    const loadNotifications = useCallback(async () => {
        if (!user) return;
        setNotifLoading(true);
        try {
            const res = await fetch('/api/notifications', { method: 'GET' });
            const data = await res.json();
            if (!res.ok || data?.error) return;

            setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
            setNotifUnread(typeof data?.unread === 'number' ? data.unread : 0);
        } catch {
            // noop
        } finally {
            setNotifLoading(false);
        }
    }, [user]);

    async function markAllNotificationsRead() {
        try {
            await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ all: true }),
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setNotifUnread(0);
        } catch {
            // noop
        }
    }

    const syncBirthdaysAndNotifications = useCallback(async () => {
        if (!user) return;
        try {
            await fetch('/api/notifications/sync-birthdays', { method: 'POST' });
        } catch {
            // noop
        }
        await loadNotifications();
    }, [user, loadNotifications]);

    useEffect(() => {
        if (!user) return;
        syncBirthdaysAndNotifications();

        const notifChannel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    loadNotifications();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    loadNotifications();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    loadNotifications();
                }
            });

        const interval = setInterval(() => {
            loadNotifications();
        }, 300000);

        return () => {
            clearInterval(interval);
            supabase.removeChannel(notifChannel);
        };
    }, [user, loadNotifications, syncBirthdaysAndNotifications]);

    useEffect(() => {
        if (!user) return;

        const feedChannel = supabase
            .channel('feed:live')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'posts' },
                () => scheduleFeedReload()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'polls' },
                () => scheduleFeedReload()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'poll_options' },
                () => scheduleFeedReload()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'post_likes' },
                () => scheduleFeedReload()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'poll_votes' },
                () => scheduleFeedReload()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'post_comments' },
                () => scheduleFeedReload()
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    loadFeed(true);
                }
            });

        return () => {
            if (feedReloadTimerRef.current) {
                clearTimeout(feedReloadTimerRef.current);
            }
            supabase.removeChannel(feedChannel);
        };
    }, [user, scheduleFeedReload, loadFeed]);

    const handleTogglePin = useCallback(async (itemType: 'post' | 'poll', id: string, currentPinned: boolean) => {
        if (!isAdmin) return;

        const nextPinned = !currentPinned;

        setItems(prev => prev.map(i => {
            if (itemType === 'post' && i.itemType === 'post' && i.id === id) return { ...i, pinned: nextPinned };
            if (itemType === 'poll' && i.itemType === 'poll' && i.id === id) return { ...i, pinned: nextPinned };
            return i;
        }));

        try {
            const res = await fetch('/api/feed/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemType, id, pinned: nextPinned }),
            });
            const data = await res.json();
            if (!res.ok || data?.error) {
                throw new Error(data?.error || 'No se pudo fijar/desfijar');
            }
            await loadFeed(true);
            await loadNotifications();
        } catch (e: unknown) {
            setItems(prev => prev.map(i => {
                if (itemType === 'post' && i.itemType === 'post' && i.id === id) return { ...i, pinned: currentPinned };
                if (itemType === 'poll' && i.itemType === 'poll' && i.id === id) return { ...i, pinned: currentPinned };
                return i;
            }));
            const msg = e instanceof Error ? e.message : 'No se pudo fijar/desfijar';
            setSubmitError(msg);
        }
    }, [isAdmin, loadFeed, loadNotifications]);

    const handleModeration = useCallback(async (itemType: 'post' | 'poll', id: string, action: 'hide' | 'restore' | 'delete') => {
        if (!isAdmin) return;

        const messages = {
            hide: 'ocultar',
            restore: 'restaurar',
            delete: 'eliminar definitivamente',
        };

        if (!confirm(`¿Querés ${messages[action]} este ${itemType === 'post' ? 'post' : 'encuesta'}?`)) {
            return;
        }

        try {
            const res = await fetch('/api/feed/moderate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemType, id, action }),
            });
            const data = await res.json();

            if (!res.ok || data?.error) {
                throw new Error(data?.error || 'No se pudo moderar el contenido');
            }

            await loadFeed(true);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'No se pudo moderar el contenido';
            setSubmitError(msg);
        }
    }, [isAdmin, loadFeed]);

    const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
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
    }, []);

    const handleVote = useCallback(async (pollId: string, optionId: string) => {
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
    }, [loadFeed]);

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
                    <Link href="/buscar" className="fp-search" aria-label="Buscar perfiles">
                        <Search size={18} />
                    </Link>
                    <button className="fp-bell" onClick={() => setNotifOpen(v => !v)}>
                        <Bell size={18} />
                        {notifUnread > 0 && <span className="fp-bell-badge">{notifUnread > 99 ? '99+' : notifUnread}</span>}
                    </button>
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
                    items.map(item => {
                        if (item.itemType === 'post') return <PostCard key={item.id} item={item} onLike={handleLike} canPin={isAdmin} onTogglePin={handleTogglePin} canModerate={isAdmin} onModerate={handleModeration} />;
                        if (item.itemType === 'poll') return <PollCard key={item.id} item={item} onVote={handleVote} canPin={isAdmin} onTogglePin={handleTogglePin} canModerate={isAdmin} onModerate={handleModeration} />;
                        if (item.itemType === 'birthday') return <BirthdayBanner key={item.id} item={item} />;
                        return null;
                    })
                )}
            </main>

            {notifOpen && (
                <div className="notif-overlay" onClick={() => setNotifOpen(false)}>
                    <div className="notif-sheet" onClick={e => e.stopPropagation()}>
                        <div className="notif-head">
                            <h3>Notificaciones</h3>
                            <button className="notif-mark-all" onClick={markAllNotificationsRead}>Marcar todo leido</button>
                        </div>
                        <div className="notif-list">
                            {notifLoading ? (
                                <p className="notif-empty">Cargando...</p>
                            ) : notifications.length === 0 ? (
                                <p className="notif-empty">No tienes notificaciones por ahora.</p>
                            ) : (
                                notifications.map(n => (
                                    <a key={n.id} href={n.link || '#'} className={`notif-item${n.read ? '' : ' unread'}`} onClick={() => setNotifOpen(false)}>
                                        <div className="notif-title">{n.title}</div>
                                        <div className="notif-msg">{n.message}</div>
                                        <div className="notif-time">{timeAgo(n.created_at, { compact: true })}</div>
                                    </a>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

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

        </div>
    );
}
