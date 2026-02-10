
import React, { useState } from 'react';
import { Recipe, Category } from '../types';
import { CATEGORIES } from '../constants';

interface HomeScreenProps {
  recipes: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
  onToggleFavorite: (id: string) => void;
  onSearch: (query: string) => void;
  onSeeAll: (category?: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ recipes, onRecipeClick, onToggleFavorite, onSearch, onSeeAll }) => {
  const [activeCategory, setActiveCategory] = useState('popular');
  const [searchValue, setSearchValue] = useState('');

  const filteredRecipes = recipes.filter(r => 
    activeCategory === 'popular' ? true : r.category === activeCategory
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim().length >= 3) {
      onSearch(searchValue);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    // Search on type: navigate to explore screen once 3 chars are entered
    if (val.trim().length >= 3) {
      onSearch(val);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-full border-2 border-primary p-0.5">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-full" 
              style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100")' }} 
            />
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight tracking-tight">Hello, Alex!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">What are you cooking today?</p>
          </div>
        </div>
        <button className="relative p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 size-2.5 bg-red-500 border-2 border-white dark:border-background-dark rounded-full"></span>
        </button>
      </header>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="px-4 py-3">
        <label className="flex items-center bg-white dark:bg-slate-800 rounded-xl px-4 h-14 w-full shadow-sm border border-slate-100 dark:border-slate-700 cursor-text">
          <span className="material-symbols-outlined text-slate-400">search</span>
          <input 
            className="bg-transparent border-none focus:ring-0 w-full text-base placeholder:text-slate-400" 
            placeholder="Search recipes..." 
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
          />
          <button type="submit" className="material-symbols-outlined text-primary">tune</button>
        </label>
      </form>

      {/* Categories */}
      <div className="py-4">
        <div className="flex items-center justify-between px-4 mb-4">
          <h3 className="text-lg font-bold">Categories</h3>
          <button onClick={() => onSeeAll()} className="text-primary font-semibold text-sm">See All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar pb-2">
          {CATEGORIES.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => setActiveCategory(cat.id)}
              className="flex flex-col items-center gap-2 shrink-0 group"
            >
              <div className={`size-16 rounded-2xl flex items-center justify-center transition-all ${
                activeCategory === cat.id 
                  ? 'bg-primary shadow-lg shadow-primary/20 scale-105' 
                  : 'bg-white dark:bg-slate-800 shadow-sm'
              }`}>
                <span className={`material-symbols-outlined text-3xl ${
                  activeCategory === cat.id ? 'text-white fill-icon' : 'text-slate-600 dark:text-slate-300'
                }`}>
                  {cat.icon}
                </span>
              </div>
              <span className={`text-sm ${activeCategory === cat.id ? 'font-bold' : 'font-medium text-slate-600 dark:text-slate-400'}`}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Popular Recipes Section */}
      <div className="flex-1 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">
            {activeCategory === 'popular' ? 'Popular Recipes' : `${activeCategory} Recipes`}
          </h3>
          <button onClick={() => onSeeAll(activeCategory === 'popular' ? undefined : activeCategory)} className="text-primary font-semibold text-sm">See All</button>
        </div>
        <div className="grid grid-cols-2 gap-4 pb-2">
          {filteredRecipes.map((recipe) => (
            <RecipeCardSmall 
              key={recipe.id} 
              recipe={recipe} 
              onClick={() => onRecipeClick(recipe)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const RecipeCardSmall: React.FC<{
  recipe: Recipe;
  onClick: () => void;
  onToggleFavorite: (id: string) => void;
}> = ({ recipe, onClick, onToggleFavorite }) => (
  <div 
    className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer active:scale-95 transition-transform"
    onClick={onClick}
  >
    <div className="relative h-40">
      <div 
        className="w-full h-full bg-cover bg-center" 
        style={{ backgroundImage: `url("${recipe.image}")` }} 
      />
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id); }}
        className={`absolute top-2 right-2 size-8 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm ${
          recipe.isFavorite ? 'bg-white text-red-500' : 'bg-white/80 text-slate-400'
        }`}
      >
        <span className={`material-symbols-outlined text-xl ${recipe.isFavorite ? 'fill-icon' : ''}`}>
          {recipe.isFavorite ? 'heart_check' : 'favorite'}
        </span>
      </button>
    </div>
    <div className="p-3">
      <h4 className="font-bold text-sm leading-snug mb-2 line-clamp-1">{recipe.title}</h4>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-slate-500 text-xs">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span>{recipe.prepTime}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="material-symbols-outlined text-sm text-primary fill-icon">star</span>
          <span className="font-bold">{recipe.rating}</span>
        </div>
      </div>
    </div>
  </div>
);

export default HomeScreen;
