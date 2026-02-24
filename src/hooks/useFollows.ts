import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useFollows(userId?: string) {
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users that the current user follows
  const fetchFollowing = useCallback(async () => {
    if (!userId) {
      setFollowingIds(new Set());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (fetchError) throw fetchError;

      const ids = new Set(data?.map(f => f.following_id) || []);
      setFollowingIds(ids);
    } catch (err) {
      console.error('Error fetching following:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch following');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Check if current user follows a specific user
  const isFollowing = useCallback((targetUserId: string): boolean => {
    return followingIds.has(targetUserId);
  }, [followingIds]);

  // Follow a user
  const followUser = async (targetUserId: string): Promise<boolean> => {
    if (!userId) {
      setError('Must be logged in to follow users');
      return false;
    }

    if (userId === targetUserId) {
      setError('Cannot follow yourself');
      return false;
    }

    setError(null);

    try {
      const { error: followError } = await supabase
        .from('follows')
        .insert({
          follower_id: userId,
          following_id: targetUserId,
        });

      if (followError) throw followError;

      // Update local state
      setFollowingIds(prev => new Set([...prev, targetUserId]));
      return true;
    } catch (err) {
      console.error('Error following user:', err);
      setError(err instanceof Error ? err.message : 'Failed to follow user');
      return false;
    }
  };

  // Unfollow a user
  const unfollowUser = async (targetUserId: string): Promise<boolean> => {
    if (!userId) {
      setError('Must be logged in to unfollow users');
      return false;
    }

    setError(null);

    try {
      const { error: unfollowError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetUserId);

      if (unfollowError) throw unfollowError;

      // Update local state
      setFollowingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
      return true;
    } catch (err) {
      console.error('Error unfollowing user:', err);
      setError(err instanceof Error ? err.message : 'Failed to unfollow user');
      return false;
    }
  };

  // Toggle follow/unfollow
  const toggleFollow = async (targetUserId: string): Promise<boolean> => {
    if (isFollowing(targetUserId)) {
      return await unfollowUser(targetUserId);
    } else {
      return await followUser(targetUserId);
    }
  };

  // Get follower count for a user
  const getFollowerCount = async (targetUserId: string): Promise<number> => {
    try {
      const { count, error: countError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      if (countError) throw countError;
      return count || 0;
    } catch (err) {
      console.error('Error getting follower count:', err);
      return 0;
    }
  };

  // Get following count for a user
  const getFollowingCount = async (targetUserId: string): Promise<number> => {
    try {
      const { count, error: countError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);

      if (countError) throw countError;
      return count || 0;
    } catch (err) {
      console.error('Error getting following count:', err);
      return 0;
    }
  };

  // Auto-fetch following list when userId changes
  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  return {
    followingIds,
    loading,
    error,
    isFollowing,
    followUser,
    unfollowUser,
    toggleFollow,
    getFollowerCount,
    getFollowingCount,
    fetchFollowing,
  };
}
