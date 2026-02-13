
import React from 'react';
import { Recipe } from '@/types';

interface RecipeCardProps {
    recipe: Recipe;
    onClick: (recipe: Recipe) => void;
    onToggleFavorite?: (id: string) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, onToggleFavorite }) => {
    return (
        <div
            className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer active:scale-95 transition-transform"
            onClick={() => onClick(recipe)}
        >
            <div className="relative h-40">
                <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite?.(recipe.id);
                    }}
                    className={`absolute top-2 right-2 size-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors ${recipe.isFavorite ? 'bg-white text-red-500' : 'bg-white/80 text-slate-400'
                        }`}
                >
                    <span className={`material-symbols-outlined text-xl ${recipe.isFavorite ? 'fill-1' : ''}`}>
                        {recipe.isFavorite ? 'heart_check' : 'favorite'}
                    </span>
                </button>
            </div>
            <div className="p-3">
                <h4 className="font-bold text-sm leading-snug mb-2 line-clamp-1">{recipe.title}</h4>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span>{recipe.prepTime}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="material-symbols-outlined text-sm text-primary fill-1">star</span>
                        <span className="font-bold">{recipe.rating}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecipeCard;
