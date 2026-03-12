'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Info, RefreshCw, Link as LinkIcon } from 'lucide-react';
import type { DbInfoLink } from '@/types';

export default function InfoPage() {
    const [links, setLinks] = useState<DbInfoLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadLinks = useCallback(async (quiet = false) => {
        if (quiet) setRefreshing(true);
        else setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/info-links', { method: 'GET' });
            const data = await res.json();

            if (!res.ok || data?.error) {
                throw new Error(data?.error || 'No se pudieron cargar los enlaces de info.');
            }

            setLinks(Array.isArray(data?.links) ? data.links : []);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'No se pudieron cargar los enlaces de info.';
            setError(msg);
            setLinks([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadLinks();
    }, [loadLinks]);

    return (
        <div className="info-root">
            <header className="info-header">
                <div className="header-left">
                    <span className="header-icon"><Info size={18} /></span>
                    <div>
                        <h1>Info importante</h1>
                        <p>Enlaces oficiales cargados por administración.</p>
                    </div>
                </div>
                <button className="refresh-btn" onClick={() => loadLinks(true)} disabled={refreshing}>
                    <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                </button>
            </header>

            {loading ? (
                <div className="state-box">Cargando enlaces...</div>
            ) : error ? (
                <div className="state-box error">{error}</div>
            ) : links.length === 0 ? (
                <div className="state-box empty">
                    <LinkIcon size={20} />
                    <span>Aun no hay enlaces publicados por administración.</span>
                </div>
            ) : (
                <main className="links-grid">
                    {links.map((item) => (
                        <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="link-card">
                            <div className="card-top">
                                <h2>{item.title}</h2>
                                <ExternalLink size={16} />
                            </div>
                            {item.description && <p className="card-desc">{item.description}</p>}
                            <span className="card-url">{item.url}</span>
                        </a>
                    ))}
                </main>
            )}

            <style jsx>{`
                .info-root { min-height: 100dvh; background: #0c0a08; color: #fff; padding-bottom: 20px; }
                .info-header {
                    position: sticky;
                    top: 0;
                    z-index: 20;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    background: rgba(12,10,8,0.92);
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    backdrop-filter: blur(12px);
                    padding: 10px 16px;
                }
                .header-left { display: flex; align-items: center; gap: 12px; }
                .header-icon {
                    width: 34px;
                    height: 34px;
                    border-radius: 10px;
                    background: rgba(212,160,23,0.14);
                    color: #d4a017;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                h1 { margin: 0; font-size: 1rem; font-weight: 700; }
                p { margin: 2px 0 0; font-size: 0.8rem; color: rgba(255,255,255,0.5); }
                .refresh-btn {
                    width: 34px;
                    height: 34px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.03);
                    color: rgba(255,255,255,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .spin { animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                .state-box {
                    margin: 16px;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px;
                    background: rgba(255,255,255,0.03);
                    color: rgba(255,255,255,0.75);
                    padding: 16px;
                    font-size: 0.9rem;
                }
                .state-box.error {
                    border-color: rgba(239,68,68,0.3);
                    background: rgba(239,68,68,0.08);
                    color: #fca5a5;
                }
                .state-box.empty {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255,255,255,0.55);
                }

                .links-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 12px;
                    padding: 16px;
                }
                .link-card {
                    text-decoration: none;
                    color: inherit;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: rgba(255,255,255,0.02);
                    border-radius: 16px;
                    padding: 14px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    transition: border-color 0.2s, transform 0.2s;
                }
                .link-card:hover {
                    border-color: rgba(212,160,23,0.35);
                    transform: translateY(-1px);
                }
                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 10px;
                }
                .card-top h2 {
                    margin: 0;
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: #fff;
                }
                .card-desc {
                    margin: 0;
                    font-size: 0.82rem;
                    color: rgba(255,255,255,0.65);
                    line-height: 1.45;
                }
                .card-url {
                    font-size: 0.75rem;
                    color: #d4a017;
                    opacity: 0.9;
                    word-break: break-all;
                }
            `}</style>
        </div>
    );
}
