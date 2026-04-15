/**
 * useGrocery Hook
 * ================
 * Manages the user's shopping/grocery list via Supabase.
 *
 * WHAT HOOKS GIVE US HERE:
 * ------------------------
 * Without hooks, every component needing grocery data would need to:
 *   1. Create its own state (useState)
 *   2. Fetch data on mount (useEffect)
 *   3. Handle loading/errors
 *   4. Define toggle/clear/add functions
 *
 * With this hook, components just call:
 *   const { items, toggleItem, addFromRecipe, clearChecked } = useGrocery();
 *
 * One line to get everything they need. Clean and DRY.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { GroceryItem, Recipe } from '@/types';

export function useGrocery() {
    const [items, setItems] = useState<GroceryItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchItems = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setItems([]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('grocery_items')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setItems((data || []).map(row => ({
                id: row.id,
                name: row.name,
                checked: row.checked,
                recipeTitle: row.recipe_title,
                recipeImage: row.recipe_image,
            })));
        } catch (err) {
            console.error('useGrocery fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Toggle an item's checked state
    const toggleItem = async (id: string) => {
        // Optimistic update
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));

        try {
            const item = items.find(i => i.id === id);
            if (!item) return;

            await supabase
                .from('grocery_items')
                .update({ checked: !item.checked })
                .eq('id', id);
        } catch (err) {
            console.error('useGrocery toggle error:', err);
            fetchItems(); // revert on error
        }
    };

    // Add all ingredients from a recipe to the grocery list
    const addFromRecipe = async (recipe: Recipe) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Always fetch fresh data from DB to avoid stale-state duplicate check
            // This prevents duplicates when called multiple times in quick succession
            const { data: existing } = await supabase
                .from('grocery_items')
                .select('name')
                .eq('user_id', user.id);

            const existingNames = new Set(
                (existing || []).map((i: { name: string }) => i.name.toLowerCase())
            );
            const newIngredients = recipe.ingredients.filter(
                ing => !existingNames.has(ing.toLowerCase())
            );

            if (newIngredients.length === 0) return;

            const { error } = await supabase
                .from('grocery_items')
                .insert(
                    newIngredients.map(name => ({
                        user_id: user.id,
                        name,
                        checked: false,
                        recipe_title: recipe.title,
                        recipe_image: recipe.image,
                    }))
                );

            if (error) throw error;
            await fetchItems();
        } catch (err) {
            console.error('useGrocery addFromRecipe error:', err);
        }
    };

    // Clear all checked items
    const clearChecked = async () => {
        const checkedIds = items.filter(i => i.checked).map(i => i.id);
        if (checkedIds.length === 0) return;

        // Optimistic update
        setItems(prev => prev.filter(i => !i.checked));

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('grocery_items')
                .delete()
                .eq('user_id', user.id)
                .in('id', checkedIds);
        } catch (err) {
            console.error('useGrocery clearChecked error:', err);
            fetchItems(); // revert on error
        }
    };

    // Remove a single item
    const removeItem = async (id: string) => {
        // Optimistic update
        setItems(prev => prev.filter(item => item.id !== id));

        try {
            await supabase
                .from('grocery_items')
                .delete()
                .eq('id', id);
        } catch (err) {
            console.error('useGrocery removeItem error:', err);
            fetchItems(); // revert on error
        }
    };

    // Update item name/quantity
    const updateItem = async (id: string, name: string) => {
        // Optimistic update
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, name } : item
        ));

        try {
            await supabase
                .from('grocery_items')
                .update({ name })
                .eq('id', id);
        } catch (err) {
            console.error('useGrocery updateItem error:', err);
            fetchItems(); // revert on error
        }
    };

    // Add a single manual item
    const addItem = async (name: string) => {
        if (!name.trim()) return;
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('grocery_items')
                .insert([{
                    user_id: user.id,
                    name: name.trim(),
                    checked: false,
                    recipe_title: 'Manual Entry',
                    recipe_image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200', // default grocery icon/image
                }])
                .select()
                .single();

            if (error) throw error;
            
            // Re-fetch to keep state in sync
            await fetchItems();
        } catch (err) {
            console.error('useGrocery addItem error:', err);
        }
    };

    const clearAll = async () => {
        // Optimistic update
        setItems([]);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('grocery_items')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (err) {
            console.error('useGrocery clearAll error:', err);
            fetchItems(); // revert on error
        }
    };

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    return { items, loading, toggleItem, addItem, addFromRecipe, clearChecked, clearAll, removeItem, updateItem, fetchItems };
}
