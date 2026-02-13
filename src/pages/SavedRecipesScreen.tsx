
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
        <div className="flex flex-col min-h-screen bg-base-200">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-base-100/80 backdrop-blur-md px-4 pt-6 pb-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="btn btn-ghost btn-circle btn-sm">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <h1 className="text-2xl font-bold tracking-tight text-base-content">Saved Recipes</h1>
                    </div>
                    <button className="btn btn-ghost btn-circle btn-sm bg-primary/20">
                        <span className="material-symbols-outlined">tune</span>
                    </button>
                </div>

                {/* Search Bar */}
                <label className="input input-bordered flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-base-content/40">search</span>
                    <input
                        className="grow"
                        placeholder="Search your bookmarks..."
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </label>

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
                            className={`btn btn-sm rounded-full ${filter === chip
                                ? 'btn-primary'
                                : 'btn-ghost bg-base-200'
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
                                className="card card-compact bg-base-100 shadow-sm cursor-pointer active:scale-95 transition-transform"
                                onClick={() => onRecipeClick(recipe)}
                            >
                                <figure className="relative aspect-square">
                                    <img
                                        alt={recipe.title}
                                        className="w-full h-full object-cover"
                                        src={recipe.image}
                                    />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id); }}
                                        className="absolute top-2 right-2 btn btn-circle btn-xs glass"
                                    >
                                        <span className="material-symbols-outlined fill-icon text-red-500 text-lg">favorite</span>
                                    </button>
                                    <div className="absolute bottom-2 left-2">
                                        <div className="badge badge-neutral badge-sm capitalize">{recipe.category}</div>
                                    </div>
                                </figure>
                                <div className="card-body !p-3">
                                    <h3 className="font-bold text-sm leading-tight line-clamp-1">{recipe.title}</h3>
                                    <div className="flex items-center gap-2 text-base-content/50 text-[10px]">
                                        <div className="flex items-center gap-0.5">
                                            <span className="material-symbols-outlined text-xs">schedule</span>
                                            <span className="font-medium">{recipe.prepTime}</span>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            <span className="material-symbols-outlined text-xs">local_fire_department</span>
                                            <span className="font-medium">{recipe.kcal} kcal</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-base-content/40 text-center">
                        <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
                        <p className="text-lg font-medium">No saved recipes match your search.</p>
                        <button
                            onClick={() => { setSearch(''); setFilter('All'); }}
                            className="btn btn-primary btn-sm mt-6"
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
