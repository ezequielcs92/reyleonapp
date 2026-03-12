'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
    ArrowLeft, 
    Cake, 
    MessageCircle,
    Instagram,
    User
} from 'lucide-react';

type UserProfile = {
    uid: string;
    full_name: string;
    email: string;
    birthdate: string;
    photo_url: string | null;
    bio: string | null;
    instagram: string | null;
    role_in_show: string | null;
};

export default function BirthdayDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        
        (async () => {
            setLoading(true);
            const { data } = await supabase
                .from('users')
                .select('*')
                .eq('uid', id)
                .single();

            if (data) setProfile(data);
            setLoading(false);
        })();
    }, [id]);

    if (loading) return (
        <div className="bday-detail-root loading">
            <div className="loader"></div>
            <p>Cargando perfil del cumpleañero...</p>
            <style>{bdayStyles}</style>
        </div>
    );

    if (!profile) return (
        <div className="bday-detail-root empty">
            <ArrowLeft onClick={() => router.back()} className="back-btn" />
            <h2>Perfil no encontrado</h2>
            <style>{bdayStyles}</style>
        </div>
    );

    const getBirthDate = (bdate: string) => {
        const [y, m, d] = bdate.split('-');
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    };

    const birthDate = getBirthDate(profile.birthdate);
    const formattedBday = birthDate.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long'
    });

    const isToday = new Date().getUTCDate() === birthDate.getUTCDate() && 
                    new Date().getUTCMonth() === birthDate.getUTCMonth();

    return (
        <div className="bday-detail-root">
            <div className="bday-bg-gradient" />
            
            <header className="bday-header">
                <button onClick={() => router.back()} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <span className="header-type">Perfil del Elenco</span>
            </header>

            <main className="bday-content">
                <div className="profile-main">
                    <div className="photo-wrapper">
                        {profile.photo_url ? (
                            <img src={profile.photo_url} alt={profile.full_name} className="profile-img" />
                        ) : (
                            <div className="profile-placeholder"><User size={48} /></div>
                        )}
                        {isToday && <div className="bday-badge">🎂</div>}
                    </div>
                    
                    <h1 className="profile-name">{profile.full_name}</h1>
                    <div className="bday-tag">
                        <Cake size={16} />
                        <span>Cumpleaños: {formattedBday}</span>
                    </div>

                    {profile.role_in_show && (
                        <div className="character-tag">
                            🎭 <span>Interpretando a <b>{profile.role_in_show}</b></span>
                        </div>
                    )}
                </div>

                <div className="profile-sections">
                    <div className="info-card">
                        <h3>Sobre mí</h3>
                        <p>{profile.bio || "Este integrante del elenco aún no ha escrito su biografía."}</p>
                    </div>

                    <div className="action-grid">
                        {isToday && (
                            <a href={`https://wa.me/?text=¡Feliz cumple ${profile.full_name}! 🎭🦁`} className="action-btn wa">
                                <MessageCircle size={20} />
                                <span>Saludar</span>
                            </a>
                        )}
                        {profile.instagram && (
                            <a href={`https://instagram.com/${profile.instagram.replace('@','')}`} target="_blank" className="action-btn ig">
                                <Instagram size={20} />
                                <span>Ver Instagram</span>
                            </a>
                        )}
                    </div>

                    <div className="profile-footer">
                        <p>Integrante de Rey León App</p>
                    </div>
                </div>
            </main>

            <style>{bdayStyles}</style>
        </div>
    );
}

const bdayStyles = `
    .bday-detail-root { min-height: 100dvh; background: #0c0a08; color: #fff; font-family: 'Poppins', sans-serif; position: relative; overflow-x: hidden; }
    .bday-bg-gradient { 
        position: absolute; top: -100px; left: 50%; transform: translateX(-50%);
        width: 140%; aspect-ratio: 1;
        background: radial-gradient(circle, rgba(212,160,23,0.12) 0%, rgba(12,10,8,0) 70%);
        pointer-events: none; z-index: 0;
    }
    
    .loading, .empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center; }
    .loader { width: 40px; height: 40px; border: 3px solid rgba(212,160,23,0.1); border-top-color: #d4a017; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .bday-header {
        position: relative; z-index: 10; display: flex; align-items: center; justify-content: space-between;
        padding: 0 16px; height: 64px;
    }
    .back-btn { background: rgba(255,255,255,0.05); border: none; color: #fff; cursor: pointer; padding: 10px; border-radius: 14px; }
    .header-type { font-size: 0.8rem; font-weight: 500; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; }

    .bday-content { position: relative; z-index: 10; padding: 20px 24px; }
    
    .profile-main { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 40px; }
    .photo-wrapper { position: relative; margin-bottom: 20px; }
    .profile-img { width: 120px; height: 120px; border-radius: 40px; object-fit: cover; border: 3px solid #d4a017; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .profile-placeholder { width: 120px; height: 120px; border-radius: 40px; background: #1a1614; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.1); border: 2px dashed rgba(255,255,255,0.1); }
    .bday-badge { position: absolute; bottom: -5px; right: -5px; background: #fff; width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }

    .profile-name { font-size: 1.8rem; font-weight: 800; margin: 0 0 8px; color: #fff; }
    .bday-tag { display: flex; align-items: center; gap: 8px; padding: 6px 16px; background: rgba(212,160,23,0.1); border: 1px solid rgba(212,160,23,0.2); border-radius: 30px; color: #d4a017; font-size: 0.85rem; font-weight: 600; margin-bottom: 12px; }
    
    .character-tag { 
        display: flex; align-items: center; gap: 8px; padding: 10px 20px; 
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); 
        border-radius: 20px; color: rgba(255,255,255,0.8); font-size: 0.9rem;
    }
    .character-tag b { color: #d4a017; margin-left: 2px; }

    .profile-sections { display: flex; flex-direction: column; gap: 24px; }
    .info-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 24px; }
    .info-card h3 { font-size: 0.9rem; font-weight: 600; color: #d4a017; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-card p { font-size: 0.95rem; color: rgba(255,255,255,0.6); line-height: 1.6; margin: 0; }

    .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .action-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 20px; border-radius: 24px; text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: transform 0.2s; }
    .action-btn:active { transform: scale(0.95); }
    .action-btn.wa { background: #25D366; color: #fff; }
    .action-btn.ig { background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: #fff; }

    .profile-footer { text-align: center; padding: 40px 0; font-size: 0.75rem; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 0.2em; }
`;
