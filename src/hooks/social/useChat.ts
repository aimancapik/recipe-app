import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getAvatarUrl } from '@/constants/avatars';

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

export interface Conversation {
    id: string;
    other_user: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    last_message: string | null;
    last_message_at: string | null;
    unread_count: number;
}

export const useChat = (currentUserId: string | undefined) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingConvos, setLoadingConvos] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const fetchConversations = useCallback(async () => {
        if (!currentUserId) return;
        setLoadingConvos(true);
        try {
            // Get all conversation IDs the user is part of
            const { data: memberRows, error: memberError } = await supabase
                .from('conversation_members')
                .select('conversation_id, last_read_at')
                .eq('user_id', currentUserId);

            if (memberError) throw memberError;
            if (!memberRows || memberRows.length === 0) {
                setConversations([]);
                return;
            }

            const convoIds = memberRows.map(r => r.conversation_id);

            // Use RPC to get the other member's user_id for each conversation
            // This avoids RLS recursion on conversation_members
            const { data: otherMemberRows, error: otherError } = await supabase
                .rpc('get_conversation_other_members', { my_user_id: currentUserId, convo_ids: convoIds });

            if (otherError) {
                console.error('get_conversation_other_members error:', otherError);
            }

            console.log('otherMemberRows:', otherMemberRows);
            const otherMembers: { conversation_id: string; user_id: string }[] = otherMemberRows || [];

            // Get profiles for other members
            const otherUserIds = [...new Set(otherMembers.map((m: { user_id: string }) => m.user_id))];
            const { data: profiles, error: profileError } = otherUserIds.length > 0
                ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', otherUserIds)
                : { data: [], error: null };

            if (profileError) throw profileError;

            // Get last message per conversation + all unread messages from others
            const { data: lastMessages, error: msgError } = await supabase
                .from('messages')
                .select('conversation_id, content, created_at, sender_id')
                .in('conversation_id', convoIds)
                .order('created_at', { ascending: false });

            if (msgError) throw msgError;

            // Build conversation objects
            const convos: Conversation[] = convoIds.map(convoId => {
                const otherMember = (otherMembers || []).find(m => m.conversation_id === convoId);
                const profile = (profiles || []).find(p => p.id === otherMember?.user_id);
                const myMemberRow = memberRows.find(r => r.conversation_id === convoId);
                const lastMsg = (lastMessages || []).find(m => m.conversation_id === convoId);

                // Count messages from others that arrived after last_read_at
                const unreadCount = (lastMessages || []).filter(m =>
                    m.conversation_id === convoId &&
                    m.sender_id !== currentUserId &&
                    (!myMemberRow?.last_read_at ||
                        new Date(m.created_at) > new Date(myMemberRow.last_read_at))
                ).length;

                return {
                    id: convoId,
                    other_user: {
                        id: profile?.id || '',
                        full_name: profile?.full_name || 'Unknown',
                        avatar_url: profile?.avatar_url ? getAvatarUrl(profile.avatar_url) : null,
                    },
                    last_message: lastMsg?.content || null,
                    last_message_at: lastMsg?.created_at || null,
                    unread_count: unreadCount,
                };
            });

            // Sort by last message time
            convos.sort((a, b) => {
                if (!a.last_message_at) return 1;
                if (!b.last_message_at) return -1;
                return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
            });

            setConversations(convos);
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        } finally {
            setLoadingConvos(false);
        }
    }, [currentUserId]);

    const fetchMessages = useCallback(async (conversationId: string) => {
        setLoadingMessages(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);

            // Mark as read
            if (currentUserId) {
                await supabase
                    .from('conversation_members')
                    .update({ last_read_at: new Date().toISOString() })
                    .eq('conversation_id', conversationId)
                    .eq('user_id', currentUserId);
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        } finally {
            setLoadingMessages(false);
        }
    }, [currentUserId]);

    const openConversation = useCallback(async (conversationId: string) => {
        setActiveConversationId(conversationId);
        await fetchMessages(conversationId);

        // Unsubscribe from previous channel
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        // Subscribe to new messages in real-time
        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`,
            }, (payload) => {
                const incoming = payload.new as ChatMessage;
                setMessages(prev => {
                    // Avoid duplicate if optimistic message already added it
                    if (prev.some(m => m.id === incoming.id)) return prev;
                    return [...prev, incoming];
                });
                // Mark as read immediately if we're looking at this convo
                if (currentUserId) {
                    supabase
                        .from('conversation_members')
                        .update({ last_read_at: new Date().toISOString() })
                        .eq('conversation_id', conversationId)
                        .eq('user_id', currentUserId);
                }
            })
            .subscribe();

        channelRef.current = channel;
    }, [fetchMessages, currentUserId]);

    const sendMessage = useCallback(async (conversationId: string, content: string) => {
        if (!currentUserId || !content.trim()) return;

        // Optimistic update — show message immediately
        const optimisticMsg: ChatMessage = {
            id: `temp-${Date.now()}`,
            conversation_id: conversationId,
            sender_id: currentUserId,
            content: content.trim(),
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimisticMsg]);

        const { data, error } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: currentUserId,
            content: content.trim(),
        }).select().single();

        if (error) {
            // Revert on failure
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            throw error;
        }

        // Replace optimistic with real message
        if (data) {
            setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data : m));
        }

        fetchConversations();
    }, [currentUserId, fetchConversations]);

    const deleteConversation = useCallback(async (conversationId: string) => {
        // Remove current user from conversation (effectively leaves it)
        await supabase
            .from('conversation_members')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', currentUserId);
        setConversations(prev => prev.filter(c => c.id !== conversationId));
    }, [currentUserId]);

    const getOrCreateConversation = useCallback(async (otherUserId: string): Promise<string> => {
        const { data, error } = await supabase.rpc('get_or_create_conversation', {
            other_user_id: otherUserId,
        });
        if (error) throw error;
        return data as string;
    }, []);

    const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);

    return {
        conversations,
        messages,
        loadingConvos,
        loadingMessages,
        activeConversationId,
        totalUnread,
        fetchConversations,
        openConversation,
        sendMessage,
        deleteConversation,
        getOrCreateConversation,
    };
};
