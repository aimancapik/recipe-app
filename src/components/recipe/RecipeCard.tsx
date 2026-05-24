import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Recipe } from '@/types';
import { isVideoUrl, getNormalizedVideoUrl, isYouTubeUrl, getYouTubeThumbnail } from '@/utils/mediaHelpers';
import { supabase } from '@/lib/supabase';
import { getAvatarUrl } from '@/constants/avatars';

interface RecipeCardProps {
    recipe: Recipe;
    onClick: (recipe: Recipe) => void;
    onToggleFavorite?: (id: string) => void;
    showCategory?: boolean;
    index?: number;
    onEdit?: (recipe: Recipe) => void;
    onDelete?: (recipe: Recipe) => void;
    onUpdateStatus?: (recipe: Recipe, status: 'published' | 'draft') => Promise<void>;
    onChefClick?: (userId: string) => void;
}

interface ChefProfile {
    full_name: string;
    avatar_url: string;
}

// Simple in-memory cache for chef profiles
const profileCache = new Map<string, ChefProfile>();
// Generation counter per userId — incremented on clear so in-flight fetches discard stale results
const cacheGeneration = new Map<string, number>();
const cacheListeners = new Set<() => void>();

export const clearProfileCache = (userId?: string) => {
    if (userId) {
        profileCache.delete(userId);
        cacheGeneration.set(userId, (cacheGeneration.get(userId) ?? 0) + 1);
    } else {
        profileCache.clear();
        cacheGeneration.clear();
    }
    // Notify all mounted RecipeCards to re-fetch
    cacheListeners.forEach(fn => fn());
};

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, onToggleFavorite, showCategory, index = 0, onEdit, onDelete, onUpdateStatus, onChefClick }) => {
    // Deterministic random aspect ratio for masonry effect
    const aspectRatios = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-[1/1]', 'aspect-[4/3]'];
    const aspectClass = aspectRatios[index % aspectRatios.length];

    const [isHovered, setIsHovered] = useState(false);
    const [chef, setChef] = useState<ChefProfile | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [isAnimatingFavorite, setIsAnimatingFavorite] = useState(false);

    const handleUpdateStatus = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onUpdateStatus) return;

        try {
            setIsUpdatingStatus(true);
            await onUpdateStatus(recipe, recipe.status === 'draft' ? 'published' : 'draft');
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Track a version counter so this effect re-runs when clearProfileCache is called
    const [cacheVersion, setCacheVersion] = useState(0);

    useEffect(() => {
        const notify = () => setCacheVersion(v => v + 1);
        cacheListeners.add(notify);
        return () => { cacheListeners.delete(notify); };
    }, []);

    // Fetch chef profile
    useEffect(() => {
        if (!recipe.userId) return;

        // Check cache first
        if (profileCache.has(recipe.userId)) {
            setChef(profileCache.get(recipe.userId)!);
            return;
        }

        // Fetch from database — capture generation so a stale response won't overwrite a newer clear
        const userId = recipe.userId;
        const genAtFetch = cacheGeneration.get(userId) ?? 0;
        supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', userId)
            .single()
            .then(({ data }) => {
                if (data && (cacheGeneration.get(userId) ?? 0) === genAtFetch) {
                    profileCache.set(userId, data);
                    setChef(data);
                }
            });
    }, [recipe.userId, cacheVersion]);

    return (
        <div
            className="group relative lec-card cursor-pointer active:scale-[0.97] transition-all duration-300 overflow-hidden break-inside-avoid hover:shadow-xl hover:shadow-primary/10"
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
                        {isYouTubeUrl(recipe.image) ? (
                            <img
                                src={getYouTubeThumbnail(recipe.image) || recipe.image}
                                alt={recipe.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <ReactPlayer
                                src={getNormalizedVideoUrl(recipe.image)}
                                playing={isHovered}
                                muted
                                loop
                                playsInline
                                width="100%"
                                height="100%"
                                className="absolute top-0 left-0 object-cover"
                            />
                        )}
                        {/* Video indicator */}
                        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm z-10">
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
                            <div className="w-full h-full bg-gradient-to-br from-primary/15 via-base-200 to-secondary/15 flex items-center justify-center">
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
                        if (!recipe.isFavorite) {
                            setIsAnimatingFavorite(true);
                            setTimeout(() => setIsAnimatingFavorite(false), 400);
                        }
                        onToggleFavorite?.(recipe.id);
                    }}
                    className={`absolute top-2.5 right-2.5 size-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 ${recipe.isFavorite
                        ? 'bg-red-500/90 text-white shadow-lg shadow-red-500/30'
                        : 'bg-black/30 text-white hover:bg-black/50'
                        } ${isAnimatingFavorite ? 'animate-favorite' : ''}`}
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
                        <span className="text-[10px] text-white font-semibold">{recipe.prepTime || 'Quick'}</span>
                    </div>
                </div>
            </figure>

            {/* Content */}
            <div className="p-3 space-y-1.5">
                <h4 className="font-black text-sm leading-snug line-clamp-2 text-base-content">{recipe.title}</h4>
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
                            {(() => {
                                const url = getAvatarUrl(chef.avatar_url);
                                return url ? (
                                    <div className="w-4 h-4 rounded-full bg-primary shrink-0 ring-1 ring-base-200 overflow-hidden">
                                        <img src={url} alt={chef.full_name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0 ring-1 ring-base-200">
                                        <span className="text-primary-content font-black" style={{ fontSize: '7px' }}>
                                            {chef.full_name?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                    </div>
                                );
                            })()}
                            <span className="text-[11px] text-base-content/50 line-clamp-1 font-medium">
                                {chef.full_name}
                            </span>
                        </div>
                    ) : (
                        <div className="flex-1" />
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-1 text-xs shrink-0">
                        <span className="material-symbols-outlined text-sm text-warning fill-1">star</span>
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
                                onClick={handleUpdateStatus}
                                disabled={isUpdatingStatus}
                                className={`btn btn-sm btn-square rounded-xl transition-all border-none shadow-sm ${isUpdatingStatus
                                    ? 'bg-base-300 pointer-events-none'
                                    : 'bg-base-200/50 text-base-content/70 hover:bg-warning hover:text-white'
                                    }`}
                                title={recipe.status === 'draft' ? 'Publish Recipe' : 'Set to Draft'}
                            >
                                {isUpdatingStatus ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                    <span className="material-symbols-outlined text-[18px]">
                                        {recipe.status === 'draft' ? 'visibility' : 'visibility_off'}
                                    </span>
                                )}
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
