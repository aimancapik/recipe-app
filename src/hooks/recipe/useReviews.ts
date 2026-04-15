import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Review {
  id: string;
  recipe_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface ReviewInput {
  rating: number;
  comment?: string;
  photos?: string[];
}

export function useReviews(recipeId?: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reviews for a recipe
  const fetchReviews = async (targetRecipeId?: string) => {
    const id = targetRecipeId || recipeId;
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select(`
          *,
          user:profiles!user_id(full_name, avatar_url)
        `)
        .eq('recipe_id', id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  // Get user's review for a recipe
  const getUserReview = async (targetRecipeId?: string): Promise<Review | null> => {
    const id = targetRecipeId || recipeId;
    if (!id) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select(`
          *,
          user:profiles!user_id(full_name, avatar_url)
        `)
        .eq('recipe_id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found", which is okay
        throw fetchError;
      }

      return data || null;
    } catch (err) {
      console.error('Error fetching user review:', err);
      return null;
    }
  };

  // Add a new review
  const addReview = async (targetRecipeId: string, input: ReviewInput): Promise<Review | null> => {
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: insertError } = await supabase
        .from('reviews')
        .insert({
          recipe_id: targetRecipeId,
          user_id: user.id,
          rating: input.rating,
          comment: input.comment || null,
          photos: input.photos || [],
        })
        .select(`
          *,
          user:profiles!user_id(full_name, avatar_url)
        `)
        .single();

      if (insertError) throw insertError;

      // Update local state if this is the current recipe
      if (targetRecipeId === recipeId) {
        setReviews(prev => [data, ...prev]);
      }

      return data;
    } catch (err) {
      console.error('Error adding review:', err);
      setError(err instanceof Error ? err.message : 'Failed to add review');
      return null;
    }
  };

  // Update an existing review
  const updateReview = async (reviewId: string, input: Partial<ReviewInput>): Promise<Review | null> => {
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('reviews')
        .update({
          ...(input.rating !== undefined && { rating: input.rating }),
          ...(input.comment !== undefined && { comment: input.comment }),
          ...(input.photos !== undefined && { photos: input.photos }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .select(`
          *,
          user:profiles!user_id(full_name, avatar_url)
        `)
        .single();

      if (updateError) throw updateError;

      // Update local state
      setReviews(prev =>
        prev.map(review => (review.id === reviewId ? data : review))
      );

      return data;
    } catch (err) {
      console.error('Error updating review:', err);
      setError(err instanceof Error ? err.message : 'Failed to update review');
      return null;
    }
  };

  // Delete a review
  const deleteReview = async (reviewId: string): Promise<boolean> => {
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (deleteError) throw deleteError;

      // Update local state
      setReviews(prev => prev.filter(review => review.id !== reviewId));

      return true;
    } catch (err) {
      console.error('Error deleting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete review');
      return false;
    }
  };

  // Auto-fetch reviews when recipeId changes
  useEffect(() => {
    if (recipeId) {
      fetchReviews(recipeId);
    }
  }, [recipeId]);

  return {
    reviews,
    loading,
    error,
    fetchReviews,
    getUserReview,
    addReview,
    updateReview,
    deleteReview,
  };
}
