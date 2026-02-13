
import React, { useState } from 'react';
import { Recipe } from '@/types';

interface SavedRecipesScreenProps {
    recipes: Recipe[];
    onRecipeClick: (recipe: Recipe) => void;
    onToggleFavorite: (id: string) => void;
    onBack: () => void;
}

const SavedRecipesScreen: React.FC<SavedRecipesScreenProps> = ({ recipes, onRecipeClick, onToggleFavorite, onBack }) => {
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');

    const savedRecipes = recipes.filter(r => r.isFavorite);
    const filtered = savedRecipes.filter(r => {
        const matchesFilter = filter === 'All' || r.category.toLowerCase() === filter.toLowerCase();
        const query = search.toLowerCase().trim();
        const isSearchActive = query.length >= 3;
        const matchesSearch = !isSearchActive || r.title.toLowerCase().includes(query);
        return matchesFilter && matchesSearch;
    });

    const filterChips = ['All', 'Breakfast', 'Vegan', 'Dinner', 'Seafood'];
    const showSearchHint = search.trim().length > 0 && search.trim().length < 3;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-background-dark">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-4 pt-6 pb-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span onClick={onBack} className="material-symbols-outlined text-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-full transition-colors">arrow_back</span>
                        <h1 className="text-2xl font-bold tracking-tight">Saved Recipes</h1>
                    </div>
                    <button className="bg-primary/20 p-2 rounded-full">
                        <span className="material-symbols-outlined text-black dark:text-white">tune</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-2">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-gray-400">search</span>
                    </div>
                    <input
                        className="w-full bg-[#f5f4f0] dark:bg-[#323120] border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary text-sm placeholder:text-slate-400"
                        placeholder="Search your bookmarks..."
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {showSearchHint && (
                    <p className="text-[10px] font-bold text-primary mb-2 animate-pulse uppercase tracking-wider">
                        Type at least 3 characters to search...
                    </p>
                )}

                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {filterChips.map(chip => (
                        <button
                            key={chip}
                            onClick={() => setFilter(chip)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${filter === chip
                                    ? 'bg-primary text-black shadow-sm'
                                    : 'bg-[#f5f4f0] dark:bg-[#323120] text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            {chip}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Grid */}
            <main className="flex-1 px-4 py-4 pb-32">
                {filtered.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {filtered.map(recipe => (
                            <div
                                key={recipe.id}
                                className="flex flex-col gap-2 group cursor-pointer animate-in fade-in zoom-in-95 duration-300"
                                onClick={() => onRecipeClick(recipe)}
                            >
                                <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm">
                                    <img
                                        alt={recipe.title}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                                        src={recipe.image}
                                    />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id); }}
                                        className="absolute top-2 right-2 bg-white/90 dark:bg-black/50 p-1.5 rounded-full shadow-md active:scale-90 transition-transform"
                                    >
                                        <span className={`material-symbols-outlined fill-icon text-red-500 text-xl`}>favorite</span>
                                    </button>
                                    <div className="absolute bottom-2 left-2">
                                        <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm capitalize font-bold">{recipe.category}</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm leading-tight line-clamp-1">{recipe.title}</h3>
                                    <div className="flex items-center gap-2 mt-1 opacity-70">
                                        <div className="flex items-center gap-0.5">
                                            <span className="material-symbols-outlined text-xs">schedule</span>
                                            <span className="text-[10px] font-medium">{recipe.prepTime}</span>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            <span className="material-symbols-outlined text-xs">local_fire_department</span>
                                            <span className="text-[10px] font-medium">{recipe.kcal} kcal</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                        <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
                        <p className="text-lg font-medium">No saved recipes match your search.</p>
                        <button
                            onClick={() => { setSearch(''); setFilter('All'); }}
                            className="mt-6 text-primary font-bold"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SavedRecipesScreen;
