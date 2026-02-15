/**
 * useFavorites Hook
 * =================
 * Manages the user's favorite recipes via Supabase.
 *
 * WHY A SEPARATE HOOK?
 * --------------------
 * Favorites are user-specific (stored in a separate table linking user ↔ recipe).
 * Separating this from useRecipes keeps concerns clean:
 *  - useRecipes = "what recipes exist" (public data)
 *  - useFavorites = "which ones does THIS user like" (private data)
 *
 * This hook provides:
 *  - `favoriteIds` — a Set of recipe IDs the user has favorited
 *  - `isFavorite(id)` — check if a recipe is favorited
 *  - `toggleFavorite(id)` — add or remove a favorite
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useFavorites() {
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    // Fetch the current user's favorite recipe IDs
    const fetchFavorites = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setFavoriteIds(new Set());
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('favorites')
                .select('recipe_id')
                .eq('user_id', user.id);

            if (error) throw error;

            setFavoriteIds(new Set((data || []).map(f => f.recipe_id)));
        } catch (err) {
            console.error('useFavorites fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const isFavorite = useCallback((recipeId: string) => {
        return favoriteIds.has(recipeId);
    }, [favoriteIds]);

    // Toggle: if already favorited → remove, otherwise → add
    const toggleFavorite = async (recipeId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // not logged in

        // Optimistic update (update UI immediately, sync with DB in background)
        const wasFavorited = favoriteIds.has(recipeId);
        setFavoriteIds(prev => {
            const next = new Set(prev);
            if (wasFavorited) {
                next.delete(recipeId);
            } else {
                next.add(recipeId);
            }
            return next;
        });

        try {
            if (wasFavorited) {
                await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('recipe_id', recipeId);
            } else {
                await supabase
                    .from('favorites')
                    .insert({ user_id: user.id, recipe_id: recipeId });
            }
        } catch (err) {
            // Revert on failure
            console.error('useFavorites toggle error:', err);
            setFavoriteIds(prev => {
                const next = new Set(prev);
                if (wasFavorited) {
                    next.add(recipeId);
                } else {
                    next.delete(recipeId);
                }
                return next;
            });
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    return { favoriteIds, isFavorite, toggleFavorite, loading };
}
