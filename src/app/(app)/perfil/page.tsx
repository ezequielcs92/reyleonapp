'use client';
import { useAuth } from '@/context/AuthContext';
import { logoutUser } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function PerfilPage() {
    const { user, profile, isAdmin, isSuperAdmin } = useAuth();
    const router = useRouter();

    const fullName = (profile as any)?.full_name || profile?.fullName || user?.user_metadata?.full_name || 'Usuario';
    const email = user?.email || '';
    const photoUrl = (profile as any)?.photo_url || user?.user_metadata?.avatar_url;
    const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    async function handleLogout() {
        await logoutUser();
        router.push('/login');
    }

    return (
        <div style={{ minHeight: '100dvh', background: '#0c0a08', fontFamily: "'Poppins', sans-serif" }}>
            <header style={{
                position: 'sticky', top: 0, zIndex: 20,
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '0 16px', height: '52px',
                background: 'rgba(12,10,8,0.92)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
            }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', flex: 1 }}>Mi perfil</span>
            </header>

            <div style={{ padding: '32px 24px' }}>
                {/* Avatar + info */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                    {photoUrl ? (
                        <img src={photoUrl} alt={fullName} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(212,160,23,0.4)' }} />
                    ) : (
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #d4a017, #7a5500)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem', fontWeight: 700, color: '#0c0a08',
                        }}>{initials}</div>
                    )}
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ color: '#fff', fontWeight: 600, fontSize: '1.15rem', margin: '0 0 4px' }}>{fullName}</h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', margin: 0 }}>{email}</p>
                        <div style={{ marginTop: '8px', display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {isSuperAdmin && (
                                <span style={{
                                    background: 'linear-gradient(135deg, #d4a017, #b8860b)',
                                    color: '#0c0a08', fontSize: '0.65rem', fontWeight: 700,
                                    padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.06em',
                                }}>SUPER ADMIN</span>
                            )}
                            {isAdmin && !isSuperAdmin && (
                                <span style={{
                                    background: 'rgba(212,160,23,0.15)', color: '#d4a017',
                                    border: '1px solid rgba(212,160,23,0.3)', fontSize: '0.65rem',
                                    fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
                                }}>ADMIN</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coming soon */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '14px', padding: '20px', marginBottom: '32px', textAlign: 'center',
                    color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem',
                }}>
                    La edición de perfil, redes sociales y trabajos viene pronto.
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '8px', padding: '14px',
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '12px', color: '#fca5a5',
                        fontFamily: "'Poppins', sans-serif", fontSize: '0.88rem', fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    <LogOut size={16} />
                    Cerrar sesión
                </button>
            </div>
        </div>
    );
}
