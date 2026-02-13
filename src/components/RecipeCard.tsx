
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
            className="card card-compact bg-base-100 shadow-sm border border-base-200 cursor-pointer active:scale-95 transition-transform"
            onClick={() => onClick(recipe)}
        >
            <figure className="relative h-40">
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
                    className={`absolute top-2 right-2 btn btn-circle btn-xs glass ${recipe.isFavorite ? 'text-red-500' : 'text-base-content/40'}`}
                >
                    <span className={`material-symbols-outlined text-lg ${recipe.isFavorite ? 'fill-1' : ''}`}>
                        {recipe.isFavorite ? 'heart_check' : 'favorite'}
                    </span>
                </button>
            </figure>
            <div className="card-body !p-3">
                <h4 className="font-bold text-sm leading-snug line-clamp-1 text-base-content">{recipe.title}</h4>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-base-content/50 text-xs">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span>{recipe.prepTime}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="material-symbols-outlined text-sm text-warning fill-1">star</span>
                        <span className="font-bold text-base-content">{recipe.rating}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecipeCard;
