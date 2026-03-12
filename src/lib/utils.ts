import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type TimeAgoOptions = {
    compact?: boolean;
    withAgo?: boolean;
};

export function timeAgo(dateString: string, options: TimeAgoOptions = {}) {
    const diff = Date.now() - new Date(dateString).getTime();
    const { compact = false, withAgo = !compact } = options;

    if (diff < 60000) {
        return compact ? 'ahora' : 'Hace unos segundos';
    }

    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        if (compact) return `${mins}m`;
        return withAgo ? `Hace ${mins} min` : `${mins} min`;
    }

    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        if (compact) return `${hours}h`;
        return withAgo ? `Hace ${hours} horas` : `${hours} h`;
    }

    const days = Math.floor(diff / 86400000);
    if (compact) return `${days}d`;
    return withAgo ? `Hace ${days} dias` : `${days} d`;
}

export function initials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
