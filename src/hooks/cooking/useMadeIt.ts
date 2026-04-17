import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MadeIt } from '@/types';

export const useMadeIt = (recipeId: string, currentUserId?: string) => {
    const [madeItList, setMadeItList] = useState<MadeIt[]>([]);
    const [hasMadeIt, setHasMadeIt] = useState(false);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        const { data } = await supabase
            .from('made_it')
            .select('*, profile:profiles(full_name, avatar_url)')
            .eq('recipe_id', recipeId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setMadeItList(data);
            setCount(data.length);
            if (currentUserId) setHasMadeIt(data.some(m => m.user_id === currentUserId));
        }
    }, [recipeId, currentUserId]);

    useEffect(() => { fetch(); }, [fetch]);

    const markMadeIt = useCallback(async (photoFile?: File) => {
        if (!currentUserId || loading) return;
        setLoading(true);
        try {
            let photo_url: string | null = null;
            if (photoFile) {
                const ext = photoFile.name.split('.').pop();
                const path = `made_it/${currentUserId}/${recipeId}_${Date.now()}.${ext}`;
                const { error: uploadErr } = await supabase.storage
                    .from('recipe-images')
                    .upload(path, photoFile, { upsert: true });
                if (!uploadErr) {
                    const { data: urlData } = supabase.storage.from('recipe-images').getPublicUrl(path);
                    photo_url = urlData.publicUrl;
                }
            }

            const { error } = await supabase.from('made_it').upsert({
                recipe_id: recipeId,
                user_id: currentUserId,
                photo_url,
            }, { onConflict: 'recipe_id,user_id' });

            if (!error) {
                setHasMadeIt(true);
                setCount(prev => prev + 1);
                await fetch();
            }
        } finally {
            setLoading(false);
        }
    }, [recipeId, currentUserId, loading, fetch]);

    const unmarkMadeIt = useCallback(async () => {
        if (!currentUserId) return;
        await supabase.from('made_it').delete()
            .eq('recipe_id', recipeId)
            .eq('user_id', currentUserId);
        setHasMadeIt(false);
        setCount(prev => Math.max(0, prev - 1));
        setMadeItList(prev => prev.filter(m => m.user_id !== currentUserId));
    }, [recipeId, currentUserId]);

    return { madeItList, hasMadeIt, count, loading, markMadeIt, unmarkMadeIt };
};
