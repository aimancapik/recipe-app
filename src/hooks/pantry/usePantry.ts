import { useCallback, useEffect, useMemo, useState } from 'react';
import { PANTRY_STAPLES } from '@/constants/ingredients';

const STORAGE_KEY = 'whatscookin_pantry';

export function usePantry() {
    const [ingredients, setIngredients] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : PANTRY_STAPLES;
        } catch {
            return PANTRY_STAPLES;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients));
    }, [ingredients]);

    const addIngredient = useCallback((name: string) => {
        const normalized = name.trim();
        if (!normalized) return;
        setIngredients(prev => prev.some(item => item.toLowerCase() === normalized.toLowerCase()) ? prev : [...prev, normalized]);
    }, []);

    const removeIngredient = useCallback((name: string) => {
        setIngredients(prev => prev.filter(item => item.toLowerCase() !== name.toLowerCase()));
    }, []);

    const clearPantry = useCallback(() => setIngredients(PANTRY_STAPLES), []);

    return useMemo(() => ({
        ingredients,
        addIngredient,
        removeIngredient,
        clearPantry,
    }), [ingredients, addIngredient, removeIngredient, clearPantry]);
}
