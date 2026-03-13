'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, User, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/utils';

type SearchProfile = {
    uid: string;
    full_name: string;
    stage_name: string | null;
    role_in_show: string | null;
    photo_url: string | null;
};

export default function BuscarPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchProfile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const q = query.trim();
        const timer = setTimeout(async () => {
            setLoading(true);

            const baseQuery = supabase
                .from('users')
                .select('uid, full_name, stage_name, role_in_show, photo_url')
                .limit(50);

            if (!q) {
                const { data } = await baseQuery.order('full_name');
                setResults(data || []);
                setLoading(false);
                return;
            }

            const safeQ = q.replace(/[,%]/g, '');
            const { data } = await baseQuery.or(
                `full_name.ilike.%${safeQ}%,stage_name.ilike.%${safeQ}%,role_in_show.ilike.%${safeQ}%`
            ).order('full_name');

            setResults(data || []);
            setLoading(false);
        }, 220);

        return () => clearTimeout(timer);
    }, [query]);

    const titleText = useMemo(() => {
        if (!query.trim()) return 'Perfiles del elenco';
        return `Resultados para "${query.trim()}"`;
    }, [query]);

    return (
        <div className="search-root">
            <header className="search-header">
                <Link href="/feed" className="search-back" aria-label="Volver al feed">
                    <ArrowLeft size={18} />
                </Link>
                <h1>Buscar perfiles</h1>
            </header>

            <div className="search-box-wrap">
                <Search size={18} />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nombre, artístico o rol..."
                    autoFocus
                />
            </div>

            <p className="search-subtitle">{titleText}</p>

            <main className="search-list">
                {loading ? (
                    <p className="search-empty">Buscando...</p>
                ) : results.length === 0 ? (
                    <p className="search-empty">No encontramos perfiles con ese criterio.</p>
                ) : (
                    results.map((profile) => (
                        <Link key={profile.uid} href={`/perfil/${profile.uid}`} className="search-card">
                            <div className="search-avatar-wrap">
                                {profile.photo_url ? (
                                    <img src={profile.photo_url} alt={profile.full_name} className="search-avatar" />
                                ) : (
                                    <div className="search-avatar-fallback">{initials(profile.full_name || 'U')}</div>
                                )}
                            </div>
                            <div className="search-meta">
                                <span className="search-name">{profile.full_name}</span>
                                {profile.stage_name && <span className="search-stage">{profile.stage_name}</span>}
                                {profile.role_in_show && <span className="search-role">🎭 {profile.role_in_show}</span>}
                            </div>
                            <User size={16} className="search-open-icon" />
                        </Link>
                    ))
                )}
            </main>

            <style>{`
                .search-root { min-height: 100dvh; background: #0c0a08; color: #fff; font-family: 'Poppins', sans-serif; padding: 8px 16px 20px; }
                .search-header {
                    position: sticky; top: 0; z-index: 20;
                    height: 52px; display: flex; align-items: center; gap: 12px;
                    background: rgba(12,10,8,0.92); backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    margin: 0 -16px 14px; padding: 0 16px;
                }
                .search-header h1 { margin: 0; font-size: 1rem; font-weight: 700; }
                .search-back {
                    width: 32px; height: 32px; border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.8);
                    text-decoration: none; display: flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,0.04);
                }
                .search-box-wrap {
                    display: flex; align-items: center; gap: 10px;
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px; padding: 0 12px; color: rgba(255,255,255,0.5);
                }
                .search-box-wrap:focus-within { border-color: rgba(212,160,23,0.45); color: #d4a017; }
                .search-box-wrap input {
                    width: 100%; border: none; outline: none; background: transparent;
                    color: #fff; font-size: 0.9rem; font-family: 'Poppins', sans-serif; padding: 12px 0;
                }
                .search-box-wrap input::placeholder { color: rgba(255,255,255,0.35); }
                .search-subtitle { margin: 12px 2px 10px; font-size: 0.78rem; color: rgba(255,255,255,0.45); }
                .search-list { display: flex; flex-direction: column; gap: 10px; }
                .search-empty { margin-top: 24px; text-align: center; color: rgba(255,255,255,0.35); font-size: 0.86rem; }
                .search-card {
                    display: flex; align-items: center; gap: 10px;
                    border: 1px solid rgba(255,255,255,0.08); border-radius: 14px;
                    background: rgba(255,255,255,0.03); text-decoration: none; color: inherit;
                    padding: 10px 12px;
                }
                .search-avatar-wrap { flex-shrink: 0; }
                .search-avatar, .search-avatar-fallback {
                    width: 44px; height: 44px; border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                }
                .search-avatar { object-fit: cover; border: 1px solid rgba(255,255,255,0.08); }
                .search-avatar-fallback {
                    background: linear-gradient(135deg, #d4a017, #7a5500);
                    color: #0c0a08; font-size: 0.78rem; font-weight: 700;
                }
                .search-meta { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 1px; }
                .search-name { font-size: 0.88rem; font-weight: 600; color: #fff; }
                .search-stage { font-size: 0.75rem; color: rgba(212,160,23,0.85); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .search-role { font-size: 0.72rem; color: rgba(255,255,255,0.45); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .search-open-icon { color: rgba(255,255,255,0.28); flex-shrink: 0; }
            `}</style>
        </div>
    );
}
