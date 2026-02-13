
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
        <div className="modal modal-open modal-bottom" onClick={onClose}>
            <div className="modal-box rounded-t-3xl" onClick={e => e.stopPropagation()}>
                {/* Handle */}
                <button onClick={onClose} className="flex h-6 w-full items-center justify-center group">
                    <div className="h-1.5 w-12 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                </button>

                {/* Header */}
                <div className="flex items-center justify-between mb-6 mt-2">
                    <h2 className="text-xl font-bold text-base-content">Quick Actions</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
                        <span className="material-symbols-outlined text-base-content/50">close</span>
                    </button>
                </div>

                {/* Hero Card — Create New Recipe */}
                <div className="mb-6">
                    <div
                        className="card bg-base-100 shadow-lg border-2 border-primary cursor-pointer active:scale-[0.98] transition-transform"
                        onClick={() => { onClose(); onCreateRecipe(); }}
                    >
                        <figure>
                            <img
                                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600"
                                alt="Create Recipe"
                                className="w-full h-40 object-cover"
                            />
                        </figure>
                        <div className="card-body">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="card-title">Create New Recipe</h3>
                                    <p className="text-base-content/60 text-sm leading-relaxed">
                                        Share your culinary masterpiece with the community.
                                    </p>
                                </div>
                                <div className="btn btn-primary btn-sm btn-square">
                                    <span className="material-symbols-outlined font-bold">add_circle</span>
                                </div>
                            </div>
                            <div className="card-actions mt-2">
                                <button className="btn btn-primary btn-sm">Get Started</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Actions */}
                <div className="space-y-3">
                    <button
                        onClick={() => { onClose(); onAddToShoppingList(); }}
                        className="w-full flex items-center gap-4 bg-base-200 p-4 rounded-xl hover:border-primary/50 transition-all text-left group"
                    >
                        <div className="btn btn-ghost btn-square btn-sm bg-base-100 text-primary group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">shopping_cart</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-base-content text-base font-semibold">Add to Shopping List</p>
                            <p className="text-base-content/50 text-sm">Quickly add ingredients to your weekly list</p>
                        </div>
                        <span className="material-symbols-outlined text-base-content/30 group-hover:text-primary transition-colors">chevron_right</span>
                    </button>

                    <button
                        onClick={() => { onClose(); onPlanMeal?.(); }}
                        className="w-full flex items-center gap-4 bg-base-200 p-4 rounded-xl hover:border-primary/50 transition-all text-left group"
                    >
                        <div className="btn btn-ghost btn-square btn-sm bg-base-100 text-primary group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">calendar_today</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-base-content text-base font-semibold">Plan a Meal</p>
                            <p className="text-base-content/50 text-sm">Schedule your next delicious homemade meal</p>
                        </div>
                        <span className="material-symbols-outlined text-base-content/30 group-hover:text-primary transition-colors">chevron_right</span>
                    </button>
                </div>

                {/* Cancel */}
                <div className="modal-action">
                    <button onClick={onClose} className="btn btn-ghost w-full">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickActionsOverlay;
