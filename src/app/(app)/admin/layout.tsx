'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Users, Calendar, Store, LayoutDashboard, ChevronLeft, Menu, X, Shield, Bell, Settings, LogOut } from 'lucide-react';

const ADMIN_LINKS = [
    { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/admin/usuarios', label: 'Elenco', Icon: Users },
    { href: '/admin/calendario', label: 'Eventos', Icon: Calendar },
    { href: '/admin/negocios', label: 'Emprendimientos', Icon: Store },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAdmin, isSuperAdmin, loading, profile } = useAuth();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (loading) return (
        <div className="loading-screen">
            <div className="loader"></div>
            <style jsx>{`
                .loading-screen { min-height: 100vh; background: #080605; display: flex; align-items: center; justify-content: center; }
                .loader { width: 40px; height: 40px; border: 3px solid rgba(212,160,23,0.1); border-top-color: #d4a017; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );

    if (!isAdmin) {
        return (
            <div className="denied-container">
                <div className="denied-card">
                    <Shield size={48} className="denied-icon" />
                    <h1>Acceso Restringido</h1>
                    <p>Esta sección es solo para personal autorizado.</p>
                    <Link href="/feed" className="denied-link">Regresar al Feed</Link>
                </div>
                <style jsx>{`
                    .denied-container { min-height: 100vh; background: #080605; display: flex; align-items: center; justify-content: center; padding: 20px; }
                    .denied-card { background: #0c0a08; border: 1px solid rgba(255,255,255,0.06); padding: 40px; border-radius: 24px; text-align: center; max-width: 400px; width: 100%; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                    .denied-icon { color: #ef4444; margin-bottom: 20px; }
                    h1 { color: #fff; font-size: 1.5rem; font-weight: 700; margin-bottom: 12px; }
                    p { color: rgba(255,255,255,0.5); margin-bottom: 24px; line-height: 1.5; }
                    .denied-link { display: inline-block; background: #d4a017; color: #000; padding: 12px 32px; border-radius: 12px; font-weight: 700; text-decoration: none; transition: transform 0.2s; }
                    .denied-link:hover { transform: translateY(-2px); }
                `}</style>
            </div>
        );
    }

    return (
        <div className="admin-wrapper">
            {/* Desktop Sidebar */}
            <aside className="desktop-sidebar">
                <div className="sidebar-inner">
                    <div className="logo-section">
                        <div className="logo-glow"></div>
                        <h1 className="logo-text">REYLEÓN</h1>
                        <span className="logo-badge">ADMIN</span>
                    </div>

                    <nav className="sidebar-nav">
                        <Link href="/feed" className="app-link">
                            <ChevronLeft size={18} />
                            <span>App Principal</span>
                        </Link>
                        
                        <div className="nav-group">
                            <span className="nav-label">General</span>
                            {ADMIN_LINKS.map(({ href, label, Icon }) => {
                                const active = pathname === href;
                                return (
                                    <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
                                        <div className="nav-icon-wrap">
                                            <Icon size={20} />
                                        </div>
                                        <span>{label}</span>
                                        {active && <div className="active-dot"></div>}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    <div className="sidebar-footer">
                        <div className="user-info">
                            <div className="user-avatar">
                                {profile?.photoUrl ? <img src={profile.photoUrl} alt="" /> : (profile?.fullName?.charAt(0) || 'A')}
                            </div>
                            <div className="user-details">
                                <span className="user-name">{profile?.fullName || 'Admin'}</span>
                                <span className="user-role">{isSuperAdmin ? 'Super Admin' : 'Administrador'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Navigation */}
            <header className={`mobile-header ${scrolled ? 'scrolled' : ''}`}>
                <div className="mobile-header-inner">
                    <h1 className="mobile-logo">RL <span className="mobile-admin-tag">ADMIN</span></h1>
                    <button className="menu-toggle" onClick={() => setIsMenuOpen(true)} title="Abrir menú">
                        <Menu size={24} />
                    </button>
                </div>
            </header>

            {/* Mobile Drawer */}
            <div className={`drawer-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}>
                <aside className={`mobile-drawer ${isMenuOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="drawer-header">
                        <div className="drawer-logo">RL ADMIN</div>
                        <button className="drawer-close" onClick={() => setIsMenuOpen(false)} title="Cerrar menú">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <nav className="drawer-nav">
                        <Link href="/feed" className="drawer-back" onClick={() => setIsMenuOpen(false)}>
                            <ChevronLeft size={18} />
                            <span>Volver a la App</span>
                        </Link>
                        <div className="drawer-divider" />
                        {ADMIN_LINKS.map(({ href, label, Icon }) => {
                            const active = pathname === href;
                            return (
                                <Link 
                                    key={href} 
                                    href={href} 
                                    className={`drawer-link ${active ? 'active' : ''}`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <Icon size={20} />
                                    <span>{label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="drawer-footer">
                        <div className="drawer-profile">
                             <div className="dr-avatar">
                                {profile?.photoUrl ? <img src={profile.photoUrl} alt="" /> : (profile?.fullName?.charAt(0) || 'A')}
                             </div>
                             <div className="dr-meta">
                                <span className="dr-name">{profile?.fullName || 'Admin'}</span>
                                <span className="dr-role">{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
                             </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Main Content Area */}
            <main className="main-content">
                <header className="page-header">
                    <div className="header-search">
                        {/* Space for future search or filters */}
                    </div>
                    <div className="header-actions">
                        <button className="action-btn" title="Notificaciones"><Bell size={20} /></button>
                        <button className="action-btn" title="Configuración"><Settings size={20} /></button>
                    </div>
                </header>

                <div className="content-container">
                    {children}
                </div>
            </main>            <style jsx global>{`
                .admin-wrapper {
                    display: flex;
                    min-height: 100vh;
                    background: #080705;
                    color: #fff;
                    font-family: 'Poppins', sans-serif;
                }

                /* Hide global bottom nav on admin routes */
                .bottom-nav {
                    display: none !important;
                }

                /* SIDEBAR DESKTOP */
                .admin-wrapper .desktop-sidebar {
                    width: 280px;
                    background: #110e0c;
                    border-right: 1px solid rgba(212,160,23,0.08);
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    z-index: 100;
                    flex-shrink: 0;
                }
                .admin-wrapper .sidebar-inner { height: 100%; display: flex; flex-direction: column; padding: 32px 20px; }
                
                .admin-wrapper .logo-section { margin-bottom: 48px; position: relative; }
                .admin-wrapper .logo-glow { position: absolute; top: 0; left: 0; width: 40px; height: 40px; background: #d4a017; filter: blur(35px); opacity: 0.3; }
                .admin-wrapper .logo-text { font-size: 1.4rem; font-weight: 900; letter-spacing: 2px; color: #fff; margin: 0; }
                .admin-wrapper .logo-badge { font-size: 0.65rem; background: rgba(212,160,23,0.15); color: #d4a017; padding: 2px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(212,160,23,0.3); margin-top: 4px; display: inline-block; }

                .admin-wrapper .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 32px; }
                .admin-wrapper .app-link { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.4); text-decoration: none; font-size: 0.85rem; font-weight: 500; transition: color 0.2s; }
                .admin-wrapper .app-link:hover { color: #d4a017; }

                .admin-wrapper .nav-group { display: flex; flex-direction: column; gap: 6px; }
                .admin-wrapper .nav-label { font-size: 0.7rem; font-weight: 700; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; padding-left: 12px; }
                
                .admin-wrapper .nav-item {
                    display: flex !important; flex-direction: row !important; align-items: center !important; gap: 14px !important; padding: 10px 16px; border-radius: 12px; color: rgba(255,255,255,0.45);
                    text-decoration: none; font-weight: 500; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); position: relative;
                }
                .admin-wrapper .nav-item svg { display: inline-block !important; flex-shrink: 0; }
                .admin-wrapper .nav-icon-wrap { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: rgba(255,255,255,0.03); transition: all 0.25s; }
                .admin-wrapper .nav-item:hover { color: #fff; background: rgba(255,255,255,0.02); }
                .admin-wrapper .nav-item:hover .nav-icon-wrap { background: rgba(255,255,255,0.08); color: #d4a017; }
                .admin-wrapper .nav-item.active { background: linear-gradient(135deg, rgba(212,160,23,0.15) 0%, rgba(212,160,23,0.02) 100%); color: #d4a017; border: 1px solid rgba(212,160,23,0.1); }
                .admin-wrapper .nav-item.active .nav-icon-wrap { background: rgba(212,160,23,0.15); color: #d4a017; box-shadow: 0 4px 12px rgba(212,160,23,0.1); }
                .admin-wrapper .active-dot { position: absolute; right: 12px; width: 5px; height: 5px; border-radius: 50%; background: #d4a017; box-shadow: 0 0 8px #d4a017; }

                .admin-wrapper .sidebar-footer { padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); }
                .admin-wrapper .user-info { display: flex; align-items: center; gap: 12px; }
                .admin-wrapper .user-avatar { width: 40px; height: 40px; border-radius: 12px; background: #d4a017; display: flex; align-items: center; justify-content: center; color: #000; font-weight: 700; font-size: 1.1rem; overflow: hidden; }
                .admin-wrapper .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .admin-wrapper .user-details { display: flex; flex-direction: column; min-width: 0; }
                .admin-wrapper .user-name { font-size: 0.9rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .admin-wrapper .user-role { font-size: 0.7rem; color: rgba(255,255,255,0.3); }

                /* MAIN CONTENT */
                .admin-wrapper .main-content { flex: 1; display: flex; flex-direction: column; min-width: 0; }
                .admin-wrapper .page-header { height: 80px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; background: rgba(8,7,5,0.5); backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 90; }
                .admin-wrapper .header-actions { display: flex; align-items: center; gap: 12px; }
                .admin-wrapper .action-btn { width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
                .admin-wrapper .action-btn:hover { background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(212,160,23,0.3); }
                .admin-wrapper .content-container { padding: 0 40px 40px; }

                /* MOBILE UI (HIDDEN ON DESKTOP) */
                .admin-wrapper .mobile-header { display: none; }
                .admin-wrapper .drawer-overlay { display: none; }

                @media (max-width: 1024px) {
                    .admin-wrapper .desktop-sidebar { display: none; }
                    .admin-wrapper .page-header { display: none; }
                    .admin-wrapper .main-content { padding-top: 70px; }
                    .admin-wrapper .content-container { padding: 20px; }

                    .admin-wrapper .mobile-header {
                        display: block; position: fixed; top: 0; left: 0; right: 0; height: 70px;
                        background: rgba(8,7,5,0.8); backdrop-filter: blur(15px); z-index: 200;
                        border-bottom: 1px solid rgba(255,255,255,0.06); transition: all 0.3s;
                    }
                    .admin-wrapper .mobile-header.scrolled { background: #0c0a08; }
                    .admin-wrapper .mobile-header-inner { height: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; }
                    .admin-wrapper .mobile-logo { font-size: 1.1rem; font-weight: 800; letter-spacing: 1px; margin: 0; }
                    .admin-wrapper .mobile-admin-tag { font-size: 0.6rem; color: #d4a017; border: 1px solid #d4a017; padding: 1px 4px; border-radius: 4px; vertical-align: middle; margin-left: 4px; }
                    .admin-wrapper .menu-toggle { background: transparent; border: none; color: #fff; cursor: pointer; padding: 8px; border-radius: 12px; }

                    /* Drawer */
                    .admin-wrapper .drawer-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 300; opacity: 0; visibility: hidden; transition: all 0.4s ease; }
                    .admin-wrapper .drawer-overlay.open { opacity: 1; visibility: visible; }
                    .admin-wrapper .mobile-drawer {
                        position: absolute; top: 0; right: 0; width: 300px; height: 100%; background: #0c0a08;
                        transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                        display: flex; flex-direction: column; box-shadow: -10px 0 40px rgba(0,0,0,0.8);
                    }
                    .admin-wrapper .drawer-overlay.open .mobile-drawer { transform: translateX(0); }
                    .admin-wrapper .drawer-header { padding: 32px 24px; display: flex; align-items: center; justify-content: space-between; }
                    .admin-wrapper .drawer-logo { font-size: 1rem; font-weight: 800; color: #d4a017; letter-spacing: 1px; }
                    .admin-wrapper .drawer-close { background: rgba(255,255,255,0.05); border: none; color: #fff; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                    
                    .admin-wrapper .drawer-nav { flex: 1; padding: 0 16px; display: flex; flex-direction: column; gap: 8px; }
                    .admin-wrapper .drawer-back { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 8px; color: rgba(255,255,255,0.4); text-decoration: none; font-size: 0.9rem; padding: 12px 16px; margin-bottom: 8px; }
                    .admin-wrapper .drawer-back svg { display: inline-block !important; }
                    .admin-wrapper .drawer-divider { height: 1px; background: rgba(255,255,255,0.08); margin-bottom: 16px; width: 90%; margin-left: 5%; }
                    
                    .admin-wrapper .drawer-link {
                        display: flex !important; flex-direction: row !important; align-items: center !important; gap: 16px !important; padding: 16px 20px; border-radius: 16px; color: rgba(255,255,255,0.6);
                        text-decoration: none; font-weight: 500; transition: all 0.2s; border: 1px solid transparent;
                    }
                    .admin-wrapper .drawer-link svg { display: inline-block !important; flex-shrink: 0; }
                    .admin-wrapper .drawer-link:active { background: rgba(255,255,255,0.03); }
                    .admin-wrapper .drawer-link.active { background: rgba(212,160,23,0.12); color: #d4a017; font-weight: 700; border-color: rgba(212,160,23,0.2); }
                    
                    .admin-wrapper .drawer-footer { padding: 32px 24px; border-top: 1px solid rgba(255,255,255,0.06); }
                    .admin-wrapper .drawer-profile { display: flex; align-items: center; gap: 12px; }
                    .admin-wrapper .dr-avatar { width: 44px; height: 44px; border-radius: 14px; background: #d4a017; color: #000; display: flex; align-items: center; justify-content: center; font-weight: 700; overflow: hidden; }
                    .admin-wrapper .dr-avatar img { width: 100%; height: 100%; object-fit: cover; }
                    .admin-wrapper .dr-meta { display: flex; flex-direction: column; }
                    .admin-wrapper .dr-name { font-size: 0.95rem; font-weight: 600; color: #fff; }
                    .admin-wrapper .dr-role { font-size: 0.7rem; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.5px; }
                }
            `}</style>
        </div>
    );
}
