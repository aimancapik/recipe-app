import React, { useState, useEffect } from 'react';
import { Recipe } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { getUserUsage, incrementAIUsage } from '@/api/userUsage';
import LoadingAnimation from '@/components/LoadingAnimation';
import { useAIGeneration } from '@/contexts/AIGenerationContext';

interface AIGenerateScreenProps {
    onBack: () => void;
    onRecipeReady: (recipe: Recipe) => void;
}

const DIETARY_OPTIONS = [
    { label: 'Vegetarian', icon: '🥬' },
    { label: 'Vegan', icon: '🌱' },
    { label: 'Keto', icon: '🥑' },
    { label: 'Gluten-Free', icon: '🌾' },
    { label: 'Halal', icon: '🍖' },
    { label: 'Dairy-Free', icon: '🥛' },
    { label: 'Low-Cal', icon: '🔥' },
];

const SUGGESTION_CHIPS = [
    { label: 'Mediterranean Vibe', icon: '🫒' },
    { label: 'Spicy Noodles', icon: '🍜' },
    { label: 'Late Night Snack', icon: '🌙' },
    { label: 'Keto Dinner', icon: '🥩' },
    { label: 'Quick Breakfast', icon: '☀️' },
    { label: 'Comfort Food', icon: '🍲' },
];

const MAX_USES = 10;

const AIGenerateScreen: React.FC<AIGenerateScreenProps> = ({ onBack, onRecipeReady }) => {
    const { user } = useAuth();
    const { startGeneration, moveToBackground, discardTask, getTask } = useAIGeneration();

    const [prompt, setPrompt] = useState('');
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
    const [usageCount, setUsageCount] = useState<number | null>(null);
    const [timeToReset, setTimeToReset] = useState<string>('');

    const currentTask = currentTaskId ? getTask(currentTaskId) : null;
    const loading = currentTask?.status === 'loading';

    // Monitor task completion
    useEffect(() => {
        if (currentTask && currentTask.status === 'completed' && currentTask.result) {
            onRecipeReady(currentTask.result);
        } else if (currentTask && currentTask.status === 'failed') {
            setError(currentTask.error || "Failed to generate recipe.");
            setCurrentTaskId(null);
        }
    }, [currentTask, onRecipeReady]);

    // Calculate time until next midnight
    const calculateTimeToReset = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setHours(24, 0, 0, 0);
        const diffMs = tomorrow.getTime() - now.getTime();

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    // Update timer every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeToReset(calculateTimeToReset());
        }, 60000);
        setTimeToReset(calculateTimeToReset());
        return () => clearInterval(timer);
    }, []);

    // Fetch usage count on mount
    useEffect(() => {
        const fetchUsage = async () => {
            if (!user) return;
            try {
                const data = await getUserUsage(user.id);
                if (data) {
                    setUsageCount(data.isNewDay ? 0 : data.ai_usage_count);
                }
            } catch (e) {
                console.error('Failed to fetch usage count:', e);
            }
        };
        fetchUsage();
    }, [user]);

    const remainingUses = usageCount !== null ? MAX_USES - usageCount : null;
    const isLimitReached = remainingUses !== null && remainingUses <= 0;

    const toggleDietary = (label: string) => {
        setSelectedDietary(prev =>
            prev.includes(label) ? prev.filter(d => d !== label) : [...prev, label]
        );
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        if (!user) {
            setError("You need to be logged in to use the AI chef.");
            return;
        }

        if (isLimitReached) {
            setError(`You've reached your daily limit of ${MAX_USES} AI recipes. Your quota will refresh tomorrow!`);
            return;
        }

        setError(null);
        try {
            const { allowed, count } = await incrementAIUsage(user.id);
            setUsageCount(count);
            if (!allowed) {
                setError("You've reached your daily limit of 10 AI recipes. Time to upgrade your kitchen skills manually!");
                return;
            }

            const taskId = await startGeneration(prompt, selectedDietary);
            setCurrentTaskId(taskId);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Something went wrong with the AI chef.");
        }
    };

    const handleBackground = () => {
        if (currentTaskId) {
            moveToBackground(currentTaskId);
            onBack(); // Navigate away
        }
    };

    const handleDiscard = () => {
        if (currentTaskId) {
            discardTask(currentTaskId);
            setCurrentTaskId(null);
        }
    };

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-base-200/80 backdrop-blur-xl px-4 pt-4 pb-2">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="btn btn-ghost btn-sm btn-circle">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold flex-1">AI Magic Chef</h1>
                </div>
            </div>

            <div className="px-5 pb-8">
                {/* Hero Section */}
                <div className="flex flex-col items-center text-center mb-8 mt-2">
                    <div className="size-20 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl shadow-primary/30 mb-5 relative">
                        <span className="material-symbols-outlined text-primary-content text-5xl fill-icon">auto_awesome</span>
                        <div className="absolute -top-1 -right-1 size-6 rounded-full bg-success flex items-center justify-center shadow-md">
                            <span className="material-symbols-outlined text-success-content text-[14px] fill-icon">bolt</span>
                        </div>
                    </div>
                    <p className="text-base-content/50 max-w-xs text-sm leading-relaxed">
                        Tell me what's in your fridge, and I'll create a unique recipe just for you.
                    </p>

                    {/* Remaining Uses Badge */}
                    {remainingUses !== null && (
                        <div className="flex flex-col items-center gap-2 mt-3">
                            <div className={`badge gap-1.5 py-3 px-4 font-bold text-xs ${isLimitReached
                                ? 'badge-error text-error-content'
                                : remainingUses <= 3
                                    ? 'badge-warning text-warning-content'
                                    : 'badge-primary text-primary-content'
                                }`}>
                                <span className="material-symbols-outlined text-[14px] fill-icon">
                                    {isLimitReached ? 'block' : 'local_fire_department'}
                                </span>
                                {isLimitReached ? 'No uses left' : `${remainingUses}/${MAX_USES} uses remaining`}
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-base-content/40">
                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                <span>Refreshes in {timeToReset}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dietary Filters */}
                <div className="mb-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-3 px-1">Dietary Preferences</h3>
                    <div className="flex flex-wrap gap-2">
                        {DIETARY_OPTIONS.map(({ label, icon }) => {
                            const isSelected = selectedDietary.includes(label);
                            return (
                                <button
                                    key={label}
                                    onClick={() => toggleDietary(label)}
                                    className={`btn btn-sm rounded-full gap-1.5 transition-all duration-200 ${isSelected
                                        ? 'btn-primary shadow-md shadow-primary/20 scale-105'
                                        : 'btn-ghost bg-base-100 border-base-300 hover:border-primary/50'
                                        }`}
                                >
                                    <span className="text-sm">{icon}</span>
                                    <span className="text-xs">{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Prompt Input */}
                <div className="card bg-base-100 shadow-sm mb-5">
                    <div className="card-body p-4">
                        <textarea
                            className="textarea textarea-bordered w-full min-h-[110px] text-base focus:textarea-primary transition-colors"
                            placeholder="Example: 2 tomatoes, some chicken, and leftover pesto..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isLimitReached}
                        />
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="alert alert-error mb-5 shadow-sm">
                        <span className="material-symbols-outlined">error</span>
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Generate Button / Loading State */}
                {loading ? (
                    <div className="flex flex-col gap-3 animate-fade-in">
                        <div className="card bg-base-100 shadow-md border border-primary/20">
                            <div className="card-body items-center py-6">
                                <LoadingAnimation size={48} />
                                <h3 className="text-lg font-bold mt-4">Chef is cooking...</h3>
                                <p className="text-sm text-base-content/50 text-center">
                                    This might take up to a minute.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleBackground}
                                className="btn btn-primary flex-1 gap-2 shadow-lg shadow-primary/20"
                            >
                                <span className="material-symbols-outlined text-[18px]">visibility_off</span>
                                Background
                            </button>
                            <button
                                onClick={handleDiscard}
                                className="btn btn-ghost bg-base-100 border-base-300 flex-1 gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                                Discard
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-base-content/40 mt-1 uppercase tracking-widest font-bold">
                            You can browse while I cook
                        </p>
                    </div>
                ) : (
                    <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isLimitReached}
                        className="btn btn-primary w-full btn-lg gap-3 shadow-lg shadow-primary/20 group mb-8"
                    >
                        <span className="material-symbols-outlined group-hover:scale-125 transition-transform fill-icon">restaurant</span>
                        <span>Generate Recipe</span>
                    </button>
                )}

                {/* Suggestion Chips */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-3 text-center">Quick Ideas</h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {SUGGESTION_CHIPS.map(({ label, icon }) => (
                            <button
                                key={label}
                                onClick={() => setPrompt(label)}
                                disabled={isLimitReached}
                                className="btn btn-ghost btn-sm rounded-full bg-base-100 border-base-200 hover:border-primary gap-1.5 transition-all"
                            >
                                <span>{icon}</span>
                                <span className="text-xs">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIGenerateScreen;
