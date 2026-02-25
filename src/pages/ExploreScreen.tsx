
import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES } from '@/data/constants';
import { Recipe } from '@/types';
import { FilterOptions } from './FilterScreen';
import RecipeCard from '@/components/RecipeCard';
import RecipeMasonryGrid from '@/components/RecipeMasonryGrid';

interface ExploreScreenProps {
    recipes: Recipe[];
    initialSearch: string;
    initialCategory?: string | null;
    onRecipeClick: (recipe: Recipe) => void;
    onAIGenerate: () => void;
    onToggleFavorite: (id: string) => void;
    onOpenFilter: () => void;
    filters: FilterOptions;
    onRefresh: (search: string, category: string, feed?: 'forYou' | 'following', followerId?: string, ingredients?: string[]) => void;
}

const ExploreScreen: React.FC<ExploreScreenProps> = ({
    recipes,
    initialSearch,
    initialCategory,
    onRecipeClick,
    onAIGenerate,
    onToggleFavorite,
    onOpenFilter,
    filters,
    onRefresh
}) => {
    const [search, setSearch] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [ingredientInput, setIngredientInput] = useState('');

    // Handle server-side filtering with debouncing
    useEffect(() => {
        const timer = setTimeout(() => {
            onRefresh(search.trim(), selectedCategory || '', 'forYou', undefined, ingredients);
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [search, selectedCategory, ingredients, onRefresh]);

    const [history, setHistory] = useState<string[]>(() => {
        const saved = localStorage.getItem('recipe_search_history');
        return saved ? JSON.parse(saved) : ['Avocado Toast', 'Quick Pasta', 'Gluten-free pancakes', 'Chicken Curry'];
    });

    useEffect(() => {
        localStorage.setItem('recipe_search_history', JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        setSearch(initialSearch);
    }, [initialSearch]);

    useEffect(() => {
        setSelectedCategory(initialCategory || null);
    }, [initialCategory]);

    const parsePrepTime = (timeStr: string): number => {
        const num = parseInt(timeStr.replace(/[^0-9]/g, ''));
        return isNaN(num) ? 0 : num;
    };

    const filteredRecipes = useMemo(() => {
        let result = recipes.filter(r => {
            const matchesDifficulty = !filters.difficulty || r.level === filters.difficulty;

            // Improved dietary matching: Check category, title, AND ingredients
            const matchesDietary = filters.dietary.length === 0 ||
                filters.dietary.every(d => {
                    const dietQuery = d.toLowerCase();
                    return r.category.toLowerCase().includes(dietQuery) ||
                        r.title.toLowerCase().includes(dietQuery) ||
                        r.ingredients.some(ing => ing.toLowerCase().includes(dietQuery));
                });

            // Cooking time matching
            let matchesTime = true;
            if (filters.cookingTime) {
                const mins = parsePrepTime(r.prepTime);
                if (filters.cookingTime === 'under15') matchesTime = mins < 15;
                else if (filters.cookingTime === '15to30') matchesTime = mins >= 15 && mins <= 30;
                else if (filters.cookingTime === '30to60') matchesTime = mins > 30 && mins <= 60;
                else if (filters.cookingTime === '60plus') matchesTime = mins > 60;
            }

            return matchesDifficulty && matchesDietary && matchesTime;
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
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent pb-1">Explore</h1>
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

                <div className="mt-3">
                    <form
                        className="flex items-center gap-2 mb-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (ingredientInput.trim() && !ingredients.includes(ingredientInput.trim().toLowerCase())) {
                                setIngredients([...ingredients, ingredientInput.trim().toLowerCase()]);
                                setIngredientInput('');
                            }
                        }}
                    >
                        <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider">Pantry Match</span>
                        <input
                            type="text"
                            placeholder="Add ingredient (e.g. egg, milk)"
                            className="input input-sm input-bordered flex-1 rounded-full text-sm"
                            value={ingredientInput}
                            onChange={(e) => setIngredientInput(e.target.value)}
                        />
                        <button type="submit" className="btn btn-sm btn-circle btn-primary shadow-sm" disabled={!ingredientInput.trim()}>
                            <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                    </form>
                    {ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {ingredients.map(ing => (
                                <div key={ing} className="badge badge-primary gap-1 pl-3 pr-1 py-3 text-xs font-medium shadow-sm animate-fade-in font-bold">
                                    {ing}
                                    <button
                                        type="button"
                                        onClick={() => setIngredients(ingredients.filter(i => i !== ing))}
                                        className="hover:scale-110 active:scale-95 transition-all text-primary-content bg-primary-focus rounded-full flex items-center justify-center p-0.5"
                                    >
                                        <span className="material-symbols-outlined text-[12px]">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

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

            <main className="px-4">
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
                            <RecipeMasonryGrid
                                recipes={filteredRecipes}
                                onRecipeClick={onRecipeClick}
                                onToggleFavorite={onToggleFavorite}
                                showCategory={true}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-base-content/40 animate-fade-in">
                                <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-base-200/50 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
                                    <div className="absolute inset-2 bg-base-200 rounded-full animate-pulse-soft"></div>
                                    <div className="absolute inset-4 bg-base-300 rounded-full flex items-center justify-center shadow-inner">
                                        <span className="material-symbols-outlined text-4xl text-base-content/40 relative z-10">search_off</span>
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-base-content/70 mb-2">No recipes found</p>
                                <p className="text-sm text-center px-8 text-base-content/50 leading-relaxed mb-6 max-w-xs">
                                    Try adjusting your filters or search term to discover more delicious recipes.
                                </p>
                                <button
                                    onClick={handleClearFilters}
                                    className="btn btn-outline btn-primary rounded-xl h-10 px-6 font-semibold"
                                >
                                    Reset Search & Filters
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
