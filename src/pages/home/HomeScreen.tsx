import React, { useMemo, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Recipe } from '@/types';
import RecipeMasonryGrid from '@/components/recipe/RecipeMasonryGrid';
import { SkeletonGrid } from '@/components/common/SkeletonCard';
import { getAvatarUrl } from '@/constants/avatars';
import PullToRefresh from '@/components/common/PullToRefresh';
import { useNotifications } from '@/hooks/social/useNotifications';
import { useTrending } from '@/hooks/recipe/useTrending';
import TrendingSection from '@/components/home/TrendingSection';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import IngredientInput from '@/components/home/IngredientInput';
import MatchedRecipeCard from '@/components/home/MatchedRecipeCard';
import { usePantry } from '@/hooks/pantry/usePantry';

interface HomeScreenProps {
    recipes: Recipe[];
    onRecipeClick: (recipe: Recipe) => void;
    onToggleFavorite: (id: string) => void;
    onSeeAll: (category?: string) => void;
    onOpenGrocery: () => void;
    onOpenNotifications: () => void;
    onOpenImport: () => void;
    user: User | null;
    onLoadMore: () => void;
    hasMore: boolean;
    loadingMore: boolean;
    loading: boolean;
    onLoginClick: () => void;
    onRefresh: (search: string, category: string, feed?: 'forYou' | 'following', followerId?: string, ingredients?: string[]) => void;
    onPullRefresh: () => Promise<void>;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
    recipes,
    onRecipeClick,
    onToggleFavorite,
    onSeeAll,
    onOpenGrocery,
    onOpenNotifications,
    onOpenImport,
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
    const { ingredients, addIngredient, removeIngredient } = usePantry();
    const [feedType, setFeedType] = useState<'forYou' | 'following'>('forYou');
    const [matchingMode, setMatchingMode] = useState(false);

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Chef';
    const avatarUrl = getAvatarUrl(user?.user_metadata?.avatar_id || user?.user_metadata?.avatar_url);
    const observerTarget = React.useRef<HTMLDivElement | null>(null);

    const matchedRecipes = useMemo(() => {
        if (!matchingMode || ingredients.length === 0) return [];
        return recipes
            .map(recipe => ({
                ...recipe,
                matchedIngredientsCount: recipe.matchedIngredientsCount ?? recipe.ingredients.filter(ingredient =>
                    ingredients.some(selected => ingredient.toLowerCase().includes(selected.toLowerCase()))
                ).length,
                totalIngredientsCount: recipe.totalIngredientsCount || recipe.ingredients.length,
            }))
            .filter(recipe => (recipe.matchedIngredientsCount || 0) > 0)
            .sort((a, b) => (b.matchedIngredientsCount || 0) - (a.matchedIngredientsCount || 0));
    }, [ingredients, matchingMode, recipes]);

    React.useEffect(() => {
        const feed = feedType;
        if (feed === 'following' && !user) return;
        onRefresh('', '', feed, user?.id, matchingMode ? ingredients : []);
    }, [feedType, user?.id, matchingMode]);

    const stateRef = React.useRef({ hasMore, loadingMore, loading, onLoadMore });
    React.useEffect(() => {
        stateRef.current = { hasMore, loadingMore, loading, onLoadMore };
    });

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                const state = stateRef.current;
                if (entries[0].isIntersecting && state.hasMore && !state.loadingMore && !state.loading) state.onLoadMore();
            },
            { threshold: 0.1, rootMargin: '200px' }
        );
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, []);

    const findRecipes = () => {
        setMatchingMode(true);
        onRefresh('', '', feedType, user?.id, ingredients);
    };

    return (
        <PullToRefresh onRefresh={onPullRefresh} className="flex flex-col pb-20 bg-base-100 wc-fridge-gradient">
            <section className="px-4 pt-5 pb-3">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        <div className="grid size-11 place-items-center overflow-hidden rounded-2xl bg-primary text-primary-content shadow-sm ring-1 ring-base-content/5">
                            {avatarUrl ? <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : <span className="text-lg font-black">{displayName.charAt(0).toUpperCase()}</span>}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Hey {displayName}</p>
                            <h1 className="text-xl font-black leading-tight text-base-content">What's cooking?</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button onClick={onOpenNotifications} className="relative inline-flex size-10 items-center justify-center rounded-full border border-base-content/10 bg-white text-base-content/70 shadow-sm transition hover:bg-base-200" aria-label="Open notifications">
                            {unreadCount > 0 && <span className="indicator-item badge badge-primary badge-xs scale-75" />}
                            <span className="material-symbols-outlined text-xl">notifications</span>
                        </button>
                    </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-primary/15 bg-white shadow-[0_18px_44px_rgba(27,27,27,0.07)]">
                    <div className="bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_18%,white),color-mix(in_srgb,var(--color-secondary)_28%,white))] px-4 pb-3.5 pt-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Kitchen check</p>
                                <h2 className="mt-1 text-[1.35rem] font-black leading-none text-base-content">Cook from what you have</h2>
                                <p className="mt-1.5 max-w-[15rem] text-xs font-semibold leading-relaxed text-base-content/55">
                                    Add pantry items and we'll pull recipes that match.
                                </p>
                            </div>
                            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/75 text-primary shadow-sm ring-1 ring-white/70">
                                <span className="material-symbols-outlined">skillet</span>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-2xl bg-white/70 px-3 py-2 ring-1 ring-white/70">
                                <p className="text-[10px] font-black uppercase tracking-widest text-base-content/40">Pantry</p>
                                <p className="mt-0.5 text-lg font-black leading-none text-base-content">{ingredients.length} item{ingredients.length === 1 ? '' : 's'}</p>
                            </div>
                            <button onClick={onOpenImport} className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 text-left ring-1 ring-white/70 transition active:scale-[0.98]">
                                <span>
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-base-content/40">Save</span>
                                    <span className="mt-0.5 block text-sm font-black text-base-content">Import recipe</span>
                                </span>
                                <span className="material-symbols-outlined text-primary">post_add</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-3.5">
                        <div>
                            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-base-content/40">Start with ingredients</p>
                        </div>
                        <IngredientInput
                            ingredients={ingredients}
                            onAdd={addIngredient}
                            onRemove={removeIngredient}
                            onFindRecipes={findRecipes}
                            onImportRecipe={onOpenImport}
                            loading={loading && matchingMode}
                        />
                    </div>
                </div>
            </section>

            {matchingMode && ingredients.length > 0 && (
                <section className="px-5 py-2">
                    <div className="mb-2 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Pantry matches</p>
                            <h2 className="text-lg font-black">{matchedRecipes.length || recipes.length} recipes you can start</h2>
                        </div>
                        <button onClick={() => setMatchingMode(false)} className="btn btn-ghost btn-sm rounded-full text-base-content/60">Browse</button>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                        {(matchedRecipes.length ? matchedRecipes : recipes).slice(0, 8).map(recipe => (
                            <MatchedRecipeCard key={recipe.id} recipe={recipe} selectedIngredients={ingredients} onClick={onRecipeClick} />
                        ))}
                    </div>
                </section>
            )}

            {!matchingMode && (
                <>
                    <section className="px-5 py-2">
                        <div className="mb-2 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-base-content/35">Browse</p>
                                <h2 className="text-lg font-black text-base-content">Fresh ideas</h2>
                            </div>
                        </div>
                        <SegmentedControl
                            value={feedType}
                            onChange={(value) => setFeedType(value)}
                            options={[
                                { value: 'forYou', label: 'For You', icon: 'local_fire_department' },
                                { value: 'following', label: 'Following', icon: 'group' },
                            ]}
                        />
                    </section>

                    {feedType === 'forYou' && (trendingLoading ? (
                        <div className="px-5 py-4">
                            <div className="h-32 rounded-2xl bg-base-200 animate-pulse" />
                        </div>
                    ) : trending.length > 0 && (
                        <TrendingSection recipes={trending} onRecipeClick={onRecipeClick} />
                    ))}

                    <section className="flex-1 px-4 py-2 min-h-[400px]">
                        {feedType === 'following' && !user ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="mb-4 grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary">
                                    <span className="material-symbols-outlined text-4xl">login</span>
                                </div>
                                <h3 className="text-lg font-black">Join the Community</h3>
                                <p className="mt-2 max-w-xs text-sm text-base-content/50">Log in to see recipes from chefs you follow.</p>
                                <button onClick={onLoginClick} className="btn btn-primary mt-6 rounded-2xl px-8">Login</button>
                            </div>
                        ) : loading && recipes.length === 0 ? (
                            <div className="columns-2 gap-4 space-y-4"><SkeletonGrid count={8} /></div>
                        ) : recipes.length > 0 ? (
                            <>
                                <div className="mb-3 flex items-end justify-between px-1">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Fresh from the kitchen</p>
                                        <h3 className="text-xl font-black text-base-content">All Recipes</h3>
                                    </div>
                                    <button onClick={() => onSeeAll()} className="btn btn-ghost btn-sm rounded-full text-primary">
                                        See All
                                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                                    </button>
                                </div>
                                <RecipeMasonryGrid recipes={recipes} onRecipeClick={onRecipeClick} onToggleFavorite={onToggleFavorite} showCategory />
                            </>
                        ) : (
                            <EmptyState icon="restaurant_menu" title="Nothing Here Yet" body="No recipes found." />
                        )}
                    </section>
                </>
            )}

            <div ref={observerTarget} className="flex min-h-[100px] items-center justify-center py-8 opacity-60">
                {(loading || loadingMore) && <span className="loading loading-dots loading-md" />}
                {!loading && !loadingMore && !hasMore && recipes.length > 0 && (
                    <p className="text-sm font-medium text-base-content/30 italic">You've reached the end of the pantry.</p>
                )}
            </div>

            <button onClick={onOpenGrocery} className="fixed bottom-24 right-[calc(50%-13rem)] z-20 btn btn-primary btn-circle shadow-xl shadow-primary/30 max-[430px]:right-5">
                <span className="material-symbols-outlined">shopping_bag</span>
            </button>
        </PullToRefresh>
    );
};

export default HomeScreen;
