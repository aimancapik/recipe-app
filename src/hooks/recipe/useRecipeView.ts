import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useRecipeView = (recipeId: string) => {
    useEffect(() => {
        if (!recipeId || recipeId.startsWith('temp-')) return;

        const key = `viewed_${recipeId}`;
        const last = localStorage.getItem(key);
        const now = Date.now();

        // Throttle: one view per recipe per hour per browser session
        if (last && now - parseInt(last) < 3600000) return;

        localStorage.setItem(key, String(now));

        supabase.auth.getUser().then(({ data }) => {
            supabase.from('recipe_views').insert({
                recipe_id: recipeId,
                viewer_id: data?.user?.id ?? null,
            }).then(() => {/* fire and forget */});
        });
    }, [recipeId]);
};
