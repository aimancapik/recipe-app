
import { useState, useEffect } from 'react';

type Theme = 'bumblebee' | 'dark';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        try {
            const saved = localStorage.getItem('letemcook_theme') as Theme;
            if (saved === 'dark' || saved === 'bumblebee') return saved;
        } catch { /* ignore */ }
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        return 'bumblebee';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('letemcook_theme', theme);
        } catch { /* ignore */ }
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'bumblebee' : 'dark');
    const isDark = theme === 'dark';

    return { theme, toggleTheme, isDark };
}
