
import React, { useState, useCallback } from 'react';
import { Screen, Recipe } from '@/types';
import BottomNav from '@/components/BottomNav';
import QuickActionsOverlay from '@/components/QuickActionsOverlay';
import HomeScreen from '@/pages/HomeScreen';
import ExploreScreen from '@/pages/ExploreScreen';
import RecipeDetailScreen from '@/pages/RecipeDetailScreen';
import AIGenerateScreen from '@/pages/AIGenerateScreen';
import SavedRecipesScreen from '@/pages/SavedRecipesScreen';
import ProfileScreen from '@/pages/ProfileScreen';
import FilterScreen, { FilterOptions } from '@/pages/FilterScreen';
import GroceryListScreen from '@/pages/GroceryListScreen';
import PublishRecipeScreen from '@/pages/PublishRecipeScreen';
import AuthScreen from '@/pages/AuthScreen';
import MyRecipesScreen from '@/pages/MyRecipesScreen';
import PublicProfileScreen from '@/pages/PublicProfileScreen';
import ReviewRecipeScreen from '@/pages/ReviewRecipeScreen';
import LoadingAnimation from '@/components/LoadingAnimation';
import SplashScreen from '@/components/SplashScreen';
import { useTheme } from '@/hooks/useTheme';
import { useRecipes } from '@/hooks/useRecipes';
import { useFavorites } from '@/hooks/useFavorites';
import { useGrocery } from '@/hooks/useGrocery';
import { useAuth } from '@/hooks/useAuth';
import { AIGenerationProvider } from '@/contexts/AIGenerationContext';

const App: React.FC = () => {
    const { isDark, toggleTheme } = useTheme();
    const { recipes, loading, loadingMore, hasMore, fetchRecipes, fetchRecipesByIds, fetchRecipesByUserId, loadMore, addRecipe, deleteRecipe, updateRecipe } = useRecipes();
    const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
    const { items: groceryItems, toggleItem: toggleGroceryItem, clearChecked: clearCheckedGroceryItems, addFromRecipe } = useGrocery();
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

    // Fetch full recipe data for all favorite IDs to ensure Saved screen is always populated
    React.useEffect(() => {
        refreshFavorites();
    }, [refreshFavorites]);

    // Fetch all user-owned recipes to ensure My Recipes screen is always populated
    React.useEffect(() => {
        refreshUserRecipes();
    }, [refreshUserRecipes]);

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

    const navigateTo = (screen: Screen, recipe?: Recipe, chefId?: string) => {
        if (recipe) setSelectedRecipe(recipe);
        if (chefId) setCurrentChefId(chefId);
        if (screen !== Screen.EXPLORE) {
            setSearchQuery('');
            setInitialCategory(null);
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

    const handlePublishRecipe = async (data: {
        title: string;
        description: string;
        image: string | null;
        images: string[];
        prepTime: string;
        serves: string;
        difficulty: string;
        category: string;
        ingredients: { id: string; name: string; qty: string; unit: string }[];
        instructions: { id: string; description: string; image: string | null; mediaType?: 'image' | 'video'; timer?: number }[];
    }) => {
        const newRecipe: Omit<Recipe, 'id'> = {
            title: data.title || 'Untitled Recipe',
            description: data.description,
            image: data.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600',
            prepTime: data.prepTime ? `${data.prepTime}m` : '30m',
            rating: 0,
            reviews: 0,
            serves: data.serves || '01',
            kcal: '0',
            level: (data.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Easy',
            ingredients: data.ingredients.map(i => `${i.qty}${i.unit} ${i.name}`),
            directions: data.instructions
                .filter(s => s.description.trim())
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
            images: data.images || []
        };

        try {
            await addRecipe(newRecipe);
            await refreshUserRecipes();
            await fetchRecipes(); // Refresh the main feed too
        } catch (err) {
            console.error('Failed to publish recipe:', err);
        }
        navigateTo(Screen.HOME);
    };

    const handleSaveDraftRecipe = (data: any) => {
        if (!editingRecipe) return;

        const updatedDraft: Recipe = {
            ...editingRecipe,
            title: data.title || 'Untitled Recipe',
            description: data.description || editingRecipe.description,
            image: data.image || editingRecipe.image,
            images: data.images || editingRecipe.images || [],
            prepTime: data.prepTime ? `${data.prepTime}m` : editingRecipe.prepTime,
            serves: data.serves || editingRecipe.serves,
            level: (data.difficulty as 'Easy' | 'Medium' | 'Hard') || editingRecipe.level,
            category: data.category || editingRecipe.category,
            ingredients: data.ingredients.map((i: any) => `${i.qty}${i.unit} ${i.name}`),
            directions: data.instructions
                .filter((s: any) => s.description.trim())
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

        setSelectedRecipe(updatedDraft);
        setEditingRecipe(null);
        setCurrentScreen(Screen.DETAIL);
    };

    const handleUpdateRecipe = async (id: string, data: {
        title: string;
        description: string;
        image: string | null;
        images: string[];
        prepTime: string;
        serves: string;
        difficulty: string;
        category: string;
        ingredients: { id: string; name: string; qty: string; unit: string }[];
        instructions: { id: string; description: string; image: string | null; mediaType?: 'image' | 'video'; timer?: number }[];
    }) => {
        const updatedRecipe: Omit<Recipe, 'id'> = {
            title: data.title || 'Untitled Recipe',
            description: data.description,
            image: data.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600',
            prepTime: data.prepTime ? `${data.prepTime}m` : '30m',
            rating: editingRecipe?.rating || 0,
            reviews: editingRecipe?.reviews || 0,
            serves: data.serves || '01',
            kcal: editingRecipe?.kcal || '0',
            level: (data.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Easy',
            ingredients: data.ingredients.map(i => `${i.qty}${i.unit} ${i.name}`),
            directions: data.instructions
                .filter(s => s.description.trim())
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
            images: data.images || []
        };

        try {
            await updateRecipe(id, updatedRecipe);
            await refreshUserRecipes();
            await refreshFavorites();
            await fetchRecipes(); // Refresh the main feed
        } catch (err) {
            console.error('Failed to update recipe:', err);
        }
        setEditingRecipe(null);
        navigateTo(Screen.MY_RECIPES);
    };

    const handleAIPublish = async () => {
        if (!selectedRecipe) return;

        // Remove temp ID and ensure user ID/favorites are reset
        const { id, isFavorite, ...recipeData } = selectedRecipe;

        try {
            await addRecipe(recipeData);
            await refreshUserRecipes();
            await fetchRecipes();
            setCurrentScreen(Screen.HOME);
        } catch (e) {
            console.error("Failed to publish AI recipe", e);
        }
    };

    const handleDeleteRecipe = async (id: string) => {
        try {
            await deleteRecipe(id);
            await refreshUserRecipes();
            await refreshFavorites();
            await fetchRecipes();
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
                        onOpenGrocery={() => requireAuth(() => navigateTo(Screen.GROCERY), Screen.HOME)}
                        isDark={isDark}
                        onToggleTheme={toggleTheme}
                        user={user}
                        onLoadMore={loadMore}
                        hasMore={hasMore}
                        loadingMore={loadingMore}
                        loading={loading}
                    />
                );
            case Screen.EXPLORE:
                return (
                    <ExploreScreen
                        recipes={recipesWithFavorites}
                        initialSearch={searchQuery}
                        initialCategory={initialCategory}
                        onRecipeClick={(r) => navigateTo(Screen.DETAIL, r)}
                        onAIGenerate={() => navigateTo(Screen.AI_GENERATE)}
                        onToggleFavorite={handleToggleFavorite}
                        onOpenFilter={() => navigateTo(Screen.FILTER)}
                        filters={filters}
                    />
                );
            case Screen.DETAIL:
                const isTempRecipe = selectedRecipe?.id.startsWith('temp-');
                return selectedRecipe ? (
                    <RecipeDetailScreen
                        recipe={{ ...selectedRecipe, isFavorite: isFavorite(selectedRecipe.id) }}
                        onBack={() => setCurrentScreen(Screen.HOME)}
                        onToggleFavorite={handleToggleFavorite}
                        onAddToGrocery={addIngredientsToGrocery}
                        onOpenGrocery={() => requireAuth(() => navigateTo(Screen.GROCERY), Screen.DETAIL)}
                        onPublish={isTempRecipe ? handleAIPublish : undefined}
                        onEdit={isTempRecipe ? (recipe) => {
                            setEditingRecipe(recipe);
                            setCurrentScreen(Screen.PUBLISH);
                        } : undefined}
                        onChefClick={(chefId) => navigateTo(Screen.PUBLIC_PROFILE, undefined, chefId)}
                        onRate={() => setCurrentScreen(Screen.REVIEW)}
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
                        onMyRecipes={() => setCurrentScreen(Screen.MY_RECIPES)}
                        onFavorites={() => setCurrentScreen(Screen.SAVED)}
                        onGroceryList={() => setCurrentScreen(Screen.GROCERY)}
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
                        onClearChecked={clearCheckedGroceryItems}
                        onBack={() => setCurrentScreen(Screen.HOME)}
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
                            await updateRecipe(r.id, { ...r, status });
                        }}
                    />
                );
            case Screen.PUBLIC_PROFILE:
                return currentChefId ? (
                    <PublicProfileScreen
                        userId={currentChefId}
                        onBack={() => setCurrentScreen(selectedRecipe ? Screen.DETAIL : Screen.HOME)}
                        onRecipeClick={(r) => navigateTo(Screen.DETAIL, r)}
                        toggleFavorite={handleToggleFavorite}
                    />
                ) : null;
            case Screen.REVIEW:
                return selectedRecipe ? (
                    <ReviewRecipeScreen
                        recipe={selectedRecipe}
                        onBack={() => setCurrentScreen(Screen.DETAIL)}
                        onSubmit={(review) => {
                            console.log('Review submitted:', review);
                            // In a real app, we'd save this to Supabase
                            setCurrentScreen(Screen.DETAIL);
                        }}
                    />
                ) : null;
            default:
                return null;
        }
    };

    const showBottomNav = !isNavHidden && ![Screen.DETAIL, Screen.AI_GENERATE, Screen.FILTER, Screen.GROCERY, Screen.PUBLISH, Screen.LOGIN, Screen.SIGNUP, Screen.MY_RECIPES, Screen.PUBLIC_PROFILE, Screen.REVIEW].includes(currentScreen);

    if (showSplash) {
        return <SplashScreen />;
    }

    return (
        <AIGenerationProvider>
            <div className={`max-w-md mx-auto ${currentScreen === Screen.LOGIN || currentScreen === Screen.SIGNUP ? '' : 'bg-base-100 text-base-content'} min-h-screen shadow-xl flex flex-col relative overflow-x-hidden ${showBottomNav ? 'pb-20' : ''}`}>
                {renderScreen()}
                {showBottomNav && (
                    <BottomNav
                        currentScreen={currentScreen}
                        onNavigate={(screen) => {
                            if (screen === Screen.SAVED || screen === Screen.PROFILE) {
                                requireAuth(() => setCurrentScreen(screen), currentScreen);
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
                    onModalToggle={setIsNavHidden}
                />
            </div>
        </AIGenerationProvider>
    );
};

export default App;
