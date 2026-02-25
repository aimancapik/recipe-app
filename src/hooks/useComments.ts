import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Comment {
    id: string;
    recipe_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user?: {
        full_name: string;
        avatar_url: string;
    };
}

export function useComments(recipeId?: string) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchComments = useCallback(async (targetRecipeId?: string) => {
        const id = targetRecipeId || recipeId;
        if (!id) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('comments')
                .select(`
                    *,
                    user:profiles!user_id(full_name, avatar_url)
                `)
                .eq('recipe_id', id)
                .order('created_at', { ascending: true }); // Chronological order

            if (fetchError) throw fetchError;

            // In case of multiple profiles returned by postgREST, handle array
            const formattedData = (data || []).map(item => ({
                ...item,
                user: Array.isArray(item.user) ? item.user[0] : item.user
            }));

            setComments(formattedData);
        } catch (err) {
            console.error('Error fetching comments:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch comments');
        } finally {
            setLoading(false);
        }
    }, [recipeId]);

    const addComment = async (targetRecipeId: string, content: string): Promise<Comment | null> => {
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error: insertError } = await supabase
                .from('comments')
                .insert({
                    recipe_id: targetRecipeId,
                    user_id: user.id,
                    content: content.trim()
                })
                .select(`
                    *,
                    user:profiles!user_id(full_name, avatar_url)
                `)
                .single();

            if (insertError) throw insertError;

            const formattedData = {
                ...data,
                user: Array.isArray(data.user) ? data.user[0] : data.user
            };

            // Update local state if this is the current recipe
            if (targetRecipeId === recipeId) {
                setComments(prev => [...prev, formattedData]);
            }

            return formattedData;
        } catch (err) {
            console.error('Error adding comment:', err);
            setError(err instanceof Error ? err.message : 'Failed to add comment');
            return null;
        }
    };

    const deleteComment = async (commentId: string): Promise<boolean> => {
        setError(null);

        try {
            const { error: deleteError } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId);

            if (deleteError) throw deleteError;

            // Update local state
            setComments(prev => prev.filter(c => c.id !== commentId));

            return true;
        } catch (err) {
            console.error('Error deleting comment:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete comment');
            return false;
        }
    };

    useEffect(() => {
        if (recipeId) {
            fetchComments(recipeId);
        }
    }, [recipeId, fetchComments]);

    return {
        comments,
        loading,
        error,
        fetchComments,
        addComment,
        deleteComment,
    };
}
