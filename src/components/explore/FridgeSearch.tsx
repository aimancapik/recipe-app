import React, { useState } from 'react';

interface FridgeSearchProps {
    ingredients: string[];
    onIngredientsChange: (next: string[]) => void;
    onSearch: (ingredients: string[]) => void;
    onClose: () => void;
}

const SUGGESTIONS = ['chicken', 'eggs', 'pasta', 'rice', 'tomatoes', 'garlic', 'onion', 'cheese', 'butter', 'potatoes', 'spinach', 'lemon'];

const FridgeSearch: React.FC<FridgeSearchProps> = ({ ingredients, onIngredientsChange, onSearch, onClose }) => {
    const [input, setInput] = useState('');

    const addIngredient = (name: string) => {
        const trimmed = name.trim().toLowerCase();
        if (!trimmed || ingredients.includes(trimmed)) return;
        onIngredientsChange([...ingredients, trimmed]);
        setInput('');
    };

    const removeIngredient = (name: string) => onIngredientsChange(ingredients.filter(i => i !== name));

    const clearAll = () => onIngredientsChange([]);

    const handleSearch = () => {
        if (ingredients.length === 0) return;
        onSearch(ingredients);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-base-100 rounded-t-3xl w-full max-w-md p-6 pb-8 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-black text-xl">🧊 What's in your fridge?</h2>
                        <p className="text-sm text-base-content/50">Add ingredients you have, find recipes</p>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Input */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && input.trim()) addIngredient(input); }}
                        placeholder="Type an ingredient..."
                        className="input input-bordered flex-1 rounded-xl"
                        autoFocus
                    />
                    <button
                        onClick={() => input.trim() && addIngredient(input)}
                        className="btn btn-primary rounded-xl"
                    >
                        Add
                    </button>
                </div>

                {/* Added ingredients */}
                {ingredients.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-base-content/40 uppercase tracking-widest">Added ({ingredients.length})</p>
                            <button onClick={clearAll} className="text-[10px] text-error font-semibold uppercase tracking-wider">Clear all</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {ingredients.map(ing => (
                                <span key={ing} className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1.5 text-sm font-semibold">
                                    {ing}
                                    <button onClick={() => removeIngredient(ing)} className="text-primary/60 hover:text-primary">
                                        <span className="material-symbols-outlined text-base leading-none">close</span>
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Suggestions */}
                <div>
                    <p className="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-2">Quick add</p>
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTIONS.filter(s => !ingredients.includes(s)).map(s => (
                            <button
                                key={s}
                                onClick={() => addIngredient(s)}
                                className="px-3 py-1.5 bg-base-200 hover:bg-base-300 rounded-full text-sm font-medium transition-colors"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search button */}
                <button
                    onClick={handleSearch}
                    disabled={ingredients.length === 0}
                    className="btn btn-primary btn-lg rounded-2xl gap-2 mt-2"
                >
                    <span className="material-symbols-outlined">search</span>
                    Find Recipes ({ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''})
                </button>
            </div>
        </div>
    );
};

export default FridgeSearch;
