'use client';

import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

type Props = {
    children: ReactNode;
};

type State = {
    hasError: boolean;
};

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error boundary atrapó un error:', error, errorInfo);
    }

    reset = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, background: '#0c0a08', color: '#fff' }}>
                    <div style={{ width: '100%', maxWidth: 460, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, background: 'rgba(255,255,255,0.03)' }}>
                        <h2 style={{ margin: '0 0 8px', fontSize: '1.2rem' }}>Se produjo un error inesperado</h2>
                        <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.7)' }}>
                            Recargá la sección para continuar usando la app.
                        </p>
                        <button
                            onClick={this.reset}
                            style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: '#d4a017', color: '#0c0a08', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
