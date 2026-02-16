import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Recipe } from '@/types';
import { CATEGORIES } from '@/data/constants';
import RecipeCard from '@/components/RecipeCard';
import LoadingAnimation from '@/components/LoadingAnimation';
import { getAvatarUrl } from '@/data/avatars';

interface HomeScreenProps {
    recipes: Recipe[];
    onRecipeClick: (recipe: Recipe) => void;
    onToggleFavorite: (id: string) => void;
    onSeeAll: (category?: string) => void;
    onOpenGrocery: () => void;
    isDark: boolean;
    onToggleTheme: () => void;
    user: User | null;
    onLoadMore: () => void;
    hasMore: boolean;
    loadingMore: boolean;
    loading: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
    recipes,
    onRecipeClick,
    onToggleFavorite,
    onSeeAll,
    onOpenGrocery,
    isDark,
    onToggleTheme,
    user,
    onLoadMore,
    hasMore,
    loadingMore,
    loading
}) => {
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Chef';
    const avatarId = user?.user_metadata?.avatar_id;
    const avatarUrl = user?.user_metadata?.avatar_url || (avatarId ? getAvatarUrl(avatarId) : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100');
    const [activeCategory, setActiveCategory] = useState('popular');
    const [searchValue, setSearchValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const searchQuery = searchValue.trim().toLowerCase();
    const isSearching = searchQuery.length >= 2;

    const filteredRecipes = recipes.filter(r => {
        const matchesCategory = activeCategory === 'popular' || r.category === activeCategory;
        if (!isSearching) return matchesCategory;
        return matchesCategory && (
            r.title.toLowerCase().includes(searchQuery) ||
            r.ingredients.some(ing => ing.toLowerCase().includes(searchQuery)) ||
            r.category.toLowerCase().includes(searchQuery)
        );
    });

    // Debug: Log filtering results
    console.log('Active Category:', activeCategory);
    console.log('Total Recipes:', recipes.length);
    console.log('Filtered Recipes:', filteredRecipes.length);
    console.log('Filtered Recipe Categories:', filteredRecipes.map(r => ({ title: r.title, category: r.category })));

    // Intersection Observer for Infinite Scroll
    const observerTarget = React.useRef(null);

    // Keep latest values in refs so the observer callback always reads fresh state
    const stateRef = React.useRef({ hasMore, loadingMore, loading, onLoadMore });
    React.useEffect(() => {
        stateRef.current = { hasMore, loadingMore, loading, onLoadMore };
    });

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                const { hasMore, loadingMore, loading, onLoadMore } = stateRef.current;
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    onLoadMore();
                }
            },
            {
                threshold: 0.1,
                rootMargin: '200px'
            }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Set up once — callback reads fresh values from refs

    const inputRef = React.useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col pb-20">
            <header className="flex items-center justify-between p-4 pt-6">
                <div className="flex items-center gap-3">
                    <div className="avatar">
                        <div className="w-12 aspect-square rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
                            <img src={avatarUrl} alt="Profile" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold leading-tight tracking-tight text-base-content">Hello, {displayName}!</h2>
                        <p className="text-base-content/50 text-sm">What are you cooking today?</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleTheme}
                        className="btn btn-ghost btn-circle btn-sm"
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
                    </button>
                    <button onClick={onOpenGrocery} className="btn btn-ghost btn-circle btn-sm indicator">
                        <span className="indicator-item badge badge-error badge-xs"></span>
                        <span className="material-symbols-outlined">shopping_bag</span>
                    </button>
                </div>
            </header>

            {/* Search Bar */}
            <div className="px-4 py-3">
                <label
                    className={`w-full flex items-center gap-3 rounded-full px-5 py-3 transition-all border-2 ${isFocused
                        ? 'border-primary bg-base-100 shadow-lg shadow-primary/10'
                        : 'border-transparent bg-base-200'
                        }`}
                >
                    <span className={`material-symbols-outlined text-xl transition-colors ${isFocused ? 'text-primary' : 'text-base-content/40'}`}>
                        search
                    </span>
                    <input
                        ref={inputRef}
                        // Use inline styles to forcefully override global !important CSS
                        style={{ boxShadow: 'none', border: 'none', outline: 'none' }}
                        className="grow text-sm bg-transparent text-base-content placeholder:text-base-content/40 !border-none !outline-none !shadow-none p-0 h-auto"
                        placeholder="Search recipes, ingredients..."
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    {searchValue && (
                        <button
                            type="button"
                            onClick={() => { setSearchValue(''); inputRef.current?.focus(); }}
                            className="btn btn-ghost btn-circle btn-xs min-h-0 h-6 w-6"
                        >
                            <span className="material-symbols-outlined text-base-content/40 text-lg">close</span>
                        </button>
                    )}
                </label>
            </div>

            {/* Categories */}
            <div className="py-2">
                <div className="flex items-center justify-between px-4 mb-3">
                    <h3 className="text-lg font-bold text-base-content">Categories</h3>
                    <button onClick={() => onSeeAll()} className="btn btn-ghost btn-sm text-primary">See All</button>
                </div>
                <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar pb-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className="flex flex-col items-center gap-2 shrink-0 group"
                        >
                            <div className={`size-14 rounded-2xl flex items-center justify-center transition-all ${activeCategory === cat.id
                                ? 'bg-primary shadow-lg shadow-primary/20 scale-105'
                                : 'bg-base-200'
                                }`}>
                                <span className={`material-symbols-outlined text-2xl ${activeCategory === cat.id ? 'text-primary-content fill-1' : 'text-base-content/60'
                                    }`}>
                                    {cat.icon}
                                </span>
                            </div>
                            <span className={`text-xs ${activeCategory === cat.id ? 'font-bold text-base-content' : 'font-medium text-base-content/60'}`}>
                                {cat.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recipes Section */}
            <div className="flex-1 px-4 py-4 min-h-[400px]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-base-content">
                        {isSearching
                            ? `Results (${filteredRecipes.length})`
                            : activeCategory === 'popular' ? 'Popular Recipes' : `${activeCategory} Recipes`}
                    </h3>
                    {!isSearching && (
                        <button onClick={() => onSeeAll(activeCategory === 'popular' ? undefined : activeCategory)} className="btn btn-ghost btn-sm text-primary">See All</button>
                    )}
                </div>

                {filteredRecipes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {filteredRecipes.map((recipe) => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                onClick={() => onRecipeClick(recipe)}
                                onToggleFavorite={onToggleFavorite}
                                showCategory={activeCategory === 'popular'}
                            />
                        ))}
                    </div>
                ) : isSearching && !loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-base-content/40">
                        <span className="material-symbols-outlined text-5xl mb-3">search_off</span>
                        <p className="text-base font-medium">No recipes found</p>
                        <p className="text-sm mt-1">Try a different keyword or category</p>
                    </div>
                ) : null}

                {/* Loading Sentinel */}
                <div ref={observerTarget} className="flex flex-col items-center justify-center min-h-[100px] py-8 opacity-60">
                    {(loading || loadingMore) ? (
                        <div className="flex flex-col items-center gap-3">
                            <LoadingAnimation size={50} />
                            {loading && <p className="text-xs font-bold uppercase tracking-widest text-base-content/40">Gathering Ingredients...</p>}
                        </div>
                    ) : (
                        !hasMore && recipes.length > 0 && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="size-1 w-12 rounded-full bg-base-content/10 mb-2"></div>
                                <p className="text-sm font-medium text-base-content/30 italic">You've reached the end of the pantry!</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};


export default HomeScreen;
