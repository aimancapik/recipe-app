
import React from 'react';
import { Recipe } from '@/types';

interface GroceryListScreenProps {
    groceryItems: { recipe: Recipe; items: { ingredient: string; checked: boolean }[] }[];
    onBack: () => void;
    onToggleItem: (recipeId: string, ingredientIndex: number) => void;
    onRemoveRecipe: (recipeId: string) => void;
    onClearAll: () => void;
}

const GroceryListScreen: React.FC<GroceryListScreenProps> = ({
    groceryItems,
    onBack,
    onToggleItem,
    onRemoveRecipe,
    onClearAll,
}) => {
    const totalItems = groceryItems.reduce((acc, g) => acc + g.items.length, 0);
    const checkedItems = groceryItems.reduce((acc, g) => acc + g.items.filter(i => i.checked).length, 0);
    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    return (
        <div className="flex flex-col min-h-screen bg-base-200">
            {/* Header */}
            <div className="navbar sticky top-0 z-10 bg-base-100/80 backdrop-blur-md border-b border-base-200">
                <div className="navbar-start">
                    <button onClick={onBack} className="btn btn-ghost btn-circle btn-sm">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                </div>
                <div className="navbar-center">
                    <h2 className="text-lg font-bold">Shopping List</h2>
                </div>
                <div className="navbar-end">
                    {groceryItems.length > 0 && (
                        <button onClick={onClearAll} className="btn btn-ghost btn-sm text-error">
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            <main className="flex-1 px-4 pb-24 pt-4">
                {groceryItems.length > 0 ? (
                    <>
                        {/* Progress Tracker */}
                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`radial-progress text-primary ${progress === 100 ? 'text-success' : ''}`} style={{ '--value': progress, '--size': '2.5rem', '--thickness': '3px' } as any} role="progressbar">
                                            <span className="text-xs font-bold">{progress}%</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-base-content">Shopping Progress</p>
                                            <p className="text-xs text-base-content/50">{checkedItems} of {totalItems} items collected</p>
                                        </div>
                                    </div>
                                    {progress === 100 && (
                                        <div className="badge badge-success gap-1">
                                            <span className="material-symbols-outlined text-xs">check_circle</span>
                                            Done!
                                        </div>
                                    )}
                                </div>
                                <progress className="progress progress-primary w-full" value={progress} max="100"></progress>
                            </div>
                        </div>

                        {/* Grocery Groups */}
                        <div className="space-y-4">
                            {groceryItems.map(group => {
                                const groupChecked = group.items.filter(i => i.checked).length;
                                const groupTotal = group.items.length;
                                return (
                                    <div key={group.recipe.id} className="card bg-base-100 shadow-sm">
                                        <div className="card-body p-4">
                                            {/* Group Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar">
                                                        <div className="w-10 rounded-lg">
                                                            <img src={group.recipe.image} alt={group.recipe.title} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-sm line-clamp-1">{group.recipe.title}</h3>
                                                        <span className="text-xs text-base-content/50">{groupChecked}/{groupTotal} items</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => onRemoveRecipe(group.recipe.id)}
                                                    className="btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-error"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                            {/* Items */}
                                            <ul className="space-y-1">
                                                {group.items.map((item, idx) => (
                                                    <li
                                                        key={idx}
                                                        onClick={() => onToggleItem(group.recipe.id, idx)}
                                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-base-200 ${item.checked ? 'opacity-50' : ''}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox checkbox-primary checkbox-sm"
                                                            checked={item.checked}
                                                            readOnly
                                                        />
                                                        <span className={`text-sm flex-1 ${item.checked ? 'line-through text-base-content/40' : 'text-base-content'}`}>
                                                            {item.ingredient}
                                                        </span>
                                                        {item.checked && (
                                                            <span className="material-symbols-outlined text-success text-sm">check_circle</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-primary text-5xl">shopping_cart</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-base-content">Your list is empty</h2>
                        <p className="text-base-content/50 max-w-xs mb-6">
                            Add ingredients from any recipe and they'll show up here for your next grocery run.
                        </p>
                        <button onClick={onBack} className="btn btn-primary gap-2">
                            <span className="material-symbols-outlined">search</span>
                            Browse Recipes
                        </button>
                    </div>
                )}
            </main>
        </div >
    );
};

export default GroceryListScreen;
