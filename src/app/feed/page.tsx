'use client';

import { useAuth } from '@/context/AuthContext';
import { logoutUser } from '@/actions/auth';
import { useRouter } from 'next/navigation';

export default function FeedPage() {
    const { user, profile, isAdmin, isSuperAdmin } = useAuth();
    const router = useRouter();

    async function handleLogout() {
        await logoutUser();
        router.push('/login');
    }

    const displayName = profile?.fullName || (profile as any)?.full_name || user?.user_metadata?.full_name || 'Usuario';
    const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="feed-root">
            <div className="feed-bg">
                <div className="feed-spotlight" />
            </div>

            {/* Header */}
            <header className="feed-header">
                <div className="feed-header-inner">
                    <div className="feed-logo">
                        <span className="feed-logo-crown">♛</span>
                        <span className="feed-logo-text">Rey León</span>
                    </div>
                    <div className="feed-header-right">
                        {isSuperAdmin && (
                            <span className="feed-badge-super">Super Admin</span>
                        )}
                        {isAdmin && !isSuperAdmin && (
                            <span className="feed-badge-admin">Admin</span>
                        )}
                        <div className="feed-avatar">{initials}</div>
                        <button onClick={handleLogout} className="feed-logout-btn">
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="feed-main">
                <div className="feed-welcome">
                    <h1 className="feed-welcome-title">Bienvenido, {displayName.split(' ')[0]}.</h1>
                    <p className="feed-welcome-sub">El feed del elenco estará aquí pronto.</p>
                </div>

                {/* Placeholder cards */}
                <div className="feed-placeholder">
                    <div className="feed-coming-card">
                        <div className="feed-coming-icon">📰</div>
                        <h3>Feed de publicaciones</h3>
                        <p>Próximamente</p>
                    </div>
                    <div className="feed-coming-card">
                        <div className="feed-coming-icon">📊</div>
                        <h3>Encuestas</h3>
                        <p>Próximamente</p>
                    </div>
                    <div className="feed-coming-card">
                        <div className="feed-coming-icon">🏪</div>
                        <h3>Negocios</h3>
                        <p>Próximamente</p>
                    </div>
                </div>
            </main>

            <style>{feedStyles}</style>
        </div>
    );
}

const feedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

  .feed-root {
    min-height: 100vh;
    background: #0c0a08;
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    position: relative;
  }

  .feed-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  .feed-spotlight {
    position: absolute;
    top: -10%;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 400px;
    background: radial-gradient(ellipse at center, rgba(212,160,23,0.07) 0%, transparent 65%);
  }

  .feed-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(12, 10, 8, 0.9);
    border-bottom: 1px solid rgba(212,160,23,0.15);
    backdrop-filter: blur(12px);
  }

  .feed-header-inner {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 1.5rem;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .feed-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .feed-logo-crown {
    font-size: 1.2rem;
    color: #d4a017;
    text-shadow: 0 0 10px rgba(212,160,23,0.4);
  }

  .feed-logo-text {
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: #ffffff;
    letter-spacing: 0.02em;
  }

  .feed-header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .feed-badge-super {
    background: linear-gradient(135deg, #d4a017, #b8860b);
    color: #0c0a08;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.2rem 0.55rem;
    border-radius: 20px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .feed-badge-admin {
    background: rgba(212,160,23,0.15);
    color: #d4a017;
    border: 1px solid rgba(212,160,23,0.3);
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.2rem 0.55rem;
    border-radius: 20px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .feed-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #d4a017, #8b6010);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: #0c0a08;
    flex-shrink: 0;
  }

  .feed-logout-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.5);
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    padding: 0.3rem 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .feed-logout-btn:hover {
    border-color: rgba(212,160,23,0.3);
    color: #d4a017;
  }

  .feed-main {
    position: relative;
    z-index: 1;
    max-width: 900px;
    margin: 0 auto;
    padding: 3rem 1.5rem;
  }

  .feed-welcome {
    margin-bottom: 3rem;
    animation: fadeUp 0.5s ease forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .feed-welcome-title {
    font-family: 'Poppins', sans-serif;
    font-size: 2.2rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 0.5rem;
    letter-spacing: 0.01em;
  }

  .feed-welcome-sub {
    font-size: 0.95rem;
    color: rgba(255,255,255,0.5);
    margin: 0;
    font-weight: 300;
  }

  .feed-placeholder {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
    animation: fadeUp 0.5s ease 0.1s both;
  }

  .feed-coming-card {
    background: rgba(18,14,10,0.8);
    border: 1px solid rgba(212,160,23,0.12);
    border-radius: 16px;
    padding: 2rem 1.5rem;
    text-align: center;
    transition: border-color 0.2s, transform 0.2s;
  }

  .feed-coming-card:hover {
    border-color: rgba(212,160,23,0.3);
    transform: translateY(-2px);
  }

  .feed-coming-icon {
    font-size: 2rem;
    margin-bottom: 0.75rem;
  }

  .feed-coming-card h3 {
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 0.4rem;
  }

  .feed-coming-card p {
    font-size: 0.78rem;
    color: rgba(212,160,23,0.5);
    margin: 0;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
`;
