import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Challenge } from '@/types';

// Hardcoded weekly challenges — swap to DB later when you have a challenges table
const WEEKLY_CHALLENGES: Challenge[] = [
    { id: '1', title: '5-Ingredient Meals', description: 'Cook something amazing with only 5 ingredients', emoji: '✋', start_date: '', end_date: '', participant_count: 0 },
    { id: '2', title: 'No-Oven Week', description: 'Every meal cooked on stovetop only', emoji: '🔥', start_date: '', end_date: '', participant_count: 0 },
    { id: '3', title: 'Street Food at Home', description: 'Recreate your fave street food', emoji: '🌮', start_date: '', end_date: '', participant_count: 0 },
    { id: '4', title: 'Grandma\'s Recipe', description: 'Cook a recipe passed down from family', emoji: '👵', start_date: '', end_date: '', participant_count: 0 },
];

const getWeeklyChallenge = (): Challenge => {
    const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    return WEEKLY_CHALLENGES[week % WEEKLY_CHALLENGES.length];
};

export const useChallenge = (userId?: string) => {
    const [challenge] = useState<Challenge>(getWeeklyChallenge());
    const [participantCount, setParticipantCount] = useState(0);
    const [hasJoined, setHasJoined] = useState(false);

    useEffect(() => {
        // Count from made_it as proxy for participation (real impl needs challenges table)
        supabase
            .from('made_it')
            .select('user_id', { count: 'exact', head: true })
            .then(({ count, error }) => { if (!error) setParticipantCount(count || 0); });

        if (userId) {
            const joined = localStorage.getItem(`challenge_joined_${challenge.id}_${userId}`);
            setHasJoined(!!joined);
        }
    }, [challenge.id, userId]);

    const joinChallenge = () => {
        if (!userId || hasJoined) return;
        localStorage.setItem(`challenge_joined_${challenge.id}_${userId}`, 'true');
        setHasJoined(true);
        setParticipantCount(prev => prev + 1);
    };

    return { challenge, participantCount, hasJoined, joinChallenge };
};
