
import { useState, useEffect } from 'react';

type Theme = 'letemcook-light' | 'letemcook-dark';

const normalizeTheme = (value: string | null): Theme | null => {
    if (value === 'letemcook-light' || value === 'bumblebee') return 'letemcook-light';
    if (value === 'letemcook-dark' || value === 'dark') return 'letemcook-dark';
    return null;
};

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        try {
            const saved = normalizeTheme(localStorage.getItem('letemcook_theme'));
            if (saved) return saved;
        } catch { /* ignore */ }
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'letemcook-dark';
        return 'letemcook-light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('letemcook_theme', theme);
        } catch { /* ignore */ }
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'letemcook-dark' ? 'letemcook-light' : 'letemcook-dark');
    const isDark = theme === 'letemcook-dark';

    return { theme, toggleTheme, isDark };
}
