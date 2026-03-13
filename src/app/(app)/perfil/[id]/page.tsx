import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { ArrowLeft, Globe, Instagram, Twitter, Youtube } from 'lucide-react';
import { initials } from '@/lib/utils';

type LinkItem = {
    id: string;
    type: string;
    label: string;
    url: string;
};

type WorkItem = {
    id: string;
    title: string;
    year: number;
    company: string;
    role: string;
    link: string | null;
};

function LinkIcon({ type }: { type: string }) {
    if (type === 'instagram') return <Instagram size={14} />;
    if (type === 'twitter') return <Twitter size={14} />;
    if (type === 'youtube') return <Youtube size={14} />;
    return <Globe size={14} />;
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: profile } = await supabase
        .from('users')
        .select('uid, full_name, stage_name, photo_url, bio, role_in_show, birthdate')
        .eq('uid', id)
        .single();

    if (!profile) notFound();

    const [{ data: links }, { data: works }] = await Promise.all([
        supabase.from('user_links').select('id, type, label, url').eq('user_id', id).order('created_at'),
        supabase.from('user_work').select('id, title, year, company, role, link').eq('user_id', id).order('year', { ascending: false }),
    ]);

    return (
        <div className="pub-root">
            <header className="pub-header">
                <Link href="/buscar" className="pub-back" aria-label="Volver a buscar">
                    <ArrowLeft size={18} />
                </Link>
                <h1>Perfil</h1>
            </header>

            <section className="pub-hero">
                {profile.photo_url ? (
                    <img src={profile.photo_url} alt={profile.full_name} className="pub-avatar-img" />
                ) : (
                    <div className="pub-avatar">{initials(profile.full_name || 'U')}</div>
                )}
                <h2>{profile.full_name}</h2>
                {profile.stage_name && <p className="pub-stage">{profile.stage_name}</p>}
                {profile.role_in_show && <p className="pub-role">🎭 {profile.role_in_show}</p>}
                {profile.bio && <p className="pub-bio">{profile.bio}</p>}
            </section>

            <section className="pub-section">
                <h3>Redes sociales</h3>
                {!links || links.length === 0 ? (
                    <p className="pub-empty">Este perfil no agregó redes sociales todavía.</p>
                ) : (
                    <div className="pub-list">
                        {(links as LinkItem[]).map((item) => (
                            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="pub-link-card">
                                <div className="pub-link-left">
                                    <LinkIcon type={item.type} />
                                    <span>{item.label}</span>
                                </div>
                                <span className="pub-link-url">Abrir</span>
                            </a>
                        ))}
                    </div>
                )}
            </section>

            <section className="pub-section">
                <h3>Trayectoria</h3>
                {!works || works.length === 0 ? (
                    <p className="pub-empty">Este perfil no agregó trayectoria todavía.</p>
                ) : (
                    <div className="pub-list">
                        {(works as WorkItem[]).map((work) => (
                            <article key={work.id} className="pub-work-card">
                                <div className="pub-work-title">{work.title} · {work.year}</div>
                                <div className="pub-work-sub">{work.role} — {work.company}</div>
                                {work.link && (
                                    <a href={work.link} target="_blank" rel="noopener noreferrer" className="pub-work-link">
                                        Ver referencia
                                    </a>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <style>{`
                .pub-root { min-height: 100dvh; background: #0c0a08; color: #fff; font-family: 'Poppins', sans-serif; padding: 8px 16px 20px; }
                .pub-header {
                    position: sticky; top: 0; z-index: 20;
                    height: 52px; display: flex; align-items: center; gap: 12px;
                    background: rgba(12,10,8,0.92); backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    margin: 0 -16px 16px; padding: 0 16px;
                }
                .pub-header h1 { margin: 0; font-size: 1rem; font-weight: 700; }
                .pub-back {
                    width: 32px; height: 32px; border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.8);
                    text-decoration: none; display: flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,0.04);
                }
                .pub-hero {
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 18px; padding: 18px 14px; display: flex; flex-direction: column; align-items: center; text-align: center;
                }
                .pub-avatar, .pub-avatar-img {
                    width: 78px; height: 78px; border-radius: 22px; margin-bottom: 10px;
                    display: flex; align-items: center; justify-content: center;
                }
                .pub-avatar {
                    background: linear-gradient(135deg, #d4a017, #7a5500);
                    color: #0c0a08; font-size: 1.2rem; font-weight: 700;
                }
                .pub-avatar-img { object-fit: cover; border: 1px solid rgba(255,255,255,0.08); }
                .pub-hero h2 { margin: 0; font-size: 1.08rem; }
                .pub-stage { margin: 3px 0 0; font-size: 0.82rem; color: rgba(212,160,23,0.85); }
                .pub-role { margin: 6px 0 0; font-size: 0.78rem; color: rgba(255,255,255,0.55); }
                .pub-bio { margin: 10px 0 0; font-size: 0.85rem; color: rgba(255,255,255,0.72); line-height: 1.45; }
                .pub-section { margin-top: 16px; }
                .pub-section h3 { margin: 0 0 8px; font-size: 0.82rem; letter-spacing: 0.08em; color: rgba(255,255,255,0.5); text-transform: uppercase; }
                .pub-empty { margin: 8px 0 0; font-size: 0.82rem; color: rgba(255,255,255,0.35); }
                .pub-list { display: flex; flex-direction: column; gap: 8px; }
                .pub-link-card, .pub-work-card {
                    border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
                    background: rgba(255,255,255,0.03); padding: 10px 12px;
                    text-decoration: none; color: inherit;
                }
                .pub-link-card { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
                .pub-link-left { display: flex; align-items: center; gap: 8px; font-size: 0.84rem; }
                .pub-link-url { font-size: 0.74rem; color: rgba(212,160,23,0.9); }
                .pub-work-title { font-size: 0.84rem; color: #fff; font-weight: 600; }
                .pub-work-sub { margin-top: 2px; font-size: 0.78rem; color: rgba(255,255,255,0.52); }
                .pub-work-link { display: inline-block; margin-top: 6px; font-size: 0.74rem; color: #d4a017; text-decoration: none; }
            `}</style>
        </div>
    );
}
