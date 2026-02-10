
import React, { useState } from 'react';
import { Screen, Recipe } from './types';
import { RECIPES } from './constants';
import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import RecipeDetailScreen from './screens/RecipeDetailScreen';
import AIGenerateScreen from './screens/AIGenerateScreen';
import SavedRecipesScreen from './screens/SavedRecipesScreen';
import ProfileScreen from './screens/ProfileScreen';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>(RECIPES);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialCategory, setInitialCategory] = useState<string | null>(null);

  const navigateTo = (screen: Screen, recipe?: Recipe) => {
    if (recipe) setSelectedRecipe(recipe);
    // Reset specific explore filters unless explicitly navigating to explore with them
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
          />
        );
      case Screen.DETAIL:
        return selectedRecipe ? (
          <RecipeDetailScreen 
            recipe={selectedRecipe} 
            onBack={() => setCurrentScreen(Screen.HOME)} 
            onToggleFavorite={toggleFavorite}
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
      default:
        return null;
    }
  };

  const showBottomNav = currentScreen !== Screen.DETAIL && currentScreen !== Screen.AI_GENERATE;

  return (
    <div className="max-w-md mx-auto bg-slate-50 dark:bg-background-dark min-h-screen shadow-xl flex flex-col relative overflow-x-hidden pb-24">
      {renderScreen()}
      {showBottomNav && (
        <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      )}
    </div>
  );
};

export default App;
