'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, User, ArrowLeft, Store, Phone, Instagram, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/utils';

type SearchProfile = {
    uid: string;
    full_name: string;
    stage_name: string | null;
    role_in_show: string | null;
    photo_url: string | null;
};

type SearchBusiness = {
    id: string;
    name: string;
    description: string | null;
    category_id: string | null;
    contact_phone: string | null;
    instagram_url: string | null;
    website_url: string | null;
    owner_id?: string | null;
    user_id?: string | null;
    owner_name?: string | null;
    is_active?: boolean | null;
    status?: string | null;
};

type CategoryRow = { id: string; name: string; icon: string | null };
type UserRow = { uid: string; full_name: string };

export default function BuscarPage() {
    const [mode, setMode] = useState<'profiles' | 'businesses'>('profiles');
    const [query, setQuery] = useState('');
    const [profileResults, setProfileResults] = useState<SearchProfile[]>([]);
    const [businessResults, setBusinessResults] = useState<Array<SearchBusiness & { owner_name: string; category_name: string; category_icon: string }>>([]);
    const [loading, setLoading] = useState(false);
    const [searchError, setSearchError] = useState('');

    useEffect(() => {
        const q = query.trim();
        const timer = setTimeout(async () => {
            setLoading(true);
            setSearchError('');

            if (mode === 'profiles') {
                const baseQuery = supabase
                    .from('users')
                    .select('uid, full_name, stage_name, role_in_show, photo_url')
                    .limit(50);

                if (!q) {
                    const { data } = await baseQuery.order('full_name');
                    setProfileResults(data || []);
                    setLoading(false);
                    return;
                }

                const safeQ = q.replace(/[,%]/g, '');
                const { data, error } = await baseQuery.or(
                    `full_name.ilike.%${safeQ}%,stage_name.ilike.%${safeQ}%,role_in_show.ilike.%${safeQ}%`
                ).order('full_name');

                if (error) {
                    setSearchError(error.message);
                    setProfileResults([]);
                    setLoading(false);
                    return;
                }

                setProfileResults(data || []);
                setLoading(false);
                return;
            }

            const safeQ = q.replace(/[,%]/g, '');

            const { data: businessesData, error: businessesError } = await supabase
                .from('businesses')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(120);

            if (businessesError) {
                setSearchError(businessesError.message);
                setBusinessResults([]);
                setLoading(false);
                return;
            }

            const businesses = (businessesData || []) as SearchBusiness[];
            const categoryIds = Array.from(new Set(businesses.map(b => b.category_id).filter(Boolean))) as string[];
            const ownerIds = Array.from(new Set(businesses.map(b => b.owner_id || b.user_id).filter(Boolean))) as string[];

            let categoriesMap: Record<string, { name: string; icon: string }> = {};
            let ownersMap: Record<string, string> = {};

            if (categoryIds.length > 0) {
                const { data: categoriesData } = await supabase
                    .from('business_categories')
                    .select('id, name, icon')
                    .in('id', categoryIds);

                categoriesMap = Object.fromEntries(
                    ((categoriesData || []) as CategoryRow[]).map(c => [c.id, { name: c.name, icon: c.icon || '🏬' }])
                );
            }

            if (ownerIds.length > 0) {
                const { data: usersData } = await supabase
                    .from('users')
                    .select('uid, full_name')
                    .in('uid', ownerIds);

                ownersMap = Object.fromEntries(
                    ((usersData || []) as UserRow[]).map(u => [u.uid, u.full_name])
                );
            }

            const merged = businesses.map((b) => {
                const ownerId = b.owner_id || b.user_id || '';
                const cat = (b.category_id && categoriesMap[b.category_id]) || { name: 'Sin categoría', icon: '🏬' };

                return {
                    ...b,
                    owner_name: b.owner_name || ownersMap[ownerId] || 'Miembro del elenco',
                    category_name: cat.name,
                    category_icon: cat.icon,
                };
            });

            const finalResults = safeQ
                ? merged.filter((item) => {
                    const queryLower = safeQ.toLowerCase();
                    const owner = item.owner_name.toLowerCase();
                    const description = (item.description || '').toLowerCase();
                    const category = (item.category_name || '').toLowerCase();
                    return owner.includes(queryLower) || item.name.toLowerCase().includes(queryLower) || description.includes(queryLower) || category.includes(queryLower);
                })
                : merged;

            setBusinessResults(finalResults);
            setLoading(false);
        }, 220);

        return () => clearTimeout(timer);
    }, [query, mode]);

    const titleText = useMemo(() => {
        if (!query.trim()) return mode === 'profiles' ? 'Perfiles del elenco' : 'Emprendimientos del elenco';
        return `Resultados para "${query.trim()}"`;
    }, [query, mode]);

    return (
        <div className="search-root">
            <header className="search-header">
                <Link href="/feed" className="search-back" aria-label="Volver al feed">
                    <ArrowLeft size={18} />
                </Link>
                <h1>Buscar</h1>
            </header>

            <div className="search-mode-tabs" role="tablist" aria-label="Modo de búsqueda">
                <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'profiles'}
                    className={`search-mode-tab${mode === 'profiles' ? ' active' : ''}`}
                    onClick={() => setMode('profiles')}
                >
                    <User size={14} /> Perfiles
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'businesses'}
                    className={`search-mode-tab${mode === 'businesses' ? ' active' : ''}`}
                    onClick={() => setMode('businesses')}
                >
                    <Store size={14} /> Emprendimientos
                </button>
            </div>

            <div className="search-box-wrap">
                <Search size={18} />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={mode === 'profiles' ? 'Buscar por nombre, artístico o rol...' : 'Buscar por negocio, dueño o descripción...'}
                    autoFocus
                />
            </div>

            <p className="search-subtitle">{titleText}</p>

            {searchError && <p className="search-error">{searchError}</p>}

            <main className="search-list">
                {loading ? (
                    <p className="search-empty">Buscando...</p>
                ) : mode === 'profiles' && profileResults.length === 0 ? (
                    <p className="search-empty">No encontramos perfiles con ese criterio.</p>
                ) : mode === 'businesses' && businessResults.length === 0 ? (
                    <p className="search-empty">No encontramos emprendimientos con ese criterio.</p>
                ) : (
                    mode === 'profiles' ? profileResults.map((profile) => (
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
                    )) : businessResults.map((business) => (
                        <article key={business.id} className="search-card business-card">
                            <div className="search-avatar-wrap">
                                <div className="search-avatar-fallback biz-avatar">{business.category_icon}</div>
                            </div>
                            <div className="search-meta">
                                <span className="search-name">{business.name}</span>
                                <span className="search-stage">{business.category_name} · por {business.owner_name}</span>
                                {business.description && <span className="search-role">{business.description}</span>}
                                <div className="business-links-row">
                                    {business.contact_phone && (
                                        <a href={`https://wa.me/${business.contact_phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="business-chip wa">
                                            <Phone size={12} /> WhatsApp
                                        </a>
                                    )}
                                    {business.instagram_url && (
                                        <a href={business.instagram_url} target="_blank" rel="noopener noreferrer" className="business-chip ig">
                                            <Instagram size={12} /> Instagram
                                        </a>
                                    )}
                                    {business.website_url && (
                                        <a href={business.website_url} target="_blank" rel="noopener noreferrer" className="business-chip web">
                                            <Globe size={12} /> Web
                                        </a>
                                    )}
                                </div>
                            </div>
                        </article>
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
                .search-mode-tabs {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin-bottom: 10px;
                }
                .search-mode-tab {
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.03);
                    color: rgba(255,255,255,0.68);
                    border-radius: 999px;
                    height: 34px;
                    font-family: 'Poppins', sans-serif;
                    font-size: 0.78rem;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    cursor: pointer;
                }
                .search-mode-tab.active {
                    color: #d4a017;
                    border-color: rgba(212,160,23,0.4);
                    background: rgba(212,160,23,0.12);
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
                .search-error {
                    margin: 0 2px 10px;
                    border: 1px solid rgba(239,68,68,0.28);
                    border-radius: 10px;
                    background: rgba(239,68,68,0.08);
                    color: #fca5a5;
                    padding: 8px 10px;
                    font-size: 0.78rem;
                }
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
                .business-card { align-items: flex-start; }
                .biz-avatar {
                    background: linear-gradient(135deg, rgba(212,160,23,0.2), rgba(212,160,23,0.08));
                    color: #d4a017;
                    border: 1px solid rgba(212,160,23,0.28);
                }
                .business-links-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
                .business-chip {
                    text-decoration: none;
                    font-size: 0.68rem;
                    font-weight: 600;
                    border-radius: 999px;
                    padding: 4px 9px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .business-chip.wa { background: rgba(37, 211, 102, 0.16); color: #4ade80; }
                .business-chip.ig { background: rgba(225, 48, 108, 0.16); color: #f472b6; }
                .business-chip.web { background: rgba(212, 160, 23, 0.16); color: #d4a017; }
            `}</style>
        </div>
    );
}
