
import React from 'react';
import { Recipe } from '@/types';

interface RecipeCardProps {
    recipe: Recipe;
    onClick: (recipe: Recipe) => void;
    onToggleFavorite?: (id: string) => void;
    showCategory?: boolean;
    index?: number;
    onEdit?: (recipe: Recipe) => void;
    onDelete?: (recipe: Recipe) => void;
    onUpdateStatus?: (recipe: Recipe, status: 'published' | 'draft') => void;
}
const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, onToggleFavorite, showCategory, index = 0, onEdit, onDelete, onUpdateStatus }) => {
    // Deterministic random aspect ratio for masonry effect
    const aspectRatios = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-[1/1]', 'aspect-[4/3]'];
    const aspectClass = aspectRatios[index % aspectRatios.length];

    return (
        <div
            className="card card-compact bg-base-100 shadow-sm border border-base-200 cursor-pointer active:scale-95 transition-transform overflow-hidden break-inside-avoid mb-4"
            onClick={() => onClick(recipe)}
        >
            <figure className={`relative w-full ${aspectClass}`}>
                {recipe.image?.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || recipe.image?.includes('video') ? (
                    <video
                        src={recipe.image}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                ) : (
                    <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite?.(recipe.id);
                    }}
                    className={`absolute top-3 right-3 size-8 btn btn-circle glass border-none hover:bg-white/20 active:scale-90 transition-all ${recipe.isFavorite ? 'text-red-500' : 'text-white'}`}
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

            {/* Management Actions */}
            {(onEdit || onDelete || onUpdateStatus) && (
                <div className="flex items-center justify-between p-3 pt-1 border-t border-base-200">
                    <div className="flex gap-2">
                        {onUpdateStatus && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(recipe, recipe.status === 'draft' ? 'published' : 'draft');
                                }}
                                className={`btn btn-sm btn-square rounded-xl transition-all border-none bg-base-200/50 text-base-content/70 hover:bg-warning hover:text-white shadow-sm`}
                                title={recipe.status === 'draft' ? 'Publish Recipe' : 'Set to Draft'}
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    {recipe.status === 'draft' ? 'visibility' : 'visibility_off'}
                                </span>
                            </button>
                        )}
                        {onEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(recipe);
                                }}
                                className="btn btn-sm btn-square rounded-xl bg-base-200/50 text-base-content/70 hover:bg-primary hover:text-white transition-all border-none shadow-sm"
                                title="Edit Recipe"
                            >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                        )}
                    </div>
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(recipe);
                            }}
                            className="btn btn-sm btn-square rounded-xl bg-base-200/50 text-base-content/70 hover:bg-error hover:text-white transition-all border-none shadow-sm"
                            title="Delete Recipe"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default RecipeCard;
