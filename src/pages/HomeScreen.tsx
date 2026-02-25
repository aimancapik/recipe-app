import React, { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { Recipe } from '@/types';
import { CATEGORIES } from '@/data/constants';
import RecipeCard from '@/components/RecipeCard';
import RecipeMasonryGrid from '@/components/RecipeMasonryGrid';
import LoadingAnimation from '@/components/LoadingAnimation';
import { SkeletonGrid } from '@/components/SkeletonCard';
import { getAvatarUrl } from '@/data/avatars';
import PullToRefresh from '@/components/PullToRefresh';
import { useNotifications } from '@/hooks/useNotifications';

interface HomeScreenProps {
    recipes: Recipe[];
    onRecipeClick: (recipe: Recipe) => void;
    onToggleFavorite: (id: string) => void;
    onSeeAll: (category?: string) => void;
    onOpenGrocery: () => void;
    onOpenNotifications: () => void;
    isDark: boolean;
    onToggleTheme: () => void;
    user: User | null;
    onLoadMore: () => void;
    hasMore: boolean;
    loadingMore: boolean;
    loading: boolean;
    onLoginClick: () => void;
    onRefresh: (search: string, category: string, feed?: 'forYou' | 'following', followerId?: string) => void;
    onPullRefresh: () => Promise<void>;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
    recipes,
    onRecipeClick,
    onToggleFavorite,
    onSeeAll,
    onOpenGrocery,
    onOpenNotifications,
    isDark,
    onToggleTheme,
    user,
    onLoadMore,
    hasMore,
    loadingMore,
    loading,
    onLoginClick,
    onRefresh,
    onPullRefresh
}) => {
    const { unreadCount } = useNotifications();
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Chef';
    const avatarId = user?.user_metadata?.avatar_id;
    const avatarUrl = user?.user_metadata?.avatar_url || (avatarId ? getAvatarUrl(avatarId) : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100');
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchValue, setSearchValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [feedType, setFeedType] = useState<'forYou' | 'following'>('forYou');

    const isSearching = searchValue.trim().length >= 2;

    // Handle server-side filtering with debouncing
    React.useEffect(() => {
        const timer = setTimeout(() => {
            const query = searchValue.trim();
            // Category 'all' maps to empty string for the RPC
            const category = activeCategory === 'all' ? '' : activeCategory;
            onRefresh(query, category, feedType, user?.id);
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchValue, activeCategory, feedType, user?.id, onRefresh]);

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

    // The recipes are now filtered at the database level when feedType is 'following'
    const filteredRecipes = recipes;

    const inputRef = React.useRef<HTMLInputElement>(null);

    // Greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <PullToRefresh onRefresh={onPullRefresh} className="flex flex-col pb-20">
            {/* Premium Header */}
            <header className="relative px-5 pt-8 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-base-100">
                                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success border-2 border-base-100" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-base-content/50 tracking-wide">{getGreeting()} 👋</p>
                            <h2 className="text-lg font-bold leading-tight text-base-content">{displayName}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={onToggleTheme}
                            className="btn btn-ghost btn-circle btn-sm hover:bg-base-200"
                            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <span className="material-symbols-outlined text-xl">{isDark ? 'light_mode' : 'dark_mode'}</span>
                        </button>
                        <button onClick={onOpenNotifications} className="btn btn-ghost btn-circle btn-sm indicator hover:bg-base-200" title="Notifications">
                            {unreadCount > 0 && <span className="indicator-item badge badge-primary badge-xs scale-75"></span>}
                            <span className="material-symbols-outlined text-xl">notifications</span>
                        </button>
                        <button onClick={onOpenGrocery} className="btn btn-ghost btn-circle btn-sm indicator hover:bg-base-200" title="Grocery List">
                            {/* <span className="indicator-item badge badge-error badge-xs"></span> */}
                            <span className="material-symbols-outlined text-xl">shopping_bag</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Search Bar */}
            <div className="px-5 pb-3">
                <label
                    className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 ${isFocused
                        ? 'bg-base-100 shadow-lg shadow-primary/10 ring-2 ring-primary/30'
                        : 'bg-base-200/70'
                        }`}
                >
                    <span className={`material-symbols-outlined text-xl transition-colors ${isFocused ? 'text-primary' : 'text-base-content/40'}`}>
                        search
                    </span>
                    <input
                        ref={inputRef}
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

            {/* For You / Following Toggle */}
            <div className="px-5 pb-4">
                <div className="flex gap-1 p-1 bg-base-200/60 rounded-2xl w-full">
                    <button
                        onClick={() => setFeedType('forYou')}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${feedType === 'forYou'
                            ? 'bg-primary text-primary-content shadow-md shadow-primary/25'
                            : 'text-base-content/50 hover:text-base-content'
                            }`}
                    >
                        For You
                    </button>
                    <button
                        onClick={() => setFeedType('following')}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${feedType === 'following'
                            ? 'bg-primary text-primary-content shadow-md shadow-primary/25'
                            : 'text-base-content/50 hover:text-base-content'
                            }`}
                    >
                        Following
                    </button>
                </div>
            </div>

            {/* Categories */}
            <div className="pb-2">
                <div className="flex gap-3 overflow-x-auto px-5 no-scrollbar pb-3">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-2xl transition-all duration-300 border ${activeCategory === cat.id
                                ? 'bg-primary text-primary-content border-primary shadow-md shadow-primary/20 scale-[1.02]'
                                : 'bg-base-100 text-base-content/70 border-base-200 hover:border-primary/30 hover:bg-base-200/50'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-lg ${activeCategory === cat.id ? 'fill-1' : ''}`}>
                                {cat.icon}
                            </span>
                            <span className="text-sm font-semibold whitespace-nowrap">
                                {cat.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recipes Section */}
            <div className="flex-1 px-4 py-2 min-h-[400px]">
                <div className="flex items-center justify-between mb-4 px-1">
                    <div>
                        <h3 className="text-lg font-bold text-base-content">
                            {isSearching
                                ? `Results`
                                : activeCategory === 'all' ? 'All Recipes' : `${CATEGORIES.find(c => c.id === activeCategory)?.name || activeCategory} `}
                        </h3>
                        <p className="text-xs text-base-content/40 mt-0.5">
                            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
                        </p>
                    </div>
                    {!isSearching && (
                        <button
                            onClick={() => onSeeAll(activeCategory === 'all' ? undefined : activeCategory)}
                            className="text-sm font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all"
                        >
                            See All
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    )}
                </div>

                {loading && recipes.length === 0 ? (
                    <div className="columns-2 gap-4 space-y-4">
                        <SkeletonGrid count={8} />
                    </div>
                ) : filteredRecipes.length > 0 ? (
                    <RecipeMasonryGrid
                        recipes={filteredRecipes}
                        onRecipeClick={onRecipeClick}
                        onToggleFavorite={onToggleFavorite}
                        showCategory={activeCategory === 'all'}
                    />
                ) : isSearching && !loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-base-content/40 animate-fade-in">
                        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                            <div className="absolute inset-0 bg-base-200/50 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
                            <div className="absolute inset-2 bg-base-200 rounded-full animate-pulse-soft"></div>
                            <div className="absolute inset-4 bg-base-300 rounded-full flex items-center justify-center shadow-inner">
                                <span className="material-symbols-outlined text-4xl text-base-content/40 relative z-10">search_off</span>
                            </div>
                        </div>
                        <p className="text-lg font-bold text-base-content/70">No recipes found</p>
                        <p className="text-sm mt-1 text-base-content/40 text-center max-w-[250px]">Try adjusting your search terms or exploring a different category.</p>
                    </div>
                ) : feedType === 'following' && !loading ? (
                    user ? (
                        <div className="flex flex-col items-center justify-center py-20 text-base-content/40 animate-fade-in">
                            <div className="relative w-24 h-24 mb-6 flex items-center justify-center group">
                                <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse-soft"></div>
                                <div className="absolute inset-2 bg-primary/10 rounded-full transition-transform group-hover:scale-105"></div>
                                <div className="absolute inset-4 bg-primary/20 rounded-full flex items-center justify-center shadow-inner">
                                    <span className="material-symbols-outlined text-4xl text-primary relative z-10">group_add</span>
                                </div>
                            </div>
                            <p className="text-xl font-bold text-base-content/70 mb-2">Your Feed is Empty</p>
                            <p className="text-sm text-center mb-8 px-8 text-base-content/50 leading-relaxed">
                                Follow your favorite chefs to see their latest culinary creations appear here.
                            </p>
                            <button
                                onClick={() => setFeedType('forYou')}
                                className="btn btn-primary h-12 px-6 rounded-2xl gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                            >
                                <span className="material-symbols-outlined text-xl">explore</span>
                                Discover Chefs
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-base-content/40">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-4xl text-primary">login</span>
                            </div>
                            <p className="text-lg font-semibold text-base-content/60 mb-2">Join the Community</p>
                            <p className="text-sm text-center mb-6 px-10 text-base-content/40">
                                Please login to see recipes from chefs you follow!
                            </p>
                            <button
                                onClick={onLoginClick}
                                className="btn btn-primary rounded-2xl px-8 shadow-lg shadow-primary/25"
                            >
                                Login to Account
                            </button>
                        </div>
                    )
                ) : !loading && filteredRecipes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-base-content/40 animate-fade-in">
                        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                            <div className="absolute inset-0 bg-base-200/40 rounded-full animate-pulse-soft"></div>
                            <div className="absolute inset-3 bg-base-200/80 rounded-full"></div>
                            <div className="absolute inset-5 bg-base-300 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-base-content/30 relative z-10">restaurant_menu</span>
                            </div>
                        </div>
                        <p className="text-xl font-bold text-base-content/70 mb-2">Nothing Here Yet</p>
                        <p className="text-sm text-center px-8 text-base-content/50 leading-relaxed mb-6">
                            We couldn't find any recipes matching this category. Be the first to publish one!
                        </p>
                        <button
                            onClick={() => setActiveCategory('all')}
                            className="btn btn-outline btn-primary rounded-xl h-10 px-6 font-semibold"
                        >
                            View All Categories
                        </button>
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
        </PullToRefresh>
    );
};


export default HomeScreen;
