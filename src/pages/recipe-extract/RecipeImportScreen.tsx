import React, { useEffect, useRef, useState } from 'react';
import { Recipe } from '@/types';
import { detectImportType, importRecipe, ImportSourceType } from '@/services/recipeImportService';
import SourceDetector from '@/components/import/SourceDetector';
import ImportProgress from '@/components/import/ImportProgress';

interface RecipeImportScreenProps {
    onBack: () => void;
    onRecipeReady: (recipe: Recipe) => void;
}

const SOURCE_LABELS = [
    { icon: 'language', label: 'Any recipe website' },
    { icon: 'play_circle', label: 'YouTube cooking videos' },
    { icon: 'music_video', label: 'TikTok recipe videos' },
    { icon: 'photo_camera', label: 'Photos and screenshots' },
];

const RecipeImportScreen: React.FC<RecipeImportScreenProps> = ({ onBack, onRecipeReady }) => {
    const [input, setInput] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progressStep, setProgressStep] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const activeInput = file || input;
    const type: ImportSourceType = activeInput ? detectImportType(activeInput) : 'text';

    useEffect(() => {
        if (!loading) return;
        const timer = window.setInterval(() => setProgressStep(prev => (prev + 1) % 3), 1200);
        return () => window.clearInterval(timer);
    }, [loading]);

    const runImport = async () => {
        if (!file && !input.trim()) return;
        setLoading(true);
        setProgressStep(0);
        setError(null);
        try {
            const recipe = await importRecipe(file || input.trim());
            const recent = JSON.parse(localStorage.getItem('whatscookin_recent_imports') || '[]');
            localStorage.setItem('whatscookin_recent_imports', JSON.stringify([recipe, ...recent].slice(0, 6)));
            onRecipeReady(recipe);
        } catch (err: any) {
            setError(err.message || 'Could not import this recipe.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-200">
            <header className="sticky top-0 z-30 border-b border-base-200 bg-base-100/90 px-4 py-3 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="btn btn-ghost btn-circle btn-sm">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">WhatsCookin</p>
                        <h1 className="text-lg font-black leading-tight">Import Recipe</h1>
                    </div>
                </div>
            </header>

            <main className="space-y-5 px-5 py-5">
                <section className="rounded-3xl border border-primary/10 bg-base-100 p-5 shadow-xl shadow-primary/5">
                    <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-content shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-3xl">post_add</span>
                    </div>
                    <h2 className="text-2xl font-black leading-tight">Paste a link or snap a photo</h2>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-base-content/55">See a recipe anywhere? Bring it here and we will turn it into something you can save.</p>

                    <textarea
                        value={input}
                        onChange={(event) => { setInput(event.target.value); setFile(null); }}
                        className="textarea textarea-bordered mt-5 min-h-32 w-full rounded-2xl bg-base-200/60 text-sm"
                        placeholder="https://... or paste recipe text"
                    />

                    <div className="mt-3 flex items-center justify-between gap-3">
                        <SourceDetector input={activeInput || null} />
                        {file && <button className="btn btn-ghost btn-xs" onClick={() => setFile(null)}>Clear photo</button>}
                    </div>

                    <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
                    <input ref={cameraInputRef} className="hidden" type="file" accept="image/*" capture="environment" onChange={(event) => setFile(event.target.files?.[0] || null)} />

                    <div className="mt-5 grid grid-cols-3 gap-3">
                        <button onClick={() => cameraInputRef.current?.click()} className="btn h-20 flex-col rounded-2xl bg-base-200/70">
                            <span className="material-symbols-outlined">photo_camera</span>
                            Camera
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="btn h-20 flex-col rounded-2xl bg-base-200/70">
                            <span className="material-symbols-outlined">image</span>
                            Upload
                        </button>
                        <button onClick={async () => setInput(await navigator.clipboard.readText())} className="btn h-20 flex-col rounded-2xl bg-base-200/70">
                            <span className="material-symbols-outlined">content_paste</span>
                            Paste
                        </button>
                    </div>

                    {loading ? (
                        <div className="mt-5">
                            <ImportProgress type={type} step={progressStep} />
                        </div>
                    ) : (
                        <button onClick={runImport} disabled={!file && !input.trim()} className="btn btn-primary mt-5 h-14 w-full rounded-2xl text-base shadow-lg shadow-primary/20">
                            Extract Recipe
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    )}

                    {error && (
                        <div className="alert alert-error mt-4 rounded-2xl text-sm">
                            <span className="material-symbols-outlined">error</span>
                            <span>{error}</span>
                        </div>
                    )}
                </section>

                <section className="grid grid-cols-2 gap-3">
                    {SOURCE_LABELS.map(item => (
                        <div key={item.label} className="rounded-2xl border border-base-200 bg-base-100 p-4">
                            <span className="material-symbols-outlined text-primary">{item.icon}</span>
                            <p className="mt-2 text-xs font-black leading-tight">{item.label}</p>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
};

export default RecipeImportScreen;
