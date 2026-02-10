
import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES } from '../constants';
import { Recipe } from '../types';

interface ExploreScreenProps {
  recipes: Recipe[];
  initialSearch: string;
  initialCategory?: string | null;
  onRecipeClick: (recipe: Recipe) => void;
  onAIGenerate: () => void;
  onToggleFavorite: (id: string) => void;
}

const ExploreScreen: React.FC<ExploreScreenProps> = ({ 
  recipes, 
  initialSearch, 
  initialCategory, 
  onRecipeClick, 
  onAIGenerate, 
  onToggleFavorite 
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [history, setHistory] = useState(['Avocado Toast', 'Quick Pasta', 'Gluten-free pancakes', 'Chicken Curry']);

  // Sync internal state with props when they change externally
  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setSelectedCategory(initialCategory || null);
  }, [initialCategory]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const query = search.toLowerCase().trim();
      // Search logic: If less than 3 chars, ignore the search query unless it's empty
      const isSearchActive = query.length >= 3;
      const matchesSearch = !isSearchActive || 
                          r.title.toLowerCase().includes(query) || 
                          r.ingredients.some(ing => ing.toLowerCase().includes(query)) ||
                          r.category.toLowerCase().includes(query);
      
      const matchesCategory = !selectedCategory || r.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [recipes, search, selectedCategory]);

  const clearHistory = () => setHistory([]);
  const removeHistoryItem = (item: string) => setHistory(prev => prev.filter(i => i !== item));

  // A search is effectively active if there's a category selected OR search query is >= 3 chars
  const isSearching = (search.trim().length >= 3) || selectedCategory !== null;
  const showSearchHint = search.trim().length > 0 && search.trim().length < 3;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim().length >= 3 && !history.includes(search)) {
      setHistory(prev => [search, ...prev.slice(0, 4)]);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-background-dark">
      <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Explore</h1>
          <button 
            onClick={onAIGenerate}
            className="size-10 rounded-full bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/20 animate-pulse active:scale-95 transition-transform"
            title="Generate with AI"
          >
            <span className="material-symbols-outlined fill-icon">auto_awesome</span>
          </button>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-3 pl-11 pr-4 text-base focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-slate-400 shadow-sm" 
              placeholder="Search for recipes, ingredients..." 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="bg-primary hover:bg-primary/90 text-black p-3 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <span className="material-symbols-outlined">tune</span>
          </button>
        </form>
        
        {showSearchHint && (
          <p className="text-[10px] font-bold text-primary mt-2 animate-pulse uppercase tracking-wider">
            Type at least 3 characters to search...
          </p>
        )}

        {selectedCategory && (
          <div className="flex items-center gap-2 mt-3 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Category:</span>
            <button 
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-1 bg-primary px-3 py-1 rounded-full text-xs font-bold text-black shadow-sm"
            >
              {selectedCategory}
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}
      </div>

      <main className="px-4 pb-20">
        {!isSearching ? (
          <>
            <div className="flex items-center justify-between mb-4 mt-6">
              <h2 className="text-xl font-bold">Categories</h2>
              <button onClick={handleClearFilters} className="text-sm font-semibold text-slate-400">View All</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map(cat => (
                <div 
                  key={cat.id} 
                  onClick={() => setSelectedCategory(cat.id)}
                  className="relative group cursor-pointer overflow-hidden rounded-2xl aspect-square bg-slate-200 shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 transition-transform"
                >
                  <img 
                    src={cat.image || `https://picsum.photos/400/400?sig=${cat.id}`} 
                    alt={cat.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                    <p className="text-white font-bold text-lg">{cat.name}</p>
                  </div>
                </div>
              ))}
            </div>

            {history.length > 0 && (
              <div className="mt-10 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Recently Searched</h2>
                  <button onClick={clearHistory} className="text-sm font-semibold text-primary">Clear all</button>
                </div>
                <div className="flex flex-col gap-3">
                  {history.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800"
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer flex-1 group"
                        onClick={() => setSearch(item)}
                      >
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">history</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item}</span>
                      </div>
                      <button onClick={() => removeHistoryItem(item)}>
                        <span className="material-symbols-outlined text-slate-400 cursor-pointer text-xl hover:text-red-500 transition-colors">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Results ({filteredRecipes.length})</h2>
              {(search.length >= 3 || selectedCategory) && (
                <button onClick={handleClearFilters} className="text-sm font-bold text-primary">Clear all</button>
              )}
            </div>
            {filteredRecipes.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {filteredRecipes.map(recipe => (
                  <div 
                    key={recipe.id} 
                    className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer active:scale-95 transition-transform"
                    onClick={() => onRecipeClick(recipe)}
                  >
                    <div className="relative h-40">
                      <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id); }}
                        className={`absolute top-2 right-2 size-8 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm ${recipe.isFavorite ? 'bg-white text-red-500' : 'bg-white/80 text-slate-400'}`}
                      >
                        <span className={`material-symbols-outlined text-xl ${recipe.isFavorite ? 'fill-icon' : ''}`}>favorite</span>
                      </button>
                      <div className="absolute bottom-2 left-2">
                        <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm capitalize font-bold">{recipe.category}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-sm leading-snug mb-1 line-clamp-1">{recipe.title}</h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">schedule</span>{recipe.prepTime}</span>
                        <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs text-primary fill-icon">star</span>{recipe.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
                <p className="text-lg font-medium">No matches for your selection.</p>
                <p className="text-sm">Try adjusting your search or category.</p>
                <button 
                  onClick={handleClearFilters}
                  className="mt-6 px-6 py-2 bg-primary text-black rounded-full font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ExploreScreen;
