
import React, { useState } from 'react';
import { Recipe } from '@/types';
import StepTimer from '@/components/StepTimer';

interface RecipeDetailScreenProps {
    recipe: Recipe;
    onBack: () => void;
    onToggleFavorite: (id: string) => void;
    onAddToGrocery: (recipe: Recipe) => void;
    onOpenGrocery: () => void;
    onPublish?: () => Promise<void> | void;
}

const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({ recipe, onBack, onToggleFavorite, onAddToGrocery, onOpenGrocery, onPublish }) => {
    const [publishing, setPublishing] = useState(false);

    const handlePublish = async () => {
        if (!onPublish || publishing) return;
        setPublishing(true);
        try {
            await onPublish();
        } catch (e) {
            console.error('Publish failed', e);
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className={`relative flex min-h-screen w-full flex-col bg-base-100 ${onPublish ? 'pb-24' : ''}`}>
            {/* Header Image & Overlay Nav */}
            <div className="relative w-full h-80">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${recipe.image}')` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"></div>
                </div>
                {/* Navigation */}
                <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4">
                    <button onClick={onBack} className="btn btn-circle btn-sm glass text-white">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    {!onPublish && (
                        <button
                            onClick={() => onToggleFavorite(recipe.id)}
                            className={`btn btn-circle btn-sm glass border-none transition-all active:scale-90 ${recipe.isFavorite ? 'text-red-500' : 'text-white'}`}
                        >
                            <span className={`material-symbols-outlined ${recipe.isFavorite ? 'fill-icon scale-110' : ''}`}>
                                {recipe.isFavorite ? 'heart_check' : 'favorite'}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Recipe Content */}
            <div className="relative -mt-8 rounded-t-3xl bg-base-100 px-6 pt-8 pb-8 shadow-2xl">
                {/* Title and Rating */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight text-base-content leading-tight">
                            {recipe.title}
                        </h1>
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-warning fill-icon text-sm">star</span>
                            <span className="text-sm font-semibold">{recipe.rating}</span>
                            <span className="text-sm text-base-content/50">({recipe.reviews} reviews)</span>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="stats stats-horizontal bg-primary/10 border border-primary/20 shadow-none w-full mb-8">
                    {[
                        { label: 'Prep', val: recipe.prepTime, icon: 'schedule' },
                        { label: 'Serves', val: recipe.serves, icon: 'group' },
                        { label: 'Kcal', val: recipe.kcal, icon: 'bolt' },
                        { label: 'Level', val: recipe.level, icon: 'bar_chart' }
                    ].map(stat => (
                        <div key={stat.label} className="stat place-items-center py-3 px-2">
                            <div className="stat-figure text-primary">
                                <span className="material-symbols-outlined">{stat.icon}</span>
                            </div>
                            <div className="stat-title text-[10px] uppercase tracking-wider">{stat.label}</div>
                            <div className="stat-value text-sm">{stat.val}</div>
                        </div>
                    ))}
                </div>

                {/* Ingredients */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Ingredients</h2>
                        <div className="badge badge-primary badge-outline">{recipe.ingredients.length} Items</div>
                    </div>
                    <ul className="space-y-3">
                        {recipe.ingredients.map((ing, idx) => (
                            <li key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-base-200">
                                <div className="size-2 rounded-full bg-primary"></div>
                                <span className="text-sm">{ing}</span>
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={() => onAddToGrocery(recipe)}
                        className="btn btn-outline btn-primary w-full mt-4 gap-2"
                    >
                        <span className="material-symbols-outlined text-xl">shopping_cart</span>
                        Add all to Shopping List
                    </button>
                </div>

                {/* Directions */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Directions</h2>
                    <ul className="steps steps-vertical w-full">
                        {recipe.directions.map((dir, idx) => (
                            <li key={idx} className="step step-primary" data-content={dir.step}>
                                <div className="flex flex-col flex-1 text-left ml-2">
                                    <h3 className="font-bold text-sm mb-1">{dir.title}</h3>
                                    {dir.image && (
                                        <div className="w-full aspect-video rounded-xl overflow-hidden mb-3 border border-base-200 relative">
                                            {dir.mediaType === 'video' ? (
                                                <>
                                                    <video
                                                        src={dir.image}
                                                        autoPlay
                                                        loop
                                                        muted
                                                        playsInline
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="badge badge-neutral badge-sm absolute bottom-2 left-2 gap-1">
                                                        <span className="material-symbols-outlined text-xs">play_circle</span>
                                                        VIDEO
                                                    </div>
                                                </>
                                            ) : (
                                                <img src={dir.image} alt={dir.title} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                    )}
                                    <p className="text-sm text-base-content/60 leading-relaxed">
                                        {dir.description}
                                    </p>
                                    {dir.timer && (
                                        <StepTimer seconds={dir.timer} label="Step Timer" />
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Publish Button (Fixed Bottom) */}
            {onPublish && (
                <div className="fixed bottom-6 left-6 right-6 max-w-[456px] mx-auto z-30">
                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        className="btn btn-primary w-full shadow-2xl text-lg font-bold border-none h-14 rounded-2xl animate-in slide-in-from-bottom duration-500"
                    >
                        {publishing ? (
                            <>
                                <span className="loading loading-spinner loading-md"></span>
                                Publishing...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined fill-icon scale-125 mr-2">publish</span>
                                Publish to Community
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecipeDetailScreen;
