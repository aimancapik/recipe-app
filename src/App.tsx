import React, { useState, useCallback, lazy, Suspense } from 'react';
import { Screen, Recipe } from '@/types';
import type { FilterOptions } from '@/pages/filter/FilterScreen';
import type { RecipeFormData } from '@/pages/recipe/PublishRecipeScreen';
import type { Conversation } from '@/hooks/social/useChat';

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { useTheme } from '@/hooks/ui/useTheme';
import { useRecipes } from '@/hooks/recipe/useRecipes';
import { useFavorites } from '@/hooks/ui/useFavorites';
import { useGrocery } from '@/hooks/grocery/useGrocery';
import { useMealPlan } from '@/hooks/meal-plan/useMealPlan';
import { useAuth } from '@/hooks/auth/useAuth';
import { useFollows } from '@/hooks/social/useFollows';
import { useChat } from '@/hooks/social/useChat';
import { useToast } from '@/hooks/ui/useToast';
import { useOnlineStatus } from '@/hooks/ui/useOnlineStatus';

// ── Components ────────────────────────────────────────────────────────────────
import BottomNav from '@/components/layout/BottomNav';
import QuickActionsOverlay from '@/components/layout/QuickActionsOverlay';
import LoadingAnimation from '@/components/common/LoadingAnimation';
import SplashScreen from '@/components/layout/SplashScreen';
import ToastContainer from '@/components/common/ToastContainer';
import ScreenRenderer from '@/components/navigation/ScreenRenderer';
import { AIGenerationProvider } from '@/contexts/AIGenerationContext';

// ── Utilities ─────────────────────────────────────────────────────────────────
import { buildNewRecipe, buildUpdatedRecipe, buildDraftRecipe } from '@/lib/recipeFormUtils';
import { uploadOptimizedImage } from '@/lib/storage';

const OnboardingScreen = lazy(() => import('@/pages/onboarding/OnboardingScreen'));

const isDataUrl = (value?: string | null) => Boolean(value?.startsWith('data:'));

const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const mime = blob.type || dataUrl.match(/^data:([^;]+);/)?.[1] || 'image/jpeg';
    const extension = mime.split('/')[1]?.split('+')[0] || 'jpg';
    const baseName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'imported-recipe';
    return new File([blob], `${baseName}.${extension}`, { type: mime });
};

const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === 'object' && err !== null) {
        const maybeError = err as { message?: string; error_description?: string; details?: string };
        return maybeError.message || maybeError.error_description || maybeError.details || fallback;
    }
    return fallback;
};

const uploadImportedDataUrl = async (dataUrl: string, sourceName?: string) => {
    const file = await dataUrlToFile(dataUrl, sourceName || 'imported-recipe-image');
    const { url } = await uploadOptimizedImage(file, 'imports');
    return url;
};

const persistImportedImages = async (recipe: Omit<Recipe, 'id'>): Promise<Omit<Recipe, 'id'>> => {
    const uploaded = new Map<string, string>();
    const uploadOnce = async (value?: string | null) => {
        if (!value || !isDataUrl(value)) return value || null;
        if (!uploaded.has(value)) {
            uploaded.set(value, await uploadImportedDataUrl(value, recipe.sourceName));
        }
        return uploaded.get(value)!;
    };

    const image = await uploadOnce(recipe.image) || recipe.image;
    const images = await Promise.all((recipe.images || []).map(async item => await uploadOnce(item) || item));
    const directions = await Promise.all((recipe.directions || []).map(async direction => ({
        ...direction,
        image: await uploadOnce(direction.image),
    })));

    return { ...recipe, image, images, directions };
};

// ── Screens hidden from bottom nav ────────────────────────────────────────────
const NO_NAV_SCREENS: Screen[] = [
    Screen.DETAIL, Screen.AI_GENERATE, Screen.FILTER, Screen.GROCERY,
    Screen.PUBLISH, Screen.LOGIN, Screen.SIGNUP, Screen.MY_RECIPES,
    Screen.PUBLIC_PROFILE, Screen.REVIEW, Screen.COOKING_MODE,
    Screen.MEAL_PLAN, Screen.BITES, Screen.NOTIFICATION,
    Screen.MESSAGES, Screen.CHAT, Screen.IMPORT, Screen.IMPORT_PREVIEW,
];

const FULLSCREEN_SCREENS: Screen[] = [Screen.BITES, Screen.NOTIFICATION];

// ─────────────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
    // ── Global UI ─────────────────────────────────────────────────────────────
    const { toasts, showToast, dismiss } = useToast();
    const isOnline = useOnlineStatus();
    useTheme();

    // ── Data hooks ────────────────────────────────────────────────────────────
    const {
        recipes, loading, loadingMore, hasMore,
        fetchRecipes, fetchRecipesByIds, fetchRecipesByUserId,
        loadMore, addRecipe, deleteRecipe, updateRecipe, updateStatus,
    } = useRecipes();

    const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();

    const {
        items: groceryItems,
        toggleItem: toggleGroceryItem,
        clearChecked: clearCheckedGroceryItems,
        addFromRecipe,
        addItem: addGroceryItem,
        removeItem: removeGroceryItem,
        updateItem: updateGroceryItem,
        clearAll: clearAllGroceryItems,
    } = useGrocery();

    const { slots: mealSlots, loading: mealPlanLoading, addSlot, removeSlot, clearDay } = useMealPlan();

    const { user, loading: authLoading, signIn, signUp, signInWithGoogle, signInWithFacebook, resetPassword, signOut, updateProfile } = useAuth();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { followingIds } = useFollows(user?.id);

    const {
        conversations, messages, loadingConvos, loadingMessages, totalUnread,
        fetchConversations, openConversation, sendMessage, sendRecipe, sendTyping, isOtherUserTyping,
        deleteConversation, getOrCreateConversation,
    } = useChat(user?.id, (msg, senderName) => {
        showToast(`${senderName}: ${msg.content.length > 40 ? msg.content.slice(0, 40) + '…' : msg.content}`, 'info');
    });

    // ── Navigation state ──────────────────────────────────────────────────────
    const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
    const [subScreenReturnTo, setSubScreenReturnTo] = useState<Screen | null>(null);
    const [returnScreen, setReturnScreen] = useState<Screen>(Screen.HOME);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    // ── Recipe state ──────────────────────────────────────────────────────────
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [currentChefId, setCurrentChefId] = useState<string | null>(null);
    const [bitesActiveIndex, setBitesActiveIndex] = useState(0);
    const [savedInitialTab, setSavedInitialTab] = useState<'saved' | 'collections'>('saved');

    // ── UI state ──────────────────────────────────────────────────────────────
    const [showSplash, setShowSplash] = useState(true);
    const [isNavHidden, setIsNavHidden] = useState(false);
    const [quickActionsOpen, setQuickActionsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [initialCategory, setInitialCategory] = useState<string | null>(null);
    const [filters, setFilters] = useState<FilterOptions>({ sortBy: 'popular', cookingTime: null, dietary: [], difficulty: null });
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem('recipe_app_onboarded') !== 'true');

    // ── Lazy-fetch refs ───────────────────────────────────────────────────────
    const hasFetchedFavoritesRef = React.useRef(false);
    const hasFetchedUserRecipesRef = React.useRef(false);
    const [fullFavoriteRecipes, setFullFavoriteRecipes] = useState<Recipe[]>([]);
    const [fullUserRecipes, setFullUserRecipes] = useState<Recipe[]>([]);

    // ── Derived data ──────────────────────────────────────────────────────────
    const recipesWithFavorites = recipes.map(r => ({ ...r, isFavorite: isFavorite(r.id) }));

    const allSavedRecipes = Array.from(new Map([
        ...recipesWithFavorites.filter(r => r.isFavorite),
        ...fullFavoriteRecipes.map(r => ({ ...r, isFavorite: true })),
    ].map(item => [item.id, item])).values());

    const allMyRecipes = Array.from(new Map([
        ...recipesWithFavorites.filter(r => r.userId === user?.id),
        ...fullUserRecipes.map(r => ({ ...r, isFavorite: isFavorite(r.id) })),
    ].map(item => [item.id, item])).values());

    // ── Refresh helpers ───────────────────────────────────────────────────────
    const refreshFavorites = useCallback(async () => {
        if (favoriteIds.size === 0) { setFullFavoriteRecipes([]); return; }
        const fetched = await fetchRecipesByIds(Array.from(favoriteIds));
        setFullFavoriteRecipes(fetched);
    }, [favoriteIds, fetchRecipesByIds]);

    const refreshUserRecipes = useCallback(async () => {
        if (!user) { setFullUserRecipes([]); return; }
        setFullUserRecipes(await fetchRecipesByUserId(user.id));
    }, [user, fetchRecipesByUserId]);

    const handleRefresh = useCallback((search: string, category: string, feed?: 'forYou' | 'following', followerId?: string, ingredients?: string[]) => {
        fetchRecipes(false, search, category, feed, followerId, ingredients || []);
    }, [fetchRecipes]);

    React.useEffect(() => { if (hasFetchedFavoritesRef.current) refreshFavorites(); }, [favoriteIds, refreshFavorites]);
    React.useEffect(() => { if (hasFetchedUserRecipesRef.current) refreshUserRecipes(); }, [user, refreshUserRecipes]);

    // ── Auth helpers ──────────────────────────────────────────────────────────
    const requireAuth = useCallback((action: () => void, returnTo: Screen = Screen.HOME) => {
        if (authLoading) return; // wait for session to resolve
        if (user) { action(); }
        else {
            sessionStorage.setItem('auth_return_screen', returnTo);
            setPendingAction(() => action);
            setReturnScreen(returnTo);
            setCurrentScreen(Screen.LOGIN);
        }
    }, [user, authLoading]);

    const handleAuthSuccess = useCallback(() => {
        if (pendingAction) { pendingAction(); setPendingAction(null); }
        setCurrentScreen(returnScreen);
    }, [pendingAction, returnScreen]);

    // ── Navigation ────────────────────────────────────────────────────────────
    const navigateTo = useCallback(async (screen: Screen, recipe?: Recipe, chefId?: string) => {
        if (recipe) {
            if (screen === Screen.DETAIL && (recipe.ingredients?.length ?? 0) === 0 && (recipe.directions?.length ?? 0) === 0 && !recipe.id.startsWith('temp-')) {
                setSelectedRecipe(recipe);
                setCurrentScreen(screen);
                window.scrollTo(0, 0);
                try {
                    const full = await fetchRecipesByIds([recipe.id]);
                    if (full.length > 0) setSelectedRecipe(full[0]);
                } catch { /* non-critical */ }
                if (chefId) setCurrentChefId(chefId);
                setSearchQuery(''); setInitialCategory(null);
                return;
            }
            setSelectedRecipe(recipe);
        }
        if (chefId) setCurrentChefId(chefId);
        if (screen !== Screen.EXPLORE) { setSearchQuery(''); setInitialCategory(null); }
        if ((screen === Screen.SAVED || screen === Screen.PROFILE) && !hasFetchedFavoritesRef.current) {
            hasFetchedFavoritesRef.current = true; refreshFavorites();
        }
        if ((screen === Screen.MY_RECIPES || screen === Screen.PROFILE) && !hasFetchedUserRecipesRef.current) {
            hasFetchedUserRecipesRef.current = true; refreshUserRecipes();
        }
        setCurrentScreen(screen);
        window.scrollTo(0, 0);
    }, [fetchRecipesByIds, refreshFavorites, refreshUserRecipes]);

    // ── Recipe handlers ───────────────────────────────────────────────────────
    const handlePublishRecipe = async (data: RecipeFormData) => {
        try {
            await addRecipe(buildNewRecipe(data));
            await Promise.all([refreshUserRecipes(), fetchRecipes()]);
            showToast('Recipe published!', 'success');
        } catch (err) {
            showToast('Failed to publish recipe. Try again.', 'error');
            throw err;
        }
    };

    const handleUpdateRecipe = async (id: string, data: RecipeFormData) => {
        try {
            await updateRecipe(id, buildUpdatedRecipe(data, editingRecipe!));
            await Promise.all([refreshUserRecipes(), refreshFavorites(), fetchRecipes()]);
            setEditingRecipe(null);
        } catch (err) {
            showToast('Failed to update recipe.', 'error');
            throw err;
        }
    };

    const handleSaveDraftRecipe = async (data: RecipeFormData) => {
        if (!editingRecipe) return;
        try {
            const draft = buildDraftRecipe(data, editingRecipe);
            if (editingRecipe.id.startsWith('temp-')) {
                const { id: _id, isFavorite: _fav, ...draftData } = draft;
                const newId = await addRecipe(draftData);
                setSelectedRecipe({ ...draft, id: newId });
            } else {
                await updateRecipe(editingRecipe.id, draft);
                setSelectedRecipe(draft);
            }
            await refreshUserRecipes();
            setEditingRecipe(null);
        } catch (err) {
            showToast('Failed to save draft.', 'error');
            throw err;
        }
    };

    const handleAIPublish = async () => {
        if (!selectedRecipe) return;
        const { id, isFavorite: _fav, ...recipeData } = selectedRecipe;
        try {
            await addRecipe(recipeData);
            await Promise.all([refreshUserRecipes(), fetchRecipes()]);
            setCurrentScreen(Screen.HOME);
        } catch { showToast('Failed to publish AI recipe.', 'error'); }
    };

    const handleSaveImportedRecipe = async (recipe: Recipe) => {
        const { id, isFavorite: _fav, ...recipeData } = recipe;
        try {
            await addRecipe(await persistImportedImages(recipeData));
            await Promise.all([refreshUserRecipes(), fetchRecipes()]);
            showToast('Imported recipe saved!', 'success');
            setSelectedRecipe(null);
            setCurrentScreen(Screen.HOME);
        } catch (err) {
            showToast(`Failed to save imported recipe: ${getErrorMessage(err, 'Try again.')}`, 'error');
        }
    };

    const handleDeleteRecipe = async (id: string) => {
        try {
            await deleteRecipe(id);
            await Promise.all([refreshUserRecipes(), refreshFavorites(), fetchRecipes()]);
        } catch {
            showToast('Failed to delete recipe.', 'error');
        }
    };

    const handleToggleFavorite = (id: string) => requireAuth(() => toggleFavorite(id), currentScreen);

    const handleSeeAll = (category?: string) => {
        setSearchQuery(''); setInitialCategory(category || null); setCurrentScreen(Screen.EXPLORE);
    };

    const addIngredientsToGrocery = (recipe: Recipe) => {
        requireAuth(() => { addFromRecipe(recipe); setSubScreenReturnTo(Screen.DETAIL); navigateTo(Screen.GROCERY); }, Screen.DETAIL);
    };

    // ── Effects ───────────────────────────────────────────────────────────────

    // Handle OAuth redirect: listen for SIGNED_IN event dispatched by useAuth
    React.useEffect(() => {
        const handler = (e: Event) => {
            const { returnTo } = (e as CustomEvent).detail;
            if (returnTo === Screen.PROFILE) {
                if (!hasFetchedFavoritesRef.current) { hasFetchedFavoritesRef.current = true; refreshFavorites(); }
                if (!hasFetchedUserRecipesRef.current) { hasFetchedUserRecipesRef.current = true; refreshUserRecipes(); }
            }
            setCurrentScreen(returnTo as Screen);
        };
        window.addEventListener('auth:signed_in', handler);
        return () => window.removeEventListener('auth:signed_in', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fallback: email/password sign-in on LOGIN screen
    React.useEffect(() => {
        if (!authLoading && user && (currentScreen === Screen.LOGIN || currentScreen === Screen.SIGNUP)) {
            handleAuthSuccess();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading]);

    React.useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    React.useEffect(() => {
        const handleDeepLink = async (path: string, search: string) => {
            const params = new URLSearchParams(search);
            const recipeMatch = path.match(/\/recipe\/([0-9a-fA-F-]+)/);
            const sharedUserId = params.get('user');
            if (recipeMatch?.[1]) {
                try {
                    const fetched = await fetchRecipesByIds([recipeMatch[1]]);
                    if (fetched.length > 0) { setSelectedRecipe(fetched[0]); setCurrentScreen(Screen.DETAIL); }
                    else showToast('Recipe not found.', 'error');
                } catch { showToast('Failed to open recipe link.', 'error'); }
            } else if (sharedUserId) {
                setCurrentChefId(sharedUserId); setCurrentScreen(Screen.PUBLIC_PROFILE);
            }
        };

        if (window.location.pathname.includes('/recipe/') || window.location.search.includes('user=')) {
            handleDeepLink(window.location.pathname, window.location.search);
        }

        let listener: any = null;
        import('@capacitor/app').then(({ App: CapApp }) => {
            listener = CapApp.addListener('appUrlOpen', (event) => {
                try { const url = new URL(event.url); handleDeepLink(url.pathname, url.search); } catch { /* ignore */ }
            });
        }).catch(() => {});

        return () => { if (listener?.remove) listener.remove(); };
    }, [fetchRecipesByIds]);

    // ── Render ────────────────────────────────────────────────────────────────
    if (showSplash) return <SplashScreen />;

    const showBottomNav = !isNavHidden && !NO_NAV_SCREENS.includes(currentScreen);
    const isFullscreen = FULLSCREEN_SCREENS.includes(currentScreen);
    const isAuthScreen = currentScreen === Screen.LOGIN || currentScreen === Screen.SIGNUP;

    const ctx = {
        currentScreen, setCurrentScreen, navigateTo,
        subScreenReturnTo, setSubScreenReturnTo, returnScreen,
        requireAuth, setPendingAction,
        selectedRecipe, setSelectedRecipe,
        editingRecipe, setEditingRecipe,
        currentChefId,
        recipesWithFavorites, allSavedRecipes, allMyRecipes,
        isFavorite, savedInitialTab, setSavedInitialTab,
        bitesActiveIndex, setBitesActiveIndex,
        handlePublishRecipe, handleUpdateRecipe, handleSaveDraftRecipe,
        handleAIPublish, handleSaveImportedRecipe, handleDeleteRecipe, handleToggleFavorite,
        handleSeeAll, handleRefresh, addIngredientsToGrocery,
        updateStatus, refreshUserRecipes, fetchRecipes, fetchRecipesByIds,
        loadMore, hasMore, loadingMore, loading,
        user, signIn, signUp, signInWithGoogle, signInWithFacebook,
        resetPassword, signOut, updateProfile, handleAuthSuccess,
        groceryItems, toggleGroceryItem, addGroceryItem,
        removeGroceryItem, updateGroceryItem,
        clearCheckedGroceryItems, clearAllGroceryItems,
        mealSlots, mealPlanLoading, addSlot, removeSlot, clearDay, addFromRecipe,
        setIsNavHidden,
        searchQuery, initialCategory, filters, setFilters,
        conversations, messages, loadingConvos, loadingMessages,
        activeConversation, setActiveConversation,
        fetchConversations, openConversation, sendMessage, sendRecipe, sendTyping, isOtherUserTyping, totalUnread,
        deleteConversation, getOrCreateConversation,
        favoriteIds, hasFetchedFavoritesRef, hasFetchedUserRecipesRef,
        refreshFavorites,
    };

    return (
        <AIGenerationProvider>
            <div className={`max-w-md mx-auto min-h-screen shadow-xl flex flex-col
                ${isAuthScreen ? '' : 'bg-base-100 text-base-content'}
                ${isFullscreen ? '' : 'relative overflow-x-hidden'}
                ${showBottomNav ? 'pb-20' : ''}
            `}>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingAnimation size={48} /></div>}>
                    <ScreenRenderer ctx={ctx} />
                </Suspense>

                {showBottomNav && (
                    <BottomNav
                        currentScreen={currentScreen}
                        onNavigate={(screen) => {
                            if (screen === Screen.SAVED || screen === Screen.PROFILE) {
                                requireAuth(() => {
                                    if (screen === Screen.SAVED && !hasFetchedFavoritesRef.current) { hasFetchedFavoritesRef.current = true; refreshFavorites(); }
                                    if (screen === Screen.SAVED) { setSavedInitialTab('saved'); setSubScreenReturnTo(Screen.HOME); }
                                    if (screen === Screen.PROFILE && !hasFetchedFavoritesRef.current) { hasFetchedFavoritesRef.current = true; refreshFavorites(); }
                                    if (screen === Screen.PROFILE && !hasFetchedUserRecipesRef.current) { hasFetchedUserRecipesRef.current = true; refreshUserRecipes(); }
                                    setCurrentScreen(screen);
                                }, currentScreen);
                            } else {
                                setCurrentScreen(screen);
                            }
                        }}
                        onQuickAction={() => setQuickActionsOpen(true)}
                        unreadMessages={totalUnread}
                    />
                )}

                <QuickActionsOverlay
                    isOpen={quickActionsOpen}
                    onClose={() => setQuickActionsOpen(false)}
                    onCreateRecipe={() => requireAuth(() => navigateTo(Screen.PUBLISH), Screen.HOME)}
                    onAddToShoppingList={() => requireAuth(() => navigateTo(Screen.GROCERY), Screen.HOME)}
                    onPlanMeal={() => requireAuth(() => { setSubScreenReturnTo(currentScreen); navigateTo(Screen.MEAL_PLAN); }, currentScreen)}
                    onImportRecipe={() => navigateTo(Screen.IMPORT)}
                    onModalToggle={setIsNavHidden}
                />

                <Suspense fallback={null}>
                    {showOnboarding && <OnboardingScreen onComplete={() => { localStorage.setItem('recipe_app_onboarded', 'true'); setShowOnboarding(false); }} />}
                </Suspense>

                <ToastContainer toasts={toasts} onDismiss={dismiss} />

                {!isOnline && (
                    <div className="fixed top-0 left-0 right-0 z-[300] flex items-center justify-center gap-2 bg-warning text-warning-content text-sm font-semibold py-2 px-4">
                        <span className="material-symbols-outlined text-[18px]">wifi_off</span>
                        No internet connection
                    </div>
                )}
            </div>
        </AIGenerationProvider>
    );
};

export default App;
