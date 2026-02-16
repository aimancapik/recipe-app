
import React, { useState } from 'react';
import LoadingAnimation from '@/components/LoadingAnimation';
import { Recipe } from '@/types';
import StepTimer from '@/components/StepTimer';

interface RecipeDetailScreenProps {
    recipe: Recipe;
    onBack: () => void;
    onToggleFavorite: (id: string) => void;
    onAddToGrocery: (recipe: Recipe) => void;
    onOpenGrocery: () => void;
    onPublish?: () => Promise<void> | void;
    onEdit?: (recipe: Recipe) => void;
}

const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({ recipe, onBack, onToggleFavorite, onAddToGrocery, onOpenGrocery, onPublish, onEdit }) => {
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
                <div className="grid grid-cols-4 gap-2 mb-8 p-1 rounded-2xl bg-base-200/50 border border-base-200">
                    {[
                        { label: 'Time', val: recipe.prepTime, icon: 'schedule' },
                        { label: 'Serves', val: recipe.serves, icon: 'group' },
                        { label: 'Kcal', val: recipe.kcal, icon: 'bolt' },
                        { label: 'Level', val: recipe.level, icon: 'bar_chart' }
                    ].map(stat => (
                        <div key={stat.label} className="flex flex-col items-center py-3 bg-base-100/50 rounded-xl shadow-sm first:bg-primary/5 last:bg-primary/5">
                            <span className="material-symbols-outlined text-primary text-[20px] mb-1">{stat.icon}</span>
                            <span className="text-base-content font-bold text-xs">{stat.val}</span>
                            <span className="text-[9px] uppercase font-bold text-base-content/40 tracking-wider">{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Ingredients */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-5 px-1">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[20px] fill-1">shopping_basket</span>
                            </div>
                            Ingredients
                        </h2>
                        <span className="text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-full">{recipe.ingredients.length} items</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                        {recipe.ingredients.map((ing, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-base-100 border border-base-200 hover:border-primary/20 transition-colors shadow-sm group">
                                <div className="size-6 rounded-full border-2 border-primary/20 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                                    <div className="size-2 rounded-full bg-primary/30" />
                                </div>
                                <span className="text-sm font-medium text-base-content/80">{ing}</span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => onAddToGrocery(recipe)}
                        className="btn btn-primary btn-outline w-full mt-6 h-12 rounded-xl gap-2 border-primary/30 hover:bg-primary/5 hover:border-primary text-primary"
                    >
                        <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                        Add all to Shopping List
                    </button>
                </div>

                {/* Directions */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-6 px-1">Directions</h2>
                    <div className="space-y-6 relative before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-base-300">
                        {recipe.directions.map((dir, idx) => (
                            <div key={idx} className="relative pl-12 flex flex-col gap-3">
                                {/* Number Circle */}
                                <div className="absolute left-0 top-0 size-9 rounded-full bg-primary text-primary-content flex items-center justify-center font-black text-sm shadow-lg ring-4 ring-base-100 z-10">
                                    {idx + 1}
                                </div>

                                <div className="flex flex-col flex-1 text-left">
                                    <h3 className="font-bold text-base mb-2 text-base-content">{dir.title}</h3>

                                    {dir.image && (
                                        <div className="w-full aspect-video rounded-2xl overflow-hidden mb-3 border border-base-200 shadow-sm relative group">
                                            {dir.mediaType === 'video' ? (
                                                <video
                                                    src={dir.image}
                                                    autoPlay
                                                    loop
                                                    muted
                                                    playsInline
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <img
                                                    src={dir.image}
                                                    alt={dir.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            )}
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                {dir.mediaType === 'video' && (
                                                    <div className="badge badge-neutral gap-1 border-0 bg-black/60 backdrop-blur-md">
                                                        <span className="material-symbols-outlined text-xs">play_circle</span> VIDEO
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-base-content/70 leading-relaxed text-sm font-medium pr-2">
                                        {dir.description}
                                    </p>

                                    {dir.timer && (
                                        <div className="max-w-xs">
                                            <StepTimer seconds={dir.timer} label="Cooking Timer" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Publish Button (Fixed Bottom) */}
            {onPublish && (
                <div className="fixed bottom-8 left-4 right-4 max-w-[450px] mx-auto z-40">
                    <div className="bg-base-100/80 backdrop-blur-xl p-3 rounded-[32px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex gap-3 items-center animate-in slide-in-from-bottom-8 duration-700">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(recipe)}
                                disabled={publishing}
                                className="btn btn-neutral btn-circle h-14 w-14 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg border-none bg-base-300 hover:bg-base-200"
                                title="Edit Recipe"
                            >
                                <span className="material-symbols-outlined text-base-content/70">edit</span>
                            </button>
                        )}
                        <button
                            onClick={handlePublish}
                            disabled={publishing}
                            className="btn btn-primary flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] border-none"
                        >
                            {publishing ? (
                                <LoadingAnimation size={24} />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined fill-1">publish</span>
                                    <span>Publish Recipe</span>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecipeDetailScreen;
