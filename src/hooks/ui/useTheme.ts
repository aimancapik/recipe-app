import { useEffect } from 'react';

const THEME = 'whatscookin-light';

export function useTheme() {
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', THEME);
        try {
            localStorage.setItem('whatscookin_theme', THEME);
        } catch { /* ignore */ }
    }, []);

    return { theme: THEME };
}
