
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
import LoadingAnimation from '@/components/LoadingAnimation';
import SplashScreen from '@/components/SplashScreen';
import { useTheme } from '@/hooks/useTheme';
import { useRecipes } from '@/hooks/useRecipes';
import { useFavorites } from '@/hooks/useFavorites';
import { useGrocery } from '@/hooks/useGrocery';
import { useAuth } from '@/hooks/useAuth';

const App: React.FC = () => {
    const { isDark, toggleTheme } = useTheme();
    const { recipes, loading, loadingMore, hasMore, loadMore, addRecipe, deleteRecipe, updateRecipe } = useRecipes();
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

    // Merge favorite status into recipes
    const recipesWithFavorites = recipes.map(r => ({
        ...r,
        isFavorite: isFavorite(r.id),
    }));

    const navigateTo = (screen: Screen, recipe?: Recipe) => {
        if (recipe) setSelectedRecipe(recipe);
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
        coverImage: string | null;
        prepTime: string;
        serves: string;
        difficulty: string;
        category: string;
        ingredients: { id: string; name: string; qty: string; unit: string }[];
        instructions: { id: string; description: string; image: string | null; mediaType?: 'image' | 'video'; timer?: number }[];
    }) => {
        const newRecipe: Omit<Recipe, 'id'> = {
            title: data.title || 'Untitled Recipe',
            image: data.coverImage || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600',
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
        };

        try {
            await addRecipe(newRecipe);
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
            image: data.coverImage || editingRecipe.image,
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
        };

        setSelectedRecipe(updatedDraft);
        setEditingRecipe(null);
        setCurrentScreen(Screen.DETAIL);
    };

    const handleUpdateRecipe = async (id: string, data: {
        title: string;
        description: string;
        coverImage: string | null;
        prepTime: string;
        serves: string;
        difficulty: string;
        category: string;
        ingredients: { id: string; name: string; qty: string; unit: string }[];
        instructions: { id: string; description: string; image: string | null; mediaType?: 'image' | 'video'; timer?: number }[];
    }) => {
        const updatedRecipe: Omit<Recipe, 'id'> = {
            title: data.title || 'Untitled Recipe',
            image: data.coverImage || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600',
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
        };

        try {
            await updateRecipe(id, updatedRecipe);
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
            setCurrentScreen(Screen.HOME);
        } catch (e) {
            console.error("Failed to publish AI recipe", e);
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
                        recipes={recipesWithFavorites}
                        onRecipeClick={(r) => navigateTo(Screen.DETAIL, r)}
                        onToggleFavorite={handleToggleFavorite}
                        onBack={() => setCurrentScreen(Screen.HOME)}
                    />
                );
            case Screen.PROFILE:
                const userRecipeCount = recipes.filter(r => r.userId === user?.id).length;
                const favoriteCount = favoriteIds.size;

                return (
                    <ProfileScreen
                        onBack={() => setCurrentScreen(Screen.HOME)}
                        isDark={isDark}
                        onToggleTheme={toggleTheme}
                        user={user}
                        onSignOut={signOut}
                        onUpdateProfile={updateProfile}
                        recipeCount={userRecipeCount}
                        favoriteCount={favoriteCount}
                        onModalToggle={setIsNavHidden}
                        onMyRecipes={() => setCurrentScreen(Screen.MY_RECIPES)}
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
                const myRecipes = recipesWithFavorites.filter(r => r.userId === user?.id);
                return (
                    <MyRecipesScreen
                        recipes={myRecipes}
                        onBack={() => setCurrentScreen(Screen.PROFILE)}
                        onEdit={(recipe) => {
                            setEditingRecipe(recipe);
                            setCurrentScreen(Screen.PUBLISH);
                        }}
                        onDelete={deleteRecipe}
                        onRecipeClick={(r) => navigateTo(Screen.DETAIL, r)}
                    />
                );
            default:
                return null;
        }
    };

    const showBottomNav = !isNavHidden && ![Screen.DETAIL, Screen.AI_GENERATE, Screen.FILTER, Screen.GROCERY, Screen.PUBLISH, Screen.LOGIN, Screen.SIGNUP, Screen.MY_RECIPES].includes(currentScreen);

    if (showSplash) {
        return <SplashScreen />;
    }

    return (
        <div className={`max-w-md mx-auto ${currentScreen === Screen.LOGIN || currentScreen === Screen.SIGNUP ? '' : (isDark ? 'bg-background-dark text-white' : 'bg-slate-50 text-base-content')} min-h-screen shadow-xl flex flex-col relative overflow-x-hidden ${showBottomNav ? 'pb-20' : ''}`}>
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
    );
};

export default App;
