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

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe, Direction } from '@/types';

const PAGE_SIZE = 20;

function transformRow(row: any): Recipe {
    // ingredients & directions may be absent from lightweight listings
    // (get_paginated_recipes omits them for performance).
    // They are only present when fetched via get_recipes_by_ids / get_user_recipes.
    // Data arrives pre-sorted from the database (ORDER BY sort_order in RPC)
    const ingredients = row.ingredients
        ? (row.ingredients as any[])
            .map((i: any) => i.name)
        : [];

    const directions = row.directions
        ? (row.directions as any[])
            .map((d: any): Direction => ({
                step: d.step,
                title: d.title,
                description: d.description,
                image: d.image || null,
                mediaType: d.media_type || 'image',
                timer: d.timer || undefined,
            }))
        : [];

    return {
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
        isFavorite: false,
        status: row.status || 'published',
        images: row.images || [],
        ingredients,
        directions,
        matchedIngredientsCount: row.matched_ingredients_count,
        totalIngredientsCount: row.total_ingredients_count,
        missingIngredients: row.missing_ingredients || [],
        source: row.source,
        sourceUrl: row.source_url,
        sourceName: row.source_name,
    };
}

export function useRecipes() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Refs to track mutable values without causing dependency churn
    const loadedCountRef = useRef(0);
    const isFetchingRef = useRef(false);
    const hasMoreRef = useRef(true);
    const fetchGenRef = useRef(0); // incremented on each new fetch; stale results are discarded
    const filtersRef = useRef({ search: '', category: '', feed: 'forYou' as 'forYou' | 'following', followerId: '' as string, ingredients: [] as string[] });

    const fetchRecipesByIds = useCallback(async (ids: string[]) => {
        if (ids.length === 0) return [];
        try {
            const { data, error: fetchError } = await supabase
                .rpc('get_recipes_by_ids', { p_ids: ids });

            if (fetchError) throw fetchError;
            return (data || []).map(transformRow);
        } catch (err) {
            console.error('useRecipes fetchByIds error:', err);
            return [];
        }
    }, []);

    const fetchRecipesByUserId = useCallback(async (userId: string) => {
        try {
            const { data, error: fetchError } = await supabase
                .rpc('get_user_recipes', { p_user_id: userId });

            if (fetchError) throw fetchError;
            return (data || []).map(transformRow);
        } catch (err) {
            console.error('useRecipes fetchByUserId error:', err);
            return [];
        }
    }, []);

    // Fetch recipes with pagination — stable callback (no state deps)
    const fetchRecipes = useCallback(async (isLoadMore = false, search = '', category = '', feed: 'forYou' | 'following' = 'forYou', followerId = '', ingredients: string[] = []) => {
        if (isLoadMore && isFetchingRef.current) return;
        // Increment generation — any in-flight fetch with an older generation will discard its result
        const gen = ++fetchGenRef.current;
        isFetchingRef.current = true;

        try {
            if (isLoadMore) {
                setLoadingMore(true);
                // When loading more, we use existing filters from ref
                search = filtersRef.current.search;
                category = filtersRef.current.category;
                feed = filtersRef.current.feed;
                followerId = filtersRef.current.followerId;
                ingredients = filtersRef.current.ingredients;
            } else {
                setLoading(true);
                // When starting a new fetch, we update the ref filters
                filtersRef.current = { search, category, feed, followerId, ingredients };
                loadedCountRef.current = 0;
            }

            setError(null);
            const offset = isLoadMore ? loadedCountRef.current : 0;

            let fetchPromise;
            if (feed === 'following') {
                if (!followerId) {
                    // Cannot fetch following feed without a user ID
                    setRecipes([]);
                    setHasMore(false);
                    setLoading(false);
                    setLoadingMore(false);
                    isFetchingRef.current = false;
                    return;
                }
                fetchPromise = supabase.rpc('get_following_recipes', {
                    p_follower_id: followerId,
                    p_offset: offset,
                    p_page_size: PAGE_SIZE,
                    p_search: search,
                    p_category: category,
                    p_ingredients: ingredients.length > 0 ? ingredients : '{}'
                }, { count: 'exact' });
            } else {
                fetchPromise = supabase.rpc('get_paginated_recipes', {
                    p_offset: offset,
                    p_page_size: PAGE_SIZE,
                    p_search: search,
                    p_category: category,
                    p_ingredients: ingredients.length > 0 ? ingredients : '{}'
                }, { count: 'exact' });
            }

            const { data, count, error: fetchError } = await fetchPromise;

            // A newer fetch has started — discard this stale result
            if (gen !== fetchGenRef.current) {
                isFetchingRef.current = false;
                return;
            }

            if (fetchError) throw fetchError;

            const transformed = (data || []).map(transformRow);

            if (isLoadMore) {
                setRecipes(prev => {
                    const updated = [...prev, ...transformed];
                    loadedCountRef.current = updated.length;
                    return updated;
                });
            } else {
                loadedCountRef.current = transformed.length;
                setRecipes(transformed);
            }

            // Determine if more pages exist
            const totalLoaded = isLoadMore
                ? loadedCountRef.current
                : transformed.length;

            if (count !== null) {
                const moreAvailable = totalLoaded < count;
                hasMoreRef.current = moreAvailable;
                setHasMore(moreAvailable);
            } else {
                const moreAvailable = transformed.length === PAGE_SIZE;
                hasMoreRef.current = moreAvailable;
                setHasMore(moreAvailable);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch recipes');
            console.error('useRecipes fetch error:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            isFetchingRef.current = false;
        }
    }, []);

    // Stable loadMore — uses refs so it never causes observer churn
    const loadMore = useCallback(() => {
        if (!isFetchingRef.current && hasMoreRef.current) {
            fetchRecipes(true);
        }
    }, [fetchRecipes]);

    const fetchByIngredients = useCallback(async (ingredients: string[]) => {
        await fetchRecipes(false, '', '', 'forYou', '', ingredients);
    }, [fetchRecipes]);

    // Helper to check if any data contains oversized strings (likely leaked base64 images)
    const checkPayloadSize = (recipe: Omit<Recipe, 'id'>) => {
        const MAX_STRING_SIZE = 100 * 1024; // 100KB
        const errors: string[] = [];

        const checkValue = (val: any, path: string) => {
            if (typeof val === 'string' && val.length > MAX_STRING_SIZE) {
                errors.push(`${path} is too large (${Math.round(val.length / 1024)}KB). Large images must be uploaded to storage, not stored as text.`);
            } else if (Array.isArray(val)) {
                val.forEach((item, i) => checkValue(item, `${path}[${i}]`));
            } else if (val && typeof val === 'object') {
                Object.entries(val).forEach(([k, v]) => checkValue(v, `${path}.${k}`));
            }
        };

        checkValue(recipe, 'recipe');
        if (errors.length > 0) {
            throw new Error(`Data size guard: ${errors[0]}`);
        }
    };

    // Add a new recipe (used by PublishRecipeScreen)
    const addRecipe = async (recipe: Omit<Recipe, 'id'>) => {
        try {
            checkPayloadSize(recipe);
            const { data: { user } } = await supabase.auth.getUser();

            // 1. Insert the recipe row
            const { data: newRecipe, error: recipeError } = await supabase
                .from('recipes')
                .insert({
                    title: recipe.title,
                    description: recipe.description,
                    image: recipe.image,
                    prep_time: recipe.prepTime,
                    rating: recipe.rating,
                    reviews: recipe.reviews,
                    serves: recipe.serves,
                    kcal: recipe.kcal,
                    level: recipe.level,
                    category: recipe.category,
                    user_id: user?.id || null,
                    status: recipe.status || 'published',
                    images: recipe.images || [],
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
        } catch (err: any) {
            console.error('useRecipes delete error:', err);
            throw err;
        }
    };

    // Update an existing recipe (metadata + replace ingredients & directions)
    const updateRecipe = async (id: string, recipe: Omit<Recipe, 'id'>) => {
        try {
            checkPayloadSize(recipe);
            // 1. Update the recipe row
            const { error: recipeError } = await supabase
                .from('recipes')
                .update({
                    title: recipe.title,
                    description: recipe.description,
                    image: recipe.image,
                    prep_time: recipe.prepTime,
                    rating: recipe.rating,
                    reviews: recipe.reviews,
                    serves: recipe.serves,
                    kcal: recipe.kcal,
                    level: recipe.level,
                    category: recipe.category,
                    status: recipe.status || 'published',
                    images: recipe.images || [],
                })
                .eq('id', id);

            if (recipeError) throw recipeError;

            // 2. Replace ingredients: delete old, insert new
            // ONLY if ingredients were modified/provided in the update
            if (recipe.ingredients) {
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
            }

            // 3. Replace directions: delete old, insert new
            if (recipe.directions) {
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
            }
        } catch (err: any) {
            console.error('useRecipes update error:', err);
            throw err;
        }
    };

    // Targeted status update — only patches the status column, no full reload
    const updateStatus = async (id: string, status: 'published' | 'draft') => {
        const { error: updateError } = await supabase
            .from('recipes')
            .update({ status })
            .eq('id', id);

        if (updateError) {
            console.error('useRecipes updateStatus error:', updateError);
            throw updateError;
        }

        // Update local state instantly so the UI reflects the change
        setRecipes(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    };

    // Fetch on mount only
    useEffect(() => {
        fetchRecipes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { recipes, loading, loadingMore, hasMore, error, fetchRecipes, fetchByIngredients, fetchRecipesByIds, fetchRecipesByUserId, loadMore, addRecipe, deleteRecipe, updateRecipe, updateStatus, setRecipes };
}
