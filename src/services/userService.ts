import { supabase } from '@/lib/supabase';

export interface UserUsage {
    ai_usage_count: number;
    last_ai_usage_at: string | null;
    isNewDay: boolean;
}

/**
 * Get the current user's AI usage status
 */
export const getUserUsage = async (userId: string): Promise<UserUsage | null> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('ai_usage_count, last_ai_usage_at')
            .eq('id', userId)
            .single();

        if (error || !data) return null;

        const lastUsage = data.last_ai_usage_at ? new Date(data.last_ai_usage_at) : null;

        // Helper to get local date string YYYY-MM-DD
        const getLocalDateString = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const todayStr = getLocalDateString(new Date());
        const lastUsageStr = lastUsage ? getLocalDateString(lastUsage) : null;

        return {
            ai_usage_count: data.ai_usage_count || 0,
            last_ai_usage_at: data.last_ai_usage_at,
            isNewDay: !!(lastUsageStr && lastUsageStr < todayStr)
        };
    } catch (e) {
        console.error('Failed to fetch user usage:', e);
        return null;
    }
};

/**
 * Increment AI usage count for the user
 * Handles timezone-aware daily resets via Supabase RPC
 */
export const incrementAIUsage = async (userId: string) => {
    // Get local date in YYYY-MM-DD format (safe from UTC shifts)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;

    const { data, error } = await supabase.rpc('increment_ai_usage', {
        p_id: userId,
        p_current_date: localDate
    });

    if (error) {
        console.error("Usage increment error:", error);
        throw new Error("Failed to update usage limits.");
    }

    return data as { allowed: boolean; count: number };
};
