import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Comment {
    id: string;
    recipe_id: string;
    user_id: string;
    parent_id: string | null;
    text: string;
    created_at: string;
    user?: {
        full_name: string;
        avatar_url: string;
    };
    replies?: Comment[];
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
                .select('*')
                .eq('recipe_id', id)
                .order('created_at', { ascending: true });

            if (fetchError) throw fetchError;

            const rawComments = data || [];

            // Fetch profiles for all unique user_ids
            const userIds = [...new Set(rawComments.map(c => c.user_id))];
            let profileMap: Record<string, { full_name: string; avatar_url: string }> = {};
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', userIds);
                (profiles || []).forEach(p => { profileMap[p.id] = p; });
            }

            const withProfiles: Comment[] = rawComments.map(item => ({
                ...item,
                user: profileMap[item.user_id] || null,
                replies: []
            }));

            // Build threaded structure: top-level comments with nested replies
            const topLevel = withProfiles.filter(c => !c.parent_id);
            const replyMap: Record<string, Comment[]> = {};
            withProfiles.filter(c => c.parent_id).forEach(r => {
                if (!replyMap[r.parent_id!]) replyMap[r.parent_id!] = [];
                replyMap[r.parent_id!].push(r);
            });
            topLevel.forEach(c => { c.replies = replyMap[c.id] || []; });

            setComments(topLevel);
        } catch (err) {
            console.error('Error fetching comments:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch comments');
        } finally {
            setLoading(false);
        }
    }, [recipeId]);

    const addComment = async (targetRecipeId: string, content: string, parentId?: string): Promise<Comment | null> => {
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error: insertError } = await supabase
                .from('comments')
                .insert({
                    recipe_id: targetRecipeId,
                    user_id: user.id,
                    text: content.trim(),
                    ...(parentId ? { parent_id: parentId } : {})
                })
                .select('*')
                .single();

            if (insertError) throw insertError;

            // Fetch the commenter's profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', user.id)
                .single();

            const formattedData: Comment = {
                ...data,
                user: profile || null,
                replies: []
            };

            // Update local state if this is the current recipe
            if (targetRecipeId === recipeId) {
                if (parentId) {
                    // Append reply under the parent comment
                    setComments(prev => prev.map(c =>
                        c.id === parentId
                            ? { ...c, replies: [...(c.replies || []), formattedData] }
                            : c
                    ));
                } else {
                    setComments(prev => [...prev, formattedData]);
                }
            }

            return formattedData;
        } catch (err) {
            console.error('Error adding comment:', err);
            setError(err instanceof Error ? err.message : 'Failed to add comment');
            return null;
        }
    };

    const deleteComment = async (commentId: string, parentId?: string): Promise<boolean> => {
        setError(null);

        try {
            const { error: deleteError } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId);

            if (deleteError) throw deleteError;

            setComments(prev => {
                if (parentId) {
                    return prev.map(c =>
                        c.id === parentId
                            ? { ...c, replies: (c.replies || []).filter(r => r.id !== commentId) }
                            : c
                    );
                }
                return prev.filter(c => c.id !== commentId);
            });

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
