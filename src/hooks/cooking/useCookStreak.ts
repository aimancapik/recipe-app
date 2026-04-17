import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CookStreak } from '@/types';

const dayKey = (date: Date) => date.toISOString().split('T')[0];

const calcStreak = (dates: string[]): { current: number; longest: number } => {
    if (dates.length === 0) return { current: 0, longest: 0 };

    const sorted = [...new Set(dates)].sort().reverse();
    const today = dayKey(new Date());
    const yesterday = dayKey(new Date(Date.now() - 86400000));

    let current = 0;
    let longest = 0;
    let streak = 0;
    let prev: string | null = null;

    for (const d of sorted) {
        if (!prev) {
            streak = (d === today || d === yesterday) ? 1 : 0;
        } else {
            const diff = (new Date(prev).getTime() - new Date(d).getTime()) / 86400000;
            streak = diff === 1 ? streak + 1 : 1;
        }
        if (streak > longest) longest = streak;
        prev = d;
    }

    // Current streak starts from today or yesterday
    current = (sorted[0] === today || sorted[0] === yesterday) ? 0 : 0;
    prev = null; streak = 0;
    for (const d of sorted) {
        if (!prev) {
            if (d !== today && d !== yesterday) break;
            streak = 1;
        } else {
            const diff = (new Date(prev).getTime() - new Date(d).getTime()) / 86400000;
            if (diff !== 1) break;
            streak++;
        }
        prev = d;
    }
    current = streak;

    return { current, longest };
};

export const useCookStreak = (userId?: string) => {
    const [streak, setStreak] = useState<CookStreak>({
        current_streak: 0,
        longest_streak: 0,
        last_cook_date: null,
        total_made: 0,
    });

    useEffect(() => {
        if (!userId) return;
        supabase
            .from('made_it')
            .select('created_at')
            .eq('user_id', userId)
            .then(({ data }) => {
                if (!data) return;
                const dates = data.map(d => dayKey(new Date(d.created_at)));
                const { current, longest } = calcStreak(dates);
                setStreak({
                    current_streak: current,
                    longest_streak: longest,
                    last_cook_date: dates[0] ?? null,
                    total_made: data.length,
                });
            });
    }, [userId]);

    return streak;
};
