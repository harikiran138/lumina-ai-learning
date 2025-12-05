import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

export function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(dateString: string): string {
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

export function getChartColors(isDark: boolean) {
    return {
        primary: '#fbbf24',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        text: isDark ? '#d1d5db' : '#4b5563',
        grid: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        background: 'rgba(251, 191, 36, 0.2)'
    };
}

export const storage = {
    set: (key: string, data: any) => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(data));
            }
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    },
    get: (key: string) => {
        try {
            if (typeof window !== 'undefined') {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            }
            return null;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return null;
        }
    },
    remove: (key: string) => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.removeItem(key);
            }
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
        }
    }
};
