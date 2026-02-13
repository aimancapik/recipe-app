
import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES } from '@/data/constants';
import { Recipe } from '@/types';
import { FilterOptions } from './FilterScreen';

interface ExploreScreenProps {
    recipes: Recipe[];
    initialSearch: string;
    initialCategory?: string | null;
    onRecipeClick: (recipe: Recipe) => void;
    onAIGenerate: () => void;
    onToggleFavorite: (id: string) => void;
    onOpenFilter: () => void;
    filters: FilterOptions;
}

const ExploreScreen: React.FC<ExploreScreenProps> = ({
    recipes,
    initialSearch,
    initialCategory,
    onRecipeClick,
    onAIGenerate,
    onToggleFavorite,
    onOpenFilter,
    filters
}) => {
    const [search, setSearch] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
    const [history, setHistory] = useState(['Avocado Toast', 'Quick Pasta', 'Gluten-free pancakes', 'Chicken Curry']);

    useEffect(() => {
        setSearch(initialSearch);
    }, [initialSearch]);

    useEffect(() => {
        setSelectedCategory(initialCategory || null);
    }, [initialCategory]);

    const filteredRecipes = useMemo(() => {
        let result = recipes.filter(r => {
            const query = search.toLowerCase().trim();
            const isSearchActive = query.length >= 3;
            const matchesSearch = !isSearchActive ||
                r.title.toLowerCase().includes(query) ||
                r.ingredients.some(ing => ing.toLowerCase().includes(query)) ||
                r.category.toLowerCase().includes(query);

            const matchesCategory = !selectedCategory || r.category.toLowerCase() === selectedCategory.toLowerCase();
            const matchesDifficulty = !filters.difficulty || r.level === filters.difficulty;
            const matchesDietary = filters.dietary.length === 0 ||
                filters.dietary.some(d => r.category.toLowerCase().includes(d.toLowerCase()));

            return matchesSearch && matchesCategory && matchesDifficulty && matchesDietary;
        });

        if (filters.sortBy === 'rating') {
            result = [...result].sort((a, b) => b.rating - a.rating);
        } else if (filters.sortBy === 'newest') {
            result = [...result].sort((a, b) => parseInt(b.id) - parseInt(a.id));
        }

        return result;
    }, [recipes, search, selectedCategory, filters]);

    const clearHistory = () => setHistory([]);
    const removeHistoryItem = (item: string) => setHistory(prev => prev.filter(i => i !== item));

    const isSearching = (search.trim().length >= 3) || selectedCategory !== null;
    const showSearchHint = search.trim().length > 0 && search.trim().length < 3;

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (search.trim().length >= 3 && !history.includes(search)) {
            setHistory(prev => [search, ...prev.slice(0, 4)]);
        }
    };

    const handleClearFilters = () => {
        setSearch('');
        setSelectedCategory(null);
    };

    return (
        <div className="flex flex-col min-h-screen bg-base-200">
            <div className="sticky top-0 z-10 bg-base-200/95 backdrop-blur-md px-4 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold tracking-tight text-base-content">Explore</h1>
                    <button
                        onClick={onAIGenerate}
                        className="btn btn-primary btn-circle btn-sm shadow-lg animate-pulse"
                        title="Generate with AI"
                    >
                        <span className="material-symbols-outlined fill-icon">auto_awesome</span>
                    </button>
                </div>
                <form onSubmit={handleSearchSubmit} className="join w-full">
                    <label className="input input-bordered join-item flex-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base-content/40">search</span>
                        <input
                            className="grow"
                            placeholder="Search for recipes, ingredients..."
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </label>
                    <button
                        type="button"
                        onClick={onOpenFilter}
                        className="btn btn-primary join-item indicator"
                    >
                        <span className="material-symbols-outlined">tune</span>
                        {(filters.cookingTime || filters.dietary.length > 0 || filters.difficulty) && (
                            <span className="indicator-item badge badge-error badge-xs"></span>
                        )}
                    </button>
                </form>

                {showSearchHint && (
                    <p className="text-[10px] font-bold text-primary mt-2 animate-pulse uppercase tracking-wider">
                        Type at least 3 characters to search...
                    </p>
                )}

                {selectedCategory && (
                    <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs font-bold text-base-content/40 uppercase tracking-widest">Active Category:</span>
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className="badge badge-primary gap-1 cursor-pointer"
                        >
                            {selectedCategory}
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                )}
            </div>

            <main className="px-4 pb-20">
                {!isSearching ? (
                    <>
                        <div className="flex items-center justify-between mb-4 mt-6">
                            <h2 className="text-xl font-bold text-base-content">Categories</h2>
                            <button onClick={handleClearFilters} className="btn btn-ghost btn-sm text-base-content/40">View All</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {CATEGORIES.map(cat => (
                                <div
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className="relative group cursor-pointer overflow-hidden rounded-2xl aspect-square shadow-sm active:scale-95 transition-transform"
                                >
                                    <img
                                        src={cat.image || `https://picsum.photos/400/400?sig=${cat.id}`}
                                        alt={cat.name}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                                        <p className="text-white font-bold text-lg">{cat.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {history.length > 0 && (
                            <div className="mt-10 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-base-content">Recently Searched</h2>
                                    <button onClick={clearHistory} className="btn btn-ghost btn-sm text-primary">Clear all</button>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {history.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between py-2 border-b border-base-300"
                                        >
                                            <div
                                                className="flex items-center gap-3 cursor-pointer flex-1 group"
                                                onClick={() => setSearch(item)}
                                            >
                                                <span className="material-symbols-outlined text-base-content/40 group-hover:text-primary transition-colors">history</span>
                                                <span className="font-medium text-base-content/70 group-hover:text-base-content transition-colors">{item}</span>
                                            </div>
                                            <button onClick={() => removeHistoryItem(item)} className="btn btn-ghost btn-circle btn-xs">
                                                <span className="material-symbols-outlined text-base-content/40 text-xl hover:text-red-500 transition-colors">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-base-content">Results ({filteredRecipes.length})</h2>
                            {(search.length >= 3 || selectedCategory) && (
                                <button onClick={handleClearFilters} className="btn btn-ghost btn-sm text-primary">Clear all</button>
                            )}
                        </div>
                        {filteredRecipes.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {filteredRecipes.map(recipe => (
                                    <div
                                        key={recipe.id}
                                        className="card card-compact bg-base-100 shadow-sm cursor-pointer active:scale-95 transition-transform"
                                        onClick={() => onRecipeClick(recipe)}
                                    >
                                        <figure className="relative h-40">
                                            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id); }}
                                                className={`absolute top-2 right-2 btn btn-circle btn-xs glass ${recipe.isFavorite ? 'text-red-500' : 'text-base-content/40'}`}
                                            >
                                                <span className={`material-symbols-outlined text-lg ${recipe.isFavorite ? 'fill-icon' : ''}`}>favorite</span>
                                            </button>
                                            <div className="absolute bottom-2 left-2">
                                                <div className="badge badge-neutral badge-sm capitalize">{recipe.category}</div>
                                            </div>
                                        </figure>
                                        <div className="card-body !p-3">
                                            <h4 className="font-bold text-sm leading-snug line-clamp-1">{recipe.title}</h4>
                                            <div className="flex items-center justify-between text-[10px] text-base-content/50">
                                                <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">schedule</span>{recipe.prepTime}</span>
                                                <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs text-warning fill-icon">star</span>{recipe.rating}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-base-content/40">
                                <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
                                <p className="text-lg font-medium">No matches for your selection.</p>
                                <p className="text-sm">Try adjusting your search or category.</p>
                                <button onClick={handleClearFilters} className="btn btn-primary btn-sm mt-6">
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ExploreScreen;
