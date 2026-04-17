import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe } from '@/types';

export const useTrending = () => {
    const [trending, setTrending] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

        // Get recipe IDs with most views in the last 7 days
        supabase
            .from('recipe_views')
            .select('recipe_id')
            .gte('created_at', weekAgo)
            .then(async ({ data: madeItData, error: madeItError }) => {
                if (madeItError || !madeItData || madeItData.length === 0) {
                    // Fallback: top rated recipes
                    const { data } = await supabase
                        .from('recipes')
                        .select('*')
                        .eq('status', 'published')
                        .order('rating', { ascending: false })
                        .limit(10);
                    setTrending((data as Recipe[]) || []);
                    setLoading(false);
                    return;
                }

                // Count made_it per recipe
                const counts: Record<string, number> = {};
                madeItData.forEach(m => { counts[m.recipe_id] = (counts[m.recipe_id] || 0) + 1; });

                const topIds = Object.entries(counts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([id]) => id);

                const { data: recipes } = await supabase
                    .from('recipes')
                    .select('*')
                    .in('id', topIds)
                    .eq('status', 'published');

                if (recipes) {
                    // Sort by made_it count
                    const sorted = recipes.sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
                    setTrending(sorted as Recipe[]);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return { trending, loading };
};
