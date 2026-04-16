import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Conversation } from '@/hooks/social/useChat';

interface ChatScreenProps {
    conversation: Conversation;
    messages: ChatMessage[];
    loading: boolean;
    currentUserId: string;
    onBack: () => void;
    onSend: (content: string) => Promise<void>;
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const ChatScreen: React.FC<ChatScreenProps> = ({ conversation, messages, loading, currentUserId, onBack, onSend }) => {
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setInput('');
        setSending(true);
        try {
            await onSend(text);
        } catch (err) {
            console.error('Failed to send message:', err);
            setInput(text);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Group messages by date
    const grouped: { label: string; msgs: ChatMessage[] }[] = [];
    messages.forEach(msg => {
        const label = formatDateLabel(msg.created_at);
        const last = grouped[grouped.length - 1];
        if (last && last.label === label) {
            last.msgs.push(msg);
        } else {
            grouped.push({ label, msgs: [msg] });
        }
    });

    return (
        <div className="flex flex-col h-screen bg-base-100 font-display">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-200">
                <div className="flex items-center p-4 gap-3 max-w-2xl mx-auto w-full">
                    <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full hover:bg-base-300 transition-colors shrink-0">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    {conversation.other_user.avatar_url ? (
                        <img src={conversation.other_user.avatar_url} alt="" className="size-10 rounded-xl object-cover shrink-0" />
                    ) : (
                        <div className="size-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                            <span className="text-primary-content font-black">
                                {conversation.other_user.full_name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{conversation.other_user.full_name}</p>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <main className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full space-y-1">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <span className="loading loading-spinner loading-md text-primary"></span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
                        <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>waving_hand</span>
                        </div>
                        <p className="font-bold">Say hi to {conversation.other_user.full_name}!</p>
                        <p className="text-sm text-base-content/50">Start the conversation below.</p>
                    </div>
                ) : (
                    grouped.map(group => (
                        <div key={group.label}>
                            {/* Date label */}
                            <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-base-200" />
                                <span className="text-[11px] font-semibold text-base-content/40 uppercase tracking-wider">{group.label}</span>
                                <div className="flex-1 h-px bg-base-200" />
                            </div>

                            {group.msgs.map((msg, idx) => {
                                const isMe = msg.sender_id === currentUserId;
                                const prevMsg = group.msgs[idx - 1];
                                const showTime = !prevMsg || new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000;

                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2`}>
                                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                            isMe
                                                ? 'bg-primary text-primary-content rounded-br-sm'
                                                : 'bg-base-200 text-base-content rounded-bl-sm'
                                        }`}>
                                            {msg.content}
                                        </div>
                                        {showTime && (
                                            <span className="text-[10px] text-base-content/30 mt-1.5 px-1">
                                                {formatTime(msg.created_at)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </main>

            {/* Input */}
            <div className="border-t border-base-200 bg-base-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <div className="flex items-center gap-3 max-w-2xl mx-auto">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message..."
                        className="flex-1 bg-base-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="size-12 rounded-2xl bg-primary text-primary-content flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                        {sending
                            ? <span className="loading loading-spinner loading-xs"></span>
                            : <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatScreen;
