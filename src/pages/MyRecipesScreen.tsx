import React, { useState } from 'react';
import LoadingAnimation from '@/components/LoadingAnimation';
import { Recipe } from '@/types';
import RecipeMasonryGrid from '@/components/RecipeMasonryGrid';

interface MyRecipesScreenProps {
    recipes: Recipe[];
    onBack: () => void;
    onEdit: (recipe: Recipe) => void;
    onDelete: (id: string) => Promise<void>;
    onRecipeClick: (recipe: Recipe) => void;
    onUpdateStatus?: (recipe: Recipe, status: 'published' | 'draft') => Promise<void>;
}

const MyRecipesScreen: React.FC<MyRecipesScreenProps> = ({
    recipes,
    onBack,
    onEdit,
    onDelete,
    onRecipeClick,
    onUpdateStatus
}) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteRecipe, setConfirmDeleteRecipe] = useState<Recipe | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredRecipes = recipes.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async () => {
        if (!confirmDeleteRecipe) return;
        try {
            setDeletingId(confirmDeleteRecipe.id);
            await onDelete(confirmDeleteRecipe.id);
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete recipe. Please try again.');
        } finally {
            setDeletingId(null);
            setConfirmDeleteRecipe(null);
        }
    };

    return (
        <div className="bg-base-200 text-base-content min-h-screen flex flex-col w-full">
            {/* Top App Bar */}
            <div className="navbar sticky top-0 z-10 bg-base-100/80 backdrop-blur-md border-b border-base-200">
                <div className="navbar-start">
                    <button onClick={onBack} className="btn btn-ghost btn-circle btn-sm">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                </div>
                <div className="navbar-center">
                    <h2 className="text-lg font-bold">My Recipes</h2>
                </div>
                <div className="navbar-end">
                    <div className="badge badge-primary badge-sm font-bold">{recipes.length}</div>
                </div>
            </div>

            {/* Search Bar */}
            {recipes.length > 0 && (
                <div className="px-4 py-3">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-[20px]">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Search your recipes..."
                            className="input input-bordered input-sm w-full bg-base-100"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-circle btn-xs"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-y-auto pb-8">
                {/* Empty State */}
                {recipes.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-primary text-5xl">menu_book</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">No recipes yet</h3>
                        <p className="text-base-content/50 text-sm mb-6 max-w-xs">
                            Your published recipes will appear here. Start cooking and share your creations!
                        </p>
                        <button
                            onClick={onBack}
                            className="btn btn-primary btn-sm gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Create your first recipe
                        </button>
                    </div>
                )}

                {/* No Search Results */}
                {recipes.length > 0 && filteredRecipes.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
                        <span className="material-symbols-outlined text-base-content/20 text-5xl mb-4">search_off</span>
                        <p className="text-base-content/50 text-sm">No recipes match "{searchQuery}"</p>
                    </div>
                )}

                {/* Recipe List */}
                <div className="px-4 py-4">
                    {filteredRecipes.length > 0 && (
                        <RecipeMasonryGrid
                            recipes={filteredRecipes}
                            onRecipeClick={onRecipeClick}
                            onEdit={onEdit}
                            onDelete={(r) => setConfirmDeleteRecipe(r)}
                            onUpdateStatus={onUpdateStatus}
                        />
                    )}
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {confirmDeleteRecipe && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6">
                    <div className="card bg-base-100 shadow-2xl w-full max-w-sm animate-fade-in">
                        <div className="card-body items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-2">
                                <span className="material-symbols-outlined text-error text-3xl">delete_forever</span>
                            </div>
                            <h3 className="card-title text-lg">Delete Recipe?</h3>
                            <p className="text-sm text-base-content/60 mb-1">
                                Are you sure you want to delete <strong>"{confirmDeleteRecipe.title}"</strong>? This action cannot be undone.
                            </p>
                            <div className="card-actions w-full mt-3">
                                <button
                                    onClick={() => setConfirmDeleteRecipe(null)}
                                    className="btn btn-ghost flex-1"
                                    disabled={!!deletingId}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="btn btn-error flex-1 gap-2"
                                    disabled={!!deletingId}
                                >
                                    {deletingId ? (
                                        <LoadingAnimation size={24} />
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyRecipesScreen;
