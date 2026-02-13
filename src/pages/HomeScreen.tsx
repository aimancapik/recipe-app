
import React, { useState } from 'react';
import { Recipe } from '@/types';
import { CATEGORIES } from '@/data/constants';

interface HomeScreenProps {
    recipes: Recipe[];
    onRecipeClick: (recipe: Recipe) => void;
    onToggleFavorite: (id: string) => void;
    onSearch: (query: string) => void;
    onSeeAll: (category?: string) => void;
    onOpenGrocery: () => void;
    isDark: boolean;
    onToggleTheme: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ recipes, onRecipeClick, onToggleFavorite, onSearch, onSeeAll, onOpenGrocery, isDark, onToggleTheme }) => {
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
        if (val.trim().length >= 3) {
            onSearch(val);
        }
    };

    return (
        <div className="flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between p-4 pt-6">
                <div className="flex items-center gap-3">
                    <div className="avatar">
                        <div className="w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="Profile" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold leading-tight tracking-tight text-base-content">Hello, Alex!</h2>
                        <p className="text-base-content/50 text-sm">What are you cooking today?</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleTheme}
                        className="btn btn-ghost btn-circle btn-sm"
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
                    </button>
                    <button onClick={onOpenGrocery} className="btn btn-ghost btn-circle btn-sm indicator">
                        <span className="indicator-item badge badge-error badge-xs"></span>
                        <span className="material-symbols-outlined">shopping_bag</span>
                    </button>
                </div>
            </header>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="px-4 py-3">
                <div className="join w-full">
                    <div className="flex-1">
                        <label className="input input-bordered join-item w-full flex items-center gap-2">
                            <span className="material-symbols-outlined text-base-content/40">search</span>
                            <input
                                className="grow"
                                placeholder="Search recipes..."
                                type="text"
                                value={searchValue}
                                onChange={handleSearchChange}
                            />
                        </label>
                    </div>
                    <button type="submit" className="btn btn-primary join-item">
                        <span className="material-symbols-outlined">tune</span>
                    </button>
                </div>
            </form>

            {/* Categories */}
            <div className="py-4">
                <div className="flex items-center justify-between px-4 mb-4">
                    <h3 className="text-lg font-bold text-base-content">Categories</h3>
                    <button onClick={() => onSeeAll()} className="btn btn-ghost btn-sm text-primary">See All</button>
                </div>
                <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar pb-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className="flex flex-col items-center gap-2 shrink-0 group"
                        >
                            <div className={`size-16 rounded-2xl flex items-center justify-center transition-all ${activeCategory === cat.id
                                ? 'bg-primary shadow-lg shadow-primary/20 scale-105'
                                : 'bg-base-200'
                                }`}>
                                <span className={`material-symbols-outlined text-3xl ${activeCategory === cat.id ? 'text-primary-content fill-icon' : 'text-base-content/60'
                                    }`}>
                                    {cat.icon}
                                </span>
                            </div>
                            <span className={`text-sm ${activeCategory === cat.id ? 'font-bold text-base-content' : 'font-medium text-base-content/60'}`}>
                                {cat.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Popular Recipes Section */}
            <div className="flex-1 px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-base-content">
                        {activeCategory === 'popular' ? 'Popular Recipes' : `${activeCategory} Recipes`}
                    </h3>
                    <button onClick={() => onSeeAll(activeCategory === 'popular' ? undefined : activeCategory)} className="btn btn-ghost btn-sm text-primary">See All</button>
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
        className="card card-compact bg-base-100 shadow-sm border border-base-200 cursor-pointer active:scale-95 transition-transform"
        onClick={onClick}
    >
        <figure className="relative h-40">
            <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-full object-cover"
            />
            <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id); }}
                className={`absolute top-2 right-2 btn btn-circle btn-xs glass ${recipe.isFavorite ? 'text-red-500' : 'text-base-content/40'}`}
            >
                <span className={`material-symbols-outlined text-lg ${recipe.isFavorite ? 'fill-icon' : ''}`}>
                    {recipe.isFavorite ? 'heart_check' : 'favorite'}
                </span>
            </button>
        </figure>
        <div className="card-body !p-3">
            <h4 className="font-bold text-sm leading-snug line-clamp-1 text-base-content">{recipe.title}</h4>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-base-content/50 text-xs">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>{recipe.prepTime}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                    <span className="material-symbols-outlined text-sm text-warning fill-icon">star</span>
                    <span className="font-bold text-base-content">{recipe.rating}</span>
                </div>
            </div>
        </div>
    </div>
);

export default HomeScreen;
