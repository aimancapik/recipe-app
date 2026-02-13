
import React from 'react';

interface QuickActionsOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateRecipe: () => void;
    onAddToShoppingList: () => void;
    onPlanMeal?: () => void;
}

const QuickActionsOverlay: React.FC<QuickActionsOverlayProps> = ({
    isOpen,
    onClose,
    onCreateRecipe,
    onAddToShoppingList,
    onPlanMeal,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(34, 33, 16, 0.4)' }}
            />

            {/* Bottom Sheet */}
            <div
                className="relative bg-white dark:bg-background-dark rounded-t-3xl shadow-2xl w-full max-w-md mx-auto animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Handle */}
                <div className="flex flex-col items-stretch">
                    <button onClick={onClose} className="flex h-6 w-full items-center justify-center group">
                        <div className="h-1.5 w-12 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                    </button>

                    <div className="px-6 pt-2 pb-8">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-[#181711] dark:text-white">Quick Actions</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-gray-500">close</span>
                            </button>
                        </div>

                        {/* Hero Card — Create New Recipe */}
                        <div className="mb-6">
                            <div
                                className="group relative flex flex-col items-stretch rounded-xl bg-primary p-1 shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
                                onClick={() => { onClose(); onCreateRecipe(); }}
                            >
                                <div className="flex flex-col overflow-hidden rounded-lg bg-white dark:bg-zinc-900">
                                    <div
                                        className="w-full h-40 bg-center bg-no-repeat bg-cover"
                                        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600")' }}
                                    />
                                    <div className="flex flex-1 flex-col justify-center p-5">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-[#181711] dark:text-white mb-1">Create New Recipe</h3>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                                                    Share your culinary masterpiece with the community and save it to your digital cookbook.
                                                </p>
                                            </div>
                                            <div className="bg-primary text-[#181711] p-2 rounded-lg ml-3 shrink-0">
                                                <span className="material-symbols-outlined font-bold">add_circle</span>
                                            </div>
                                        </div>
                                        <button className="w-full sm:w-auto self-start px-6 py-2.5 bg-primary text-[#181711] font-bold rounded-lg hover:shadow-md transition-all">
                                            Get Started
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Actions */}
                        <div className="space-y-3">
                            {/* Shopping List */}
                            <button
                                onClick={() => { onClose(); onAddToShoppingList(); }}
                                className="w-full flex items-center gap-4 bg-background-light dark:bg-white/5 p-4 rounded-xl border border-transparent hover:border-primary/50 transition-all text-left group"
                            >
                                <div className="flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 shadow-sm border border-gray-100 dark:border-white/10 shrink-0 size-12 text-primary group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined">shopping_cart</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[#181711] dark:text-white text-base font-semibold">Add to Shopping List</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Quickly add ingredients to your weekly list</p>
                                </div>
                                <div className="shrink-0 text-gray-400 group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </div>
                            </button>

                            {/* Plan a Meal */}
                            <button
                                onClick={() => { onClose(); onPlanMeal?.(); }}
                                className="w-full flex items-center gap-4 bg-background-light dark:bg-white/5 p-4 rounded-xl border border-transparent hover:border-primary/50 transition-all text-left group"
                            >
                                <div className="flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 shadow-sm border border-gray-100 dark:border-white/10 shrink-0 size-12 text-primary group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined">calendar_today</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[#181711] dark:text-white text-base font-semibold">Plan a Meal</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Schedule your next delicious homemade meal</p>
                                </div>
                                <div className="shrink-0 text-gray-400 group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </div>
                            </button>
                        </div>

                        {/* Cancel */}
                        <div className="mt-8">
                            <button
                                onClick={onClose}
                                className="w-full py-4 text-gray-500 dark:text-gray-400 font-medium hover:text-[#181711] dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default QuickActionsOverlay;
