
import React, { useState, useEffect, useRef } from 'react';
import { GroceryItem } from '@/types';

interface GroceryListScreenProps {
    items: GroceryItem[];
    onToggleItem: (id: string) => void;
    onClearChecked: () => void;
    onBack: () => void;
}

// Simple confetti particle component
const ConfettiParticle: React.FC<{ delay: number; left: number; color: string }> = ({ delay, left, color }) => (
    <div
        className="absolute w-2 h-2 rounded-full opacity-0"
        style={{
            left: `${left}%`,
            top: '40%',
            backgroundColor: color,
            animation: `confetti-fall 1.5s ease-out ${delay}s forwards`,
        }}
    />
);

const GroceryListScreen: React.FC<GroceryListScreenProps> = ({ items, onToggleItem, onClearChecked, onBack }) => {
    const total = items.length;
    const checked = items.filter(i => i.checked).length;
    const percent = total === 0 ? 0 : Math.round((checked / total) * 100);
    const circumference = 2 * Math.PI * 34;
    const dashOffset = circumference - (circumference * percent) / 100;

    const [showConfetti, setShowConfetti] = useState(false);
    const [justCheckedId, setJustCheckedId] = useState<string | null>(null);
    const prevPercentRef = useRef(percent);

    const progressLabel = percent === 100 ? '🎉 All done!' : percent >= 50 ? 'Almost there!' : percent > 0 ? 'Keep going!' : 'Let\'s start!';

    // Trigger confetti when hitting 100%
    useEffect(() => {
        if (percent === 100 && prevPercentRef.current < 100 && total > 0) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 2500);
            return () => clearTimeout(timer);
        }
        prevPercentRef.current = percent;
    }, [percent, total]);

    // Clear the "just checked" animation after it plays
    useEffect(() => {
        if (justCheckedId) {
            const timer = setTimeout(() => setJustCheckedId(null), 400);
            return () => clearTimeout(timer);
        }
    }, [justCheckedId]);

    const handleToggle = (id: string) => {
        const item = items.find(i => i.id === id);
        if (item && !item.checked) {
            setJustCheckedId(id);
        }
        onToggleItem(id);
    };

    // Group items by recipeTitle, sort: unchecked first
    const grouped: Record<string, { items: GroceryItem[]; image: string }> = {};
    for (const item of items) {
        if (!grouped[item.recipeTitle]) {
            grouped[item.recipeTitle] = { items: [], image: item.recipeImage };
        }
        grouped[item.recipeTitle].items.push(item);
    }

    // Sort items within each group: unchecked first
    for (const key of Object.keys(grouped)) {
        grouped[key].items.sort((a, b) => {
            if (a.checked === b.checked) return 0;
            return a.checked ? 1 : -1;
        });
    }

    // Confetti colors
    const confettiColors = ['#f4e225', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const confettiParticles = Array.from({ length: 24 }, (_, i) => ({
        delay: Math.random() * 0.5,
        left: Math.random() * 100,
        color: confettiColors[i % confettiColors.length],
    }));

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-[#1c1b0e] relative overflow-hidden">
            {/* Confetti animation styles */}
            <style>{`
                @keyframes confetti-fall {
                    0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
                    50% { opacity: 1; transform: translateY(-80px) rotate(180deg) scale(1.5); }
                    100% { opacity: 0; transform: translateY(120px) rotate(360deg) scale(0.5); }
                }
                @keyframes check-bounce {
                    0% { transform: scale(1); }
                    30% { transform: scale(1.3); }
                    60% { transform: scale(0.9); }
                    100% { transform: scale(1); }
                }
                @keyframes glow-pulse {
                    0%, 100% { filter: drop-shadow(0 0 4px rgba(244, 226, 37, 0.3)); }
                    50% { filter: drop-shadow(0 0 12px rgba(244, 226, 37, 0.7)); }
                }
                .check-bounce {
                    animation: check-bounce 0.4s ease-out;
                }
                .glow-ring {
                    animation: glow-pulse 2s ease-in-out infinite;
                }
            `}</style>

            {/* Confetti overlay */}
            {showConfetti && (
                <div className="absolute inset-0 z-50 pointer-events-none">
                    {confettiParticles.map((p, i) => (
                        <ConfettiParticle key={i} delay={p.delay} left={p.left} color={p.color} />
                    ))}
                </div>
            )}

            {/* Header Section */}
            <header className="p-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-zinc-800 active:scale-90 transition-transform"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold tracking-tight">Your Basket</h1>
                    <button
                        onClick={checked > 0 ? onClearChecked : undefined}
                        className={`w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-all ${checked > 0
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100'
                            : 'bg-slate-50 dark:bg-zinc-800 text-zinc-400'
                            }`}
                    >
                        <span className="material-symbols-outlined text-xl">
                            {checked > 0 ? 'delete_sweep' : 'more_vert'}
                        </span>
                    </button>
                </div>

                {/* Progress Tracker */}
                <div className={`flex items-center gap-6 p-4 rounded-xl border transition-all duration-500 ${percent === 100
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-700'
                    : 'bg-primary/10 dark:bg-primary/5 border-primary/20'
                    }`}>
                    <div className="relative flex items-center justify-center">
                        <svg className={`w-20 h-20 ${percent === 100 ? 'glow-ring' : ''}`}>
                            <circle
                                className="text-zinc-200 dark:text-zinc-700"
                                cx="40" cy="40" fill="transparent" r="34"
                                stroke="currentColor" strokeWidth="6"
                            />
                            <circle
                                className={`transition-all duration-700 ease-out ${percent === 100 ? 'text-green-500' : 'text-primary'}`}
                                cx="40" cy="40" fill="transparent" r="34"
                                stroke="currentColor"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                strokeLinecap="round" strokeWidth="6"
                                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                            />
                        </svg>
                        <span className={`absolute text-lg font-bold transition-all duration-300 ${percent === 100 ? 'text-green-600 dark:text-green-400' : ''}`}>
                            {percent}%
                        </span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight">{progressLabel}</h3>
                        <p className="text-sm opacity-70">{checked} of {total} items collected</p>
                        <div className="mt-2 flex -space-x-2">
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-primary flex items-center justify-center text-[10px] font-bold text-black">ME</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Shopping List */}
            <main className="flex-1 px-6 pt-6 space-y-8 pb-32">
                {total === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-zinc-400">shopping_cart</span>
                        </div>
                        <h3 className="font-bold text-lg mb-1">Your basket is empty</h3>
                        <p className="text-sm text-zinc-500 max-w-[220px]">Add ingredients from a recipe to get started</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([recipeTitle, group]) => {
                        const groupChecked = group.items.filter(i => i.checked).length;
                        const allChecked = groupChecked === group.items.length;
                        return (
                            <section key={recipeTitle}>
                                {/* Recipe group header with thumbnail */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div
                                        className="w-10 h-10 rounded-xl bg-cover bg-center shadow-sm border-2 border-white dark:border-zinc-700 flex-shrink-0"
                                        style={{ backgroundImage: `url('${group.image}')` }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-base truncate transition-all ${allChecked ? 'opacity-50' : ''}`}>{recipeTitle}</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ease-out ${allChecked ? 'bg-green-500' : 'bg-primary'}`}
                                                    style={{ width: `${(groupChecked / group.items.length) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-zinc-400 whitespace-nowrap">{groupChecked}/{group.items.length}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Items */}
                                <div className="space-y-2">
                                    {group.items.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleToggle(item.id)}
                                            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 ${item.checked
                                                ? 'bg-slate-50/80 dark:bg-zinc-800/30 border border-transparent'
                                                : 'bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 hover:border-primary/30 hover:shadow-md'
                                                }`}
                                            style={{
                                                transform: item.checked ? 'scale(0.98)' : 'scale(1)',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            }}
                                        >
                                            {/* Animated Checkbox */}
                                            <div
                                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${justCheckedId === item.id ? 'check-bounce' : ''
                                                    } ${item.checked
                                                        ? 'bg-primary shadow-sm shadow-primary/30'
                                                        : 'border-2 border-zinc-200 dark:border-zinc-700 hover:border-primary'
                                                    }`}
                                            >
                                                {item.checked && (
                                                    <span className="material-symbols-outlined text-white text-sm font-bold">check</span>
                                                )}
                                            </div>
                                            {/* Item name */}
                                            <div className="flex-1">
                                                <p className={`font-medium transition-all duration-300 ${item.checked ? 'line-through opacity-40' : ''
                                                    }`}>
                                                    {item.name}
                                                </p>
                                            </div>
                                            {/* Visual indicator for checked items */}
                                            {item.checked && (
                                                <span className="material-symbols-outlined text-green-500 text-sm">done</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })
                )}
            </main>
        </div>
    );
};

export default GroceryListScreen;
