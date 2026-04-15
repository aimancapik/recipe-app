import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/auth/useAuth';
import { Recipe } from '@/types';

export interface Collection {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    cover_image: string | null;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    recipe_count?: number; // Aggregated field
}

export const useCollections = () => {
    const { user } = useAuth();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCollections = useCallback(async (userId?: string) => {
        const targetUserId = userId || user?.id;
        if (!targetUserId) return;

        try {
            setLoading(true);
            // Fetch collections and their recipe count
            const { data, error: fetchError } = await supabase
                .from('collections')
                .select(`
                    *,
                    collection_recipes(count)
                `)
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            const formatted = data.map((c: any) => ({
                ...c,
                recipe_count: c.collection_recipes?.[0]?.count || 0,
            }));

            setCollections(formatted);
            return formatted;
        } catch (err: any) {
            console.error('Error fetching collections:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const createCollection = useCallback(async (name: string, description?: string, isPublic = false) => {
        if (!user) throw new Error('Must be logged in to create a collection');

        try {
            setLoading(true);
            const { data, error: createError } = await supabase
                .from('collections')
                .insert({
                    user_id: user.id,
                    name,
                    description: description || null,
                    is_public: isPublic
                })
                .select()
                .single();

            if (createError) throw createError;

            setCollections(prev => [{ ...data, recipe_count: 0 }, ...prev]);
            return data;
        } catch (err: any) {
            console.error('Error creating collection:', err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user]);

    const updateCollection = useCallback(async (id: string, updates: Partial<Pick<Collection, 'name' | 'description' | 'cover_image' | 'is_public'>>) => {
        try {
            const { data, error: updateError } = await supabase
                .from('collections')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            setCollections(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
            return data;
        } catch (err: any) {
            console.error('Error updating collection:', err.message);
            throw err;
        }
    }, []);

    const deleteCollection = useCallback(async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('collections')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            setCollections(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            console.error('Error deleting collection:', err.message);
            throw err;
        }
    }, []);

    const addRecipeToCollection = useCallback(async (collectionId: string, recipeId: string) => {
        try {
            const { error: addError } = await supabase
                .from('collection_recipes')
                .insert({ collection_id: collectionId, recipe_id: recipeId });

            if (addError && addError.code !== '23505') { // Ignore unique violation if already added
                throw addError;
            }

            // Update local count
            setCollections(prev => prev.map(c =>
                c.id === collectionId ? { ...c, recipe_count: (c.recipe_count || 0) + 1 } : c
            ));
        } catch (err: any) {
            console.error('Error adding recipe to collection:', err.message);
            throw err;
        }
    }, []);

    const removeRecipeFromCollection = useCallback(async (collectionId: string, recipeId: string) => {
        try {
            const { error: removeError } = await supabase
                .from('collection_recipes')
                .delete()
                .match({ collection_id: collectionId, recipe_id: recipeId });

            if (removeError) throw removeError;

            // Update local count
            setCollections(prev => prev.map(c =>
                c.id === collectionId ? { ...c, recipe_count: Math.max(0, (c.recipe_count || 1) - 1) } : c
            ));
        } catch (err: any) {
            console.error('Error removing recipe from collection:', err.message);
            throw err;
        }
    }, []);

    const isRecipeInCollection = useCallback(async (collectionId: string, recipeId: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase
                .from('collection_recipes')
                .select('recipe_id')
                .match({ collection_id: collectionId, recipe_id: recipeId })
                .maybeSingle();

            if (error) throw error;
            return !!data;
        } catch (err) {
            console.error('Error checking recipe in collection:', err);
            return false;
        }
    }, []);

    const fetchCollectionRecipes = useCallback(async (collectionId: string): Promise<Recipe[]> => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('collection_recipes')
                .select(`
                    recipes (*)
                `)
                .eq('collection_id', collectionId)
                .order('added_at', { ascending: false });

            if (error) throw error;

            return data.map((row: any) => row.recipes) as Recipe[];
        } catch (err: any) {
            console.error('Error fetching collection recipes:', err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        collections,
        loading,
        error,
        fetchCollections,
        createCollection,
        updateCollection,
        deleteCollection,
        addRecipeToCollection,
        removeRecipeFromCollection,
        isRecipeInCollection,
        fetchCollectionRecipes
    };
};
