import React from 'react';
import { Recipe } from '@/types';

interface ImportPreviewScreenProps {
    recipe: Recipe;
    onBack: () => void;
    onSave: (recipe: Recipe) => void;
    onEdit: (recipe: Recipe) => void;
}

const ImportPreviewScreen: React.FC<ImportPreviewScreenProps> = ({ recipe, onBack, onSave, onEdit }) => {
    const ingredients = recipe.ingredients ?? [];
    const directions = recipe.directions ?? [];

    return (
        <div className="relative min-h-screen bg-base-100 pb-28">
            <section className="relative h-80 w-full overflow-hidden bg-base-200">
                <img src={recipe.image} alt={recipe.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />

                <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
                    <button onClick={onBack} className="btn btn-circle btn-sm glass border-none text-white">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                        Import Preview
                    </div>
                </div>
            </section>

            <main className="relative -mt-8 rounded-t-3xl bg-base-100 px-6 pb-10 pt-7 shadow-2xl">
                {recipe.sourceName && (
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-black text-primary">
                        <span className="material-symbols-outlined text-sm">link</span>
                        Imported from {recipe.sourceName}
                    </div>
                )}

                <div className="mb-6">
                    <h1 className="text-3xl font-black leading-tight tracking-tight text-base-content">{recipe.title}</h1>
                    {recipe.description && (
                        <p className="mt-3 text-sm font-medium leading-relaxed text-base-content/60">{recipe.description}</p>
                    )}
                </div>

                <div className="mb-8 grid grid-cols-3 gap-2 rounded-2xl border border-base-200 bg-base-200/50 p-1">
                    {[
                        { label: 'Time', val: recipe.prepTime || 'Quick', icon: 'schedule' },
                        { label: 'Serves', val: recipe.serves || '2', icon: 'group' },
                        { label: 'Level', val: recipe.level || 'Easy', icon: 'bar_chart' },
                    ].map(stat => (
                        <div key={stat.label} className="flex min-h-20 flex-col items-center justify-center rounded-xl bg-base-100/80 px-2 text-center shadow-sm">
                            <span className="material-symbols-outlined mb-1 text-[20px] text-primary">{stat.icon}</span>
                            <span className="max-w-full truncate text-xs font-black text-base-content">{stat.val}</span>
                            <span className="text-[9px] font-black uppercase tracking-wider text-base-content/40">{stat.label}</span>
                        </div>
                    ))}
                </div>

                <section className="mb-10">
                    <div className="mb-5 flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-secondary/20 text-primary">
                            <span className="material-symbols-outlined text-[20px]">shopping_basket</span>
                        </div>
                        <h2 className="text-xl font-black">Ingredients</h2>
                    </div>

                    <div className="grid gap-2.5">
                        {ingredients.map((ingredient, index) => (
                            <div key={`${ingredient}-${index}`} className="flex items-center gap-3 rounded-xl border border-base-200 bg-base-100 p-4 shadow-sm">
                                <span className="flex size-6 items-center justify-center rounded-full border-2 border-primary/20">
                                    <span className="size-2 rounded-full bg-primary/50" />
                                </span>
                                <span className="text-sm font-semibold text-base-content/80">{ingredient}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="mb-6 px-1 text-xl font-black">Directions</h2>
                    <div className="relative space-y-6 before:absolute before:bottom-4 before:left-[17px] before:top-4 before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-base-300">
                        {directions.map((direction, index) => (
                            <div key={`${direction.description}-${index}`} className="relative flex flex-col gap-3 pl-12">
                                <div className="absolute left-0 top-0 z-10 flex size-9 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-content shadow-lg ring-4 ring-base-100">
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className="mb-2 text-base font-black text-base-content">{direction.title || `Step ${index + 1}`}</h3>
                                    <p className="pr-2 text-sm font-medium leading-relaxed text-base-content/70">{direction.description}</p>
                                    {direction.timer && (
                                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-black text-primary">
                                            <span className="material-symbols-outlined text-sm">timer</span>
                                            {Math.round(direction.timer / 60)}m
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md border-t border-base-200 bg-base-100/90 p-4 backdrop-blur-xl">
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => onEdit(recipe)} className="btn btn-outline h-14 rounded-2xl gap-2 border-2">
                        <span className="material-symbols-outlined">edit</span>
                        Edit
                    </button>
                    <button onClick={() => onSave(recipe)} className="btn btn-primary h-14 rounded-2xl gap-2 shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined">bookmark_add</span>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportPreviewScreen;
