import React, { useMemo, useState } from 'react';
import { INGREDIENTS, QUICK_INGREDIENTS } from '@/constants/ingredients';

interface IngredientInputProps {
    ingredients: string[];
    onAdd: (ingredient: string) => void;
    onRemove: (ingredient: string) => void;
    onFindRecipes: () => void;
    onImportRecipe: () => void;
    loading?: boolean;
}

const iconFor = (name: string) => INGREDIENTS.find(item => item.name.toLowerCase() === name.toLowerCase())?.emoji || 'kitchen';

const IngredientInput: React.FC<IngredientInputProps> = ({
    ingredients,
    onAdd,
    onRemove,
    onFindRecipes,
    onImportRecipe,
    loading,
}) => {
    const [value, setValue] = useState('');

    const suggestions = useMemo(() => {
        const query = value.trim().toLowerCase();
        if (!query) return [];
        return INGREDIENTS
            .filter(item => item.name.toLowerCase().includes(query))
            .filter(item => !ingredients.some(selected => selected.toLowerCase() === item.name.toLowerCase()))
            .slice(0, 5);
    }, [ingredients, value]);

    const submit = () => {
        if (!value.trim()) return;
        onAdd(value);
        setValue('');
    };

    return (
        <div className="space-y-4">
            <label className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-base-content/10 bg-base-200/60 px-4 transition focus-within:border-primary/45 focus-within:bg-white">
                <span className="material-symbols-outlined text-primary">search</span>
                <input
                    className="no-focus-ring min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-base-content/35"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            submit();
                        }
                    }}
                    placeholder="What ingredients do you have?"
                />
                <button type="button" onClick={submit} className="btn btn-primary btn-sm btn-circle shadow-none">
                    <span className="material-symbols-outlined text-base">add</span>
                </button>
            </label>

            {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {suggestions.map(item => (
                        <button key={item.name} onClick={() => { onAdd(item.name); setValue(''); }} className="btn btn-xs rounded-full border-base-content/10 bg-white text-base-content/70 shadow-none">
                            <span className="material-symbols-outlined text-sm">{item.emoji}</span>
                            {item.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                {ingredients.map(item => (
                    <button key={item} onClick={() => onRemove(item)} className="btn btn-sm rounded-full border-primary/20 bg-primary/10 text-primary shadow-none hover:bg-primary/15">
                        <span className="material-symbols-outlined text-base">{iconFor(item)}</span>
                        {item}
                        <span className="material-symbols-outlined text-base">close</span>
                    </button>
                ))}
            </div>

            <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-base-content/45">Quick adds</p>
                <div className="grid grid-cols-4 gap-2">
                    {QUICK_INGREDIENTS.map(item => (
                        <button
                            key={item}
                            onClick={() => onAdd(item)}
                            className="flex h-14 flex-col items-center justify-center rounded-2xl border border-base-content/10 bg-white text-center text-[11px] font-black shadow-sm shadow-base-content/[0.03] transition hover:border-primary/25 hover:bg-primary/5 active:scale-95"
                        >
                            <span className="material-symbols-outlined mb-0.5 text-lg text-primary">{iconFor(item)}</span>
                            <span className="max-w-full truncate px-1">{item}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3">
                <button onClick={onFindRecipes} disabled={ingredients.length === 0 || loading} className="btn btn-primary h-[52px] rounded-2xl px-5 text-sm shadow-md shadow-primary/15">
                    <span className="material-symbols-outlined text-xl">search</span>
                    {loading ? 'Finding recipes...' : `Find ${ingredients.length ? 'Matching' : ''} Recipes`}
                </button>
                <button onClick={onImportRecipe} aria-label="Import a recipe" className="btn h-[52px] w-14 rounded-2xl border-base-content/10 bg-white px-0 text-primary shadow-sm">
                    <span className="material-symbols-outlined">download</span>
                </button>
            </div>
        </div>
    );
};

export default IngredientInput;
