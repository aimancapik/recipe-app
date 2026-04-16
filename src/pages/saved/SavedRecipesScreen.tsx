
import React, { useState, useEffect } from 'react';
import { Recipe } from '@/types';
import RecipeCard from '@/components/recipe/RecipeCard';
import RecipeMasonryGrid from '@/components/recipe/RecipeMasonryGrid';
import { useCollections, Collection } from '@/hooks/recipe/useCollections';

interface SavedRecipesScreenProps {
    recipes: Recipe[];
    onRecipeClick: (recipe: Recipe) => void;
    onToggleFavorite: (id: string) => void;
    onBack: () => void;
    initialTab?: 'saved' | 'collections';
}

const SavedRecipesScreen: React.FC<SavedRecipesScreenProps> = ({ recipes, onRecipeClick, onToggleFavorite, onBack, initialTab = 'saved' }) => {
    const [activeTab, setActiveTab] = useState<'saved' | 'collections'>(initialTab);

    // Collections state
    const { collections, fetchCollections, createCollection, fetchCollectionRecipes, loading } = useCollections();
    const [isCreating, setIsCreating] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
    const [collectionRecipes, setCollectionRecipes] = useState<Recipe[]>([]);
    const [loadingCollection, setLoadingCollection] = useState(false);

    useEffect(() => {
        if (activeCollection) {
            setLoadingCollection(true);
            fetchCollectionRecipes(activeCollection.id)
                .then(fetched => {
                    // Inject isFavorite flag manually for visual consistency
                    const enhanced = fetched.map(r => ({
                        ...r,
                        isFavorite: recipes.some(saved => saved.id === r.id && saved.isFavorite)
                    }));
                    setCollectionRecipes(enhanced);
                })
                .finally(() => setLoadingCollection(false));
        } else {
            setCollectionRecipes([]);
        }
    }, [activeCollection, fetchCollectionRecipes, recipes]);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) return;
        await createCollection(newCollectionName.trim());
        setNewCollectionName('');
        setIsCreating(false);
    };

    const savedRecipes = recipes.filter(r => r.isFavorite);

    if (activeCollection) {
        // Render Collection Detail Sub-screen (we'll expand this later, for now just a placeholder)
        return (
            <div className="flex flex-col min-h-screen bg-base-200">
                <header className="sticky top-0 z-20 bg-base-100/80 backdrop-blur-md px-4 pt-6 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <button onClick={() => setActiveCollection(null)} className="btn btn-ghost btn-circle btn-sm">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <h1 className="text-xl font-bold truncate">{activeCollection.name}</h1>
                    </div>
                    <p className="text-sm text-base-content/60 px-12">{activeCollection.recipe_count} recipes</p>
                </header>
                <main className="flex-1 px-4 py-4 pb-32">
                    {loadingCollection ? (
                        <div className="flex justify-center py-20">
                            <span className="loading loading-spinner text-primary loading-lg"></span>
                        </div>
                    ) : collectionRecipes.length > 0 ? (
                        <RecipeMasonryGrid
                            recipes={collectionRecipes}
                            onRecipeClick={onRecipeClick}
                            onToggleFavorite={onToggleFavorite}
                            showCategory={true}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <span className="material-symbols-outlined text-6xl text-base-content/20 mb-4">folder_open</span>
                            <h3 className="text-lg font-bold mb-2">Collection is empty</h3>
                            <p className="text-sm text-base-content/60 max-w-xs">Tap the bookmark icon on recipes to add them here.</p>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-base-200">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-base-100/80 backdrop-blur-md px-4 pt-6 pb-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="btn btn-ghost btn-circle btn-sm">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <h1 className="text-2xl font-bold tracking-tight text-base-content">Saved Recipes</h1>
                    </div>
                    <button className="btn btn-ghost btn-circle btn-sm bg-primary/20">
                        <span className="material-symbols-outlined">tune</span>
                    </button>
                </div>

                <div className="mt-2 mb-4">
                    <div className="tabs tabs-boxed bg-base-200/50 p-1">
                        <button
                            className={`tab flex-1 transition-all ${activeTab === 'saved' ? 'tab-active bg-primary text-primary-content font-bold shadow-sm' : ''}`}
                            onClick={() => setActiveTab('saved')}
                        >
                            <span className="material-symbols-outlined mr-2 text-sm">bookmark</span>
                            All Saved
                        </button>
                        <button
                            className={`tab flex-1 transition-all ${activeTab === 'collections' ? 'tab-active bg-primary text-primary-content font-bold shadow-sm' : ''}`}
                            onClick={() => setActiveTab('collections')}
                        >
                            <span className="material-symbols-outlined mr-2 text-sm">folder</span>
                            Collections
                        </button>
                    </div>
                </div>

                {activeTab === 'saved' && (
                    <div className="mb-2"></div>
                )}
            </header>

            <main className="flex-1 px-4 py-4 pb-32">
                {activeTab === 'saved' ? (
                    savedRecipes.length > 0 ? (
                        <RecipeMasonryGrid
                            recipes={savedRecipes}
                            onRecipeClick={onRecipeClick}
                            onToggleFavorite={onToggleFavorite}
                            showCategory={true}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="text-8xl mb-6">📌</div>
                            <h3 className="text-xl font-bold text-base-content mb-2">No saved recipes yet</h3>
                            <p className="text-sm text-base-content/60 mb-8 max-w-xs">
                                Start building your personal cookbook by saving recipes you love!
                            </p>
                            <button
                                onClick={onBack}
                                className="btn btn-primary gap-2"
                            >
                                <span className="material-symbols-outlined">explore</span>
                                Explore Recipes
                            </button>
                        </div>
                    )
                ) : (
                    <div className="space-y-4">
                        <button
                            onClick={() => setIsCreating(true)}
                            className="btn btn-outline btn-block border-dashed h-20 text-base-content/60 hover:text-primary hover:border-primary"
                        >
                            <span className="material-symbols-outlined mr-2">add</span>
                            Create New Collection
                        </button>

                        {loading && collections.length === 0 ? (
                            <div className="flex justify-center py-8">
                                <span className="loading loading-spinner text-primary"></span>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {collections.map(collection => (
                                    <div
                                        key={collection.id}
                                        onClick={() => setActiveCollection(collection)}
                                        className="card bg-base-100 shadow-sm border border-base-200 cursor-pointer active:scale-95 transition-transform"
                                    >
                                        <div className="p-4 flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-base-200 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                                {collection.cover_image ? (
                                                    <img src={collection.cover_image} alt={collection.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-3xl text-base-content/20">folder</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg">{collection.name}</h3>
                                                <p className="text-sm text-base-content/60">{collection.recipe_count} recipes</p>
                                            </div>
                                            <span className="material-symbols-outlined text-base-content/30">chevron_right</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Create Collection Modal */}
            <dialog className={`modal modal-bottom sm:modal-middle ${isCreating ? 'modal-open' : ''}`}>
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">Create Collection</h3>
                    <input
                        type="text"
                        placeholder="Collection Name"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        className="input input-bordered w-full mb-4"
                        autoFocus
                    />
                    <div className="modal-action">
                        <button className="btn btn-ghost" onClick={() => { setIsCreating(false); setNewCollectionName(''); }}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleCreateCollection} disabled={!newCollectionName.trim() || loading}>
                            {loading ? <span className="loading loading-spinner"></span> : 'Create'}
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop" onClick={() => setIsCreating(false)}>
                    <button>close</button>
                </form>
            </dialog>
        </div>
    );
};

export default SavedRecipesScreen;
