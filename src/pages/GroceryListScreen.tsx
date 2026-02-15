
import React, { useMemo, useState } from 'react';
import { GroceryItem } from '@/types';

interface GroceryListScreenProps {
    items: GroceryItem[];
    onToggleItem: (id: string) => void;
    onClearChecked: () => void;
    onBack: () => void;
}

interface GroceryGroup {
    recipeTitle: string;
    recipeImage: string;
    items: GroceryItem[];
}

const GroceryListScreen: React.FC<GroceryListScreenProps> = ({
    items,
    onToggleItem,
    onClearChecked,
    onBack,
}) => {
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const toggleGroup = (title: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(title)) next.delete(title);
            else next.add(title);
            return next;
        });
    };

    // Group items by recipe
    const groups = useMemo(() => {
        const map = new Map<string, GroceryGroup>();
        items.forEach(item => {
            if (!map.has(item.recipeTitle)) {
                map.set(item.recipeTitle, {
                    recipeTitle: item.recipeTitle,
                    recipeImage: item.recipeImage,
                    items: [],
                });
            }
            map.get(item.recipeTitle)!.items.push(item);
        });
        return Array.from(map.values());
    }, [items]);

    const totalItems = items.length;
    const checkedItems = items.filter(i => i.checked).length;
    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
    const allDone = progress === 100 && totalItems > 0;

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
                    {checkedItems > 0 && (
                        <button onClick={onClearChecked} className="btn btn-ghost btn-sm text-error gap-1">
                            <span className="material-symbols-outlined text-sm">delete_sweep</span>
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <main className="flex-1 px-4 pb-24 pt-4">
                {items.length > 0 ? (
                    <>
                        {/* Progress Card */}
                        <div className={`rounded-2xl p-4 mb-5 shadow-sm transition-all duration-500 ${allDone
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                            : 'bg-base-100'
                            }`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`size-12 aspect-square rounded-xl flex items-center justify-center font-bold text-sm ${allDone
                                        ? 'bg-white/20 text-white'
                                        : 'bg-primary/10 text-primary'
                                        }`}>
                                        {progress}%
                                    </div>
                                    <div>
                                        <p className={`font-bold text-sm ${allDone ? 'text-white' : 'text-base-content'}`}>
                                            {allDone ? '🎉 All collected!' : 'Shopping Progress'}
                                        </p>
                                        <p className={`text-xs ${allDone ? 'text-white/70' : 'text-base-content/50'}`}>
                                            {checkedItems} of {totalItems} items
                                        </p>
                                    </div>
                                </div>
                                {allDone && (
                                    <span className="material-symbols-outlined fill-icon text-white text-2xl">
                                        celebration
                                    </span>
                                )}
                            </div>
                            {/* Progress bar */}
                            <div className={`w-full h-2 rounded-full overflow-hidden ${allDone ? 'bg-white/20' : 'bg-base-200'}`}>
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ease-out ${allDone
                                        ? 'bg-white'
                                        : 'bg-primary'
                                        }`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Recipe Groups */}
                        <div className="space-y-3">
                            {groups.map(group => {
                                const groupChecked = group.items.filter(i => i.checked).length;
                                const groupTotal = group.items.length;
                                const groupDone = groupChecked === groupTotal;
                                const isCollapsed = collapsedGroups.has(group.recipeTitle);

                                return (
                                    <div key={group.recipeTitle} className="rounded-2xl bg-base-100 shadow-sm overflow-hidden">
                                        {/* Group Header — collapsible */}
                                        <button
                                            onClick={() => toggleGroup(group.recipeTitle)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-base-200/50 transition-colors"
                                        >
                                            <div
                                                className="size-11 aspect-square rounded-xl bg-cover bg-center flex-shrink-0"
                                                style={{ backgroundImage: `url(${group.recipeImage})` }}
                                            />
                                            <div className="flex-1 text-left min-w-0">
                                                <h3 className="font-bold text-sm line-clamp-1">{group.recipeTitle}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-xs font-medium ${groupDone ? 'text-success' : 'text-base-content/50'}`}>
                                                        {groupChecked}/{groupTotal}
                                                    </span>
                                                    {/* Mini progress */}
                                                    <div className="flex-1 h-1.5 rounded-full bg-base-200 max-w-[80px]">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${groupDone ? 'bg-success' : 'bg-primary'}`}
                                                            style={{ width: `${(groupChecked / groupTotal) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`material-symbols-outlined text-base-content/30 text-xl transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}>
                                                expand_more
                                            </span>
                                        </button>

                                        {/* Items */}
                                        {!isCollapsed && (
                                            <ul className="px-3 pb-2">
                                                {group.items.map(item => (
                                                    <li
                                                        key={item.id}
                                                        onClick={() => onToggleItem(item.id)}
                                                        className={`flex items-center gap-3 px-2 py-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:bg-base-200/60 active:scale-[0.98] ${item.checked ? 'opacity-50' : ''
                                                            }`}
                                                    >
                                                        {/* Custom checkbox */}
                                                        <div className={`size-6 aspect-square rounded-lg flex-shrink-0 flex items-center justify-center transition-all duration-200 ${item.checked
                                                            ? 'bg-success text-white scale-95'
                                                            : 'border-2 border-base-300'
                                                            }`}>
                                                            {item.checked && (
                                                                <span className="material-symbols-outlined text-sm fill-icon">check</span>
                                                            )}
                                                        </div>
                                                        <span className={`text-sm flex-1 transition-all duration-200 ${item.checked
                                                            ? 'line-through text-base-content/40'
                                                            : 'text-base-content'
                                                            }`}>
                                                            {item.name}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="size-24 aspect-square rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-primary text-5xl">shopping_cart</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-base-content">Your list is empty</h2>
                        <p className="text-base-content/50 max-w-xs mb-6 text-sm">
                            Browse any recipe and tap "Add to Grocery" to start building your shopping list.
                        </p>
                        <button onClick={onBack} className="btn btn-primary gap-2 rounded-xl">
                            <span className="material-symbols-outlined">search</span>
                            Browse Recipes
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default GroceryListScreen;
