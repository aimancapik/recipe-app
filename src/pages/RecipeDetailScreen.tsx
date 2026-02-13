
import React from 'react';
import { Recipe } from '@/types';

interface RecipeDetailScreenProps {
    recipe: Recipe;
    onBack: () => void;
    onToggleFavorite: (id: string) => void;
    onAddToGrocery: (recipe: Recipe) => void;
    onOpenGrocery: () => void;
}

const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({ recipe, onBack, onToggleFavorite, onAddToGrocery, onOpenGrocery }) => {
    return (
        <div className="relative flex min-h-screen w-full flex-col bg-white dark:bg-[#1a1a1a]">
            {/* Header Image & Overlay Nav */}
            <div className="relative w-full h-80">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${recipe.image}')` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"></div>
                </div>
                {/* Navigation */}
                <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4">
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center size-10 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <button
                        onClick={() => onToggleFavorite(recipe.id)}
                        className={`flex items-center justify-center size-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 transition-colors ${recipe.isFavorite ? 'text-primary' : 'text-white'
                            }`}
                    >
                        <span className={`material-symbols-outlined ${recipe.isFavorite ? 'fill-icon' : ''}`}>
                            bookmark
                        </span>
                    </button>
                </div>
            </div>

            {/* Recipe Content */}
            <div className="relative -mt-8 rounded-t-3xl bg-white dark:bg-[#1a1a1a] px-6 pt-8 pb-32 shadow-2xl">
                {/* Title and Rating */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight text-[#1c1c1c] dark:text-white leading-tight">
                            {recipe.title}
                        </h1>
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-primary fill-icon text-sm">star</span>
                            <span className="text-sm font-semibold">{recipe.rating}</span>
                            <span className="text-sm text-gray-500">({recipe.reviews} reviews)</span>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-2 mb-8">
                    {[
                        { label: 'Prep', val: recipe.prepTime, icon: 'schedule' },
                        { label: 'Serves', val: recipe.serves, icon: 'group' },
                        { label: 'Kcal', val: recipe.kcal, icon: 'bolt' },
                        { label: 'Level', val: recipe.level, icon: 'bar_chart' }
                    ].map(stat => (
                        <div key={stat.label} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-primary/10 dark:bg-primary/5 border border-primary/20">
                            <div className="size-10 flex items-center justify-center rounded-full bg-primary text-black">
                                <span className="material-symbols-outlined text-xl">{stat.icon}</span>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">{stat.label}</span>
                            <span className="text-xs font-bold">{stat.val}</span>
                        </div>
                    ))}
                </div>

                {/* Ingredients */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Ingredients</h2>
                        <span className="text-sm text-primary font-bold">{recipe.ingredients.length} Items</span>
                    </div>
                    <ul className="space-y-3">
                        {recipe.ingredients.map((ing, idx) => (
                            <li key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-background-light dark:bg-zinc-800/50">
                                <div className="size-2 rounded-full bg-primary"></div>
                                <span className="text-sm">{ing}</span>
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={() => onAddToGrocery(recipe)}
                        className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-primary text-sm font-bold rounded-xl text-[#1c1c1c] dark:text-white hover:bg-primary/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">shopping_cart</span>
                        Add all to Shopping List
                    </button>
                </div>

                {/* Directions */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Directions</h2>
                    <div className="space-y-6">
                        {recipe.directions.map((dir, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="flex-none flex items-center justify-center size-8 rounded-full bg-primary text-black font-bold text-sm mt-1">
                                    {dir.step}
                                </div>
                                <div className="flex flex-col flex-1">
                                    <h3 className="font-bold text-sm mb-1">{dir.title}</h3>
                                    {dir.image && (
                                        <div className="w-full aspect-video rounded-xl overflow-hidden mb-3 border border-gray-100 dark:border-zinc-700">
                                            <img src={dir.image} alt={dir.title} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {dir.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Floating CTA Button */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-lg z-50">
                <div className="flex flex-col gap-3">
                    <button
                        className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        onClick={() => onAddToGrocery(recipe)}
                    >
                        <span className="material-symbols-outlined">shopping_cart</span>
                        Add to Shopping List
                    </button>
                    <button
                        onClick={onOpenGrocery}
                        className="flex items-center justify-center gap-1 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">list_alt</span>
                        View Shopping List
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipeDetailScreen;
