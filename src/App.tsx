
import React, { useState, useEffect } from 'react';
import { Screen, Recipe, GroceryItem } from '@/types';
import { RECIPES } from '@/data/constants';
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

const App: React.FC = () => {
    const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [recipes, setRecipes] = useState<Recipe[]>(() => {
        try {
            const saved = localStorage.getItem('culinary_haven_recipes');
            if (saved) return JSON.parse(saved);
        } catch { /* ignore */ }
        return RECIPES;
    });

    useEffect(() => {
        try {
            localStorage.setItem('culinary_haven_recipes', JSON.stringify(recipes));
        } catch { /* ignore if storage full */ }
    }, [recipes]);
    const [searchQuery, setSearchQuery] = useState('');
    const [initialCategory, setInitialCategory] = useState<string | null>(null);
    const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
    const [quickActionsOpen, setQuickActionsOpen] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({
        sortBy: 'popular',
        cookingTime: null,
        dietary: [],
        difficulty: null,
    });

    const navigateTo = (screen: Screen, recipe?: Recipe) => {
        if (recipe) setSelectedRecipe(recipe);
        if (screen !== Screen.EXPLORE) {
            setSearchQuery('');
            setInitialCategory(null);
        }
        setCurrentScreen(screen);
        window.scrollTo(0, 0);
    };

    const toggleFavorite = (id: string) => {
        setRecipes(prev => prev.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
    };

    const handleSearchFromHome = (query: string) => {
        setSearchQuery(query);
        setInitialCategory(null);
        setCurrentScreen(Screen.EXPLORE);
    };

    const handleSeeAll = (category?: string) => {
        setSearchQuery('');
        setInitialCategory(category || null);
        setCurrentScreen(Screen.EXPLORE);
    };

    const addIngredientsToGrocery = (recipe: Recipe) => {
        setGroceryItems(prev => {
            const existingNames = new Set(prev.map(item => item.name.toLowerCase()));
            const newItems: GroceryItem[] = recipe.ingredients
                .filter(ing => !existingNames.has(ing.toLowerCase()))
                .map((ing, idx) => ({
                    id: `${recipe.id}-${Date.now()}-${idx}`,
                    name: ing,
                    checked: false,
                    recipeTitle: recipe.title,
                    recipeImage: recipe.image,
                }));
            return [...prev, ...newItems];
        });
        navigateTo(Screen.GROCERY);
    };

    const toggleGroceryItem = (id: string) => {
        setGroceryItems(prev => prev.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const clearCheckedGroceryItems = () => {
        setGroceryItems(prev => prev.filter(item => !item.checked));
    };

    const handlePublishRecipe = (data: {
        title: string;
        description: string;
        coverImage: string | null;
        prepTime: string;
        serves: string;
        difficulty: string;
        ingredients: { id: string; name: string; qty: string; unit: string }[];
        instructions: { id: string; description: string; image: string | null }[];
    }) => {
        const newRecipe: Recipe = {
            id: `user-${Date.now()}`,
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
                })),
            category: 'popular',
            isFavorite: false,
        };
        setRecipes(prev => [newRecipe, ...prev]);
        navigateTo(Screen.HOME);
    };

    const renderScreen = () => {
        switch (currentScreen) {
            case Screen.HOME:
                return (
                    <HomeScreen
                        recipes={recipes}
                        onRecipeClick={(r) => navigateTo(Screen.DETAIL, r)}
                        onToggleFavorite={toggleFavorite}
                        onSearch={handleSearchFromHome}
                        onSeeAll={handleSeeAll}
                        onOpenGrocery={() => navigateTo(Screen.GROCERY)}
                    />
                );
            case Screen.EXPLORE:
                return (
                    <ExploreScreen
                        recipes={recipes}
                        initialSearch={searchQuery}
                        initialCategory={initialCategory}
                        onRecipeClick={(r) => navigateTo(Screen.DETAIL, r)}
                        onAIGenerate={() => navigateTo(Screen.AI_GENERATE)}
                        onToggleFavorite={toggleFavorite}
                        onOpenFilter={() => navigateTo(Screen.FILTER)}
                        filters={filters}
                    />
                );
            case Screen.DETAIL:
                return selectedRecipe ? (
                    <RecipeDetailScreen
                        recipe={selectedRecipe}
                        onBack={() => setCurrentScreen(Screen.HOME)}
                        onToggleFavorite={toggleFavorite}
                        onAddToGrocery={addIngredientsToGrocery}
                        onOpenGrocery={() => navigateTo(Screen.GROCERY)}
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
                        recipes={recipes}
                        onRecipeClick={(r) => navigateTo(Screen.DETAIL, r)}
                        onToggleFavorite={toggleFavorite}
                        onBack={() => setCurrentScreen(Screen.HOME)}
                    />
                );
            case Screen.PROFILE:
                return (
                    <ProfileScreen
                        onBack={() => setCurrentScreen(Screen.HOME)}
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
                        onBack={() => setCurrentScreen(Screen.HOME)}
                        onPublish={handlePublishRecipe}
                    />
                );
            default:
                return null;
        }
    };

    const showBottomNav = currentScreen !== Screen.DETAIL && currentScreen !== Screen.AI_GENERATE && currentScreen !== Screen.FILTER && currentScreen !== Screen.GROCERY && currentScreen !== Screen.PUBLISH;

    return (
        <div className="max-w-md mx-auto bg-slate-50 dark:bg-background-dark min-h-screen shadow-xl flex flex-col relative overflow-x-hidden pb-24">
            {renderScreen()}
            {showBottomNav && (
                <BottomNav
                    currentScreen={currentScreen}
                    onNavigate={setCurrentScreen}
                    onQuickAction={() => setQuickActionsOpen(true)}
                />
            )}
            <QuickActionsOverlay
                isOpen={quickActionsOpen}
                onClose={() => setQuickActionsOpen(false)}
                onCreateRecipe={() => navigateTo(Screen.PUBLISH)}
                onAddToShoppingList={() => navigateTo(Screen.GROCERY)}
            />
        </div>
    );
};

export default App;
