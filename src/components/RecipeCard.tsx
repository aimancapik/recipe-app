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
    const [imgError, setImgError] = useState(false);

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
            className="group relative bg-base-100 rounded-2xl cursor-pointer active:scale-[0.97] transition-all duration-300 overflow-hidden break-inside-avoid mb-4 shadow-sm hover:shadow-xl hover:shadow-base-content/5 border border-base-200/80"
            onClick={() => onClick(recipe)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
        >
            {/* Image */}
            <figure className={`relative w-full ${aspectClass} overflow-hidden`}>
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
                            className="absolute top-0 left-0 object-cover"
                        />
                        {/* Video indicator */}
                        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                            <span className="material-symbols-outlined text-white text-xs fill-1">play_arrow</span>
                            <span className="text-[10px] text-white font-semibold">VIDEO</span>
                        </div>
                    </div>
                ) : (
                    <>
                        {!imgError ? (
                            <img
                                src={recipe.image}
                                alt={recipe.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-base-content/20">restaurant</span>
                            </div>
                        )}
                    </>
                )}

                {/* Gradient overlay on bottom for text legibility */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

                {/* Favorite button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite?.(recipe.id);
                    }}
                    className={`absolute top-2.5 right-2.5 size-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 ${recipe.isFavorite
                        ? 'bg-red-500/90 text-white shadow-lg shadow-red-500/30'
                        : 'bg-black/30 text-white hover:bg-black/50'
                        }`}
                >
                    <span className={`material-symbols-outlined text-[18px] transition-all ${recipe.isFavorite ? 'fill-icon scale-110' : ''}`}>
                        {recipe.isFavorite ? 'favorite' : 'favorite_border'}
                    </span>
                </button>

                {/* Category badge */}
                {showCategory && (
                    <div className="absolute bottom-2.5 left-2.5">
                        <div className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] uppercase tracking-wider font-bold text-white">
                            {recipe.category}
                        </div>
                    </div>
                )}

                {/* Prep time badge */}
                <div className="absolute bottom-2.5 right-2.5">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md">
                        <span className="material-symbols-outlined text-white text-xs">schedule</span>
                        <span className="text-[10px] text-white font-semibold">{recipe.prepTime}</span>
                    </div>
                </div>
            </figure>

            {/* Content */}
            <div className="p-3 space-y-1.5">
                <h4 className="font-bold text-sm leading-snug line-clamp-2 text-base-content">{recipe.title}</h4>
                <div className="flex items-center justify-between">
                    {/* Chef Attribution */}
                    {chef ? (
                        <div
                            className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity min-w-0 flex-1 mr-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChefClick?.(recipe.userId!);
                            }}
                        >
                            {chef.avatar_url ? (
                                <img
                                    src={chef.avatar_url}
                                    alt={chef.full_name}
                                    className="w-4 h-4 rounded-full object-cover shrink-0 ring-1 ring-base-200"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className="w-3.5 h-3.5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[8px] text-primary">person</span>
                                </div>
                            )}
                            <span className="text-[11px] text-base-content/50 line-clamp-1 font-medium">
                                {chef.full_name}
                            </span>
                        </div>
                    ) : (
                        <div className="flex-1" />
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-1 text-xs shrink-0">
                        <span className="material-symbols-outlined text-sm text-amber-400 fill-1">star</span>
                        <span className="font-bold text-base-content">{recipe.rating}</span>
                    </div>
                </div>
            </div>

            {/* Management Actions */}
            {(onEdit || onDelete || onUpdateStatus) && (
                <div className="flex items-center justify-between p-3 pt-1 border-t border-base-200/60">
                    <div className="flex gap-1.5">
                        {onUpdateStatus && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(recipe, recipe.status === 'draft' ? 'published' : 'draft');
                                }}
                                className="btn btn-sm btn-square rounded-xl transition-all border-none bg-base-200/50 text-base-content/70 hover:bg-warning hover:text-white shadow-sm"
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
