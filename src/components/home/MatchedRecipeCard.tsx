import React from 'react';
import { Recipe } from '@/types';

interface MatchedRecipeCardProps {
    recipe: Recipe;
    selectedIngredients: string[];
    onClick: (recipe: Recipe) => void;
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, '');

const MatchedRecipeCard: React.FC<MatchedRecipeCardProps> = ({ recipe, selectedIngredients, onClick }) => {
    const matched = recipe.matchedIngredientsCount ?? recipe.ingredients.filter(ingredient =>
        selectedIngredients.some(selected => normalize(ingredient).includes(normalize(selected)))
    ).length;
    const total = recipe.totalIngredientsCount || recipe.ingredients.length || Math.max(matched, selectedIngredients.length);
    const percent = total > 0 ? Math.round((matched / total) * 100) : 0;

    return (
        <button onClick={() => onClick(recipe)} className="w-full overflow-hidden rounded-[1.35rem] border border-base-content/10 bg-white text-left shadow-[0_14px_34px_rgba(27,27,27,0.06)] transition active:scale-[0.99]">
            <div className="flex gap-3 p-3">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-base-200">
                    <img src={recipe.image} alt="" className="h-full w-full object-cover" />
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-primary shadow-sm">{percent}%</span>
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-base-content/45">
                        <span>{recipe.prepTime}</span>
                        <span className="size-1 rounded-full bg-base-content/20" />
                        <span>{recipe.level}</span>
                    </div>
                    <h3 className="mt-1 line-clamp-2 text-[15px] font-black leading-tight text-base-content">{recipe.title}</h3>
                    <p className="mt-1.5 text-xs font-semibold text-base-content/50">You have {matched}/{total} ingredients</p>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-base-200">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, percent)}%` }} />
                    </div>
                    {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                        <p className="mt-2 truncate text-[11px] font-medium text-base-content/45">
                            Missing: {recipe.missingIngredients.slice(0, 3).join(', ')}
                        </p>
                    )}
                </div>
            </div>
        </button>
    );
};

export default MatchedRecipeCard;
