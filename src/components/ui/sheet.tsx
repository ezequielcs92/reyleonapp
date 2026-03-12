'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type SheetProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    zIndex?: number;
};

export default function Sheet({ open, onClose, title, children, zIndex = 100 }: SheetProps) {
    if (!open) return null;

    return (
        <div className="sheet-overlay" onClick={onClose} style={{ zIndex }}>
            <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
                <div className="sheet-handle" />
                <div className="sheet-header">
                    <span className="sheet-title">{title}</span>
                    <button className="sheet-close" onClick={onClose} aria-label="Cerrar">
                        <X size={20} />
                    </button>
                </div>
                <div className="sheet-body">{children}</div>
            </div>
        </div>
    );
}
