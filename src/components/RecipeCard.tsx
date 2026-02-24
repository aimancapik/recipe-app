import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Recipe } from '@/types';
import { isVideoUrl } from '@/utils/mediaHelpers';
import { supabase } from '@/lib/supabase';

interface RecipeCardProps {
    recipe: Recipe;
    onClick: (recipe: Recipe) => void;
    onToggleFavorite?: (id: string) => void;
    showCategory?: boolean;
    index?: number;
    onEdit?: (recipe: Recipe) => void;
    onDelete?: (recipe: Recipe) => void;
    onUpdateStatus?: (recipe: Recipe, status: 'published' | 'draft') => void;
    onChefClick?: (userId: string) => void;
}

interface ChefProfile {
    full_name: string;
    avatar_url: string;
}

// Simple in-memory cache for chef profiles
const profileCache = new Map<string, ChefProfile>();
const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, onToggleFavorite, showCategory, index = 0, onEdit, onDelete, onUpdateStatus, onChefClick }) => {
    // Deterministic random aspect ratio for masonry effect
    const aspectRatios = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-[1/1]', 'aspect-[4/3]'];
    const aspectClass = aspectRatios[index % aspectRatios.length];

    const [isHovered, setIsHovered] = useState(false);
    const [chef, setChef] = useState<ChefProfile | null>(null);

    // Fetch chef profile
    useEffect(() => {
        if (!recipe.userId) return;

        // Check cache first
        if (profileCache.has(recipe.userId)) {
            setChef(profileCache.get(recipe.userId)!);
            return;
        }

        // Fetch from database
        supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', recipe.userId)
            .single()
            .then(({ data }) => {
                if (data) {
                    profileCache.set(recipe.userId!, data);
                    setChef(data);
                }
            });
    }, [recipe.userId]);

    return (
        <div
            className="card card-compact bg-base-100 shadow-sm border border-base-200 cursor-pointer active:scale-95 transition-transform overflow-hidden break-inside-avoid mb-4"
            onClick={() => onClick(recipe)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
        >
            <figure className={`relative w-full ${aspectClass}`}>
                {isVideoUrl(recipe.image) ? (
                    <div className="w-full h-full pointer-events-none">
                        <ReactPlayer
                            src={recipe.image}
                            playing={isHovered}
                            muted
                            loop
                            playsInline
                            width="100%"
                            height="100%"
                            className="absolute top-0 left-0 object-cover transition-transform duration-500 hover:scale-105"
                        />
                    </div>
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
                {/* Chef Attribution */}
                {chef && (
                    <div
                        className="flex items-center gap-1.5 mt-1 -mb-1 cursor-pointer hover:opacity-70 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChefClick?.(recipe.userId!);
                        }}
                    >
                        {chef.avatar_url ? (
                            <img
                                src={chef.avatar_url}
                                alt={chef.full_name}
                                className="w-4 h-4 rounded-full object-cover"
                                onError={(e) => {
                                    // Fallback to default avatar on error
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent && !parent.querySelector('.default-avatar')) {
                                        const fallback = document.createElement('div');
                                        fallback.className = 'w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center default-avatar';
                                        fallback.innerHTML = '<span class="material-symbols-outlined text-[10px] text-primary">person</span>';
                                        parent.insertBefore(fallback, parent.firstChild);
                                    }
                                }}
                            />
                        ) : (
                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[10px] text-primary">person</span>
                            </div>
                        )}
                        <span className="text-[11px] text-base-content/60 line-clamp-1">
                            {chef.full_name}
                        </span>
                    </div>
                )}
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
