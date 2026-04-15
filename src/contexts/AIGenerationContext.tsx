
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Recipe } from '@/types';
import { generateRecipeFromIngredients } from '@/services/aiRecipe';
import { useRecipes } from '@/hooks/recipe/useRecipes';

export type TaskStatus = 'idle' | 'loading' | 'completed' | 'failed' | 'background';

export interface AITask {
    id: string;
    ingredients: string;
    dietaryFilters: string[];
    status: TaskStatus;
    result?: Recipe | null;
    error?: string;
}

interface AIGenerationContextType {
    activeTasks: AITask[];
    startGeneration: (ingredients: string, dietaryFilters: string[]) => Promise<string>;
    moveToBackground: (taskId: string) => void;
    discardTask: (taskId: string) => void;
    getTask: (taskId: string) => AITask | undefined;
    clearTask: (taskId: string) => void;
    notifications: string[];
    clearNotification: (index: number) => void;
}

const AIGenerationContext = createContext<AIGenerationContextType | undefined>(undefined);

export const AIGenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeTasks, setActiveTasks] = useState<AITask[]>([]);
    const [notifications, setNotifications] = useState<string[]>([]);
    const { addRecipe } = useRecipes();

    // Use a ref for abort controllers to handle discards
    const abortControllers = useRef<Map<string, AbortController>>(new Map());

    const clearNotification = useCallback((index: number) => {
        setNotifications(prev => prev.filter((_, i) => i !== index));
    }, []);

    const addNotification = useCallback((message: string) => {
        setNotifications(prev => [...prev, message]);
        // Auto clear after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(m => m !== message));
        }, 5000);
    }, []);

    const startGeneration = useCallback(async (ingredients: string, dietaryFilters: string[]) => {
        const taskId = `task-${Date.now()}`;
        const controller = new AbortController();
        abortControllers.current.set(taskId, controller);

        const newTask: AITask = {
            id: taskId,
            ingredients,
            dietaryFilters,
            status: 'loading'
        };

        setActiveTasks(prev => [...prev, newTask]);

        // Run in background (don't await)
        (async () => {
            try {
                const result = await generateRecipeFromIngredients(ingredients, dietaryFilters);

                if (controller.signal.aborted) return;

                if (result) {
                    // Check status before updating to see if we need to auto-save
                    setActiveTasks(prev => {
                        const task = prev.find(t => t.id === taskId);
                        const isBackground = task?.status === 'background';

                        if (isBackground) {
                            // We use a timeout to call saveToDrafts to avoid state update issues
                            setTimeout(() => saveToDrafts(result), 0);
                            // Remove background task since it's being saved
                            return prev.filter(t => t.id !== taskId);
                        }

                        return prev.map(t =>
                            t.id === taskId ? { ...t, status: 'completed', result } : t
                        );
                    });
                } else {
                    setActiveTasks(prev => prev.map(t =>
                        t.id === taskId ? { ...t, status: 'failed', error: 'Failed to generate recipe' } : t
                    ));
                }
            } catch (err: any) {
                if (controller.signal.aborted) return;
                setActiveTasks(prev => prev.map(t =>
                    t.id === taskId ? { ...t, status: 'failed', error: err.message } : t
                ));
            } finally {
                abortControllers.current.delete(taskId);
            }
        })();

        return taskId;
    }, [addRecipe]);

    const saveToDrafts = useCallback(async (recipe: Recipe) => {
        console.log("Saving background recipe to drafts:", recipe.title);
        try {
            const { id, isFavorite, ...recipeData } = recipe;
            await addRecipe({ ...recipeData, status: 'draft' });
            addNotification(`Chef Finished: "${recipe.title}" is ready in your drafts!`);
            console.log("Background recipe saved successfully.");
        } catch (err) {
            console.error("Failed to auto-save background recipe", err);
        }
    }, [addRecipe, addNotification]);

    const moveToBackground = useCallback((taskId: string) => {
        setActiveTasks(prev => {
            const task = prev.find(t => t.id === taskId);
            if (task && task.status === 'completed' && task.result) {
                // If already completed, just save it now
                saveToDrafts(task.result);
                return prev.filter(t => t.id !== taskId);
            }
            return prev.map(t =>
                t.id === taskId ? { ...t, status: 'background' } : t
            );
        });
    }, [addRecipe]);

    const discardTask = useCallback((taskId: string) => {
        const controller = abortControllers.current.get(taskId);
        if (controller) controller.abort();
        abortControllers.current.delete(taskId);
        setActiveTasks(prev => prev.filter(t => t.id !== taskId));
    }, []);

    const getTask = useCallback((taskId: string) => {
        return activeTasks.find(t => t.id === taskId);
    }, [activeTasks]);

    const clearTask = useCallback((taskId: string) => {
        setActiveTasks(prev => prev.filter(t => t.id !== taskId));
    }, []);

    return (
        <AIGenerationContext.Provider value={{
            activeTasks,
            startGeneration,
            moveToBackground,
            discardTask,
            getTask,
            clearTask,
            notifications,
            clearNotification
        }}>
            {children}

            {/* Simple Toast Container */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4">
                {notifications.map((note, i) => (
                    <div key={i} className="alert alert-success shadow-lg animate-bounce-in py-3">
                        <span className="material-symbols-outlined shrink-0">check_circle</span>
                        <span className="text-sm font-medium">{note}</span>
                        <button onClick={() => clearNotification(i)} className="btn btn-ghost btn-xs btn-circle">
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    </div>
                ))}
            </div>
        </AIGenerationContext.Provider>
    );
};

export const useAIGeneration = () => {
    const context = useContext(AIGenerationContext);
    if (context === undefined) {
        throw new Error('useAIGeneration must be used within an AIGenerationProvider');
    }
    return context;
};
