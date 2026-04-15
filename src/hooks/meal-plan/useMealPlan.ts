/**
 * useMealPlan Hook
 * ================
 * Manages the user's weekly meal plan via Supabase.
 * Table: meal_plans
 *
 * SQL to create table:
 * --------------------
 * create table meal_plans (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users(id) on delete cascade,
 *   day text not null,
 *   meal_type text not null,
 *   recipe_id text not null,
 *   recipe_title text not null,
 *   recipe_image text not null,
 *   recipe_kcal text,
 *   recipe_prep_time text,
 *   created_at timestamptz default now()
 * );
 * alter table meal_plans enable row level security;
 * create policy "Users manage own plans" on meal_plans
 *   for all using (auth.uid() = user_id);
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MealSlot, MealDay, MealType, Recipe } from '@/types';

export function useMealPlan() {
    const [slots, setSlots] = useState<MealSlot[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSlots = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setSlots([]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('meal_plans')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setSlots((data || []).map(row => ({
                id: row.id,
                day: row.day as MealDay,
                mealType: row.meal_type as MealType,
                recipeId: row.recipe_id,
                recipeTitle: row.recipe_title,
                recipeImage: row.recipe_image,
                recipeKcal: row.recipe_kcal || '—',
                recipePrepTime: row.recipe_prep_time || '—',
            })));
        } catch (err) {
            console.error('useMealPlan fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    /** Assign a recipe to a specific day + meal type slot (truly optimistic) */
    const addSlot = useCallback(async (day: MealDay, mealType: MealType, recipe: Recipe) => {
        // ── 1. Build a temp slot for immediate UI update ──────────────────
        const tempId = `temp-${Date.now()}`;
        const tempSlot: MealSlot = {
            id: tempId,
            day,
            mealType,
            recipeId: recipe.id,
            recipeTitle: recipe.title,
            recipeImage: recipe.image,
            recipeKcal: recipe.kcal || '—',
            recipePrepTime: recipe.prepTime || '—',
        };

        // ── 2. Update UI instantly ─────────────────────────────────────────
        setSlots(prev => [
            ...prev.filter(s => !(s.day === day && s.mealType === mealType)),
            tempSlot,
        ]);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Remove any existing DB slot for this day+mealType
            const existing = slots.find(s => s.day === day && s.mealType === mealType);
            if (existing && !existing.id.startsWith('temp-')) {
                await supabase.from('meal_plans').delete().eq('id', existing.id);
            }

            const { data, error } = await supabase
                .from('meal_plans')
                .insert({
                    user_id: user.id,
                    day,
                    meal_type: mealType,
                    recipe_id: recipe.id,
                    recipe_title: recipe.title,
                    recipe_image: recipe.image,
                    recipe_kcal: recipe.kcal,
                    recipe_prep_time: recipe.prepTime,
                })
                .select()
                .single();

            if (error) throw error;

            // ── 3. Swap temp ID with real DB ID ────────────────────────────
            const realSlot: MealSlot = {
                id: data.id,
                day: data.day,
                mealType: data.meal_type,
                recipeId: data.recipe_id,
                recipeTitle: data.recipe_title,
                recipeImage: data.recipe_image,
                recipeKcal: data.recipe_kcal || '—',
                recipePrepTime: data.recipe_prep_time || '—',
            };

            setSlots(prev => prev.map(s => s.id === tempId ? realSlot : s));

        } catch (err) {
            console.error('[useMealPlan] addSlot failed:', err);
            // Rollback — remove the temp slot
            setSlots(prev => prev.filter(s => s.id !== tempId));
            // Refetch to get actual DB state
            fetchSlots();
        }
    }, [slots, fetchSlots]);

    /** Remove a specific meal slot */
    const removeSlot = useCallback(async (id: string) => {
        // Optimistic update
        setSlots(prev => prev.filter(s => s.id !== id));

        try {
            await supabase.from('meal_plans').delete().eq('id', id);
        } catch (err) {
            console.error('useMealPlan removeSlot error:', err);
            fetchSlots();
        }
    }, [fetchSlots]);

    /** Clear all slots for a given day */
    const clearDay = useCallback(async (day: MealDay) => {
        const daySlotIds = slots.filter(s => s.day === day).map(s => s.id);
        if (daySlotIds.length === 0) return;

        // Optimistic update
        setSlots(prev => prev.filter(s => s.day !== day));

        try {
            await supabase.from('meal_plans').delete().in('id', daySlotIds);
        } catch (err) {
            console.error('useMealPlan clearDay error:', err);
            fetchSlots();
        }
    }, [slots, fetchSlots]);

    /** Get all slots for a specific day */
    const getMealsByDay = useCallback((day: MealDay): MealSlot[] => {
        return slots.filter(s => s.day === day);
    }, [slots]);

    /** Calculate total kcal for a day (parses strings like "480 kcal") */
    const totalKcalForDay = useCallback((day: MealDay): number => {
        return slots
            .filter(s => s.day === day)
            .reduce((sum, s) => {
                const num = parseInt(s.recipeKcal.replace(/\D/g, ''), 10);
                return sum + (isNaN(num) ? 0 : num);
            }, 0);
    }, [slots]);

    /** Get all unique recipes assigned in current plan (for grocery generation) */
    const getAllAssignedRecipeData = useCallback((): Pick<MealSlot, 'recipeId' | 'recipeTitle' | 'recipeImage'>[] => {
        const seen = new Set<string>();
        return slots.reduce<Pick<MealSlot, 'recipeId' | 'recipeTitle' | 'recipeImage'>[]>((acc, s) => {
            if (!seen.has(s.recipeId)) {
                seen.add(s.recipeId);
                acc.push({ recipeId: s.recipeId, recipeTitle: s.recipeTitle, recipeImage: s.recipeImage });
            }
            return acc;
        }, []);
    }, [slots]);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    return {
        slots,
        loading,
        addSlot,
        removeSlot,
        clearDay,
        getMealsByDay,
        totalKcalForDay,
        getAllAssignedRecipeData,
        fetchSlots,
    };
}
