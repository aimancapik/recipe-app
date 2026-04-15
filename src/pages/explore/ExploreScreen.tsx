
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CATEGORIES } from '@/constants/constants';
import { Recipe } from '@/types';
import { FilterOptions } from '@/pages/filter/FilterScreen';
import RecipeMasonryGrid from '@/components/recipe/RecipeMasonryGrid';
import { SkeletonGrid } from '@/components/common/SkeletonCard';

interface ExploreScreenProps {
    recipes: Recipe[];
    initialSearch: string;
    initialCategory?: string | null;
    onRecipeClick: (recipe: Recipe) => void;

    onToggleFavorite: (id: string) => void;
    onOpenFilter: () => void;
    filters: FilterOptions;
    onRefresh: (search: string, category: string, feed?: 'forYou' | 'following', followerId?: string, ingredients?: string[]) => void;
    loading?: boolean;
}

const ExploreScreen: React.FC<ExploreScreenProps> = ({
    recipes,
    initialSearch,
    initialCategory,
    onRecipeClick,

    onToggleFavorite,
    onOpenFilter,
    filters,
    onRefresh,
    loading = false,
}) => {
    const [search, setSearch] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync with parent-passed initial values
    useEffect(() => { setSearch(initialSearch); }, [initialSearch]);
    useEffect(() => { setSelectedCategory(initialCategory || 'all'); }, [initialCategory]);

    // Debounced server-side refresh
    useEffect(() => {
        const timer = setTimeout(() => {
            const cat = selectedCategory === 'all' ? '' : selectedCategory;
            onRefresh(search.trim(), cat, 'forYou');
        }, 400);
        return () => clearTimeout(timer);
    }, [search, selectedCategory, onRefresh]);

    const parsePrepTime = (timeStr: string): number => {
        const num = parseInt(timeStr.replace(/[^0-9]/g, ''));
        return isNaN(num) ? 0 : num;
    };

    // Client-side filter for difficulty/dietary/cookingTime/sortBy
    const filteredRecipes = useMemo(() => {
        let result = recipes.filter(r => {
            const matchesDifficulty = !filters.difficulty || r.level === filters.difficulty;
            const matchesDietary = filters.dietary.length === 0 ||
                filters.dietary.every(d => {
                    const q = d.toLowerCase();
                    return r.category.toLowerCase().includes(q) ||
                        r.title.toLowerCase().includes(q) ||
                        r.ingredients.some(ing => ing.toLowerCase().includes(q));
                });
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
    }, [recipes, filters]);

    const hasActiveFilters = filters.cookingTime || filters.dietary.length > 0 || filters.difficulty;
    const isSearching = search.trim().length >= 2;
    const showHint = search.trim().length === 1;

    const handleClearSearch = () => {
        setSearch('');
        inputRef.current?.focus();
    };

    // Category chip excluding 'all' gets its own label; 'all' = reset
    const handleCategorySelect = (catId: string) => {
        setSelectedCategory(catId);
    };

    return (
        <div className="flex flex-col min-h-screen bg-base-100">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-base-100/95 backdrop-blur-md px-5 pt-8 pb-3 border-b border-base-200/60">
                {/* Title row */}
                <div className="mb-4">
                    <p className="text-xs font-bold text-base-content/40 uppercase tracking-widest">Discover</p>
                    <h1 className="text-3xl font-black tracking-tight text-base-content">Explore</h1>
                </div>

                {/* Search bar */}
                <label
                    className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 ${
                        isFocused ? 'bg-base-100 shadow-lg shadow-primary/10 ring-1 ring-primary/20' : 'bg-base-200/70'
                    }`}
                >
                    <span className={`material-symbols-outlined text-xl transition-colors ${isFocused ? 'text-primary' : 'text-base-content/40'}`}>
                        search
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search recipes, ingredients..."
                        className="no-focus-ring grow text-sm bg-transparent text-base-content placeholder:text-base-content/40 border-0 outline-none ring-0 shadow-none appearance-none p-0 h-auto"
                        style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    <div className="flex items-center gap-1">
                        {search && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="btn btn-ghost btn-circle btn-xs min-h-0 h-6 w-6"
                            >
                                <span className="material-symbols-outlined text-base-content/40 text-lg">close</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onOpenFilter}
                            className="relative btn btn-ghost btn-circle btn-sm min-h-0 h-8 w-8"
                        >
                            <span className={`material-symbols-outlined text-xl transition-colors ${hasActiveFilters ? 'text-primary' : 'text-base-content/50'}`}>tune</span>
                            {hasActiveFilters && (
                                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-error border-2 border-base-100" />
                            )}
                        </button>
                    </div>
                </label>

                {showHint && (
                    <p className="text-[10px] font-bold text-primary mt-2 px-1 animate-pulse uppercase tracking-wider">
                        Type at least 2 characters to search…
                    </p>
                )}

                {/* Category chips — horizontal scroll */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 pb-1">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategorySelect(cat.id)}
                            className={`flex items-center gap-1.5 shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                                selectedCategory === cat.id
                                    ? 'bg-primary text-primary-content border-primary shadow-sm shadow-primary/20 scale-[1.02]'
                                    : 'bg-base-100 text-base-content/60 border-base-200 hover:border-primary/30 hover:bg-base-200/50'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-base ${selectedCategory === cat.id ? 'fill-1' : ''}`}>
                                {cat.icon}
                            </span>
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main content */}
            <main className="flex-1 px-4 pt-5 pb-28">
                {/* Results count + active filters badges */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-bold text-base-content">
                            {isSearching
                                ? `Results for "${search.trim()}"`
                                : selectedCategory === 'all'
                                    ? 'All Recipes'
                                    : `${CATEGORIES.find(c => c.id === selectedCategory)?.name || ''} Recipes`}
                        </h2>
                        {!loading && (
                            <p className="text-xs text-base-content/40 mt-0.5">
                                {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
                            </p>
                        )}
                    </div>
                    {(isSearching || selectedCategory !== 'all' || hasActiveFilters) && (
                        <button
                            onClick={() => { setSearch(''); setSelectedCategory('all'); }}
                            className="btn btn-ghost btn-xs text-primary font-bold"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {/* Skeleton loading */}
                {loading && recipes.length === 0 ? (
                    <div className="columns-2 gap-4 space-y-4">
                        <SkeletonGrid count={8} />
                    </div>
                ) : filteredRecipes.length > 0 ? (
                    <RecipeMasonryGrid
                        recipes={filteredRecipes}
                        onRecipeClick={onRecipeClick}
                        onToggleFavorite={onToggleFavorite}
                        showCategory={selectedCategory === 'all'}
                    />
                ) : (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-20 text-base-content/40 animate-fade-in">
                        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                            <div className="absolute inset-0 bg-base-200/50 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }} />
                            <div className="absolute inset-2 bg-base-200 rounded-full animate-pulse-soft" />
                            <div className="absolute inset-4 bg-base-300 rounded-full flex items-center justify-center shadow-inner">
                                <span className="material-symbols-outlined text-4xl text-base-content/40 relative z-10">search_off</span>
                            </div>
                        </div>
                        <p className="text-xl font-bold text-base-content/70 mb-2">No recipes found</p>
                        <p className="text-sm text-center px-8 text-base-content/50 leading-relaxed mb-6 max-w-xs">
                            Try a different keyword or adjust your filters.
                        </p>
                        <button
                            onClick={() => { setSearch(''); setSelectedCategory('all'); }}
                            className="btn btn-outline btn-primary rounded-xl h-10 px-6 font-semibold"
                        >
                            Reset Search &amp; Filters
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ExploreScreen;
