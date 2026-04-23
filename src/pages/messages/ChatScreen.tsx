import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Conversation, SharedRecipePayload, isRecipeMessage, decodeRecipeMessage } from '@/hooks/social/useChat';
import { Recipe } from '@/types';

interface ChatScreenProps {
    conversation: Conversation;
    messages: ChatMessage[];
    loading: boolean;
    currentUserId: string;
    isOtherUserTyping?: boolean;
    myRecipes: Recipe[];
    savedRecipes: Recipe[];
    onBack: () => void;
    onSend: (content: string) => Promise<void>;
    onSendRecipe: (recipe: SharedRecipePayload) => Promise<void>;
    onTyping?: (typing: boolean) => void;
    onRecipeClick: (recipe: Recipe) => void;
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

function toSharedPayload(r: Recipe): SharedRecipePayload {
    return { id: r.id, title: r.title, image: r.image, prepTime: r.prepTime, level: r.level, category: r.category };
}

// Dedup by id, merge published + saved
function mergeRecipes(mine: Recipe[], saved: Recipe[]): Recipe[] {
    const map = new Map<string, Recipe>();
    [...mine, ...saved].forEach(r => map.set(r.id, r));
    return Array.from(map.values());
}

const RecipeBubble: React.FC<{ payload: SharedRecipePayload; isMe: boolean; onClick: () => void }> = ({ payload, isMe, onClick }) => (
    <button
        onClick={onClick}
        className={`max-w-[75%] rounded-2xl overflow-hidden text-left border transition-all active:scale-95 ${
            isMe ? 'rounded-br-sm border-primary/30' : 'rounded-bl-sm border-base-300'
        }`}
    >
        <div className="relative w-full h-28">
            <img src={payload.image} alt={payload.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute bottom-2 left-3 text-white text-[10px] font-bold uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded-full">
                {payload.category}
            </span>
        </div>
        <div className={`px-3 py-2.5 ${isMe ? 'bg-primary/10' : 'bg-base-200'}`}>
            <p className="font-bold text-sm text-base-content leading-tight">{payload.title}</p>
            <div className="flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-[13px] text-base-content/40">schedule</span>
                <span className="text-[11px] text-base-content/50">{payload.prepTime}</span>
                <span className="text-[11px] text-base-content/40">·</span>
                <span className="text-[11px] text-base-content/50">{payload.level}</span>
            </div>
            <p className="text-[11px] text-primary font-semibold mt-1.5">Tap to view recipe →</p>
        </div>
    </button>
);

const RecipePickerModal: React.FC<{
    recipes: Recipe[];
    onSelect: (r: Recipe) => void;
    onClose: () => void;
}> = ({ recipes, onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const filtered = recipes.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-base-100 rounded-t-3xl w-full max-w-md max-h-[75vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-base-200">
                    <h2 className="font-bold text-lg">Share a Recipe</h2>
                    <button onClick={onClose} className="btn btn-circle btn-sm btn-ghost">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="px-4 py-3">
                    <div className="flex items-center gap-2 bg-base-200 rounded-2xl px-3 py-2.5">
                        <span className="material-symbols-outlined text-base-content/40 text-[20px]">search</span>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search recipes..."
                            className="flex-1 bg-transparent outline-none text-sm"
                            style={{ fontSize: '16px' }}
                            autoFocus
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center py-12 gap-3 text-center">
                            <span className="material-symbols-outlined text-5xl text-base-content/20">restaurant_menu</span>
                            <p className="text-base-content/50 text-sm">No recipes found</p>
                        </div>
                    ) : (
                        filtered.map(r => (
                            <button
                                key={r.id}
                                onClick={() => { onSelect(r); onClose(); }}
                                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-base-200 active:scale-[0.98] transition-all text-left"
                            >
                                <img src={r.image} alt={r.title} className="size-14 rounded-xl object-cover shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{r.title}</p>
                                    <p className="text-xs text-base-content/50 mt-0.5">{r.category} · {r.prepTime} · {r.level}</p>
                                </div>
                                <span className="material-symbols-outlined text-base-content/30 shrink-0">chevron_right</span>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const ChatScreen: React.FC<ChatScreenProps> = ({
    conversation, messages, loading, currentUserId,
    isOtherUserTyping, myRecipes, savedRecipes,
    onBack, onSend, onSendRecipe, onTyping, onRecipeClick,
}) => {
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const allRecipes = mergeRecipes(
        myRecipes.filter(r => r.status === 'published'),
        savedRecipes,
    );

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOtherUserTyping]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        if (onTyping) {
            onTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
        }
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setInput('');
        setSending(true);
        if (onTyping) {
            onTyping(false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
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

    const handleSendRecipe = async (recipe: Recipe) => {
        setSending(true);
        try {
            await onSendRecipe(toSharedPayload(recipe));
        } catch (err) {
            console.error('Failed to share recipe:', err);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

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
                            <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-base-200" />
                                <span className="text-[11px] font-semibold text-base-content/40 uppercase tracking-wider">{group.label}</span>
                                <div className="flex-1 h-px bg-base-200" />
                            </div>

                            {group.msgs.map((msg, idx) => {
                                const isMe = msg.sender_id === currentUserId;
                                const prevMsg = group.msgs[idx - 1];
                                const showTime = !prevMsg || new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000;
                                const recipePayload = decodeRecipeMessage(msg.content);

                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2`}>
                                        {recipePayload ? (
                                            <RecipeBubble
                                                payload={recipePayload}
                                                isMe={isMe}
                                                onClick={() => onRecipeClick({
                                                    id: recipePayload.id,
                                                    title: recipePayload.title,
                                                    image: recipePayload.image,
                                                    prepTime: recipePayload.prepTime,
                                                    level: recipePayload.level as any,
                                                    category: recipePayload.category,
                                                    description: '',
                                                    rating: 0,
                                                    reviews: 0,
                                                    serves: '',
                                                    kcal: '',
                                                    ingredients: [],
                                                    directions: [],
                                                })}
                                            />
                                        ) : (
                                            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                                isMe
                                                    ? 'bg-primary text-primary-content rounded-br-sm'
                                                    : 'bg-base-200 text-base-content rounded-bl-sm'
                                            }`}>
                                                {msg.content}
                                            </div>
                                        )}
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
                {isOtherUserTyping && (
                    <div className="flex items-start mb-2">
                        <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-base-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-base-content/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-base-content/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-base-content/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </main>

            {/* Input */}
            <div className="border-t border-base-200 bg-base-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <div className="flex items-center gap-2 max-w-2xl mx-auto">
                    <button
                        onClick={() => setShowPicker(true)}
                        className="size-12 rounded-2xl bg-base-200 text-base-content/60 flex items-center justify-center hover:bg-base-300 active:scale-95 transition-all shrink-0"
                        title="Share recipe"
                    >
                        <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant_menu</span>
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Message..."
                        className="flex-1 bg-base-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        style={{ fontSize: '16px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="size-12 rounded-2xl bg-primary text-primary-content flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all shadow-lg shadow-primary/20 shrink-0"
                    >
                        {sending
                            ? <span className="loading loading-spinner loading-xs"></span>
                            : <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                        }
                    </button>
                </div>
            </div>

            {showPicker && (
                <RecipePickerModal
                    recipes={allRecipes}
                    onSelect={handleSendRecipe}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
};

export default ChatScreen;
