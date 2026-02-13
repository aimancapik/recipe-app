
import React, { useState } from 'react';
import { generateRecipeFromIngredients } from '@/services/geminiService';
import { Recipe } from '@/types';

interface AIGenerateScreenProps {
    onBack: () => void;
    onRecipeReady: (recipe: Recipe) => void;
}

const AIGenerateScreen: React.FC<AIGenerateScreenProps> = ({ onBack, onRecipeReady }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const recipe = await generateRecipeFromIngredients(prompt);
            if (recipe) {
                onRecipeReady(recipe);
            } else {
                setError("I couldn't whip something up this time. Try different ingredients?");
            }
        } catch (e) {
            setError("Something went wrong with the AI chef.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 min-h-screen bg-slate-50 dark:bg-background-dark">
            <button onClick={onBack} className="mb-8 flex items-center gap-2 text-slate-500">
                <span className="material-symbols-outlined">arrow_back</span>
                <span>Back</span>
            </button>

            <div className="flex flex-col items-center text-center mb-10">
                <div className="size-20 rounded-3xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 mb-6">
                    <span className="material-symbols-outlined text-white text-5xl fill-icon">auto_awesome</span>
                </div>
                <h1 className="text-3xl font-bold mb-2">AI Magic Chef</h1>
                <p className="text-slate-500 max-w-xs">
                    Tell me what's in your fridge, and I'll create a unique recipe just for you.
                </p>
            </div>

            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                    <textarea
                        className="w-full bg-transparent border-none focus:ring-0 text-lg placeholder:text-slate-400 min-h-[120px]"
                        placeholder="Example: 2 tomatoes, some chicken, and leftover pesto..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>

                {error && (
                    <p className="text-red-500 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                        {error}
                    </p>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className="w-full bg-primary disabled:opacity-50 text-black font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 group"
                >
                    {loading ? (
                        <>
                            <div className="size-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
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
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 text-center">Suggestions</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                    {['Mediterranean Vibe', 'Spicy Noodles', 'Late Night Snack', 'Keto Dinner'].map(s => (
                        <button
                            key={s}
                            onClick={() => setPrompt(s)}
                            className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-800 hover:border-primary transition-colors"
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
