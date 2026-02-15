
import React from 'react';
import { Recipe } from '@/types';

interface RecipeCardProps {
    recipe: Recipe;
    onClick: (recipe: Recipe) => void;
    onToggleFavorite?: (id: string) => void;
    showCategory?: boolean;
}
const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, onToggleFavorite, showCategory }) => {
    return (
        <div
            className="card card-compact bg-base-100 shadow-sm border border-base-200 cursor-pointer active:scale-95 transition-transform overflow-hidden"
            onClick={() => onClick(recipe)}
        >
            <figure className="relative h-40">
                <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite?.(recipe.id);
                    }}
                    className={`absolute top-3 right-3 w-8 h-8 btn btn-circle glass border-none hover:bg-white/20 active:scale-90 transition-all ${recipe.isFavorite ? 'text-red-500' : 'text-white'}`}
                >
                    <span className={`material-symbols-outlined text-[18px] transition-all ${recipe.isFavorite ? 'fill-icon scale-110' : ''}`}>
                        {recipe.isFavorite ? 'heart_check' : 'favorite'}
                    </span>
                </button>
                {showCategory && (
                    <div className="absolute bottom-2 left-2">
                        <div className="badge badge-neutral shadow-lg border-none bg-black/60 backdrop-blur-md text-[10px] uppercase tracking-wider font-bold">
                            {recipe.category}
                        </div>
                    </div>
                )}
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
