'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginUser, signInWithGoogle } from '@/actions/auth';

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');
        const formData = new FormData(e.currentTarget);
        const result = await loginUser(formData);
        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push('/feed');
        }
    }

    async function handleGoogle() {
        setGoogleLoading(true);
        setError('');
        const result = await signInWithGoogle();
        if (result.error) {
            setError(result.error);
            setGoogleLoading(false);
        } else if (result.url) {
            window.location.href = result.url;
        }
    }

    return (
        <div className="auth-root">
            <div className="auth-bg">
                <div className="auth-spotlight" />
                <div className="auth-grain" />
            </div>

            <div className="auth-card">
                {/* Logo / marca */}
                <div className="auth-brand">
                    <div className="auth-crown">♛</div>
                    <h1 className="auth-title">Rey León</h1>
                    <p className="auth-subtitle">Comunidad del elenco</p>
                </div>

                {/* Google */}
                <button
                    onClick={handleGoogle}
                    disabled={googleLoading}
                    className="auth-google-btn"
                    type="button"
                >
                    {googleLoading ? (
                        <span className="auth-spinner" />
                    ) : (
                        <GoogleIcon />
                    )}
                    <span>Continuar con Google</span>
                </button>

                <div className="auth-divider">
                    <span className="auth-divider-line" />
                    <span className="auth-divider-text">o</span>
                    <span className="auth-divider-line" />
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label className="auth-label">Correo electrónico</label>
                        <input
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="tu@correo.com"
                            className="auth-input"
                        />
                    </div>
                    <div className="auth-field">
                        <label className="auth-label">Contraseña</label>
                        <input
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className="auth-input"
                        />
                    </div>

                    {error && <p className="auth-error">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="auth-submit-btn"
                    >
                        {loading ? <span className="auth-spinner" /> : 'Iniciar sesión'}
                    </button>
                </form>

                <p className="auth-footer-text">
                    ¿No tienes cuenta?{' '}
                    <Link href="/register" className="auth-link">
                        Regístrate
                    </Link>
                </p>
            </div>

            <style>{authStyles}</style>
        </div>
    );
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
    );
}

const authStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

  .auth-root {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0c0a08;
    font-family: 'DM Sans', sans-serif;
    padding: 1.5rem;
    position: relative;
    overflow: hidden;
  }

  .auth-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .auth-spotlight {
    position: absolute;
    top: -20%;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 600px;
    background: radial-gradient(ellipse at center, rgba(212,160,23,0.12) 0%, transparent 65%);
    border-radius: 50%;
  }

  .auth-grain {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.4;
  }

  .auth-card {
    position: relative;
    width: 100%;
    max-width: 400px;
    background: rgba(18, 14, 10, 0.95);
    border: 1px solid rgba(212, 160, 23, 0.2);
    border-radius: 20px;
    padding: 2.5rem 2rem;
    box-shadow:
      0 0 0 1px rgba(212,160,23,0.05),
      0 25px 60px rgba(0,0,0,0.6),
      0 0 80px rgba(212,160,23,0.04);
    animation: cardFadeIn 0.5s ease forwards;
  }

  @keyframes cardFadeIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .auth-brand {
    text-align: center;
    margin-bottom: 2rem;
  }

  .auth-crown {
    font-size: 2.2rem;
    line-height: 1;
    color: #d4a017;
    text-shadow: 0 0 20px rgba(212,160,23,0.5);
    margin-bottom: 0.5rem;
  }

  .auth-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.9rem;
    font-weight: 700;
    color: #f5e6c8;
    letter-spacing: 0.02em;
    line-height: 1;
    margin: 0 0 0.35rem;
  }

  .auth-subtitle {
    font-size: 0.8rem;
    font-weight: 300;
    color: rgba(212,160,23,0.7);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin: 0;
  }

  .auth-google-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    padding: 0.7rem 1rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #e8dcc8;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }

  .auth-google-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.18);
  }

  .auth-google-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .auth-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1.25rem 0;
  }

  .auth-divider-line {
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.08);
  }

  .auth-divider-text {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.3);
    font-weight: 400;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .auth-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .auth-label {
    font-size: 0.78rem;
    font-weight: 500;
    color: rgba(245,230,200,0.6);
    letter-spacing: 0.04em;
  }

  .auth-input {
    width: 100%;
    padding: 0.65rem 0.85rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 9px;
    color: #f5e6c8;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    transition: border-color 0.2s, background 0.2s;
    outline: none;
    box-sizing: border-box;
  }

  .auth-input::placeholder { color: rgba(245,230,200,0.2); }

  .auth-input:focus {
    border-color: rgba(212,160,23,0.5);
    background: rgba(212,160,23,0.04);
  }

  .auth-error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 8px;
    color: #fca5a5;
    font-size: 0.8rem;
    padding: 0.6rem 0.85rem;
    margin: 0;
  }

  .auth-submit-btn {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #d4a017 0%, #b8860b 100%);
    border: none;
    border-radius: 10px;
    color: #0c0a08;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    letter-spacing: 0.02em;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    margin-top: 0.25rem;
  }

  .auth-submit-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .auth-submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .auth-footer-text {
    text-align: center;
    font-size: 0.82rem;
    color: rgba(245,230,200,0.4);
    margin: 1.5rem 0 0;
  }

  .auth-link {
    color: #d4a017;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
  }

  .auth-link:hover { color: #f0c040; }

  .auth-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0,0,0,0.2);
    border-top-color: #0c0a08;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
