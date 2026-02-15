/**
 * useRecipes Hook
 * ===============
 * A custom React hook that manages all recipe data from Supabase.
 *
 * WHY A HOOK?
 * -----------
 * Hooks let you extract reusable stateful logic out of components.
 * Instead of every screen (Home, Explore, Saved) having its own
 * fetch-recipes logic with useState/useEffect, we put it all here.
 *
 * Any component that calls `useRecipes()` gets:
 *  - `recipes` — the current list of recipes
 *  - `loading` — whether we're still fetching
 *  - `fetchRecipes()` — to manually refresh
 *  - `addRecipe()` — to create a new recipe
 *
 * The hook handles the Supabase calls, state management, and
 * data transformation (DB format → app format) in one place.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe, Direction } from '@/types';

export function useRecipes() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all recipes with their ingredients and directions
    const fetchRecipes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Supabase lets us fetch related tables in one query
            const { data, error: fetchError } = await supabase
                .from('recipes')
                .select(`
                    *,
                    ingredients ( name, sort_order ),
                    directions ( step, title, description, image, media_type, timer, sort_order )
                `)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            // Transform from Supabase DB format → our app's Recipe type
            const transformed: Recipe[] = (data || []).map(row => ({
                id: row.id,
                title: row.title,
                image: row.image,
                prepTime: row.prep_time,
                rating: Number(row.rating),
                reviews: row.reviews,
                serves: row.serves,
                kcal: row.kcal,
                level: row.level as 'Easy' | 'Medium' | 'Hard',
                category: row.category,
                userId: row.user_id,
                isFavorite: false, // favorites are handled by useFavorites hook
                ingredients: (row.ingredients || [])
                    .sort((a: any, b: any) => a.sort_order - b.sort_order)
                    .map((i: any) => i.name),
                directions: (row.directions || [])
                    .sort((a: any, b: any) => a.sort_order - b.sort_order)
                    .map((d: any): Direction => ({
                        step: d.step,
                        title: d.title,
                        description: d.description,
                        image: d.image || null,
                        mediaType: d.media_type || 'image',
                        timer: d.timer || undefined,
                    })),
            }));

            setRecipes(transformed);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch recipes');
            console.error('useRecipes fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Add a new recipe (used by PublishRecipeScreen)
    const addRecipe = async (recipe: Omit<Recipe, 'id'>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // 1. Insert the recipe row
            const { data: newRecipe, error: recipeError } = await supabase
                .from('recipes')
                .insert({
                    title: recipe.title,
                    image: recipe.image,
                    prep_time: recipe.prepTime,
                    rating: recipe.rating,
                    reviews: recipe.reviews,
                    serves: recipe.serves,
                    kcal: recipe.kcal,
                    level: recipe.level,
                    category: recipe.category,
                    user_id: user?.id || null,
                })
                .select()
                .single();

            if (recipeError) throw recipeError;

            // 2. Insert ingredients
            if (recipe.ingredients.length > 0) {
                const { error: ingError } = await supabase
                    .from('ingredients')
                    .insert(
                        recipe.ingredients.map((name, idx) => ({
                            recipe_id: newRecipe.id,
                            name,
                            sort_order: idx,
                        }))
                    );
                if (ingError) throw ingError;
            }

            // 3. Insert directions
            if (recipe.directions.length > 0) {
                const { error: dirError } = await supabase
                    .from('directions')
                    .insert(
                        recipe.directions.map((dir, idx) => ({
                            recipe_id: newRecipe.id,
                            step: dir.step,
                            title: dir.title,
                            description: dir.description,
                            image: dir.image || null,
                            media_type: dir.mediaType || 'image',
                            timer: dir.timer || null,
                            sort_order: idx,
                        }))
                    );
                if (dirError) throw dirError;
            }

            // Refresh the list
            await fetchRecipes();
            return newRecipe.id;
        } catch (err: any) {
            console.error('useRecipes add error:', err);
            throw err;
        }
    };

    // Delete a recipe (ingredients & directions cascade automatically)
    const deleteRecipe = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('recipes')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // Refresh the list
            await fetchRecipes();
        } catch (err: any) {
            console.error('useRecipes delete error:', err);
            throw err;
        }
    };

    // Update an existing recipe (metadata + replace ingredients & directions)
    const updateRecipe = async (id: string, recipe: Omit<Recipe, 'id'>) => {
        try {
            // 1. Update the recipe row
            const { error: recipeError } = await supabase
                .from('recipes')
                .update({
                    title: recipe.title,
                    image: recipe.image,
                    prep_time: recipe.prepTime,
                    rating: recipe.rating,
                    reviews: recipe.reviews,
                    serves: recipe.serves,
                    kcal: recipe.kcal,
                    level: recipe.level,
                    category: recipe.category,
                })
                .eq('id', id);

            if (recipeError) throw recipeError;

            // 2. Replace ingredients: delete old, insert new
            await supabase.from('ingredients').delete().eq('recipe_id', id);
            if (recipe.ingredients.length > 0) {
                const { error: ingError } = await supabase
                    .from('ingredients')
                    .insert(
                        recipe.ingredients.map((name, idx) => ({
                            recipe_id: id,
                            name,
                            sort_order: idx,
                        }))
                    );
                if (ingError) throw ingError;
            }

            // 3. Replace directions: delete old, insert new
            await supabase.from('directions').delete().eq('recipe_id', id);
            if (recipe.directions.length > 0) {
                const { error: dirError } = await supabase
                    .from('directions')
                    .insert(
                        recipe.directions.map((dir, idx) => ({
                            recipe_id: id,
                            step: dir.step,
                            title: dir.title,
                            description: dir.description,
                            image: dir.image || null,
                            media_type: dir.mediaType || 'image',
                            timer: dir.timer || null,
                            sort_order: idx,
                        }))
                    );
                if (dirError) throw dirError;
            }

            // Refresh the list
            await fetchRecipes();
        } catch (err: any) {
            console.error('useRecipes update error:', err);
            throw err;
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    return { recipes, loading, error, fetchRecipes, addRecipe, deleteRecipe, updateRecipe, setRecipes };
}
