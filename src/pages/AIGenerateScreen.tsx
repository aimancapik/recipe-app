import React, { useState } from 'react';
import { generateRecipeFromIngredients } from '@/services/llamaService';
import { Recipe } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface AIGenerateScreenProps {
    onBack: () => void;
    onRecipeReady: (recipe: Recipe) => void;
}

const AIGenerateScreen: React.FC<AIGenerateScreenProps> = ({ onBack, onRecipeReady }) => {
    const { user } = useAuth();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        if (!user) {
            setError("You need to be logged in to use the AI chef.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Check usage limit
            const { data: allowed, error: usageError } = await supabase.rpc('increment_ai_usage', { p_id: user.id });

            if (usageError) {
                console.error("Usage check error:", usageError);
                throw new Error("Failed to check usage limits.");
            }

            if (!allowed) {
                setError("You've reached your limit of 10 AI recipes. Time to upgrade your kitchen skills manually!");
                setLoading(false);
                return; // Stop here
            }

            // Proceed to generate
            const recipe = await generateRecipeFromIngredients(prompt);
            if (recipe) {
                onRecipeReady(recipe);
            } else {
                setError("I couldn't whip something up this time. Try different ingredients?");
                // Ideally, decrement usage count here if fail, but let's keep it simple (consumed attempt)
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Something went wrong with the AI chef.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 min-h-screen bg-base-200">
            <button onClick={onBack} className="btn btn-ghost btn-sm gap-2 mb-8">
                <span className="material-symbols-outlined">arrow_back</span>
                <span>Back</span>
            </button>

            <div className="flex flex-col items-center text-center mb-10">
                <div className="size-20 rounded-3xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 mb-6">
                    <span className="material-symbols-outlined text-primary-content text-5xl fill-icon">auto_awesome</span>
                </div>
                <h1 className="text-3xl font-bold mb-2 text-base-content">AI Magic Chef</h1>
                <p className="text-base-content/50 max-w-xs">
                    Tell me what's in your fridge, and I'll create a unique recipe just for you.
                    <span className="block mt-1 text-xs font-bold text-primary">Limit: 10 Uses</span>
                </p>
            </div>

            <div className="space-y-6">
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <textarea
                            className="textarea textarea-bordered w-full min-h-[120px] text-lg"
                            placeholder="Example: 2 tomatoes, some chicken, and leftover pesto..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <span className="material-symbols-outlined">error</span>
                        <span>{error}</span>
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className="btn btn-primary w-full btn-lg gap-3 shadow-lg group"
                >
                    {loading ? (
                        <>
                            <span className="loading loading-spinner loading-md"></span>
                            <span>Stirring the pot...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined group-hover:scale-125 transition-transform">restaurant</span>
                            <span>Generate Recipe</span>
                        </>
                    )}
                </button>
            </div>

            <div className="mt-12">
                <h3 className="text-sm font-bold uppercase tracking-widest text-base-content/40 mb-4 text-center">Suggestions</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                    {['Mediterranean Vibe', 'Spicy Noodles', 'Late Night Snack', 'Keto Dinner'].map(s => (
                        <button
                            key={s}
                            onClick={() => setPrompt(s)}
                            className="btn btn-ghost btn-sm rounded-full bg-base-100 border-base-200 hover:border-primary"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AIGenerateScreen;
