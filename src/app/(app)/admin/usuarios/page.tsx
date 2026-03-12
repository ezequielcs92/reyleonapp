'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Shield, ShieldAlert, User as UserIcon } from 'lucide-react';

type UserAdmin = {
    uid: string;
    full_name: string;
    stage_name?: string | null;
    email: string;
    photo_url?: string | null;
    is_admin: boolean;
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserAdmin[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        setLoading(true);
        try {
            // Fetch users and their admin status
            const [{ data: userData }, { data: adminData }] = await Promise.all([
                supabase.from('users').select('uid, full_name, stage_name, email, photo_url'),
                supabase.from('admins').select('uid'),
            ]);

            if (userData) {
                const adminIds = new Set(adminData?.map(a => a.uid) || []);
                const merged = userData.map(u => ({
                    ...u,
                    is_admin: adminIds.has(u.uid)
                }));
                // Sort by admin first, then by name
                setUsers(merged.sort((a, b) => {
                    if (a.is_admin === b.is_admin) return a.full_name.localeCompare(b.full_name);
                    return a.is_admin ? -1 : 1;
                }));
            }
        } catch (err) {
            console.error('Error loading users:', err);
        } finally {
            setLoading(false);
        }
    }

    async function toggleAdmin(userId: string, currentAdmin: boolean) {
        if (!confirm(`¿Estás seguro de que quieres ${currentAdmin ? 'quitar' : 'dar'} permisos de administrador?`)) return;
        
        try {
            if (currentAdmin) {
                await supabase.from('admins').delete().eq('uid', userId);
            } else {
                await supabase.from('admins').insert({ uid: userId });
            }
            loadUsers();
        } catch {
            alert('Error al cambiar permisos');
        }
    }

    const filteredUsers = users.filter(u => 
        u.full_name.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.stage_name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="admin-users">
            <header className="page-header">
                <div>
                    <h2 className="home-title">Gestión de Usuarios</h2>
                    <p className="home-subtitle">{users.length} miembros registrados</p>
                </div>
                <div className="search-box">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o email..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <div className="users-table-container">
                {loading ? (
                    <div className="loading-state">Cargando usuarios...</div>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => (
                                <tr key={u.uid}>
                                    <td>
                                        <div className="user-info">
                                            <div className="user-avatar">
                                                {u.photo_url ? (
                                                    <img src={u.photo_url} alt={u.full_name} />
                                                ) : (
                                                    <UserIcon size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="user-name">{u.full_name}</div>
                                                {u.stage_name && <div className="user-stage">&quot;{u.stage_name}&quot;</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="user-email">{u.email}</span></td>
                                    <td>
                                        {u.is_admin ? (
                                            <span className="badge admin">Admin</span>
                                        ) : (
                                            <span className="badge user">Elenco</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="action-dot-btn" onClick={() => toggleAdmin(u.uid, u.is_admin)}>
                                            {u.is_admin ? <ShieldAlert size={18} color="#ef4444" /> : <Shield size={18} color="#10b981" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style jsx>{`
                .admin-users { max-width: 1000px; }
                .page-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 32px;
                    gap: 20px;
                }
                .search-box {
                    flex: 1;
                    max-width: 400px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px;
                    padding: 0 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .search-box input {
                    background: transparent; border: none; padding: 12px 0;
                    color: #fff; width: 100%; outline: none; font-size: 0.9rem;
                }

                .users-table-container {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 20px;
                    overflow: hidden;
                }
                .users-table { width: 100%; border-collapse: collapse; }
                .users-table th {
                    text-align: left; padding: 16px 24px;
                    font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;
                    color: rgba(255,255,255,0.3); border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                .users-table td { padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.04); }
                .user-info { display: flex; align-items: center; gap: 14px; }
                .user-avatar {
                    width: 40px; height: 40px; border-radius: 50%;
                    background: rgba(255,255,255,0.05); overflow: hidden;
                    display: flex; align-items: center; justify-content: center;
                    color: rgba(255,255,255,0.2);
                }
                .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .user-name { font-weight: 600; font-size: 0.95rem; color: #fff; }
                .user-stage { font-size: 0.75rem; color: #d4a017; margin-top: 1px; }
                .user-email { color: rgba(255,255,255,0.4); font-size: 0.9rem; }

                .badge {
                    padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
                    display: inline-block;
                }
                .badge.admin { background: rgba(212,160,23,0.1); color: #d4a017; border: 1px solid rgba(212,160,23,0.2); }
                .badge.user { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); }

                .action-dot-btn {
                    background: transparent; border: none; cursor: pointer;
                    padding: 8px; border-radius: 10px; transition: all 0.2s;
                }
                .action-dot-btn:hover { background: rgba(255,255,255,0.05); }

                .loading-state { padding: 80px; text-align: center; color: rgba(255,255,255,0.3); }

                @media (max-width: 768px) {
                    .page-header { flex-direction: column; align-items: stretch; }
                    .search-box { max-width: 100%; }
                    .users-table th:nth-child(2), .users-table td:nth-child(2) { display: none; }
                }

                /* Reuse text styles from Dashboard main */
                .home-title { font-size: 1.8rem; font-weight: 800; margin: 0 0 4px; color: #fff; }
                .home-subtitle { color: rgba(255,255,255,0.4); font-size: 0.95rem; }
            `}</style>
        </div>
    );
}
