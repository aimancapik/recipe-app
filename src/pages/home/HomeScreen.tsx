import React, { useMemo, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Recipe } from '@/types';
import { CATEGORIES } from '@/constants/constants';
import RecipeMasonryGrid from '@/components/recipe/RecipeMasonryGrid';
import { SkeletonGrid } from '@/components/common/SkeletonCard';
import { getAvatarUrl } from '@/constants/avatars';
import PullToRefresh from '@/components/common/PullToRefresh';
import { useNotifications } from '@/hooks/social/useNotifications';
import { useTrending } from '@/hooks/recipe/useTrending';
import TrendingSection from '@/components/home/TrendingSection';
import { getYouTubeThumbnail, isYouTubeUrl } from '@/utils/mediaHelpers';
import IconButton from '@/components/ui/IconButton';
import MediaHero from '@/components/ui/MediaHero';
import SegmentedControl from '@/components/ui/SegmentedControl';
import StatTile from '@/components/ui/StatTile';
import EmptyState from '@/components/ui/EmptyState';

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

const getDisplayImage = (url?: string): string => {
    if (!url) return '';
    if (isYouTubeUrl(url)) return getYouTubeThumbnail(url) || url;
    return url;
};

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
    const { trending, loading: trendingLoading } = useTrending();

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Chef';
    const avatarId = user?.user_metadata?.avatar_id;
    const googleAvatar = user?.user_metadata?.avatar_url;
    const avatarUrl = getAvatarUrl(avatarId || googleAvatar);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchValue, setSearchValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [feedType, setFeedType] = useState<'forYou' | 'following'>('forYou');
    const [switching, setSwitching] = useState(false);

    const isSearching = searchValue.trim().length >= 2;
    const featuredRecipe = useMemo(() => trending[0] || recipes[0], [recipes, trending]);
    const filteredRecipes = recipes;
    const inputRef = React.useRef<HTMLInputElement>(null);
    const observerTarget = React.useRef<HTMLDivElement | null>(null);

    const quickStats = useMemo(() => {
        const recipeCount = recipes.length;
        const ratedRecipes = recipes.filter(recipe => Number(recipe.rating) > 0);
        const avgRating = ratedRecipes.length
            ? (ratedRecipes.reduce((sum, recipe) => sum + Number(recipe.rating), 0) / ratedRecipes.length).toFixed(1)
            : '0.0';
        const quickCount = recipes.filter(recipe => {
            const minutes = Number.parseInt(recipe.prepTime, 10);
            return Number.isFinite(minutes) && minutes <= 30;
        }).length;

        return [
            { label: 'recipes', value: recipeCount.toString(), icon: 'restaurant_menu' },
            { label: 'avg rating', value: avgRating, icon: 'star' },
            { label: 'under 30m', value: quickCount.toString(), icon: 'timer' },
        ];
    }, [recipes]);

    React.useEffect(() => {
        if (!loading) setSwitching(false);
    }, [loading]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (feedType === 'following' && !user) return;
            const query = searchValue.trim();
            const category = activeCategory === 'all' ? '' : activeCategory;
            onRefresh(query, category, feedType, user?.id);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchValue, activeCategory, feedType, user?.id, onRefresh]);

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
            { threshold: 0.1, rootMargin: '200px' }
        );

        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <PullToRefresh onRefresh={onPullRefresh} className="flex flex-col pb-20 bg-base-100 lec-food-gradient">
            <section className="relative overflow-hidden px-5 pt-8 pb-5">
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 via-secondary/5 to-transparent pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-base-100 bg-primary flex items-center justify-center shadow-sm">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-primary-content font-black text-lg">{displayName.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success border-2 border-base-100" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-base-content/45 tracking-wide">{getGreeting()}</p>
                            <h2 className="text-lg font-black leading-tight text-base-content">{displayName}</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <IconButton onClick={onToggleTheme} icon={isDark ? 'light_mode' : 'dark_mode'} label={isDark ? 'Use light theme' : 'Use dark theme'} variant="ghost" className="size-9" />
                        <button onClick={onOpenNotifications} className="relative inline-flex size-9 items-center justify-center rounded-full bg-transparent text-base-content/70 transition-all hover:bg-base-200 active:scale-95" title="Notifications">
                            {unreadCount > 0 && <span className="indicator-item badge badge-primary badge-xs scale-75"></span>}
                            <span className="material-symbols-outlined text-xl">notifications</span>
                        </button>
                        <IconButton onClick={onOpenGrocery} icon="shopping_bag" label="Grocery List" variant="ghost" className="size-9" />
                    </div>
                </div>

                <div className="mt-6">
                    {featuredRecipe ? (
                        <MediaHero
                            image={getDisplayImage(featuredRecipe.image)}
                            title={featuredRecipe.title}
                            eyebrow={`Tonight's pick · ${featuredRecipe.level}`}
                            meta={
                                <div className="flex min-w-0 items-center gap-3 text-xs font-bold text-white/85">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        {featuredRecipe.prepTime || 'Quick'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm fill-1 text-warning">star</span>
                                        {featuredRecipe.rating.toFixed(1)}
                                    </span>
                                </div>
                            }
                            action={
                                <button type="button" onClick={() => onRecipeClick(featuredRecipe)} className="btn btn-sm rounded-full border-0 bg-base-100 text-base-content hover:bg-base-200">
                                    Cook
                                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                                </button>
                            }
                        />
                    ) : (
                        <div className="flex min-h-[230px] flex-col justify-end p-5">
                            <p className="text-xs font-black uppercase tracking-widest text-base-content/45">Ready when you are</p>
                            <h1 className="mt-2 text-3xl font-black leading-tight text-base-content">Find something worth cooking.</h1>
                        </div>
                    )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                    {quickStats.map((stat) => (
                        <StatTile key={stat.label} icon={stat.icon} value={stat.value} label={stat.label} tone={stat.label === 'under 30m' ? 'secondary' : 'primary'} />
                    ))}
                </div>
            </section>

            <div className="sticky top-0 z-30 bg-base-100/95 px-5 pb-3 pt-2 backdrop-blur-xl">
                <label className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300 ${isFocused
                    ? 'border-primary/40 bg-base-100 shadow-lg shadow-primary/10'
                    : 'border-base-200 bg-base-200/70'
                    }`}>
                    <span className={`material-symbols-outlined text-xl transition-colors ${isFocused ? 'text-primary' : 'text-base-content/40'}`}>search</span>
                    <input
                        ref={inputRef}
                        style={{ boxShadow: 'none', border: 'none', outline: 'none' }}
                        className="no-focus-ring grow bg-transparent p-0 text-sm text-base-content placeholder:text-base-content/40 border-0 outline-none ring-0 shadow-none focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none !border-none !outline-none !shadow-none !ring-0 appearance-none h-auto"
                        placeholder="Search recipes, ingredients..."
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    {searchValue && (
                        <button type="button" onClick={() => { setSearchValue(''); inputRef.current?.focus(); }} className="btn btn-ghost btn-circle btn-xs min-h-0 h-6 w-6">
                            <span className="material-symbols-outlined text-base-content/40 text-lg">close</span>
                        </button>
                    )}
                </label>

                <SegmentedControl
                    className="mt-3"
                    value={feedType}
                    onChange={(value) => { setFeedType(value); if (value === 'forYou' || user) setSwitching(true); }}
                    options={[
                        { value: 'forYou', label: 'For You', icon: 'local_fire_department' },
                        { value: 'following', label: 'Following', icon: 'group' },
                    ]}
                />
            </div>

            {!isSearching && (
                <div className="pb-2">
                    <div className="flex gap-3 overflow-x-auto px-5 no-scrollbar pb-3">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`group relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl border text-left transition-all duration-300 ${activeCategory === cat.id
                                    ? 'border-primary shadow-lg shadow-base-content/10'
                                    : 'border-base-200 hover:border-primary/30'
                                    }`}
                            >
                                {cat.image && <img src={cat.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                <span className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md ${activeCategory === cat.id ? 'bg-base-100 text-primary' : 'bg-base-100/20 text-white'}`}>
                                    <span className={`material-symbols-outlined text-base ${activeCategory === cat.id ? 'fill-1' : ''}`}>{cat.icon}</span>
                                </span>
                                <span className="absolute bottom-2 left-2 right-2 text-xs font-black text-white">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {!isSearching && feedType === 'forYou' && (trendingLoading ? (
                <div className="mb-5">
                    <div className="flex items-center gap-2 px-5 mb-3">
                        <div className="w-6 h-6 rounded-full bg-base-200 animate-pulse" />
                        <div className="w-36 h-4 rounded-full bg-base-200 animate-pulse" />
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-40">
                                <div className="w-40 h-44 rounded-2xl bg-base-200 animate-pulse" />
                                <div className="mt-2 w-28 h-3 rounded-full bg-base-200 animate-pulse" />
                                <div className="mt-1 w-16 h-2.5 rounded-full bg-base-200 animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : trending.length > 0 && (
                <TrendingSection recipes={trending} onRecipeClick={onRecipeClick} />
            ))}

            <div className="flex-1 px-4 py-3 min-h-[400px]">
                {!(feedType === 'following' && !user) && (
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                                {feedType === 'following' ? 'Your chefs' : isSearching ? 'Search mode' : 'Fresh from the kitchen'}
                            </p>
                            <h3 className="text-xl font-black text-base-content">
                                {isSearching
                                    ? 'Results'
                                    : activeCategory === 'all' ? 'All Recipes' : `${CATEGORIES.find(c => c.id === activeCategory)?.name || activeCategory}`}
                            </h3>
                            <p className="text-xs text-base-content/40 mt-0.5">
                                {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
                            </p>
                        </div>
                        {!isSearching && feedType !== 'following' && (
                            <button onClick={() => onSeeAll(activeCategory === 'all' ? undefined : activeCategory)} className="btn btn-ghost btn-sm rounded-full text-primary">
                                See All
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        )}
                    </div>
                )}

                {feedType === 'following' && !user ? (
                    <div className="flex flex-col items-center justify-center py-20 text-base-content/40">
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-primary">login</span>
                        </div>
                        <p className="text-lg font-black text-base-content/70 mb-2">Join the Community</p>
                        <p className="text-sm text-center mb-6 px-10 text-base-content/45">
                            Log in to see recipes from chefs you follow.
                        </p>
                        <button onClick={onLoginClick} className="btn btn-primary rounded-2xl px-8 shadow-lg shadow-primary/25">
                            Login to Account
                        </button>
                    </div>
                ) : (loading || switching) && (recipes.length === 0 || switching) ? (
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
                    <EmptyState icon="search_off" title="No recipes found" body="Try a different ingredient, dish, or category." />
                ) : feedType === 'following' && !loading ? (
                    <EmptyState
                        icon="group_add"
                        title="Your Feed is Empty"
                        body="Follow your favorite chefs to see their newest recipes here."
                        action={<button onClick={() => setFeedType('forYou')} className="btn btn-primary h-12 px-6 rounded-2xl gap-2 shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-xl">explore</span>
                            Discover Chefs
                        </button>}
                    />
                ) : !loading && filteredRecipes.length === 0 ? (
                    <EmptyState
                        icon="restaurant_menu"
                        title="Nothing Here Yet"
                        body="No recipes match this category yet."
                        action={<button onClick={() => setActiveCategory('all')} className="btn btn-outline btn-primary rounded-xl h-10 px-6 font-semibold">
                            View All Categories
                        </button>}
                    />
                ) : null}

                <div ref={observerTarget} className="flex flex-col items-center justify-center min-h-[100px] py-8 opacity-60" style={{ display: feedType === 'following' && !user ? 'none' : undefined }}>
                    {(loading || loadingMore) ? (
                        <div className="flex items-center gap-2">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="w-2 h-2 rounded-full bg-base-content/30" style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                            ))}
                        </div>
                    ) : (
                        !hasMore && recipes.length > 0 && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="size-1 w-12 rounded-full bg-base-content/10 mb-2"></div>
                                <p className="text-sm font-medium text-base-content/30 italic">You've reached the end of the pantry.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </PullToRefresh>
    );
};

export default HomeScreen;
