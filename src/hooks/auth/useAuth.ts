/**
 * useAuth Hook
 * =============
 * Manages authentication state via Supabase Auth.
 * Supports email/password, Google OAuth, and Facebook OAuth.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
                if (event === 'SIGNED_IN') {
                    const returnTo = sessionStorage.getItem('auth_return_screen');
                    if (returnTo) {
                        sessionStorage.removeItem('auth_return_screen');
                        // Small delay so React state settles
                        setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('auth:signed_in', { detail: { returnTo } }));
                        }, 100);
                    }
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: import.meta.env.VITE_APP_URL ?? window.location.origin },
        });
        if (error) throw error;
    };

    const signInWithFacebook = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: { redirectTo: import.meta.env.VITE_APP_URL ?? window.location.origin },
        });
        if (error) throw error;
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const updateProfile = async (updates: {
        full_name?: string;
        avatar_url?: string;
        avatar_id?: string;
        cover_url?: string;
        bio?: string;
        socials?: {
            instagram?: string;
            twitter?: string;
            youtube?: string;
        };
    }) => {
        if (!user) return;

        // 1. Update Auth Metadata (for easy access in state)
        const { error: authError } = await supabase.auth.updateUser({
            data: updates
        });
        if (authError) throw authError;

        // 2. Sync to 'profiles' table (for public querying and uniqueness)
        const profileUpdates: any = {
            id: user.id,
            updated_at: new Date().toISOString()
        };
        if (updates.full_name !== undefined) profileUpdates.full_name = updates.full_name;
        if (updates.avatar_id !== undefined) profileUpdates.avatar_url = updates.avatar_id;
        else if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url;
        if (updates.cover_url !== undefined) profileUpdates.cover_url = updates.cover_url;
        if (updates.bio !== undefined) profileUpdates.bio = updates.bio;
        if (updates.socials !== undefined) profileUpdates.socials = updates.socials;

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileUpdates);

        if (profileError) {
            // If it's a unique constraint violation
            if (profileError.code === '23505') {
                throw new Error('This name is already taken. Please choose another one.');
            }
            throw profileError;
        }
    };

    return {
        user,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithFacebook,
        resetPassword,
        signOut,
        updateProfile,
    };
}
