import React, { useRef } from 'react';
import { Recipe } from '@/types';

import { getYouTubeThumbnail, isYouTubeUrl } from '@/utils/mediaHelpers';

const getDisplayImage = (url: string): string => {
    if (!url) return '';
    if (isYouTubeUrl(url)) {
        return getYouTubeThumbnail(url) || url;
    }
    return url;
};

interface TrendingSectionProps {
    recipes: Recipe[];
    onRecipeClick: (recipe: Recipe) => void;
}

const TrendingSection: React.FC<TrendingSectionProps> = ({ recipes, onRecipeClick }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const dragDistance = useRef(0);

    const onMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        dragDistance.current = 0;
        if (scrollRef.current) {
            startX.current = e.pageX - scrollRef.current.offsetLeft;
            scrollLeft.current = scrollRef.current.scrollLeft;
        }
    };

    const onMouseLeave = () => {
        isDragging.current = false;
    };

    const onMouseUp = () => {
        isDragging.current = false;
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        e.preventDefault();
        if (scrollRef.current) {
            const x = e.pageX - scrollRef.current.offsetLeft;
            const walk = (x - startX.current) * 1.5; 
            scrollRef.current.scrollLeft = scrollLeft.current - walk;
            dragDistance.current += Math.abs(e.movementX);
        }
    };

    const handleClick = (e: React.MouseEvent, recipe: Recipe) => {
        if (dragDistance.current > 5) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        onRecipeClick(recipe);
    };

    if (recipes.length === 0) return null;

    return (
        <div className="mb-5">
            <div className="flex items-center gap-2 px-5 mb-3">
                <span className="text-xl">🔥</span>
                <h2 className="font-black text-base text-base-content">Trending This Week</h2>
            </div>
            <div 
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1 cursor-grab active:cursor-grabbing"
                onMouseDown={onMouseDown}
                onMouseLeave={onMouseLeave}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
            >
                {recipes.map((recipe, i) => (
                    <button
                        key={recipe.id}
                        onClick={(e) => handleClick(e, recipe)}
                        className="flex-shrink-0 w-40 group text-left outline-none"
                    >
                        <div className="relative w-40 h-44 rounded-2xl overflow-hidden shadow-md user-select-none pointer-events-none">
                            <img
                                src={getDisplayImage(recipe.image)}
                                alt={recipe.title}
                                className="w-full h-full object-cover group-active:scale-105 transition-transform duration-300"
                                onError={(e) => { console.log('trending img fail:', recipe.image); (e.target as HTMLImageElement).style.display = 'none'; }}
                                draggable={false}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            {/* Rank badge */}
                            <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg
                                ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-400 text-orange-900' : 'bg-base-100/80 text-base-content'}`}>
                                {i + 1}
                            </div>
                            <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-white font-bold text-xs leading-tight line-clamp-2">{recipe.title}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-yellow-400 text-[10px]">★</span>
                                    <span className="text-white/80 text-[10px]">{recipe.rating.toFixed(1)}</span>
                                    <span className="text-white/40 text-[10px]">·</span>
                                    <span className="text-white/80 text-[10px]">{recipe.prepTime}</span>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TrendingSection;
