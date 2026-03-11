'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Store, User } from 'lucide-react';

const TABS = [
    { href: '/feed', label: 'Inicio', Icon: Home },
    { href: '/negocios', label: 'Negocios', Icon: Store },
    { href: '/perfil', label: 'Perfil', Icon: User },
];

export default function BottomNav() {
    const pathname = usePathname();
    return (
        <>
            <nav className="bottom-nav">
                {TABS.map(({ href, label, Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/');
                    return (
                        <Link key={href} href={href} className={`bottom-tab${active ? ' active' : ''}`}>
                            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>
            <style>{`
                .bottom-nav {
                    position: fixed;
                    bottom: 0; left: 0; right: 0;
                    height: calc(60px + env(safe-area-inset-bottom, 0px));
                    background: rgba(8, 6, 4, 0.97);
                    border-top: 1px solid rgba(255,255,255,0.07);
                    display: flex;
                    align-items: flex-start;
                    padding-top: 8px;
                    padding-bottom: env(safe-area-inset-bottom, 0px);
                    backdrop-filter: blur(16px);
                    z-index: 40;
                }
                .bottom-tab {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 3px;
                    text-decoration: none;
                    color: rgba(255,255,255,0.35);
                    font-family: 'Poppins', sans-serif;
                    font-size: 10px;
                    font-weight: 500;
                    transition: color 0.15s;
                    padding: 4px 0;
                    letter-spacing: 0.02em;
                }
                .bottom-tab.active { color: #d4a017; }
            `}</style>
        </>
    );
}
