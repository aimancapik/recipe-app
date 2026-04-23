import React, { lazy } from 'react';
import { Screen, Recipe } from '@/types';
import type { FilterOptions } from '@/pages/filter/FilterScreen';
import type { RecipeFormData } from '@/pages/recipe/PublishRecipeScreen';
import type { Conversation } from '@/hooks/social/useChat';

// ── Lazy screens ──────────────────────────────────────────────────────────────
const HomeScreen        = lazy(() => import('@/pages/home/HomeScreen'));
const ExploreScreen     = lazy(() => import('@/pages/explore/ExploreScreen'));
const RecipeDetailScreen= lazy(() => import('@/pages/recipe/RecipeDetailScreen'));
const AIGenerateScreen  = lazy(() => import('@/pages/ai-generate/AIGenerateScreen'));
const SavedRecipesScreen= lazy(() => import('@/pages/saved/SavedRecipesScreen'));
const ProfileScreen     = lazy(() => import('@/pages/profile/ProfileScreen'));
const FilterScreen      = lazy(() => import('@/pages/filter/FilterScreen'));
const GroceryListScreen = lazy(() => import('@/pages/grocery/GroceryListScreen'));
const PublishRecipeScreen=lazy(() => import('@/pages/recipe/PublishRecipeScreen'));
const AuthScreen        = lazy(() => import('@/pages/auth/AuthScreen'));
const MyRecipesScreen   = lazy(() => import('@/pages/my-recipes/MyRecipesScreen'));
const PublicProfileScreen=lazy(() => import('@/pages/profile/PublicProfileScreen'));
const ReviewRecipeScreen= lazy(() => import('@/pages/recipe/ReviewRecipeScreen'));
const CookingModeScreen = lazy(() => import('@/pages/recipe/CookingModeScreen'));
const BitesScreen       = lazy(() => import('@/pages/bites/BitesScreen'));
const NotificationScreen= lazy(() => import('@/pages/notifications/NotificationScreen'));
const MealPlanScreen    = lazy(() => import('@/pages/meal-plan/MealPlanScreen'));
const MessagesScreen    = lazy(() => import('@/pages/messages/MessagesScreen'));
const ChatScreen        = lazy(() => import('@/pages/messages/ChatScreen'));

export interface AppCtx {
    // ── Navigation ────────────────────────────────────────────────────────────
    currentScreen: Screen;
    setCurrentScreen: (s: Screen) => void;
    navigateTo: (screen: Screen, recipe?: Recipe, chefId?: string) => void;
    subScreenReturnTo: Screen | null;
    setSubScreenReturnTo: (s: Screen | null) => void;
    returnScreen: Screen;
    requireAuth: (action: () => void, returnTo?: Screen) => void;
    setPendingAction: (fn: (() => void) | null) => void;

    // ── Recipe state ──────────────────────────────────────────────────────────
    selectedRecipe: Recipe | null;
    setSelectedRecipe: (r: Recipe | null) => void;
    editingRecipe: Recipe | null;
    setEditingRecipe: (r: Recipe | null) => void;
    currentChefId: string | null;
    recipesWithFavorites: Recipe[];
    allSavedRecipes: Recipe[];
    allMyRecipes: Recipe[];
    isFavorite: (id: string) => boolean;
    savedInitialTab: 'saved' | 'collections';
    setSavedInitialTab: (t: 'saved' | 'collections') => void;
    bitesActiveIndex: number;
    setBitesActiveIndex: (i: number) => void;

    // ── Recipe handlers ───────────────────────────────────────────────────────
    handlePublishRecipe: (data: RecipeFormData) => Promise<void>;
    handleUpdateRecipe: (id: string, data: RecipeFormData) => Promise<void>;
    handleSaveDraftRecipe: (data: RecipeFormData) => Promise<void>;
    handleAIPublish: () => Promise<void>;
    handleDeleteRecipe: (id: string) => Promise<void>;
    handleToggleFavorite: (id: string) => void;
    handleSeeAll: (category?: string) => void;
    handleRefresh: (search: string, category: string, feed?: 'forYou' | 'following', followerId?: string, ingredients?: string[]) => void;
    addIngredientsToGrocery: (recipe: Recipe) => void;
    updateStatus: (id: string, status: 'published' | 'draft') => Promise<void>;
    refreshUserRecipes: () => Promise<void>;
    fetchRecipes: (reset?: boolean) => void;
    fetchRecipesByIds: (ids: string[]) => Promise<Recipe[]>;
    loadMore: () => void;
    hasMore: boolean;
    loadingMore: boolean;
    loading: boolean;

    // ── Auth ──────────────────────────────────────────────────────────────────
    user: any;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithFacebook: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (data: any) => Promise<void>;
    handleAuthSuccess: () => void;

    // ── Grocery ───────────────────────────────────────────────────────────────
    groceryItems: any[];
    toggleGroceryItem: (id: string) => void;
    addGroceryItem: (item: any) => void;
    removeGroceryItem: (id: string) => void;
    updateGroceryItem: (id: string, updates: any) => void;
    clearCheckedGroceryItems: () => void;
    clearAllGroceryItems: () => void;

    // ── Meal plan ─────────────────────────────────────────────────────────────
    mealSlots: any[];
    mealPlanLoading: boolean;
    addSlot: (day: any, mealType: any, recipe: any) => Promise<void>;
    removeSlot: (id: string) => Promise<void>;
    clearDay: (day: string) => Promise<void>;
    addFromRecipe: (recipe: Recipe) => void;

    // ── UI ────────────────────────────────────────────────────────────────────
    isDark: boolean;
    toggleTheme: () => void;
    setIsNavHidden: (v: boolean) => void;
    searchQuery: string;
    initialCategory: string | null;
    filters: FilterOptions;
    setFilters: (f: FilterOptions) => void;

    // ── Chat ──────────────────────────────────────────────────────────────────
    conversations: Conversation[];
    messages: any[];
    loadingConvos: boolean;
    loadingMessages: boolean;
    activeConversation: Conversation | null;
    setActiveConversation: (c: Conversation | null) => void;
    fetchConversations: () => void;
    openConversation: (id: string) => void;
    sendMessage: (convoId: string, content: string) => Promise<void>;
    sendTyping: (typing: boolean) => void;
    isOtherUserTyping: boolean;
    totalUnread: number;
    deleteConversation: (id: string) => Promise<void>;
    getOrCreateConversation: (userId: string) => Promise<string>;

    // ── Profile ───────────────────────────────────────────────────────────────
    favoriteIds: Set<string>;
    hasFetchedFavoritesRef: React.MutableRefObject<boolean>;
    hasFetchedUserRecipesRef: React.MutableRefObject<boolean>;
    refreshFavorites: () => Promise<void>;
}

interface Props { ctx: AppCtx }

const ScreenRenderer: React.FC<Props> = ({ ctx }) => {
    const {
        currentScreen, setCurrentScreen, navigateTo,
        subScreenReturnTo, setSubScreenReturnTo,
        returnScreen, requireAuth, setPendingAction,
        selectedRecipe, setSelectedRecipe,
        editingRecipe, setEditingRecipe,
        currentChefId,
        recipesWithFavorites, allSavedRecipes, allMyRecipes,
        isFavorite, savedInitialTab, setSavedInitialTab,
        bitesActiveIndex, setBitesActiveIndex,
        handlePublishRecipe, handleUpdateRecipe, handleSaveDraftRecipe,
        handleAIPublish, handleDeleteRecipe, handleToggleFavorite,
        handleSeeAll, handleRefresh, addIngredientsToGrocery,
        updateStatus, refreshUserRecipes, fetchRecipes, fetchRecipesByIds,
        loadMore, hasMore, loadingMore, loading,
        user, signIn, signUp, signInWithGoogle, signInWithFacebook,
        resetPassword, signOut, updateProfile, handleAuthSuccess,
        groceryItems, toggleGroceryItem, addGroceryItem,
        removeGroceryItem, updateGroceryItem,
        clearCheckedGroceryItems, clearAllGroceryItems,
        mealSlots, mealPlanLoading, addSlot, removeSlot, clearDay, addFromRecipe,
        isDark, toggleTheme, setIsNavHidden,
        searchQuery, initialCategory, filters, setFilters,
        conversations, messages, loadingConvos, loadingMessages,
        activeConversation, setActiveConversation,
        fetchConversations, openConversation, sendMessage, sendTyping, isOtherUserTyping, totalUnread,
        deleteConversation, getOrCreateConversation,
        favoriteIds, hasFetchedFavoritesRef, hasFetchedUserRecipesRef,
        refreshFavorites,
    } = ctx;

    switch (currentScreen) {
        // ── Auth ──────────────────────────────────────────────────────────────
        case Screen.LOGIN:
        case Screen.SIGNUP:
            return (
                <AuthScreen
                    mode={currentScreen === Screen.LOGIN ? 'login' : 'signup'}
                    onToggleMode={() => setCurrentScreen(currentScreen === Screen.LOGIN ? Screen.SIGNUP : Screen.LOGIN)}
                    onSignIn={async (e, p) => { await signIn(e, p); handleAuthSuccess(); }}
                    onSignUp={async (e, p) => { await signUp(e, p); handleAuthSuccess(); }}
                    onGoogleSignIn={signInWithGoogle}
                    onFacebookSignIn={signInWithFacebook}
                    onForgotPassword={resetPassword}
                    onSkip={() => { setPendingAction(null); setCurrentScreen(returnScreen); }}
                />
            );

        // ── Home ──────────────────────────────────────────────────────────────
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
                    onPullRefresh={() => fetchRecipes(false)}
                />
            );

        // ── Notifications ─────────────────────────────────────────────────────
        case Screen.NOTIFICATION:
            return (
                <NotificationScreen
                    onBack={() => setCurrentScreen(subScreenReturnTo ?? Screen.HOME)}
                    onRecipeClick={async (recipeId) => {
                        const fetched = await fetchRecipesByIds([recipeId]);
                        if (fetched.length > 0) {
                            setSelectedRecipe(fetched[0]);
                            setCurrentScreen(Screen.DETAIL);
                            window.scrollTo(0, 0);
                        }
                    }}
                    onProfileClick={(chefId) => navigateTo(Screen.PUBLIC_PROFILE, undefined, chefId)}
                />
            );

        // ── Bites ─────────────────────────────────────────────────────────────
        case Screen.BITES:
            return (
                <BitesScreen
                    recipes={recipesWithFavorites}
                    initialIndex={bitesActiveIndex}
                    onIndexChange={setBitesActiveIndex}
                    onLoadMore={loadMore}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                    onRecipeClick={(r) => { setSubScreenReturnTo(Screen.BITES); navigateTo(Screen.DETAIL, r); }}
                    onToggleFavorite={handleToggleFavorite}
                    onBack={() => setCurrentScreen(Screen.HOME)}
                    onProfileClick={(chefId) => { setSubScreenReturnTo(Screen.BITES); navigateTo(Screen.PUBLIC_PROFILE, undefined, chefId); }}
                />
            );

        // ── Explore ───────────────────────────────────────────────────────────
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

        // ── Recipe Detail ─────────────────────────────────────────────────────
        case Screen.DETAIL: {
            const isTempRecipe = selectedRecipe?.id.startsWith('temp-');
            return selectedRecipe ? (
                <RecipeDetailScreen
                    key={`${selectedRecipe.id}-${selectedRecipe.rating}-${selectedRecipe.reviews}`}
                    recipe={{ ...selectedRecipe, isFavorite: isFavorite(selectedRecipe.id) }}
                    onBack={() => { const t = subScreenReturnTo ?? Screen.HOME; setSubScreenReturnTo(null); setCurrentScreen(t); }}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToGrocery={addIngredientsToGrocery}
                    onOpenGrocery={() => requireAuth(() => navigateTo(Screen.GROCERY), Screen.DETAIL)}
                    onPublish={isTempRecipe ? handleAIPublish : undefined}
                    onEdit={isTempRecipe ? (recipe) => { setEditingRecipe(recipe); setCurrentScreen(Screen.PUBLISH); } : undefined}
                    onChefClick={(chefId) => navigateTo(Screen.PUBLIC_PROFILE, undefined, chefId)}
                    onRate={() => requireAuth(() => setCurrentScreen(Screen.REVIEW), Screen.DETAIL)}
                    onStartCooking={() => setCurrentScreen(Screen.COOKING_MODE)}
                />
            ) : null;
        }

        // ── Cooking Mode ──────────────────────────────────────────────────────
        case Screen.COOKING_MODE:
            return selectedRecipe ? (
                <CookingModeScreen recipe={selectedRecipe} onExit={() => setCurrentScreen(Screen.DETAIL)} />
            ) : null;

        // ── AI Generate ───────────────────────────────────────────────────────
        case Screen.AI_GENERATE:
            return (
                <AIGenerateScreen
                    onBack={() => setCurrentScreen(Screen.EXPLORE)}
                    onRecipeReady={(r) => navigateTo(Screen.DETAIL, r)}
                />
            );

        // ── Saved ─────────────────────────────────────────────────────────────
        case Screen.SAVED:
            return (
                <SavedRecipesScreen
                    recipes={allSavedRecipes}
                    onRecipeClick={(r) => navigateTo(Screen.DETAIL, r)}
                    onToggleFavorite={handleToggleFavorite}
                    initialTab={savedInitialTab}
                    onBack={() => setCurrentScreen(subScreenReturnTo ?? Screen.HOME)}
                />
            );

        // ── Profile ───────────────────────────────────────────────────────────
        case Screen.PROFILE:
            return (
                <ProfileScreen
                    onBack={() => setCurrentScreen(Screen.HOME)}
                    isDark={isDark}
                    onToggleTheme={toggleTheme}
                    user={user}
                    onSignOut={signOut}
                    onUpdateProfile={updateProfile}
                    recipeCount={allMyRecipes.length}
                    favoriteCount={favoriteIds.size}
                    groceryCount={groceryItems.length}
                    onModalToggle={setIsNavHidden}
                    onMyRecipes={() => {
                        if (!hasFetchedUserRecipesRef.current) { hasFetchedUserRecipesRef.current = true; refreshUserRecipes(); }
                        setCurrentScreen(Screen.MY_RECIPES);
                    }}
                    onFavorites={() => {
                        if (!hasFetchedFavoritesRef.current) { hasFetchedFavoritesRef.current = true; refreshFavorites(); }
                        setSavedInitialTab('saved');
                        setSubScreenReturnTo(Screen.PROFILE);
                        setCurrentScreen(Screen.SAVED);
                    }}
                    onGroceryList={() => { setSubScreenReturnTo(Screen.PROFILE); setCurrentScreen(Screen.GROCERY); }}
                    onMealPlan={() => { setSubScreenReturnTo(Screen.PROFILE); setCurrentScreen(Screen.MEAL_PLAN); }}
                    onNotifications={() => { setSubScreenReturnTo(Screen.PROFILE); setCurrentScreen(Screen.NOTIFICATION); }}
                    onMessages={() => { setSubScreenReturnTo(Screen.PROFILE); setCurrentScreen(Screen.MESSAGES); }}
                    totalUnreadMessages={totalUnread}
                    onCollections={() => {
                        if (!hasFetchedFavoritesRef.current) { hasFetchedFavoritesRef.current = true; refreshFavorites(); }
                        setSubScreenReturnTo(Screen.PROFILE);
                        setSavedInitialTab('collections');
                        setCurrentScreen(Screen.SAVED);
                    }}
                    onMessageClick={(otherUserId, otherName, otherAvatar) => {
                        requireAuth(async () => {
                            try {
                                const convoId = await getOrCreateConversation(otherUserId);
                                const existingConvo = conversations.find(c => c.id === convoId);
                                setActiveConversation({
                                    ...(existingConvo ?? { last_message: null, last_message_at: null, unread_count: 0 }),
                                    id: convoId,
                                    other_user: { id: otherUserId, full_name: otherName, avatar_url: otherAvatar },
                                });
                                await openConversation(convoId);
                                setSubScreenReturnTo(Screen.PROFILE);
                                setCurrentScreen(Screen.CHAT);
                            } catch (err) {
                                console.error('Failed to open chat:', err);
                            }
                        }, Screen.PROFILE);
                    }}
                />
            );

        // ── Filter ────────────────────────────────────────────────────────────
        case Screen.FILTER:
            return (
                <FilterScreen
                    onClose={() => setCurrentScreen(Screen.EXPLORE)}
                    onApply={setFilters}
                    initialFilters={filters}
                    resultCount={recipesWithFavorites.length}
                />
            );

        // ── Grocery ───────────────────────────────────────────────────────────
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
                    onBack={() => setCurrentScreen(subScreenReturnTo ?? Screen.HOME)}
                />
            );

        // ── Publish ───────────────────────────────────────────────────────────
        case Screen.PUBLISH:
            return (
                <PublishRecipeScreen
                    onBack={() => {
                        const returnTo = editingRecipe ? (subScreenReturnTo ?? Screen.MY_RECIPES) : Screen.HOME;
                        setEditingRecipe(null);
                        setCurrentScreen(returnTo);
                    }}
                    onPublish={handlePublishRecipe}
                    onUpdate={handleUpdateRecipe}
                    onSaveDraft={handleSaveDraftRecipe}
                    onSuccess={() => {
                        if (editingRecipe?.id.startsWith('temp-')) setCurrentScreen(Screen.DETAIL);
                        else if (editingRecipe) navigateTo(Screen.MY_RECIPES);
                        else navigateTo(Screen.HOME);
                    }}
                    editingRecipe={editingRecipe}
                />
            );

        // ── My Recipes ────────────────────────────────────────────────────────
        case Screen.MY_RECIPES:
            return (
                <MyRecipesScreen
                    recipes={allMyRecipes}
                    onBack={() => setCurrentScreen(Screen.PROFILE)}
                    onEdit={(recipe) => { setEditingRecipe(recipe); setCurrentScreen(Screen.PUBLISH); }}
                    onDelete={handleDeleteRecipe}
                    onRecipeClick={(r) => navigateTo(Screen.DETAIL, r)}
                    onUpdateStatus={async (r, status) => { await updateStatus(r.id, status); await refreshUserRecipes(); }}
                />
            );

        // ── Public Profile ────────────────────────────────────────────────────
        case Screen.PUBLIC_PROFILE:
            return currentChefId ? (
                <PublicProfileScreen
                    userId={currentChefId}
                    onBack={() => {
                        const t = subScreenReturnTo ?? (selectedRecipe ? Screen.DETAIL : Screen.HOME);
                        setSubScreenReturnTo(null);
                        setCurrentScreen(t);
                    }}
                    onRecipeClick={(r) => { setSubScreenReturnTo(Screen.PUBLIC_PROFILE); navigateTo(Screen.DETAIL, r); }}
                    toggleFavorite={handleToggleFavorite}
                    onUserClick={(uid) => navigateTo(Screen.PUBLIC_PROFILE, undefined, uid)}
                    onMessageClick={(otherUserId, otherName, otherAvatar) => {
                        requireAuth(async () => {
                            try {
                                const convoId = await getOrCreateConversation(otherUserId);
                                const existingConvo = conversations.find(c => c.id === convoId);
                                setActiveConversation({
                                    ...(existingConvo ?? { last_message: null, last_message_at: null, unread_count: 0 }),
                                    id: convoId,
                                    other_user: { id: otherUserId, full_name: otherName, avatar_url: otherAvatar },
                                });
                                await openConversation(convoId);
                                setSubScreenReturnTo(Screen.PUBLIC_PROFILE);
                                setCurrentScreen(Screen.CHAT);
                            } catch (err) {
                                console.error('Failed to open chat:', err);
                            }
                        }, Screen.PUBLIC_PROFILE);
                    }}
                />
            ) : null;

        // ── Review ────────────────────────────────────────────────────────────
        case Screen.REVIEW:
            return selectedRecipe ? (
                <ReviewRecipeScreen
                    recipe={selectedRecipe}
                    onBack={() => setCurrentScreen(Screen.DETAIL)}
                    onSubmit={async () => {
                        try {
                            const { supabase } = await import('@/lib/supabase');
                            const { data, error } = await supabase
                                .from('recipes')
                                .select('rating, reviews')
                                .eq('id', selectedRecipe.id)
                                .single();
                            if (!error && data) {
                                setSelectedRecipe({ ...selectedRecipe, rating: data.rating, reviews: data.reviews });
                                await new Promise(r => setTimeout(r, 100));
                            }
                        } catch { /* non-critical */ }
                        setCurrentScreen(Screen.DETAIL);
                    }}
                />
            ) : null;

        // ── Messages ──────────────────────────────────────────────────────────
        case Screen.MESSAGES:
            return (
                <MessagesScreen
                    conversations={conversations}
                    loading={loadingConvos}
                    onBack={() => setCurrentScreen(subScreenReturnTo ?? Screen.HOME)}
                    onDeleteConversation={deleteConversation}
                    onOpenChat={(convo) => {
                        setActiveConversation(convo);
                        openConversation(convo.id);
                        setCurrentScreen(Screen.CHAT);
                    }}
                />
            );

        // ── Chat ──────────────────────────────────────────────────────────────
        case Screen.CHAT:
            return activeConversation && user ? (
                <ChatScreen
                    conversation={activeConversation}
                    messages={messages}
                    loading={loadingMessages}
                    currentUserId={user.id}
                    isOtherUserTyping={isOtherUserTyping}
                    onBack={() => { fetchConversations(); setCurrentScreen(Screen.MESSAGES); }}
                    onSend={(content) => sendMessage(activeConversation.id, content)}
                    onTyping={sendTyping}
                />
            ) : null;

        // ── Meal Plan ─────────────────────────────────────────────────────────
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
                        const fullRecipes = await fetchRecipesByIds(recipeIds);
                        for (const recipe of fullRecipes) await addFromRecipe(recipe);
                        navigateTo(Screen.GROCERY);
                    }}
                    onRecipeClick={(r) => navigateTo(Screen.DETAIL, r)}
                    onBack={() => setCurrentScreen(subScreenReturnTo ?? Screen.HOME)}
                />
            );

        default:
            return null;
    }
};

export default ScreenRenderer;
