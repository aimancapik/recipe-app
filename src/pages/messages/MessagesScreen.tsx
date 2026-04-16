import React, { useRef, useState } from 'react';
import { Conversation } from '@/hooks/social/useChat';

interface MessagesScreenProps {
    conversations: Conversation[];
    loading: boolean;
    onBack: () => void;
    onOpenChat: (conversation: Conversation) => void;
    onDeleteConversation: (conversationId: string) => void;
}

function timeAgo(dateStr: string): string {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

const SWIPE_THRESHOLD = 72;

interface SwipeItemProps {
    convo: Conversation;
    onOpen: () => void;
    onDeleteRequest: () => void;
}

const SwipeItem: React.FC<SwipeItemProps> = ({ convo, onOpen, onDeleteRequest }) => {
    const [offsetX, setOffsetX] = useState(0);
    const [swiping, setSwiping] = useState(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const isDragging = useRef(false);
    const isHorizontal = useRef<boolean | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        isDragging.current = true;
        isHorizontal.current = null;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return;
        const dx = e.touches[0].clientX - startX.current;
        const dy = e.touches[0].clientY - startY.current;

        if (isHorizontal.current === null) {
            if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
            isHorizontal.current = Math.abs(dx) > Math.abs(dy);
        }
        if (!isHorizontal.current) return;

        e.preventDefault();
        setSwiping(true);
        setOffsetX(Math.min(0, dx));
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        if (!swiping) return;
        setSwiping(false);
        setOffsetX(offsetX < -SWIPE_THRESHOLD / 2 ? -SWIPE_THRESHOLD : 0);
    };

    const reset = () => setOffsetX(0);

    return (
        <li className="relative overflow-hidden">
            {/* Delete button revealed behind */}
            <div className="absolute inset-y-0 right-0 w-18 flex items-center justify-center bg-error px-4">
                <button
                    onClick={() => { reset(); onDeleteRequest(); }}
                    className="flex flex-col items-center gap-1 text-white"
                >
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>delete</span>
                    <span className="text-[11px] font-bold">Delete</span>
                </button>
            </div>

            {/* Swipeable row */}
            <div
                className="relative bg-base-100"
                style={{
                    transform: `translateX(${offsetX}px)`,
                    transition: swiping ? 'none' : 'transform 0.25s ease',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <button
                    onClick={() => { if (offsetX === 0) onOpen(); else reset(); }}
                    className="flex items-center gap-4 w-full px-4 py-4 hover:bg-base-200 transition-colors text-left"
                >
                    <div className="relative shrink-0">
                        {convo.other_user.avatar_url ? (
                            <img src={convo.other_user.avatar_url} alt={convo.other_user.full_name} className="size-14 rounded-2xl object-cover" />
                        ) : (
                            <div className="size-14 rounded-2xl bg-primary flex items-center justify-center">
                                <span className="text-primary-content font-black text-xl">
                                    {convo.other_user.full_name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        {convo.unread_count > 0 && (
                            <span className="absolute -top-1 -right-1 size-5 bg-primary text-primary-content text-[10px] font-bold rounded-full flex items-center justify-center">
                                {convo.unread_count > 9 ? '9+' : convo.unread_count}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <p className={`font-bold truncate ${convo.unread_count > 0 ? 'text-base-content' : 'text-base-content/80'}`}>
                                {convo.other_user.full_name}
                            </p>
                            {convo.last_message_at && (
                                <span className="text-[11px] text-base-content/40 shrink-0">{timeAgo(convo.last_message_at)}</span>
                            )}
                        </div>
                        <p className={`text-sm truncate mt-0.5 ${convo.unread_count > 0 ? 'font-semibold text-base-content' : 'text-base-content/50'}`}>
                            {convo.last_message || 'No messages yet'}
                        </p>
                    </div>
                </button>
            </div>
        </li>
    );
};

const MessagesScreen: React.FC<MessagesScreenProps> = ({ conversations, loading, onBack, onOpenChat, onDeleteConversation }) => {
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const confirmConvo = conversations.find(c => c.id === confirmId);

    return (
        <div className="flex flex-col min-h-screen bg-base-100 font-display">
            <header className="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-200">
                <div className="flex items-center p-4 gap-3 max-w-2xl mx-auto w-full">
                    <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full hover:bg-base-300 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold flex-1">Messages</h1>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 px-8 text-center">
                        <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                        </div>
                        <h2 className="text-xl font-bold">No messages yet</h2>
                        <p className="text-sm text-base-content/50">Visit a chef's profile and tap the message button to start a conversation.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-base-200">
                        {conversations.map(convo => (
                            <SwipeItem
                                key={convo.id}
                                convo={convo}
                                onOpen={() => onOpenChat(convo)}
                                onDeleteRequest={() => setConfirmId(convo.id)}
                            />
                        ))}
                    </ul>
                )}
            </main>

            {/* Delete confirmation modal */}
            {confirmId && confirmConvo && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmId(null)}>
                    <div className="bg-base-100 rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="size-14 rounded-2xl bg-error/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>delete</span>
                            </div>
                            <h2 className="text-lg font-bold">Delete conversation?</h2>
                            <p className="text-sm text-base-content/50">
                                Your chat with <strong>{confirmConvo.other_user.full_name}</strong> will be removed from your inbox.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmId(null)} className="flex-1 h-12 rounded-2xl bg-base-200 font-bold hover:bg-base-300 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => { onDeleteConversation(confirmId); setConfirmId(null); }}
                                className="flex-1 h-12 rounded-2xl bg-error text-white font-bold hover:bg-error/90 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessagesScreen;
