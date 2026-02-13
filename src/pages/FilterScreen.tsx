
import React, { useState } from 'react';

export type SortOption = 'popular' | 'newest' | 'rating';
export type CookingTime = 'under15' | '15to30' | '30to60' | '60plus';
export type Dietary = 'vegan' | 'vegetarian' | 'glutenFree' | 'keto';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface FilterOptions {
    sortBy: SortOption;
    cookingTime: CookingTime | null;
    dietary: Dietary[];
    difficulty: Difficulty | null;
}

interface FilterScreenProps {
    onClose: () => void;
    onApply: (filters: FilterOptions) => void;
    initialFilters?: FilterOptions;
    resultCount?: number;
}

const defaultFilters: FilterOptions = {
    sortBy: 'popular',
    cookingTime: null,
    dietary: [],
    difficulty: null,
};

const FilterScreen: React.FC<FilterScreenProps> = ({
    onClose,
    onApply,
    initialFilters = defaultFilters,
    resultCount = 0
}) => {
    const [filters, setFilters] = useState<FilterOptions>(initialFilters);

    const handleClearAll = () => {
        setFilters(defaultFilters);
    };

    const toggleDietary = (diet: Dietary) => {
        setFilters(prev => ({
            ...prev,
            dietary: prev.dietary.includes(diet)
                ? prev.dietary.filter(d => d !== diet)
                : [...prev.dietary, diet]
        }));
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    return (
        <div className="relative flex h-screen max-w-md mx-auto flex-col bg-white dark:bg-background-dark overflow-hidden shadow-2xl">
            {/* Header */}
            <header className="flex items-center bg-white dark:bg-background-dark p-4 border-b border-primary/10 justify-between sticky top-0 z-10">
                <div
                    onClick={onClose}
                    className="text-[#181711] dark:text-white flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-primary/10 rounded-full"
                >
                    <span className="material-symbols-outlined">close</span>
                </div>
                <h2 className="text-[#181711] dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">Filters</h2>
                <div className="flex w-12 items-center justify-end">
                    <button
                        onClick={handleClearAll}
                        className="text-[#181711]/60 dark:text-white/60 text-sm font-bold leading-normal hover:text-primary transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4">
                {/* Sort By Section */}
                <section className="mb-8">
                    <h3 className="text-[#181711] dark:text-white text-base font-bold mb-4">Sort By</h3>
                    <div className="flex flex-col gap-3">
                        {[
                            { value: 'popular' as SortOption, label: 'Popular' },
                            { value: 'newest' as SortOption, label: 'Newest' },
                            { value: 'rating' as SortOption, label: 'Rating' },
                        ].map(option => (
                            <label
                                key={option.value}
                                className="flex items-center gap-4 rounded-xl border border-solid border-primary/20 p-4 flex-row-reverse cursor-pointer hover:bg-primary/5 transition-colors"
                            >
                                <input
                                    type="radio"
                                    name="sort"
                                    checked={filters.sortBy === option.value}
                                    onChange={() => setFilters(prev => ({ ...prev, sortBy: option.value }))}
                                    className="h-5 w-5 border-2 border-primary/30 bg-transparent text-primary focus:ring-primary"
                                />
                                <div className="flex grow flex-col">
                                    <p className="text-[#181711] dark:text-white text-sm font-semibold">{option.label}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </section>

                {/* Cooking Time Section */}
                <section className="mb-8">
                    <h3 className="text-[#181711] dark:text-white text-base font-bold mb-4">Cooking Time</h3>
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { value: 'under15' as CookingTime, label: 'Under 15 mins' },
                            { value: '15to30' as CookingTime, label: '15-30 mins' },
                            { value: '30to60' as CookingTime, label: '30-60 mins' },
                            { value: '60plus' as CookingTime, label: '60+ mins' },
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => setFilters(prev => ({
                                    ...prev,
                                    cookingTime: prev.cookingTime === option.value ? null : option.value
                                }))}
                                className={`flex h-11 px-5 items-center justify-center rounded-full border text-sm cursor-pointer transition-colors ${filters.cookingTime === option.value
                                        ? 'bg-primary text-[#181711] border-primary font-semibold'
                                        : 'bg-background-light dark:bg-primary/10 text-[#181711] dark:text-white border-primary/10 font-medium hover:border-primary/50'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Dietary Section */}
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[#181711] dark:text-white text-base font-bold">Dietary</h3>
                        <span className="text-xs text-primary font-bold">Multiple Select</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { value: 'vegan' as Dietary, label: 'Vegan' },
                            { value: 'vegetarian' as Dietary, label: 'Vegetarian' },
                            { value: 'glutenFree' as Dietary, label: 'Gluten-Free' },
                            { value: 'keto' as Dietary, label: 'Keto' },
                        ].map(option => {
                            const isSelected = filters.dietary.includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => toggleDietary(option.value)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isSelected
                                            ? 'border-primary/20 bg-primary/10'
                                            : 'border-primary/10 bg-white dark:bg-background-dark/50'
                                        }`}
                                >
                                    <span className={`material-symbols-outlined text-xl ${isSelected ? 'text-primary' : 'text-[#181711]/20'
                                        }`}>
                                        {isSelected ? 'check_box' : 'check_box_outline_blank'}
                                    </span>
                                    <span className={`text-sm text-[#181711] dark:text-white ${isSelected ? 'font-semibold' : 'font-medium'
                                        }`}>
                                        {option.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Difficulty Section */}
                <section className="mb-10">
                    <h3 className="text-[#181711] dark:text-white text-base font-bold mb-4">Difficulty</h3>
                    <div className="flex bg-background-light dark:bg-primary/5 p-1 rounded-xl">
                        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
                            <button
                                key={level}
                                onClick={() => setFilters(prev => ({
                                    ...prev,
                                    difficulty: prev.difficulty === level ? null : level
                                }))}
                                className={`flex-1 py-3 px-2 rounded-lg text-sm transition-colors ${filters.difficulty === level
                                        ? 'bg-white dark:bg-primary text-[#181711] shadow-sm font-bold'
                                        : 'text-[#181711]/60 dark:text-white/60 font-medium'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </section>
            </main>

            {/* Sticky Footer */}
            <footer className="p-4 bg-white dark:bg-background-dark border-t border-primary/10">
                <button
                    onClick={handleApply}
                    className="w-full bg-primary hover:bg-primary/90 text-[#181711] font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-base"
                >
                    <span>Apply Filters</span>
                    {resultCount > 0 && (
                        <span className="bg-[#181711] text-primary text-[10px] px-1.5 py-0.5 rounded-full">
                            {resultCount}
                        </span>
                    )}
                </button>
            </footer>
        </div>
    );
};

export default FilterScreen;
