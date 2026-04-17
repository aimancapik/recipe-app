
import React, { useState, useMemo, useCallback } from 'react';
import { MealDay, MealType, MealSlot, Recipe } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS: MealDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAYS: Record<MealDay, string> = {
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
    Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};
const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const MEAL_ICONS: Record<MealType, string> = {
    Breakfast: 'wb_sunny', Lunch: 'lunch_dining', Dinner: 'dinner_dining', Snack: 'cookie',
};
const MEAL_COLORS: Record<MealType, string> = {
    Breakfast: 'text-amber-500 bg-amber-50',
    Lunch: 'text-emerald-500 bg-emerald-50',
    Dinner: 'text-violet-500 bg-violet-50',
    Snack: 'text-rose-400 bg-rose-50',
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface MealPlanScreenProps {
    slots: MealSlot[];
    loading: boolean;
    recipes: Recipe[];
    onAddSlot: (day: MealDay, mealType: MealType, recipe: Recipe) => void;
    onRemoveSlot: (id: string) => void;
    onClearDay: (day: MealDay) => void;
    onGenerateGrocery: (recipeIds: string[]) => void;
    onRecipeClick: (recipe: Recipe) => void;
    onBack: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayDay(): MealDay {
    const dayMap: Record<number, MealDay> = {
        1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 0: 'Sun',
    };
    return dayMap[new Date().getDay()];
}

function getWeekRange(): string {
    const today = new Date();
    const day = today.getDay(); // 0=Sun
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // get Monday
    const mon = new Date(today.setDate(diff));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
    return `${fmt(mon)} – ${fmt(sun)}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface RecipePickerModalProps {
    isOpen: boolean;
    recipes: Recipe[];
    onPick: (recipe: Recipe) => void;
    onClose: () => void;
    targetLabel: string;
}

const RecipePickerModal: React.FC<RecipePickerModalProps> = ({
    isOpen, recipes, onPick, onClose, targetLabel,
}) => {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() =>
        recipes
            .filter(r => r.title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 60),
        [recipes, query],
    );

    if (!isOpen) return null;

    return (
        <dialog className="modal modal-open modal-bottom sm:modal-middle" onClick={onClose}>
            <div
                className="modal-box p-0 max-w-md bg-base-100 overflow-hidden flex flex-col max-h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Handle */}
                <div className="flex h-6 w-full items-center justify-center sm:hidden">
                    <div className="h-1.5 w-12 rounded-full bg-base-300 mt-2" />
                </div>

                {/* Header */}
                <div className="px-5 pt-3 pb-3 border-b border-base-200">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="font-bold text-lg text-base-content">Pick a Recipe</h3>
                            <p className="text-xs text-base-content/50">For {targetLabel}</p>
                        </div>
                        <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>
                    {/* Search */}
                    <label className="flex items-center gap-2 bg-base-200/70 rounded-xl px-3 py-2.5 outline-none border border-transparent">
                        <span className="material-symbols-outlined text-base-content/40 text-xl">search</span>
                        <input
                            type="text"
                            placeholder="Search recipes..."
                            className="no-focus-ring bg-transparent flex-1 text-sm outline-none border-none focus:outline-none placeholder:text-base-content/30"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            autoFocus
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="text-base-content/30 hover:text-base-content transition-colors">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        )}
                    </label>
                </div>

                {/* Recipe Grid */}
                <div className="overflow-y-auto flex-1 p-3">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <span className="material-symbols-outlined text-5xl text-base-content/20 mb-3">search_off</span>
                            <p className="text-base-content/40 text-sm">No recipes found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2.5">
                            {filtered.map(recipe => (
                                <button
                                    key={recipe.id}
                                    onClick={() => { onPick(recipe); onClose(); setQuery(''); }}
                                    className="group rounded-2xl overflow-hidden bg-base-200/60 hover:bg-base-200 active:scale-[0.97] transition-all text-left"
                                >
                                    <div
                                        className="w-full aspect-video bg-cover bg-center"
                                        style={{ backgroundImage: `url(${recipe.image})` }}
                                    />
                                    <div className="px-2.5 py-2">
                                        <p className="font-semibold text-xs text-base-content line-clamp-2 leading-tight">{recipe.title}</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="material-symbols-outlined text-primary text-xs">local_fire_department</span>
                                            <span className="text-[10px] text-base-content/50">{recipe.kcal}</span>
                                            <span className="text-[10px] text-base-content/30">·</span>
                                            <span className="text-[10px] text-base-content/50">{recipe.prepTime}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const MealPlanScreen: React.FC<MealPlanScreenProps> = ({
    slots,
    loading,
    recipes,
    onAddSlot,
    onRemoveSlot,
    onClearDay,
    onGenerateGrocery,
    onRecipeClick,
    onBack,
}) => {
    const today = getTodayDay();
    const [selectedDay, setSelectedDay] = useState<MealDay>(today);
    const [pickerTarget, setPickerTarget] = useState<{ day: MealDay; mealType: MealType } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const slotsByDay = useMemo(() => {
        const map: Record<MealDay, Partial<Record<MealType, MealSlot>>> = {} as any;
        DAYS.forEach(d => { map[d] = {}; });
        slots.forEach(s => { map[s.day][s.mealType] = s; });
        return map;
    }, [slots]);

    const dayKcal = useMemo(() => {
        return slots
            .filter(s => s.day === selectedDay)
            .reduce((sum, s) => {
                const n = parseInt(s.recipeKcal.replace(/\D/g, ''), 10);
                return sum + (isNaN(n) ? 0 : n);
            }, 0);
    }, [slots, selectedDay]);

    const totalSlotsFilled = useMemo(() =>
        Object.values(slotsByDay[selectedDay]).filter(Boolean).length,
        [slotsByDay, selectedDay],
    );

    const allAssignedIds = useMemo(() => {
        const seen = new Set<string>();
        return slots.reduce<string[]>((acc, s) => {
            if (!seen.has(s.recipeId)) { seen.add(s.recipeId); acc.push(s.recipeId); }
            return acc;
        }, []);
    }, [slots]);

    const handlePickerOpen = useCallback((day: MealDay, mealType: MealType) => {
        setPickerTarget({ day, mealType });
    }, []);

    const handlePickerClose = useCallback(() => {
        setPickerTarget(null);
    }, []);

    const handlePick = useCallback((recipe: Recipe) => {
        if (!pickerTarget) return;
        onAddSlot(pickerTarget.day, pickerTarget.mealType, recipe);
        handlePickerClose();
    }, [pickerTarget, onAddSlot, handlePickerClose]);

    return (
        <div className="flex flex-col min-h-screen bg-base-100">
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="sticky top-0 z-10 bg-base-100/95 backdrop-blur-md border-b border-base-200/60">
                <div className="navbar px-2 min-h-14">
                    <div className="navbar-start">
                        <button onClick={onBack} className="btn btn-ghost btn-circle btn-sm">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                    </div>
                    <div className="navbar-center flex flex-col items-center">
                        <h1 className="text-base font-bold text-base-content">Meal Plan</h1>
                        <p className="text-[10px] text-base-content/40 -mt-0.5">{getWeekRange()}</p>
                    </div>
                    <div className="navbar-end">
                        {totalSlotsFilled > 0 && (
                            <button
                                onClick={() => onClearDay(selectedDay)}
                                className="btn btn-ghost btn-sm text-error gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Day Chips ──────────────────────────────────── */}
                <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
                    {DAYS.map(day => {
                        const isSelected = day === selectedDay;
                        const isToday = day === today;
                        const filled = Object.values(slotsByDay[day]).filter(Boolean).length;
                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`relative flex-shrink-0 flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-2xl transition-all duration-200 ${
                                    isSelected
                                        ? 'bg-primary text-primary-content shadow-md shadow-primary/20'
                                        : 'bg-base-200/70 text-base-content/70 hover:bg-base-200'
                                }`}
                            >
                                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isToday && !isSelected ? 'text-primary' : ''}`}>
                                    {day}
                                </span>
                                {/* Filled indicator dots */}
                                <div className="flex gap-0.5">
                                    {MEAL_TYPES.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-1 h-1 rounded-full transition-all ${
                                                i < filled
                                                    ? isSelected ? 'bg-primary-content/70' : 'bg-primary/60'
                                                    : isSelected ? 'bg-primary-content/20' : 'bg-base-300'
                                            }`}
                                        />
                                    ))}
                                </div>
                                {isToday && !isSelected && (
                                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary border-2 border-base-100" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Day Summary ────────────────────────────────────── */}
            <div className="px-4 pt-4 pb-2">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-base-content/50 font-medium">{FULL_DAYS[selectedDay]}</p>
                        <p className="font-black text-2xl text-base-content">
                            {dayKcal > 0 ? `${dayKcal.toLocaleString()} kcal` : 'No meals planned'}
                        </p>
                        <p className="text-xs text-base-content/40 mt-0.5">
                            {totalSlotsFilled}/{MEAL_TYPES.length} slots filled
                        </p>
                    </div>
                    <div className="size-16 aspect-square rounded-2xl bg-primary/10 flex flex-col items-center justify-center gap-0.5">
                        {MEAL_TYPES.map((mt, i) => {
                            const filled = !!slotsByDay[selectedDay][mt];
                            return (
                                <div key={i} className={`h-1.5 w-10 rounded-full transition-all duration-300 ${filled ? 'bg-primary' : 'bg-base-300'}`} />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Meal Slots ─────────────────────────────────────── */}
            <main className="flex-1 px-4 pb-32 pt-2 space-y-3">
                {loading ? (
                    // Skeleton
                    <>{MEAL_TYPES.map(mt => (
                        <div key={mt} className="rounded-2xl bg-base-200 animate-pulse h-24" />
                    ))}</>
                ) : (
                    MEAL_TYPES.map(mealType => {
                        const slot = slotsByDay[selectedDay][mealType];
                        const colorClass = MEAL_COLORS[mealType];
                        const icon = MEAL_ICONS[mealType];

                        return (
                            <div key={mealType} className="rounded-2xl bg-base-100 border border-base-200/80 overflow-hidden shadow-sm">
                                {/* Meal Type Label */}
                                <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                                    <div className={`size-7 aspect-square rounded-lg flex items-center justify-center ${colorClass}`}>
                                        <span className="material-symbols-outlined fill-icon text-[16px]">{icon}</span>
                                    </div>
                                    <span className="font-bold text-sm text-base-content">{mealType}</span>
                                </div>

                                {slot ? (
                                    /* Filled slot */
                                    <div className="px-3 pb-3">
                                        <div className="flex items-center gap-3 bg-base-200/50 rounded-xl p-2.5 group">
                                            <button
                                                onClick={() => onRecipeClick(recipes.find(r => r.id === slot.recipeId) || recipes[0])}
                                                className="flex items-center gap-3 flex-1 min-w-0 text-left"
                                            >
                                                <div
                                                    className="size-14 aspect-square rounded-xl bg-cover bg-center flex-shrink-0 shadow-sm"
                                                    style={{ backgroundImage: `url(${slot.recipeImage})` }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-base-content line-clamp-2 leading-tight">{slot.recipeTitle}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="material-symbols-outlined text-primary text-xs fill-icon">local_fire_department</span>
                                                        <span className="text-xs text-base-content/50">{slot.recipeKcal}</span>
                                                        <span className="text-xs text-base-content/30">·</span>
                                                        <span className="material-symbols-outlined text-base-content/40 text-xs">schedule</span>
                                                        <span className="text-xs text-base-content/50">{slot.recipePrepTime}</span>
                                                    </div>
                                                </div>
                                            </button>
                                            <div className="flex flex-col gap-1 flex-shrink-0">
                                                <button
                                                    onClick={() => handlePickerOpen(selectedDay, mealType)}
                                                    className="btn btn-ghost btn-xs btn-circle text-primary"
                                                    title="Change recipe"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                                                </button>
                                                <button
                                                    onClick={() => onRemoveSlot(slot.id)}
                                                    className="btn btn-ghost btn-xs btn-circle text-error/60 hover:text-error"
                                                    title="Remove"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Empty slot */
                                    <button
                                        onClick={() => handlePickerOpen(selectedDay, mealType)}
                                        className="w-full px-3 pb-3"
                                    >
                                        <div className="flex items-center gap-3 border-2 border-dashed border-base-300 rounded-xl px-4 py-3 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] transition-all group">
                                            <div className="size-8 aspect-square rounded-full bg-base-200 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                                <span className="material-symbols-outlined text-base-content/30 group-hover:text-primary text-xl transition-colors">add</span>
                                            </div>
                                            <span className="text-sm text-base-content/40 group-hover:text-primary transition-colors font-medium">
                                                Add {mealType}
                                            </span>
                                        </div>
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </main>

            {/* ── Bottom CTA ─────────────────────────────────────── */}
            {allAssignedIds.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-gradient-to-t from-base-100 via-base-100/95 to-transparent">
                    <button
                        onClick={async () => {
                            if (isGenerating) return;
                            setIsGenerating(true);
                            try {
                                await onGenerateGrocery(allAssignedIds);
                            } finally {
                                setIsGenerating(false);
                            }
                        }}
                        disabled={isGenerating}
                        className="btn btn-primary w-full rounded-2xl shadow-lg shadow-primary/20 gap-2 disabled:opacity-60"
                    >
                        {isGenerating ? (
                            <span className="loading loading-spinner loading-sm" />
                        ) : (
                            <span className="material-symbols-outlined">shopping_cart</span>
                        )}
                        {isGenerating ? 'Generating...' : 'Generate Grocery List'}
                        {!isGenerating && (
                            <span className="badge badge-primary-content bg-primary-content/20 badge-sm font-bold">{slots.length} meals</span>
                        )}
                    </button>
                </div>
            )}

            {/* ── Recipe Picker Modal ────────────────────────────── */}
            <RecipePickerModal
                isOpen={pickerTarget !== null}
                recipes={recipes}
                onPick={handlePick}
                onClose={handlePickerClose}
                targetLabel={pickerTarget ? `${FULL_DAYS[pickerTarget.day]} ${pickerTarget.mealType}` : ''}
            />
        </div>
    );
};

export default MealPlanScreen;
