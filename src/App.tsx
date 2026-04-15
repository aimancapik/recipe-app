
import React, { useState, useCallback, lazy, Suspense } from 'react';
import { Screen, Recipe } from '@/types';
import BottomNav from '@/components/layout/BottomNav';
import QuickActionsOverlay from '@/components/layout/QuickActionsOverlay';
import type { FilterOptions } from '@/pages/filter/FilterScreen';
import type { RecipeFormData } from '@/pages/recipe/PublishRecipeScreen';
import LoadingAnimation from '@/components/common/LoadingAnimation';
import SplashScreen from '@/components/layout/SplashScreen';
import { useTheme } from '@/hooks/ui/useTheme';
import { useRecipes } from '@/hooks/recipe/useRecipes';
import { useFavorites } from '@/hooks/ui/useFavorites';
import { useGrocery } from '@/hooks/grocery/useGrocery';
import { useMealPlan } from '@/hooks/meal-plan/useMealPlan';
import { useAuth } from '@/hooks/auth/useAuth';
import { useFollows } from '@/hooks/social/useFollows';
import { AIGenerationProvider } from '@/contexts/AIGenerationContext';

// Lazy load screens for better performance
const HomeScreen = lazy(() => import('@/pages/home/HomeScreen'));
const ExploreScreen = lazy(() => import('@/pages/explore/ExploreScreen'));
const RecipeDetailScreen = lazy(() => import('@/pages/recipe/RecipeDetailScreen'));
const AIGenerateScreen = lazy(() => import('@/pages/ai-generate/AIGenerateScreen'));
const SavedRecipesScreen = lazy(() => import('@/pages/saved/SavedRecipesScreen'));
const ProfileScreen = lazy(() => import('@/pages/profile/ProfileScreen'));
const FilterScreen = lazy(() => import('@/pages/filter/FilterScreen'));
const GroceryListScreen = lazy(() => import('@/pages/grocery/GroceryListScreen'));
const PublishRecipeScreen = lazy(() => import('@/pages/recipe/PublishRecipeScreen'));
const AuthScreen = lazy(() => import('@/pages/auth/AuthScreen'));
const MyRecipesScreen = lazy(() => import('@/pages/my-recipes/MyRecipesScreen'));
const PublicProfileScreen = lazy(() => import('@/pages/profile/PublicProfileScreen'));
const ReviewRecipeScreen = lazy(() => import('@/pages/recipe/ReviewRecipeScreen'));
const CookingModeScreen = lazy(() => import('@/pages/recipe/CookingModeScreen'));
const BitesScreen = lazy(() => import('@/pages/bites/BitesScreen'));
const OnboardingScreen = lazy(() => import('@/pages/onboarding/OnboardingScreen'));
const NotificationScreen = lazy(() => import('@/pages/notifications/NotificationScreen'));
const MealPlanScreen = lazy(() => import('@/pages/meal-plan/MealPlanScreen'));

const App: React.FC = () => {
    const { isDark, toggleTheme } = useTheme();
    const { recipes, loading, loadingMore, hasMore, fetchRecipes, fetchRecipesByIds, fetchRecipesByUserId, loadMore, addRecipe, deleteRecipe, updateRecipe, updateStatus } = useRecipes();
    const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
    const { 
        items: groceryItems, 
        toggleItem: toggleGroceryItem, 
        clearChecked: clearCheckedGroceryItems, 
        addFromRecipe,
        addItem: addGroceryItem,
        removeItem: removeGroceryItem,
        updateItem: updateGroceryItem,
        clearAll: clearAllGroceryItems
    } = useGrocery();
    const { slots: mealSlots, loading: mealPlanLoading, addSlot, removeSlot, clearDay } = useMealPlan();
    const {
        user,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithFacebook,
        resetPassword,
        signOut,
        updateProfile
    } = useAuth();
    const { followingIds } = useFollows(user?.id);

    const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
    const [showSplash, setShowSplash] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [initialCategory, setInitialCategory] = useState<string | null>(null);
    const [quickActionsOpen, setQuickActionsOpen] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({
        sortBy: 'popular',
        cookingTime: null,
        dietary: [],
        difficulty: null,
    });

    // Stores where to go back to after login
    const [returnScreen, setReturnScreen] = useState<Screen>(Screen.HOME);
    // Stores a pending action to execute after successful login
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [currentChefId, setCurrentChefId] = useState<string | null>(null);
    const [subScreenReturnTo, setSubScreenReturnTo] = useState<Screen>(Screen.HOME);
    const [bitesActiveIndex, setBitesActiveIndex] = useState(0);

    const [showOnboarding, setShowOnboarding] = useState(() => {
        return localStorage.getItem('recipe_app_onboarded') !== 'true';
    });

    const completeOnboarding = () => {
        localStorage.setItem('recipe_app_onboarded', 'true');
        setShowOnboarding(false);
    };
    const [fullFavoriteRecipes, setFullFavoriteRecipes] = useState<Recipe[]>([]);
    const [fullUserRecipes, setFullUserRecipes] = useState<Recipe[]>([]);

    const refreshFavorites = useCallback(async () => {
        if (favoriteIds.size === 0) {
            setFullFavoriteRecipes([]);
            return;
        }
        const ids = Array.from(favoriteIds);
        const fetched = await fetchRecipesByIds(ids);
        setFullFavoriteRecipes(fetched);
    }, [favoriteIds, fetchRecipesByIds]);

    const refreshUserRecipes = useCallback(async () => {
        if (!user) {
            setFullUserRecipes([]);
            return;
        }
        const fetched = await fetchRecipesByUserId(user.id);
        setFullUserRecipes(fetched);
    }, [user, fetchRecipesByUserId]);

    // Stable callback for HomeScreen/ExploreScreen refresh — avoids infinite effect loops
    const handleRefresh = useCallback((search: string, category: string, feed?: 'forYou' | 'following', followerId?: string, ingredients?: string[]) => {
        fetchRecipes(false, search, category, feed, followerId, ingredients || []);
    }, [fetchRecipes]);

    // Lazily fetch favorites/user-recipes only when navigating to those screens
    const hasFetchedFavoritesRef = React.useRef(false);
    const hasFetchedUserRecipesRef = React.useRef(false);

    // Re-fetch when favoriteIds change (user toggled a favorite)
    React.useEffect(() => {
        if (hasFetchedFavoritesRef.current) {
            refreshFavorites();
        }
    }, [favoriteIds, refreshFavorites]);

    // Re-fetch when user changes (login/logout)
    React.useEffect(() => {
        if (hasFetchedUserRecipesRef.current) {
            refreshUserRecipes();
        }
    }, [user, refreshUserRecipes]);

    // Merge favorite status into recipes, and include all fullFavoriteRecipes
    const recipesWithFavorites = [...recipes].map(r => ({
        ...r,
        isFavorite: isFavorite(r.id),
    }));

    // For the Saved screen, we want to combine loaded recipes with specifically fetched favorites
    const allSavedRecipes = Array.from(new Map([
        ...recipesWithFavorites.filter(r => r.isFavorite),
        ...fullFavoriteRecipes.map(r => ({ ...r, isFavorite: true }))
    ].map(item => [item.id, item])).values());

    // For My Recipes screen, we merge loaded recipes with specifically fetched user recipes
    const allMyRecipes = Array.from(new Map([
        ...recipesWithFavorites.filter(r => r.userId === user?.id),
        ...fullUserRecipes.map(r => ({ ...r, isFavorite: isFavorite(r.id) }))
    ].map(item => [item.id, item])).values());

    const navigateTo = async (screen: Screen, recipe?: Recipe, chefId?: string) => {
        if (recipe) {
            // If navigating to DETAIL and the recipe is lightweight (no ingredients/directions),
            // fetch the full data first. Recipes from get_paginated_recipes won't have these fields.
            if (screen === Screen.DETAIL && recipe.ingredients.length === 0 && recipe.directions.length === 0 && !recipe.id.startsWith('temp-')) {
                setSelectedRecipe(recipe); // show immediately with what we have
                setCurrentScreen(screen);
                window.scrollTo(0, 0);
                // Fetch full data in background
                try {
                    const fullRecipes = await fetchRecipesByIds([recipe.id]);
                    if (fullRecipes.length > 0) {
                        setSelectedRecipe(fullRecipes[0]);
                    }
                } catch (err) {
                    console.error('Failed to fetch full recipe:', err);
                }
                if (chefId) setCurrentChefId(chefId);
                setSearchQuery('');
                setInitialCategory(null);
                return;
            }
            setSelectedRecipe(recipe);
        }
        if (chefId) setCurrentChefId(chefId);
        if (screen !== Screen.EXPLORE) {
            setSearchQuery('');
            setInitialCategory(null);
        }
        // Lazy-load data for screens that need it
        if ((screen === Screen.SAVED || screen === Screen.PROFILE) && !hasFetchedFavoritesRef.current) {
            hasFetchedFavoritesRef.current = true;
            refreshFavorites();
        }
        if ((screen === Screen.MY_RECIPES || screen === Screen.PROFILE) && !hasFetchedUserRecipesRef.current) {
            hasFetchedUserRecipesRef.current = true;
            refreshUserRecipes();
        }

        setCurrentScreen(screen);
        window.scrollTo(0, 0);
    };

    /**
     * Gate an action behind auth.
     * If logged in, runs the action immediately.
     * If not, saves the action and redirects to login.
     */
    const requireAuth = useCallback((action: () => void, returnTo: Screen = Screen.HOME) => {
        if (user) {
            action();
        } else {
            setPendingAction(() => action);
            setReturnScreen(returnTo);
            setCurrentScreen(Screen.LOGIN);
        }
    }, [user]);

    // Execute pending action after login and redirect back
    const handleAuthSuccess = useCallback(() => {
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
        setCurrentScreen(returnScreen);
    }, [pendingAction, returnScreen]);

    // Wrap onAuthStateChange to detect login
    // Splash screen timeout
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    // Deep linking support for shared recipes
    React.useEffect(() => {
        const path = window.location.pathname;
        const recipeMatch = path.match(/\/recipe\/([0-9a-fA-F-]+)/); // UUID or friendly ID

        if (recipeMatch && recipeMatch[1]) {
            const recipeId = recipeMatch[1];

            const handleDeepLink = async () => {
                try {
                    const fetchedRecipes = await fetchRecipesByIds([recipeId]);
                    if (fetchedRecipes.length > 0) {
                        setSelectedRecipe(fetchedRecipes[0]);
                        setCurrentScreen(Screen.DETAIL);
                    }
                } catch (err) {
                    console.error('Deep link failed:', err);
                }
            };

            handleDeepLink();
        }
    }, [fetchRecipesByIds]);

    const handleSignIn = async (email: string, password: string) => {
        await signIn(email, password);
        handleAuthSuccess();
    };

    const handleSignUp = async (email: string, password: string) => {
        await signUp(email, password);
        handleAuthSuccess();
    };

    const handleToggleFavorite = (id: string) => {
        requireAuth(() => toggleFavorite(id), currentScreen);
    };

    const handleSeeAll = (category?: string) => {
        setSearchQuery('');
        setInitialCategory(category || null);
        setCurrentScreen(Screen.EXPLORE);
    };

    const addIngredientsToGrocery = (recipe: Recipe) => {
        requireAuth(() => {
            addFromRecipe(recipe);
            navigateTo(Screen.GROCERY);
        }, Screen.DETAIL);
    };

    const handlePublishRecipe = async (data: RecipeFormData) => {
        const newRecipe: Omit<Recipe, 'id'> = {
            title: data.title || 'Untitled Recipe',
            description: data.description,
            image: data.coverImages[0] || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600',
            prepTime: data.prepTime ? `${data.prepTime}m` : '30m',
            rating: 0,
            reviews: 0,
            serves: data.serves || '01',
            kcal: '0',
            level: (data.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Easy',
            ingredients: data.ingredients.map(i => `${i.qty}${i.unit} ${i.name}`),
            directions: data.instructions
                .filter(s => s.description.trim() || s.image)
                .map((s, idx) => ({
                    step: idx + 1,
                    title: `Step ${idx + 1}`,
                    description: s.description,
                    image: s.image || null,
                    mediaType: s.mediaType || 'image' as const,
                    timer: s.timer,
                })),
            category: data.category || 'breakfast',
            isFavorite: false,
            status: 'published',
            images: data.coverImages || []
        };

        try {
            await addRecipe(newRecipe);
            await Promise.all([refreshUserRecipes(), fetchRecipes()]);
        } catch (err) {
            console.error('Failed to publish recipe:', err);
            throw err; // Re-throw so the UI can handle it
        }
    };

    const handleSaveDraftRecipe = async (data: RecipeFormData) => {
        if (!editingRecipe) return;

        const updatedDraft: Recipe = {
            ...editingRecipe,
            title: data.title || 'Untitled Recipe',
            description: data.description || editingRecipe.description,
            image: data.coverImages[0] || editingRecipe.image,
            images: data.coverImages || editingRecipe.images || [],
            prepTime: data.prepTime ? `${data.prepTime}m` : editingRecipe.prepTime,
            serves: data.serves || editingRecipe.serves,
            level: (data.difficulty as 'Easy' | 'Medium' | 'Hard') || editingRecipe.level,
            category: data.category || editingRecipe.category,
            ingredients: data.ingredients.map((i: any) => `${i.qty}${i.unit} ${i.name}`),
            directions: data.instructions
                .filter((s: any) => s.description.trim() || s.image)
                .map((s: any, idx: number) => ({
                    step: idx + 1,
                    title: `Step ${idx + 1}`,
                    description: s.description,
                    image: s.image || null,
                    mediaType: s.mediaType || 'image' as const,
                    timer: s.timer,
                })),
            status: 'draft'
        };

        try {
            await updateRecipe(editingRecipe.id, updatedDraft);
            await refreshUserRecipes();
            setSelectedRecipe(updatedDraft);
            setEditingRecipe(null);
        } catch (err) {
            console.error('Failed to save draft:', err);
            throw err;
        }
    };

    const handleUpdateRecipe = async (id: string, data: RecipeFormData) => {
        const updatedRecipe: Omit<Recipe, 'id'> = {
            title: data.title || 'Untitled Recipe',
            description: data.description,
            image: data.coverImages[0] || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600',
            prepTime: data.prepTime ? `${data.prepTime}m` : '30m',
            rating: editingRecipe?.rating || 0,
            reviews: editingRecipe?.reviews || 0,
            serves: data.serves || '01',
            kcal: editingRecipe?.kcal || '0',
            level: (data.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Easy',
            ingredients: data.ingredients.map(i => `${i.qty}${i.unit} ${i.name}`),
            directions: data.instructions
                .filter(s => s.description.trim() || s.image)
                .map((s, idx) => ({
                    step: idx + 1,
                    title: `Step ${idx + 1}`,
                    description: s.description,
                    image: s.image || null,
                    mediaType: s.mediaType || 'image' as const,
                    timer: s.timer,
                })),
            category: data.category || editingRecipe?.category || 'breakfast',
            isFavorite: false,
            status: editingRecipe?.status || 'published',
            images: data.coverImages || []
        };

        try {
            await updateRecipe(id, updatedRecipe);
            await Promise.all([refreshUserRecipes(), refreshFavorites(), fetchRecipes()]);
            setEditingRecipe(null);
        } catch (err) {
            console.error('Failed to update recipe:', err);
            throw err;
        }
    };

    const handleAIPublish = async () => {
        if (!selectedRecipe) return;

        // Remove temp ID and ensure user ID/favorites are reset
        const { id, isFavorite, ...recipeData } = selectedRecipe;

        try {
            await addRecipe(recipeData);
            await Promise.all([refreshUserRecipes(), fetchRecipes()]);
            setCurrentScreen(Screen.HOME);
        } catch (e) {
            console.error("Failed to publish AI recipe", e);
        }
    };

    const handleDeleteRecipe = async (id: string) => {
        try {
            await deleteRecipe(id);
            await Promise.all([refreshUserRecipes(), refreshFavorites(), fetchRecipes()]);
        } catch (err) {
            console.error('Failed to delete recipe:', err);
        }
    };

    const [isNavHidden, setIsNavHidden] = useState(false);

    const renderScreen = () => {
        switch (currentScreen) {
            case Screen.LOGIN:
                return (
                    <AuthScreen
                        mode="login"
                        onToggleMode={() => setCurrentScreen(Screen.SIGNUP)}
                        onSignIn={handleSignIn}
                        onSignUp={handleSignUp}
                        onGoogleSignIn={signInWithGoogle}
                        onFacebookSignIn={signInWithFacebook}
                        onForgotPassword={resetPassword}
                        onSkip={() => { setPendingAction(null); setCurrentScreen(returnScreen); }}
                    />
                );
            case Screen.SIGNUP:
                return (
                    <AuthScreen
                        mode="signup"
                        onToggleMode={() => setCurrentScreen(Screen.LOGIN)}
                        onSignIn={handleSignIn}
                        onSignUp={handleSignUp}
                        onGoogleSignIn={signInWithGoogle}
                        onFacebookSignIn={signInWithFacebook}
                        onForgotPassword={resetPassword}
                        onSkip={() => { setPendingAction(null); setCurrentScreen(returnScreen); }}
                    />
                );
            case Screen.HOME:
                return (
                    <HomeScreen
                        recipes={recipesWithFavorites}
                        onRecipeClick={(r) => navigateTo(Screen.DETAIL, r)}
                        onToggleFavorite={handleToggleFavorite}
                        onSeeAll={handleSeeAll}
                        onOpenGrocery={() => requireAuth(() => { setSubScreenReturnTo(Screen.HOME); navigateTo(Screen.GROCERY); }, Screen.HOME)}
                        onOpenNotifications={() => requireAuth(() => { setSubScreenReturnTo(Screen.HOME); navigateTo(Screen.NOTIFICATION); }, Screen.HOME)}
                        isDark={isDark}
                        onToggleTheme={toggleTheme}
                        user={user}
                        onLoadMore={loadMore}
                        hasMore={hasMore}
                        loadingMore={loadingMore}
                        loading={loading}
                        onLoginClick={() => setCurrentScreen(Screen.LOGIN)}
                        onRefresh={handleRefresh}
                        onPullRefresh={async () => {
                            await fetchRecipes(false);
                        }}
                    />
                );
            case Screen.NOTIFICATION:
                return (
                    <NotificationScreen
                        onBack={() => setCurrentScreen(subScreenReturnTo)}
                        onRecipeClick={async (recipeId) => {
                            try {
                                const fetched = await fetchRecipesByIds([recipeId]);
                                if (fetched.length > 0) {
                                    setSelectedRecipe(fetched[0]);
                                    setCurrentScreen(Screen.DETAIL);
                                    window.scrollTo(0, 0);
                                }
                            } catch (err) {
                                console.error('Error opening recipe from notification:', err);
                            }
                        }}
                        onProfileClick={(chefId) => navigateTo(Screen.PUBLIC_PROFILE, undefined, chefId)}
                    />
                );
            case Screen.BITES:
                return (
                    <BitesScreen
                        recipes={recipesWithFavorites}
                        initialIndex={bitesActiveIndex}
                        onIndexChange={setBitesActiveIndex}
                        onLoadMore={loadMore}
                        loadingMore={loadingMore}
                        hasMore={hasMore}
                        onRecipeClick={(r) => {
                            setSubScreenReturnTo(Screen.BITES);
                            navigateTo(Screen.DETAIL, r);
                        }}
                        onToggleFavorite={handleToggleFavorite}
                        onBack={() => setCurrentScreen(Screen.HOME)}
                        onProfileClick={(chefId) => {
                            setSubScreenReturnTo(Screen.BITES);
                            navigateTo(Screen.PUBLIC_PROFILE, undefined, chefId);
                        }}
                    />
                );
            case Screen.EXPLORE:
                return (
                    <ExploreScreen
                        recipes={recipesWithFavorites}
                        initialSearch={searchQuery}
                        initialCategory={initialCategory}
                        onRecipeClick={(r) => navigateTo(Screen.DETAIL, r)}
                        onToggleFavorite={handleToggleFavorite}
                        onOpenFilter={() => navigateTo(Screen.FILTER)}
                        onClearFilters={() => setFilters({ sortBy: 'popular', cookingTime: null, dietary: [], difficulty: null })}
                        filters={filters}
                        onRefresh={handleRefresh}
                        loading={loading}
                    />
                );
            case Screen.DETAIL:
                const isTempRecipe = selectedRecipe?.id.startsWith('temp-');
                return selectedRecipe ? (
                    <RecipeDetailScreen
                        key={`${selectedRecipe.id}-${selectedRecipe.rating}-${selectedRecipe.reviews}`}
                        recipe={{ ...selectedRecipe, isFavorite: isFavorite(selectedRecipe.id) }}
                        onBack={() => {
                            const returnTo = subScreenReturnTo ?? Screen.HOME;
                            setSubScreenReturnTo(null);
                            setCurrentScreen(returnTo);
                        }}
                        onToggleFavorite={handleToggleFavorite}
                        onAddToGrocery={addIngredientsToGrocery}
                        onOpenGrocery={() => requireAuth(() => navigateTo(Screen.GROCERY), Screen.DETAIL)}
                        onPublish={isTempRecipe ? handleAIPublish : undefined}
                        onEdit={isTempRecipe ? (recipe) => {
                            setEditingRecipe(recipe);
                            setCurrentScreen(Screen.PUBLISH);
                        } : undefined}
                        onChefClick={(chefId) => navigateTo(Screen.PUBLIC_PROFILE, undefined, chefId)}
                        onRate={() => requireAuth(() => setCurrentScreen(Screen.REVIEW), Screen.DETAIL)}
                        onStartCooking={() => setCurrentScreen(Screen.COOKING_MODE)}
                    />
                ) : null;
            case Screen.COOKING_MODE:
                return selectedRecipe ? (
                    <CookingModeScreen
                        recipe={selectedRecipe}
                        onExit={() => setCurrentScreen(Screen.DETAIL)}
                    />
                ) : null;
            case Screen.AI_GENERATE:
                return (
                    <AIGenerateScreen
                        onBack={() => setCurrentScreen(Screen.EXPLORE)}
                        onRecipeReady={(r) => navigateTo(Screen.DETAIL, r)}
                    />
                );
            case Screen.SAVED:
                return (
                    <SavedRecipesScreen
                        recipes={allSavedRecipes}
                        onRecipeClick={(r) => navigateTo(Screen.DETAIL, r)}
                        onToggleFavorite={handleToggleFavorite}
                        onBack={() => setCurrentScreen(Screen.HOME)}
                    />
                );
            case Screen.PROFILE:
                const favoriteCount = favoriteIds.size;

                return (
                    <ProfileScreen
                        onBack={() => setCurrentScreen(Screen.HOME)}
                        isDark={isDark}
                        onToggleTheme={toggleTheme}
                        user={user}
                        onSignOut={signOut}
                        onUpdateProfile={updateProfile}
                        recipeCount={allMyRecipes.length}
                        favoriteCount={favoriteCount}
                        groceryCount={groceryItems.length}
                        onModalToggle={setIsNavHidden}
                        onMyRecipes={() => {
                            if (!hasFetchedUserRecipesRef.current) { hasFetchedUserRecipesRef.current = true; refreshUserRecipes(); }
                            setCurrentScreen(Screen.MY_RECIPES);
                        }}
                        onFavorites={() => {
                            if (!hasFetchedFavoritesRef.current) { hasFetchedFavoritesRef.current = true; refreshFavorites(); }
                            setCurrentScreen(Screen.SAVED);
                        }}
                        onGroceryList={() => {
                            setSubScreenReturnTo(Screen.PROFILE);
                            setCurrentScreen(Screen.GROCERY);
                        }}
                        onMealPlan={() => {
                            setSubScreenReturnTo(Screen.PROFILE);
                            setCurrentScreen(Screen.MEAL_PLAN);
                        }}
                        onNotifications={() => {
                            setSubScreenReturnTo(Screen.PROFILE);
                            setCurrentScreen(Screen.NOTIFICATION);
                        }}
                    />
                );
            case Screen.FILTER:
                return (
                    <FilterScreen
                        onClose={() => setCurrentScreen(Screen.EXPLORE)}
                        onApply={(newFilters) => setFilters(newFilters)}
                        initialFilters={filters}
                        resultCount={recipes.length}
                    />
                );
            case Screen.GROCERY:
                return (
                    <GroceryListScreen
                        items={groceryItems}
                        onToggleItem={toggleGroceryItem}
                        onAddItem={addGroceryItem}
                        onRemoveItem={removeGroceryItem}
                        onUpdateItem={updateGroceryItem}
                        onClearChecked={clearCheckedGroceryItems}
                        onClearAll={clearAllGroceryItems}
                        onBack={() => setCurrentScreen(subScreenReturnTo)}
                    />
                );
            case Screen.PUBLISH:
                return (
                    <PublishRecipeScreen
                        onBack={() => {
                            setEditingRecipe(null);
                            setCurrentScreen(editingRecipe ? Screen.MY_RECIPES : Screen.HOME);
                        }}
                        onPublish={handlePublishRecipe}
                        onUpdate={handleUpdateRecipe}
                        onSaveDraft={handleSaveDraftRecipe}
                        onSuccess={() => {
                            if (editingRecipe?.id.startsWith('temp-')) {
                                setCurrentScreen(Screen.DETAIL);
                            } else if (editingRecipe) {
                                navigateTo(Screen.MY_RECIPES);
                            } else {
                                navigateTo(Screen.HOME);
                            }
                        }}
                        editingRecipe={editingRecipe}
                    />
                );
            case Screen.MY_RECIPES:
                return (
                    <MyRecipesScreen
                        recipes={allMyRecipes}
                        onBack={() => setCurrentScreen(Screen.PROFILE)}
                        onEdit={(recipe) => {
                            setEditingRecipe(recipe);
                            setCurrentScreen(Screen.PUBLISH);
                        }}
                        onDelete={handleDeleteRecipe}
                        onRecipeClick={(r) => navigateTo(Screen.DETAIL, r)}
                        onUpdateStatus={async (r, status) => {
                            await updateStatus(r.id, status);
                            await refreshUserRecipes();
                        }}
                    />
                );
            case Screen.PUBLIC_PROFILE:
                return currentChefId ? (
                    <PublicProfileScreen
                        userId={currentChefId}
                        onBack={() => {
                            const returnTo = subScreenReturnTo ?? (selectedRecipe ? Screen.DETAIL : Screen.HOME);
                            setSubScreenReturnTo(null);
                            setCurrentScreen(returnTo);
                        }}
                        onRecipeClick={(r) => {
                            setSubScreenReturnTo(Screen.PUBLIC_PROFILE);
                            navigateTo(Screen.DETAIL, r);
                        }}
                        toggleFavorite={handleToggleFavorite}
                        onUserClick={(clickedUserId) => navigateTo(Screen.PUBLIC_PROFILE, undefined, clickedUserId)}
                    />
                ) : null;
            case Screen.REVIEW:
                return selectedRecipe ? (
                    <ReviewRecipeScreen
                        recipe={selectedRecipe}
                        onBack={() => setCurrentScreen(Screen.DETAIL)}
                        onSubmit={async (review) => {
                            console.log('Review submitted:', review);
                            // Refresh the recipe to get updated rating and review count
                            if (selectedRecipe) {
                                try {
                                    const { supabase } = await import('@/lib/supabase');
                                    const { data, error } = await supabase
                                        .from('recipes')
                                        .select('rating, reviews')
                                        .eq('id', selectedRecipe.id)
                                        .single();

                                    if (!error && data) {
                                        const updatedRecipe = {
                                            ...selectedRecipe,
                                            rating: data.rating,
                                            reviews: data.reviews
                                        };
                                        setSelectedRecipe(updatedRecipe);
                                        // Small delay to ensure state update propagates
                                        await new Promise(resolve => setTimeout(resolve, 100));
                                    }
                                } catch (err) {
                                    console.error('Error refreshing recipe:', err);
                                }
                            }
                            setCurrentScreen(Screen.DETAIL);
                        }}
                    />
                ) : null;
            case Screen.MEAL_PLAN:
                return (
                    <MealPlanScreen
                        slots={mealSlots}
                        loading={mealPlanLoading}
                        recipes={recipesWithFavorites}
                        onAddSlot={addSlot}
                        onRemoveSlot={removeSlot}
                        onClearDay={clearDay}
                        onGenerateGrocery={async (recipeIds) => {
                            // Fetch full recipes for each ID, then add their ingredients to grocery
                            const fullRecipes = await fetchRecipesByIds(recipeIds);
                            for (const recipe of fullRecipes) {
                                await addFromRecipe(recipe);
                            }
                            navigateTo(Screen.GROCERY);
                        }}
                        onRecipeClick={(r) => navigateTo(Screen.DETAIL, r)}
                        onBack={() => setCurrentScreen(subScreenReturnTo)}
                    />
                );
            default:
                return null;
        }
    };

    const showBottomNav = !isNavHidden && ![Screen.DETAIL, Screen.AI_GENERATE, Screen.FILTER, Screen.GROCERY, Screen.PUBLISH, Screen.LOGIN, Screen.SIGNUP, Screen.MY_RECIPES, Screen.PUBLIC_PROFILE, Screen.REVIEW, Screen.COOKING_MODE, Screen.MEAL_PLAN, Screen.BITES, Screen.NOTIFICATION].includes(currentScreen);

    if (showSplash) {
        return <SplashScreen />;
    }

    return (
        <AIGenerationProvider>
            {(() => {
                const isFullscreenOverlay = [Screen.BITES, Screen.NOTIFICATION].includes(currentScreen);
                return (
            <div className={`max-w-md mx-auto ${currentScreen === Screen.LOGIN || currentScreen === Screen.SIGNUP ? '' : 'bg-base-100 text-base-content'} min-h-screen shadow-xl flex flex-col ${isFullscreenOverlay ? '' : 'relative overflow-x-hidden'} ${showBottomNav ? 'pb-20' : ''}`}>
                <Suspense fallback={
                    <div className="flex items-center justify-center min-h-screen">
                        <LoadingAnimation size={48} />
                    </div>
                }>
                    {renderScreen()}
                </Suspense>
                {showBottomNav && (
                    <BottomNav
                        currentScreen={currentScreen}
                        onNavigate={(screen) => {
                            if (screen === Screen.SAVED || screen === Screen.PROFILE) {
                                requireAuth(() => {
                                    if ((screen === Screen.SAVED) && !hasFetchedFavoritesRef.current) { hasFetchedFavoritesRef.current = true; refreshFavorites(); }
                                    if ((screen === Screen.PROFILE) && !hasFetchedFavoritesRef.current) { hasFetchedFavoritesRef.current = true; refreshFavorites(); }
                                    if ((screen === Screen.PROFILE) && !hasFetchedUserRecipesRef.current) { hasFetchedUserRecipesRef.current = true; refreshUserRecipes(); }
                                    setCurrentScreen(screen);
                                }, currentScreen);
                            } else {
                                setCurrentScreen(screen);
                            }
                        }}
                        onQuickAction={() => setQuickActionsOpen(true)}
                    />
                )}
                <QuickActionsOverlay
                    isOpen={quickActionsOpen}
                    onClose={() => setQuickActionsOpen(false)}
                    onCreateRecipe={() => requireAuth(() => navigateTo(Screen.PUBLISH), Screen.HOME)}
                    onAddToShoppingList={() => requireAuth(() => navigateTo(Screen.GROCERY), Screen.HOME)}
                    onPlanMeal={() => requireAuth(() => {
                        setSubScreenReturnTo(currentScreen);
                        navigateTo(Screen.MEAL_PLAN);
                    }, currentScreen)}
                    onModalToggle={setIsNavHidden}
                />
                <Suspense fallback={null}>
                    {showOnboarding && <OnboardingScreen onComplete={completeOnboarding} />}
                </Suspense>
            </div>
                );
            })()}
        </AIGenerationProvider>
    );
};

export default App;
