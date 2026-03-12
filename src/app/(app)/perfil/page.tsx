'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { logoutUser } from '@/actions/auth';
import { updateProfile, addLink, deleteLink, addWork, deleteWork } from '@/actions/profile';
import { useRouter } from 'next/navigation';
import { LogOut, Plus, Trash2, X, Globe, Instagram, Twitter, Youtube, Camera, Shield } from 'lucide-react';
import Cropper, { Area, Point } from 'react-easy-crop';

type Link = { id: string; type: string; label: string; url: string };
type Work = { id: string; title: string; year: number; company: string; role: string; link?: string | null };
type Prof = { full_name: string; stage_name?: string | null; bio?: string | null; role_in_show?: string | null; photo_url?: string | null; birthdate?: string | null; };

const MAX_PHOTO_SIZE_MB = 5;

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', error => reject(error));
        image.src = url;
    });
}

async function getCroppedBlob(imageSrc: string, cropPixels: Area, mimeType: string) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo procesar la imagen');

    ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height
    );

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            blob => {
                if (blob) resolve(blob);
                else reject(new Error('No se pudo generar el recorte'));
            },
            mimeType,
            0.92
        );
    });
}

const LINK_TYPES = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'twitter', label: 'Twitter / X' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'website', label: 'Sitio web' },
    { value: 'other', label: 'Otro' },
];

function LinkIcon({ type }: { type: string }) {
    if (type === 'instagram') return <Instagram size={15} />;
    if (type === 'twitter') return <Twitter size={15} />;
    if (type === 'youtube') return <Youtube size={15} />;
    return <Globe size={15} />;
}

function initials(name: string) {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
}

function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="sheet-overlay" onClick={onClose}>
            <div className="sheet-panel" onClick={e => e.stopPropagation()}>
                <div className="sheet-handle" />
                <div className="sheet-header">
                    <span className="sheet-title">{title}</span>
                    <button className="sheet-close" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="sheet-body">{children}</div>
            </div>
        </div>
    );
}

export default function PerfilPage() {
    const { user, profile: prof, isAdmin, isSuperAdmin } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [links, setLinks] = useState<Link[]>([]);
    const [works, setWorks] = useState<Work[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoError, setPhotoError] = useState('');
    const [cropOpen, setCropOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState('');
    const [cropMimeType, setCropMimeType] = useState('image/jpeg');
    const [cropExt, setCropExt] = useState('jpg');
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    // Edit basic info sheet
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ full_name: '', stage_name: '', bio: '', role_in_show: '', birthdate: '' });
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState('');

    // Add link sheet
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkForm, setLinkForm] = useState({ type: 'instagram', label: 'Instagram', url: '' });
    const [linkSubmitting, setLinkSubmitting] = useState(false);
    const [linkError, setLinkError] = useState('');

    // Add work sheet
    const [workOpen, setWorkOpen] = useState(false);
    const [workForm, setWorkForm] = useState({ title: '', year: String(new Date().getFullYear()), company: '', role: '', link: '' });
    const [workSubmitting, setWorkSubmitting] = useState(false);
    const [workError, setWorkError] = useState('');

    const loadData = useCallback(async () => {
        if (!user) return;
        const [lr, wr] = await Promise.all([
            supabase.from('user_links').select('*').eq('user_id', user.id).order('created_at'),
            supabase.from('user_work').select('*').eq('user_id', user.id).order('year', { ascending: false }),
        ]);
        setLinks(lr.data || []);
        setWorks(wr.data || []);
        setLoading(false);
    }, [user]);

    useEffect(() => { loadData(); }, [loadData]);

    function openEdit() {
        setEditForm({
            full_name: prof?.fullName || '',
            stage_name: prof?.stageName || '',
            bio: prof?.bio || '',
            role_in_show: prof?.roleInShow || '',
            birthdate: prof?.birthdate || '',
        });
        setEditError('');
        setEditOpen(true);
    }

    async function handleEditSave() {
        setEditSubmitting(true); setEditError('');
        const fd = new FormData();
        Object.entries(editForm).forEach(([k, v]) => fd.append(k, v));
        const res = await updateProfile(fd);
        setEditSubmitting(false);
        if (res.error) { setEditError(res.error); return; }
        setEditOpen(false);
    }

    async function handleAddLink() {
        setLinkSubmitting(true); setLinkError('');
        const fd = new FormData();
        Object.entries(linkForm).forEach(([k, v]) => fd.append(k, v));
        const res = await addLink(fd);
        setLinkSubmitting(false);
        if (res.error) { setLinkError(res.error); return; }
        setLinkOpen(false);
        setLinkForm({ type: 'instagram', label: 'Instagram', url: '' });
        loadData();
    }

    async function handleDeleteLink(id: string) {
        await deleteLink(id);
        setLinks(prev => prev.filter(l => l.id !== id));
    }

    async function handleAddWork() {
        setWorkSubmitting(true); setWorkError('');
        const fd = new FormData();
        Object.entries(workForm).forEach(([k, v]) => fd.append(k, v));
        const res = await addWork(fd);
        setWorkSubmitting(false);
        if (res.error) { setWorkError(res.error); return; }
        setWorkOpen(false);
        setWorkForm({ title: '', year: String(new Date().getFullYear()), company: '', role: '', link: '' });
        loadData();
    }

    async function handleDeleteWork(id: string) {
        await deleteWork(id);
        setWorks(prev => prev.filter(w => w.id !== id));
    }

    async function handleLogout() {
        await logoutUser();
        router.push('/login');
    }

    useEffect(() => {
        return () => {
            if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
        };
    }, [cropImageSrc]);

    async function uploadPhoto(blob: Blob, ext: string, mimeType: string) {
        if (!user) return;

        setUploadingPhoto(true);
        const path = `${user.id}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(path, blob, { upsert: true, contentType: mimeType });

        if (uploadError) {
            setUploadingPhoto(false);
            setPhotoError('No se pudo subir la foto. Verificá que exista el bucket avatars.');
            return;
        }

        const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
        const publicUrl = `${publicData.publicUrl}?v=${Date.now()}`;

        const { error: dbErr } = await supabase
            .from('users')
            .update({ photo_url: publicUrl })
            .eq('uid', user.id);

        setUploadingPhoto(false);

        if (dbErr) {
            setPhotoError(dbErr.message);
            return;
        }
    }

    async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setPhotoError('');

        if (!file.type.startsWith('image/')) {
            setPhotoError('Seleccioná una imagen válida');
            return;
        }

        if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
            setPhotoError(`La imagen debe pesar menos de ${MAX_PHOTO_SIZE_MB}MB`);
            return;
        }

        if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
        const objectUrl = URL.createObjectURL(file);
        setCropImageSrc(objectUrl);
        setCropMimeType(file.type || 'image/jpeg');
        setCropExt(file.name.split('.').pop()?.toLowerCase() || 'jpg');
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setCropOpen(true);

        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function handleSaveCrop() {
        if (!cropImageSrc || !croppedAreaPixels) return;
        try {
            const blob = await getCroppedBlob(cropImageSrc, croppedAreaPixels, cropMimeType);
            setCropOpen(false);
            await uploadPhoto(blob, cropExt, cropMimeType);
            URL.revokeObjectURL(cropImageSrc);
            setCropImageSrc('');
        } catch {
            setPhotoError('No se pudo recortar la imagen');
        }
    }

    const displayName = prof?.fullName || user?.user_metadata?.full_name || 'Usuario';
    const email = user?.email || '';
    const photoUrl = prof?.photoUrl || user?.user_metadata?.avatar_url;

    return (
        <div className="pf-root">
            <header className="pf-header">
                <span className="pf-header-title">Mi perfil</span>
            </header>

            <div className="pf-content">
                {/* Hero */}
                <div className="pf-hero">
                    <div className="pf-avatar-wrap">
                        {photoUrl ? (
                            <img src={photoUrl} alt={displayName} className="pf-avatar-img" />
                        ) : (
                            <div className="pf-avatar">{initials(displayName)}</div>
                        )}
                        <button
                            className="pf-avatar-edit"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                        >
                            <Camera size={14} />
                            {uploadingPhoto ? 'Subiendo...' : 'Cambiar'}
                        </button>
                        <input
                            ref={fileInputRef}
                            className="pf-hidden-input"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoSelected}
                        />
                    </div>
                    {photoError && <p className="pf-photo-error">{photoError}</p>}
                    <div className="pf-name">{displayName}</div>
                    <div className="pf-email">{email}</div>
                    <div className="pf-badges">
                        {isSuperAdmin && <span className="badge-super">SUPER ADMIN</span>}
                        {isAdmin && !isSuperAdmin && (
                            <div className="pf-badge admin-badge">
                                <Shield size={14} className="badge-icon" />
                                Administrador
                            </div>
                        )}
                        {prof?.roleInShow && <span className="badge-character">🎭 {prof.roleInShow}</span>}
                        {prof?.birthdate && (
                            <span className="badge-role" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                🎂 {new Date(prof.birthdate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                            </span>
                        )}
                    </div>
                    <button className="pf-edit-btn" onClick={openEdit}>Editar perfil</button>
                </div>

                {/* Bio */}
                {prof?.bio && (
                    <div className="pf-section">
                        <p className="pf-bio">{prof.bio}</p>
                    </div>
                )}

                {/* Social Links */}
                <div className="pf-section">
                    <div className="pf-section-header">
                        <span className="pf-section-title">Redes sociales</span>
                        <button className="pf-add-btn" onClick={() => { setLinkError(''); setLinkOpen(true); }}>
                            <Plus size={16} />
                        </button>
                    </div>
                    {loading ? (
                        <div className="pf-skeleton" />
                    ) : links.length === 0 ? (
                        <p className="pf-empty-text">Aún no agregaste redes sociales.</p>
                    ) : (
                        <div className="pf-list">
                            {links.map(l => (
                                <div key={l.id} className="pf-list-item">
                                    <div className="pf-list-icon"><LinkIcon type={l.type} /></div>
                                    <div className="pf-list-body">
                                        <span className="pf-list-label">{l.label}</span>
                                        <a href={l.url} target="_blank" rel="noopener noreferrer" className="pf-list-url">{l.url}</a>
                                    </div>
                                    <button className="pf-del-btn" onClick={() => handleDeleteLink(l.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Work History */}
                <div className="pf-section">
                    <div className="pf-section-header">
                        <span className="pf-section-title">Trayectoria</span>
                        <button className="pf-add-btn" onClick={() => { setWorkError(''); setWorkOpen(true); }}>
                            <Plus size={16} />
                        </button>
                    </div>
                    {loading ? (
                        <div className="pf-skeleton" />
                    ) : works.length === 0 ? (
                        <p className="pf-empty-text">Aún no agregaste trabajos.</p>
                    ) : (
                        <div className="pf-list">
                            {works.map(w => (
                                <div key={w.id} className="pf-list-item">
                                    <div className="pf-list-body">
                                        <span className="pf-list-label">{w.title} · {w.year}</span>
                                        <span className="pf-list-sub">{w.role} — {w.company}</span>
                                        {w.link && (
                                            <a href={w.link} target="_blank" rel="noopener noreferrer" className="pf-list-url">{w.link}</a>
                                        )}
                                    </div>
                                    <button className="pf-del-btn" onClick={() => handleDeleteWork(w.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Logout */}
                <div className="pf-section pf-section-last">
                    <button className="pf-logout-btn" onClick={handleLogout}>
                        <LogOut size={16} />
                        Cerrar sesión
                    </button>
                </div>
            </div>

            {/* Edit profile sheet */}
            <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="Editar perfil">
                <label className="sheet-label">Nombre completo *</label>
                <input className="sheet-input" placeholder="Tu nombre" value={editForm.full_name}
                    onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />

                <label className="sheet-label">Nombre artístico</label>
                <input className="sheet-input" placeholder='Ej: "El Simba"' value={editForm.stage_name}
                    onChange={e => setEditForm(f => ({ ...f, stage_name: e.target.value }))} />

                <label className="sheet-label">Cumpleaños</label>
                <input className="sheet-input" type="date" value={editForm.birthdate}
                    onChange={e => setEditForm(f => ({ ...f, birthdate: e.target.value }))} />

                <label className="sheet-label">Personaje / Rol</label>
                <input className="sheet-input" placeholder="Ej: Simba, Ensemble..." value={editForm.role_in_show}
                    onChange={e => setEditForm(f => ({ ...f, role_in_show: e.target.value }))} />

                <label className="sheet-label">Bio</label>
                <textarea className="sheet-textarea" placeholder="Contá algo sobre vos..." rows={3}
                    value={editForm.bio}
                    onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} />

                {editError && <p className="sheet-error">{editError}</p>}
                <button className="sheet-submit" onClick={handleEditSave}
                    disabled={!editForm.full_name.trim() || editSubmitting}>
                    {editSubmitting ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </Sheet>

            <Sheet open={cropOpen} onClose={() => setCropOpen(false)} title="Recortar foto">
                <div className="crop-area-wrap">
                    <div className="crop-area">
                        {cropImageSrc && (
                            <Cropper
                                image={cropImageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                            />
                        )}
                    </div>
                    <div className="crop-controls">
                        <span className="crop-label">Zoom</span>
                        <input
                            className="crop-zoom"
                            type="range"
                            min={1}
                            max={3}
                            step={0.01}
                            value={zoom}
                            onChange={e => setZoom(Number(e.target.value))}
                        />
                    </div>
                    <button className="sheet-submit" onClick={handleSaveCrop} disabled={uploadingPhoto || !croppedAreaPixels}>
                        {uploadingPhoto ? 'Guardando...' : 'Guardar foto'}
                    </button>
                </div>
            </Sheet>

            {/* Add link sheet */}
            <Sheet open={linkOpen} onClose={() => setLinkOpen(false)} title="Agregar red social">
                <label className="sheet-label">Plataforma</label>
                <select className="sheet-select" value={linkForm.type}
                    onChange={e => {
                        const type = e.target.value;
                        const label = LINK_TYPES.find(t => t.value === type)?.label || type;
                        setLinkForm(f => ({ ...f, type, label }));
                    }}>
                    {LINK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>

                <label className="sheet-label">Nombre visible</label>
                <input className="sheet-input" placeholder="Ej: Instagram" value={linkForm.label}
                    onChange={e => setLinkForm(f => ({ ...f, label: e.target.value }))} />

                <label className="sheet-label">URL</label>
                <input className="sheet-input" placeholder="https://instagram.com/usuario" value={linkForm.url}
                    onChange={e => setLinkForm(f => ({ ...f, url: e.target.value }))} />

                {linkError && <p className="sheet-error">{linkError}</p>}
                <button className="sheet-submit" onClick={handleAddLink}
                    disabled={!linkForm.label.trim() || !linkForm.url.trim() || linkSubmitting}>
                    {linkSubmitting ? 'Agregando...' : 'Agregar'}
                </button>
            </Sheet>

            {/* Add work sheet */}
            <Sheet open={workOpen} onClose={() => setWorkOpen(false)} title="Agregar trabajo">
                <label className="sheet-label">Obra / Producción *</label>
                <input className="sheet-input" placeholder="Ej: El Rey León" value={workForm.title}
                    onChange={e => setWorkForm(f => ({ ...f, title: e.target.value }))} />

                <label className="sheet-label">Año *</label>
                <input className="sheet-input" placeholder="2024" type="number" value={workForm.year}
                    onChange={e => setWorkForm(f => ({ ...f, year: e.target.value }))} />

                <label className="sheet-label">Compañía / Teatro *</label>
                <input className="sheet-input" placeholder="Ej: Teatro Colón" value={workForm.company}
                    onChange={e => setWorkForm(f => ({ ...f, company: e.target.value }))} />

                <label className="sheet-label">Rol / Personaje *</label>
                <input className="sheet-input" placeholder="Ej: Simba" value={workForm.role}
                    onChange={e => setWorkForm(f => ({ ...f, role: e.target.value }))} />

                <label className="sheet-label">Link (opcional)</label>
                <input className="sheet-input" placeholder="https://..." value={workForm.link}
                    onChange={e => setWorkForm(f => ({ ...f, link: e.target.value }))} />

                {workError && <p className="sheet-error">{workError}</p>}
                <button className="sheet-submit" onClick={handleAddWork}
                    disabled={!workForm.title.trim() || !workForm.year || !workForm.company.trim() || !workForm.role.trim() || workSubmitting}>
                    {workSubmitting ? 'Guardando...' : 'Agregar'}
                </button>
            </Sheet>

            <style>{`
  .pf-root { min-height: 100dvh; background: #0c0a08; font-family: 'Poppins', sans-serif; }
  .pf-header {
    position: sticky; top: 0; z-index: 20;
    display: flex; align-items: center;
    padding: 0 16px; height: 52px;
    background: rgba(12,10,8,0.92);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    backdrop-filter: blur(12px);
  }
  .pf-header-title { font-size: 1rem; font-weight: 600; color: #fff; }
  .pf-content { padding-bottom: 24px; }
  .pf-hero {
    display: flex; flex-direction: column; align-items: center;
    gap: 6px; padding: 28px 24px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
    .pf-avatar-wrap { position: relative; margin-bottom: 4px; }
  .pf-avatar {
    width: 76px; height: 76px; border-radius: 50%;
    background: linear-gradient(135deg, #d4a017, #7a5500);
    display: flex; align-items: center; justify-content: center;
        font-size: 1.4rem; font-weight: 700; color: #0c0a08;
  }
  .pf-avatar-img {
    width: 76px; height: 76px; border-radius: 50%; object-fit: cover;
        border: 2px solid rgba(212,160,23,0.35);
  }
    .pf-avatar-edit {
        position: absolute; left: 50%; bottom: -11px; transform: translateX(-50%);
        display: inline-flex; align-items: center; gap: 4px;
        background: rgba(8,6,4,0.95); color: #d4a017;
        border: 1px solid rgba(212,160,23,0.35); border-radius: 14px;
        padding: 3px 8px; font-family: 'Poppins', sans-serif; font-size: 0.64rem; font-weight: 600;
        cursor: pointer;
    }
    .pf-avatar-edit:disabled { opacity: 0.6; cursor: not-allowed; }
    .pf-hidden-input { display: none; }
    .pf-photo-error { margin: 10px 0 0; color: #fca5a5; font-size: 0.75rem; }
  .pf-name { font-size: 1.1rem; font-weight: 600; color: #fff; }
  .pf-stage { font-size: 0.82rem; color: rgba(212,160,23,0.8); font-style: italic; }
  .pf-email { font-size: 0.78rem; color: rgba(255,255,255,0.35); }
  .pf-badges { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 4px; }
  .badge-super {
    background: linear-gradient(135deg, #d4a017, #b8860b);
    color: #0c0a08; font-size: 0.62rem; font-weight: 700;
    padding: 3px 10px; border-radius: 20px; letter-spacing: 0.06em;
  }
  .badge-admin {
    background: rgba(212,160,23,0.12); color: #d4a017;
    border: 1px solid rgba(212,160,23,0.3); font-size: 0.62rem;
    font-weight: 600; padding: 3px 10px; border-radius: 20px;
  }
  .badge-role {
    background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.55);
    font-size: 0.62rem; font-weight: 500; padding: 3px 10px; border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .badge-character {
    background: rgba(212,160,23,0.15); color: #fff;
    border: 1px solid rgba(212,160,23,0.5); font-size: 0.65rem;
    font-weight: 700; padding: 3px 10px; border-radius: 20px;
  }
  .pf-edit-btn {
    margin-top: 10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;
    padding: 8px 20px; color: #fff;
    font-family: 'Poppins', sans-serif; font-size: 0.82rem; font-weight: 500;
    cursor: pointer; transition: border-color 0.15s, background 0.15s;
  }
  .pf-edit-btn:hover { border-color: rgba(212,160,23,0.4); background: rgba(212,160,23,0.06); }
  .pf-bio { font-size: 0.88rem; color: rgba(255,255,255,0.65); line-height: 1.6; margin: 0; }
  .pf-section { padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .pf-section-last { border-bottom: none; }
  .pf-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .pf-section-title { font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.08em; }
  .pf-add-btn {
    width: 30px; height: 30px; border-radius: 50%;
    background: rgba(212,160,23,0.1); border: 1px solid rgba(212,160,23,0.25);
    color: #d4a017; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .pf-add-btn:hover { background: rgba(212,160,23,0.2); }
  .pf-empty-text { font-size: 0.82rem; color: rgba(255,255,255,0.25); margin: 0; }
  .pf-skeleton {
    height: 56px; border-radius: 10px;
    background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
    background-size: 200% 100%;
    animation: pfshimmer 1.4s infinite;
  }
  @keyframes pfshimmer { to { background-position: -200% 0; } }
  .pf-list { display: flex; flex-direction: column; gap: 8px; }
  .pf-list-item {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 12px;
  }
  .pf-list-icon { color: rgba(255,255,255,0.4); flex-shrink: 0; display: flex; align-items: center; }
  .pf-list-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .pf-list-label { font-size: 0.85rem; font-weight: 500; color: #fff; }
  .pf-list-sub { font-size: 0.78rem; color: rgba(255,255,255,0.45); }
  .pf-list-url {
    font-size: 0.72rem; color: #d4a017; text-decoration: none;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .pf-del-btn {
    width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
    background: rgba(239,68,68,0.08); border: none;
    color: rgba(239,68,68,0.6); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .pf-del-btn:hover { background: rgba(239,68,68,0.15); color: #fca5a5; }
  .pf-logout-btn {
    width: 100%; display: flex; align-items: center; justify-content: center;
    gap: 8px; padding: 13px;
    background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.18);
    border-radius: 12px; color: #fca5a5;
    font-family: 'Poppins', sans-serif; font-size: 0.88rem; font-weight: 500;
    cursor: pointer;
  }
  .sheet-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    z-index: 50; display: flex; align-items: flex-end;
  }
  .sheet-panel {
    width: 100%; background: #161210;
    border-radius: 20px 20px 0 0;
    border-top: 1px solid rgba(255,255,255,0.1);
    max-height: 85svh; overflow-y: auto;
    padding-bottom: env(safe-area-inset-bottom, 16px);
    animation: sheetUp 0.28s cubic-bezier(0.32,0.72,0,1) forwards;
  }
  @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .sheet-handle { width: 36px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.15); margin: 10px auto 0; }
  .sheet-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px 8px; border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .sheet-title { font-size: 0.95rem; font-weight: 600; color: #fff; }
  .sheet-close { background: transparent; border: none; color: rgba(255,255,255,0.4); cursor: pointer; padding: 4px; display: flex; align-items: center; }
  .sheet-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
  .sheet-label { font-size: 0.75rem; font-weight: 500; color: rgba(255,255,255,0.45); margin-bottom: -4px; }
  .sheet-input, .sheet-select, .sheet-textarea {
    width: 100%; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
    padding: 11px 12px; color: #fff; font-family: 'Poppins', sans-serif;
    font-size: 0.88rem; outline: none; transition: border-color 0.15s;
    box-sizing: border-box;
  }
  .sheet-input:focus, .sheet-select:focus, .sheet-textarea:focus { border-color: rgba(212,160,23,0.4); }
  .sheet-input::placeholder, .sheet-textarea::placeholder { color: rgba(255,255,255,0.25); }
  .sheet-select { appearance: none; cursor: pointer; }
  .sheet-select option { background: #161210; }
  .sheet-textarea { resize: none; line-height: 1.5; }
  .sheet-error {
    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
    border-radius: 8px; padding: 8px 12px; color: #fca5a5; font-size: 0.78rem; margin: 0;
  }
  .sheet-submit {
    width: 100%;
    background: linear-gradient(135deg, #d4a017, #b8860b);
    border: none; border-radius: 12px;
    padding: 13px; color: #0c0a08;
    font-family: 'Poppins', sans-serif; font-size: 0.9rem; font-weight: 600;
    cursor: pointer; margin-top: 4px; transition: opacity 0.15s;
  }
  .sheet-submit:disabled { opacity: 0.4; cursor: not-allowed; }
    .crop-area-wrap { display: flex; flex-direction: column; gap: 14px; }
    .crop-area {
        position: relative;
        width: 100%;
        height: 320px;
        background: #0b0907;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        overflow: hidden;
    }
    .crop-controls { display: flex; align-items: center; gap: 10px; }
    .crop-label { font-size: 0.78rem; color: rgba(255,255,255,0.5); min-width: 42px; }
    .crop-zoom { width: 100%; accent-color: #d4a017; }
`}</style>
        </div>
    );
}

