
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
        <div className="relative flex h-screen max-w-md mx-auto flex-col bg-base-100 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="navbar bg-base-100 border-b border-base-200 sticky top-0 z-10">
                <div className="navbar-start">
                    <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="navbar-center">
                    <h2 className="text-lg font-bold">Filters</h2>
                </div>
                <div className="navbar-end">
                    <button onClick={handleClearAll} className="btn btn-ghost btn-sm text-base-content/60">
                        Clear
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4">
                {/* Sort By Section */}
                <section className="mb-8">
                    <h3 className="text-base font-bold mb-4">Sort By</h3>
                    <div className="flex flex-col gap-3">
                        {[
                            { value: 'popular' as SortOption, label: 'Popular' },
                            { value: 'newest' as SortOption, label: 'Newest' },
                            { value: 'rating' as SortOption, label: 'Rating' },
                        ].map(option => (
                            <label
                                key={option.value}
                                className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${filters.sortBy === option.value ? 'border-primary bg-primary/10' : 'border-base-200 hover:bg-base-200'}`}
                            >
                                <input
                                    type="radio"
                                    name="sort"
                                    className="radio radio-primary"
                                    checked={filters.sortBy === option.value}
                                    onChange={() => setFilters(prev => ({ ...prev, sortBy: option.value }))}
                                />
                                <span className="text-sm font-semibold">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </section>

                {/* Cooking Time Section */}
                <section className="mb-8">
                    <h3 className="text-base font-bold mb-4">Cooking Time</h3>
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
                                className={`btn btn-sm rounded-full ${filters.cookingTime === option.value ? 'btn-primary' : 'btn-ghost bg-base-200'}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Dietary Section */}
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold">Dietary</h3>
                        <span className="badge badge-primary badge-sm">Multiple Select</span>
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
                                <label
                                    key={option.value}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/10' : 'border-base-200'}`}
                                >
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary checkbox-sm"
                                        checked={isSelected}
                                        onChange={() => toggleDietary(option.value)}
                                    />
                                    <span className={`text-sm ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                                        {option.label}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </section>

                {/* Difficulty Section */}
                <section className="mb-10">
                    <h3 className="text-base font-bold mb-4">Difficulty</h3>
                    <div className="join w-full">
                        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
                            <button
                                key={level}
                                onClick={() => setFilters(prev => ({
                                    ...prev,
                                    difficulty: prev.difficulty === level ? null : level
                                }))}
                                className={`join-item btn flex-1 ${filters.difficulty === level ? 'btn-primary' : 'btn-ghost bg-base-200'}`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </section>
            </main>

            {/* Sticky Footer */}
            <footer className="p-4 bg-base-100 border-t border-base-200">
                <button onClick={handleApply} className="btn btn-primary w-full gap-2">
                    <span>Apply Filters</span>
                    {resultCount > 0 && (
                        <div className="badge badge-neutral badge-sm">{resultCount}</div>
                    )}
                </button>
            </footer>
        </div>
    );
};

export default FilterScreen;
