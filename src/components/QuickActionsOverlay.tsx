
import React from 'react';

interface QuickActionsOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateRecipe: () => void;
    onAddToShoppingList: () => void;
    onPlanMeal?: () => void;
    onModalToggle?: (hidden: boolean) => void;
}

const QuickActionsOverlay: React.FC<QuickActionsOverlayProps> = ({
    isOpen,
    onClose,
    onCreateRecipe,
    onAddToShoppingList,
    onPlanMeal,
    onModalToggle,
}) => {
    React.useEffect(() => {
        if (isOpen) {
            onModalToggle?.(true);
        } else {
            onModalToggle?.(false);
        }
    }, [isOpen, onModalToggle]);

    if (!isOpen) return null;

    return (
        <dialog className={`modal modal-bottom sm:modal-middle ${isOpen ? 'modal-open' : ''}`} onClick={onClose}>
            <div
                className="modal-box p-0 max-w-md bg-white overflow-hidden shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Bottom Sheet Handle */}
                <div className="flex h-6 w-full items-center justify-center sm:hidden">
                    <div className="h-1.5 w-12 rounded-full bg-primary/30"></div>
                </div>

                {/* Header */}
                <div className="px-6 pt-4 pb-2 text-center relative">
                    <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <h2 className="text-[#181711] text-2xl font-bold leading-tight tracking-tight">Quick Actions</h2>
                    <p className="text-[#181711]/70 text-sm font-normal mt-2">What's the plan for today?</p>
                </div>

                <div className="p-6 space-y-4">
                    {/* Primary Action */}
                    <button
                        onClick={() => { onClose(); onCreateRecipe(); }}
                        className="w-full bg-primary/10 hover:bg-primary/20 active:scale-[0.98] transition-all p-4 rounded-xl flex items-center gap-4 group border border-primary/20"
                    >
                        <div className="w-12 h-12 rounded-full bg-primary text-[#181711] flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl">add</span>
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-[#181711] font-bold text-lg">Create Recipe</h3>
                            <p className="text-[#181711]/60 text-xs">Share your chef's secret</p>
                        </div>
                        <span className="material-symbols-outlined text-primary/50 group-hover:text-primary transition-colors">chevron_right</span>
                    </button>

                    {/* Secondary Actions Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => { onClose(); onAddToShoppingList(); }}
                            className="bg-gray-50 hover:bg-gray-100 active:scale-[0.98] transition-all p-4 rounded-xl flex flex-col items-center gap-3 text-center border border-gray-100"
                        >
                            <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-xl">shopping_cart</span>
                            </div>
                            <div>
                                <span className="block text-[#181711] font-bold text-sm">Grocery List</span>
                                <span className="block text-[#181711]/50 text-[10px] mt-0.5">Add items</span>
                            </div>
                        </button>

                        <button
                            onClick={() => { onClose(); onPlanMeal?.(); }}
                            className="bg-gray-50 hover:bg-gray-100 active:scale-[0.98] transition-all p-4 rounded-xl flex flex-col items-center gap-3 text-center border border-gray-100"
                        >
                            <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-xl">calendar_today</span>
                            </div>
                            <div>
                                <span className="block text-[#181711] font-bold text-sm">Meal Plan</span>
                                <span className="block text-[#181711]/50 text-[10px] mt-0.5">Schedule dinner</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
};

export default QuickActionsOverlay;
