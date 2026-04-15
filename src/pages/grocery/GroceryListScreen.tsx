
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { GroceryItem } from '@/types';
import { categorizeIngredient, formatGroceryListForSharing } from '@/utils/grocery';

interface GroceryListScreenProps {
    items: GroceryItem[];
    onToggleItem: (id: string) => void;
    onAddItem?: (name: string) => void;
    onUpdateItem: (id: string, name: string) => void;
    onClearChecked: () => void;
    onClearAll: () => void;
    onBack: () => void;
}

interface GroceryGroup {
    title: string;
    image?: string;
    items: GroceryItem[];
    type: 'recipe' | 'category';
}

const CATEGORY_ICONS: Record<string, string> = {
    'Produce': 'nutrition',
    'Meat & Seafood': 'set_meal',
    'Dairy & Eggs': 'egg',
    'Pantry & Grains': 'grocery',
    'Bakery': 'cake',
    'Frozen': 'ac_unit',
    'Household & Others': 'home',
};

const CATEGORY_COLORS: Record<string, string> = {
    'Produce': 'bg-green-100 text-green-600',
    'Meat & Seafood': 'bg-red-100 text-red-500',
    'Dairy & Eggs': 'bg-yellow-100 text-yellow-600',
    'Pantry & Grains': 'bg-amber-100 text-amber-600',
    'Bakery': 'bg-orange-100 text-orange-500',
    'Frozen': 'bg-blue-100 text-blue-500',
    'Household & Others': 'bg-base-200 text-base-content/50',
};

const GroceryListScreen: React.FC<GroceryListScreenProps> = ({
    items,
    onToggleItem,
    onAddItem,
    onUpdateItem,
    onClearChecked,
    onClearAll,
    onBack,
}) => {
    const [viewMode, setViewMode] = useState<'recipe' | 'category'>('category');
    const [newItemName, setNewItemName] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [showConfirmClear, setShowConfirmClear] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingItemId) {
            editInputRef.current?.focus();
            editInputRef.current?.select();
        }
    }, [editingItemId]);

    const toggleGroup = (title: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(title)) next.delete(title);
            else next.add(title);
            return next;
        });
    };

    const handleQuickAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemName.trim() && onAddItem) {
            onAddItem(newItemName.trim());
            setNewItemName('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const startEditing = (item: GroceryItem) => {
        if (item.checked) return;
        setEditingItemId(item.id);
        setEditValue(item.name);
    };

    const saveEdit = () => {
        if (editingItemId && editValue.trim()) {
            onUpdateItem(editingItemId, editValue.trim());
        }
        setEditingItemId(null);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') setEditingItemId(null);
    };

    const handleShare = async () => {
        const text = formatGroceryListForSharing(items);
        if (navigator.share) {
            try {
                await navigator.share({ title: 'My Shopping List', text });
            } catch {}
        } else {
            navigator.clipboard.writeText(text);
        }
    };

    const groups = useMemo(() => {
        const map = new Map<string, GroceryGroup>();

        items.forEach(item => {
            const groupKey = viewMode === 'recipe'
                ? (item.recipeTitle || 'Manual Added')
                : categorizeIngredient(item.name);

            if (!map.has(groupKey)) {
                map.set(groupKey, {
                    title: groupKey,
                    image: viewMode === 'recipe' ? item.recipeImage : undefined,
                    items: [],
                    type: viewMode,
                });
            }
            map.get(groupKey)!.items.push(item);
        });

        return Array.from(map.values())
            .map(group => ({
                ...group,
                items: [...group.items].sort((a, b) => {
                    if (a.checked === b.checked) return 0;
                    return a.checked ? 1 : -1;
                })
            }))
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [items, viewMode]);

    const totalItems = items.length;
    const checkedItems = items.filter(i => i.checked).length;
    const uncheckedItems = totalItems - checkedItems;
    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
    const allDone = progress === 100 && totalItems > 0;

    return (
        <div className="flex flex-col min-h-screen bg-base-100">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-base-100/95 backdrop-blur-md border-b border-base-200">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="btn btn-ghost btn-circle btn-sm -ml-1">
                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-[17px] font-bold leading-tight">Shopping List</h1>
                            {totalItems > 0 && (
                                <p className="text-xs text-base-content/40 font-medium">
                                    {uncheckedItems} remaining · {checkedItems} done
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {items.length > 0 && (
                            <>
                                <button
                                    onClick={handleShare}
                                    className="btn btn-ghost btn-circle btn-sm"
                                    aria-label="Share list"
                                >
                                    <span className="material-symbols-outlined text-[20px]">ios_share</span>
                                </button>
                                <div className="dropdown dropdown-end">
                                    <button tabIndex={0} className="btn btn-ghost btn-circle btn-sm">
                                        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                                    </button>
                                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-1.5 shadow-xl bg-base-100 rounded-2xl w-52 border border-base-200 mt-1">
                                        {checkedItems > 0 && (
                                            <li>
                                                <button
                                                    onClick={onClearChecked}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-base-content"
                                                >
                                                    <span className="material-symbols-outlined text-[18px] text-base-content/50">done_all</span>
                                                    Remove {checkedItems} checked
                                                </button>
                                            </li>
                                        )}
                                        <li>
                                            <button
                                                onClick={() => setShowConfirmClear(true)}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-error"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                                                Clear all items
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                </div>

            </div>

            <main className="flex-1 pb-28 overflow-y-auto">
                {items.length > 0 ? (
                    <div className="px-4 pt-4">

                        {/* Progress summary card */}
                        {allDone ? (
                            <div className="flex items-center gap-3 bg-success/10 border border-success/20 rounded-2xl px-4 py-3.5 mb-5">
                                <div className="w-9 h-9 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-success text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-success text-sm">All done!</p>
                                    <p className="text-xs text-success/70">You got everything on the list</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 mb-5 px-1">
                                <div className="flex-1">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">Progress</span>
                                        <span className="text-xs font-bold text-primary">{progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-base-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* View toggle */}
                        <div className="flex bg-base-200/60 p-1 rounded-xl mb-5">
                            <button
                                onClick={() => setViewMode('category')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-semibold transition-all ${viewMode === 'category' ? 'bg-base-100 shadow-sm text-base-content' : 'text-base-content/40'}`}
                            >
                                <span className="material-symbols-outlined text-[15px]">category</span>
                                By Category
                            </button>
                            <button
                                onClick={() => setViewMode('recipe')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-semibold transition-all ${viewMode === 'recipe' ? 'bg-base-100 shadow-sm text-base-content' : 'text-base-content/40'}`}
                            >
                                <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                                By Recipe
                            </button>
                        </div>

                        {/* Groups */}
                        <div className="space-y-3">
                            {groups.map(group => {
                                const groupChecked = group.items.filter(i => i.checked).length;
                                const groupTotal = group.items.length;
                                const groupDone = groupChecked === groupTotal;
                                const isCollapsed = collapsedGroups.has(group.title);
                                const colorClass = group.type === 'category'
                                    ? (CATEGORY_COLORS[group.title] ?? 'bg-base-200 text-base-content/50')
                                    : 'bg-base-200 text-base-content/50';
                                const iconName = group.type === 'category'
                                    ? (CATEGORY_ICONS[group.title] ?? 'category')
                                    : 'receipt_long';

                                return (
                                    <div key={group.title} className="bg-base-100 rounded-2xl border border-base-200/80 overflow-hidden">
                                        {/* Group header */}
                                        <button
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-base-200/30 transition-colors"
                                            onClick={() => toggleGroup(group.title)}
                                        >
                                            {/* Icon / image */}
                                            {group.type === 'recipe' && group.image ? (
                                                <div
                                                    className="w-9 h-9 rounded-xl bg-cover bg-center shrink-0 bg-base-200"
                                                    style={{ backgroundImage: `url(${group.image})` }}
                                                />
                                            ) : (
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                                                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{iconName}</span>
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0 text-left">
                                                <p className={`text-[14px] font-semibold truncate ${groupDone ? 'text-base-content/40 line-through' : 'text-base-content'}`}>
                                                    {group.title}
                                                </p>
                                                <p className="text-[11px] text-base-content/40 font-medium mt-0.5">
                                                    {groupChecked === groupTotal ? 'All done' : `${groupTotal - groupChecked} left`}
                                                    {' · '}
                                                    {groupTotal} item{groupTotal !== 1 ? 's' : ''}
                                                </p>
                                            </div>

                                            <span className={`material-symbols-outlined text-base-content/30 text-[20px] transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}>
                                                expand_more
                                            </span>
                                        </button>

                                        {/* Items */}
                                        {!isCollapsed && (
                                            <div className="border-t border-base-200/60">
                                                {group.items.map((item, idx) => (
                                                    <div
                                                        key={item.id}
                                                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${idx !== group.items.length - 1 ? 'border-b border-base-200/40' : ''} ${item.checked ? 'bg-base-200/20' : 'hover:bg-base-200/20'}`}
                                                    >
                                                        {/* Checkbox */}
                                                        <button
                                                            onClick={e => { e.stopPropagation(); onToggleItem(item.id); }}
                                                            className="shrink-0 w-8 h-8 flex items-center justify-center"
                                                            aria-label="Toggle item"
                                                        >
                                                            <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                                                item.checked
                                                                    ? 'bg-primary border-primary'
                                                                    : 'border-base-300 bg-base-100'
                                                            }`}>
                                                                {item.checked && (
                                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        </button>

                                                        {/* Name / edit */}
                                                        <div className="flex-1 min-w-0">
                                                            {editingItemId === item.id ? (
                                                                <input
                                                                    ref={editInputRef}
                                                                    type="text"
                                                                    value={editValue}
                                                                    onChange={e => setEditValue(e.target.value)}
                                                                    onBlur={saveEdit}
                                                                    onKeyDown={handleEditKeyDown}
                                                                    className="w-full bg-base-200/70 rounded-lg px-2.5 py-1 text-[14px] font-medium outline-none focus:ring-2 focus:ring-primary/30 text-base-content"
                                                                />
                                                            ) : (
                                                                <button
                                                                    className="text-left w-full"
                                                                    onClick={() => startEditing(item)}
                                                                    disabled={item.checked}
                                                                >
                                                                    <span className={`block text-[14px] font-medium transition-all ${item.checked ? 'line-through text-base-content/30' : 'text-base-content'}`}>
                                                                        {item.name}
                                                                    </span>
                                                                    {viewMode === 'category' && item.recipeTitle && item.recipeTitle !== 'Manual Entry' && (
                                                                        <span className="block text-[11px] text-base-content/35 mt-0.5 truncate">
                                                                            {item.recipeTitle}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>

                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Checked items summary — quick clear CTA */}
                        {checkedItems > 0 && (
                            <button
                                onClick={onClearChecked}
                                className="w-full mt-4 py-3 rounded-2xl border border-base-200 text-sm font-medium text-base-content/40 hover:text-error hover:border-error/30 hover:bg-error/5 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[17px]">done_all</span>
                                Remove {checkedItems} checked item{checkedItems !== 1 ? 's' : ''}
                            </button>
                        )}
                    </div>
                ) : (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center h-[75vh] px-8 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-base-200 flex items-center justify-center mb-5">
                            <span className="material-symbols-outlined text-4xl text-base-content/25" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                        </div>
                        <h2 className="text-[19px] font-bold mb-2">Nothing here yet</h2>
                        <p className="text-base-content/45 text-[14px] leading-relaxed mb-8 max-w-xs">
                            Add ingredients from a recipe, or type them in below to build your list.
                        </p>
                        <button onClick={onBack} className="btn btn-primary rounded-xl px-6 font-semibold shadow-none">
                            Browse Recipes
                        </button>
                    </div>
                )}
            </main>

            {/* Bottom add input */}
            <div className="fixed bottom-0 left-0 right-0 bg-base-100/95 backdrop-blur-xl border-t border-base-200 px-4 py-3 pb-safe z-40">
                <form onSubmit={handleQuickAdd} className="max-w-[500px] mx-auto flex items-center gap-2.5">
                    <div className="flex-1 flex items-center bg-base-200/60 rounded-[14px] px-4 transition-all focus-within:bg-base-200">
                        <span className="material-symbols-outlined text-base-content/30 text-[18px] mr-2 shrink-0">add_shopping_cart</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            placeholder="Add an item..."
                            className="w-full bg-transparent border-none outline-none py-3 text-[15px] text-base-content placeholder:text-base-content/35 no-focus-ring"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newItemName.trim()}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                            newItemName.trim()
                                ? 'bg-primary text-primary-content hover:scale-105 active:scale-95 shadow-sm'
                                : 'bg-base-200 text-base-content/25'
                        }`}
                        aria-label="Add item"
                    >
                        <span className="material-symbols-outlined text-[20px] font-bold">arrow_upward</span>
                    </button>
                </form>
            </div>

            {/* Confirm clear all modal */}
            {showConfirmClear && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setShowConfirmClear(false)}>
                    <div className="bg-base-100 rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center mb-4 mx-auto">
                            <span className="material-symbols-outlined text-error text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
                        </div>
                        <h3 className="text-[17px] font-bold text-center mb-1.5">Clear everything?</h3>
                        <p className="text-[13px] text-base-content/50 text-center mb-6 leading-relaxed">
                            This will remove all {totalItems} items from your list. This can't be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmClear(false)}
                                className="flex-1 btn btn-ghost rounded-xl font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { onClearAll(); setShowConfirmClear(false); }}
                                className="flex-1 btn btn-error rounded-xl font-semibold text-white"
                            >
                                Clear all
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroceryListScreen;
