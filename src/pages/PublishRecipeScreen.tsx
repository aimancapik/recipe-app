
import React, { useState, useRef, useEffect } from 'react';
import { uploadImage } from '@/lib/storage';
import { videoToGif } from '@/lib/videoToGif';
import { Recipe } from '@/types';

interface Ingredient {
    id: string;
    name: string;
    qty: string;
    unit: string;
}

interface InstructionStep {
    id: string;
    description: string;
    image: string | null;
    mediaType?: 'image' | 'video';
    timer?: number;
}

interface PublishRecipeScreenProps {
    onBack: () => void;
    onPublish?: (data: RecipeFormData) => void;
    onUpdate?: (id: string, data: RecipeFormData) => void;
    editingRecipe?: Recipe | null;
}

interface RecipeFormData {
    title: string;
    description: string;
    coverImage: string | null;
    prepTime: string;
    serves: string;
    difficulty: string;
    ingredients: Ingredient[];
    instructions: InstructionStep[];
}

const UNITS = ['g', 'kg', 'ml', 'tsp', 'tbsp', 'cup', 'pcs'];

const PublishRecipeScreen: React.FC<PublishRecipeScreenProps> = ({ onBack, onPublish, onUpdate, editingRecipe }) => {
    const isEditing = !!editingRecipe;
    const [step, setStep] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const stepImageRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const stepCameraRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const stepVideoRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [prepTime, setPrepTime] = useState('');
    const [serves, setServes] = useState('');
    const [difficulty, setDifficulty] = useState('Easy');

    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [newIngName, setNewIngName] = useState('');
    const [newIngQty, setNewIngQty] = useState('');
    const [newIngUnit, setNewIngUnit] = useState('g');

    const [instructions, setInstructions] = useState<InstructionStep[]>([
        { id: '1', description: '', image: null },
    ]);

    // Pre-fill form when editing
    useEffect(() => {
        if (editingRecipe) {
            setTitle(editingRecipe.title || '');
            setDescription('');
            setCoverImage(editingRecipe.image || null);
            setPrepTime(editingRecipe.prepTime?.replace(/[^0-9]/g, '') || '');
            setServes(editingRecipe.serves || '');
            setDifficulty(editingRecipe.level || 'Easy');

            // Parse ingredients back to form format
            const parsedIngredients: Ingredient[] = editingRecipe.ingredients.map((ing, idx) => {
                // Try to parse "100g Flour" format
                const match = ing.match(/^([\d.]+)\s*(g|kg|ml|tsp|tbsp|cup|pcs)?\s*(.+)$/i);
                if (match) {
                    return { id: `edit-${idx}`, qty: match[1], unit: match[2] || 'g', name: match[3].trim() };
                }
                return { id: `edit-${idx}`, qty: '', unit: 'pcs', name: ing };
            });
            setIngredients(parsedIngredients);

            // Parse directions
            const parsedInstructions: InstructionStep[] = editingRecipe.directions.map((dir, idx) => ({
                id: `edit-${idx}`,
                description: dir.description,
                image: dir.image || null,
                mediaType: dir.mediaType || 'image',
                timer: dir.timer,
            }));
            setInstructions(parsedInstructions.length > 0 ? parsedInstructions : [{ id: '1', description: '', image: null }]);
        }
    }, [editingRecipe]);

    const [uploading, setUploading] = useState(false);

    const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadImage(file, 'covers');
            setCoverImage(url);
        } catch (err) {
            console.error('Upload failed:', err);
            // Fallback to base64 if storage isn't set up
            const reader = new FileReader();
            reader.onloadend = () => setCoverImage(reader.result as string);
            reader.readAsDataURL(file);
        } finally {
            setUploading(false);
        }
    };

    const handleStepImageUpload = async (stepId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const isVideo = file.type.startsWith('video/');
        setUploading(true);
        try {
            // Convert video to GIF before uploading
            const fileToUpload = isVideo ? await videoToGif(file) : file;
            const url = await uploadImage(fileToUpload, 'steps');
            setInstructions(prev => prev.map(s =>
                s.id === stepId ? { ...s, image: url, mediaType: 'image' } : s
            ));
        } catch (err) {
            console.error('Upload failed:', err);
            // Fallback to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setInstructions(prev => prev.map(s =>
                    s.id === stepId ? { ...s, image: reader.result as string, mediaType: 'image' } : s
                ));
            };
            reader.readAsDataURL(file);
        } finally {
            setUploading(false);
        }
    };

    const addIngredient = () => {
        if (!newIngName.trim()) return;
        setIngredients(prev => [...prev, {
            id: Date.now().toString(),
            name: newIngName.trim(),
            qty: newIngQty || '0',
            unit: newIngUnit,
        }]);
        setNewIngName('');
        setNewIngQty('');
        setNewIngUnit('g');
    };

    const removeIngredient = (id: string) => {
        setIngredients(prev => prev.filter(i => i.id !== id));
    };

    const addInstructionStep = () => {
        setInstructions(prev => [...prev, {
            id: Date.now().toString(),
            description: '',
            image: null,
        }]);
    };

    const removeInstructionStep = (id: string) => {
        if (instructions.length <= 1) return;
        setInstructions(prev => prev.filter(s => s.id !== id));
    };

    const updateInstructionStep = (id: string, updates: Partial<InstructionStep>) => {
        setInstructions(prev => prev.map(s =>
            s.id === id ? { ...s, ...updates } : s
        ));
    };

    const removeStepImage = (stepId: string) => {
        setInstructions(prev => prev.map(s =>
            s.id === stepId ? { ...s, image: null } : s
        ));
    };

    const handlePublish = () => {
        const data = { title, description, coverImage, prepTime, serves, difficulty, ingredients, instructions };
        if (isEditing && editingRecipe) {
            onUpdate?.(editingRecipe.id, data);
        } else {
            onPublish?.(data);
        }
    };

    const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
    const progressPercent = step * 25;

    // ─────────────────────────────────────────────
    // STEP 1: BASIC INFO
    // ─────────────────────────────────────────────
    const renderStep1 = () => (
        <div className="flex-1 overflow-y-auto pb-24">
            <div className="p-4">
                <div
                    className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-6 py-10 transition-colors hover:bg-primary/10 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {coverImage ? (
                        <div className="w-full aspect-video rounded-lg overflow-hidden relative">
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                            <button
                                onClick={(e) => { e.stopPropagation(); setCoverImage(null); }}
                                className="btn btn-circle btn-xs btn-neutral absolute top-2 right-2"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-content">
                                <span className="material-symbols-outlined text-3xl">{uploading ? 'hourglass_empty' : 'add_a_photo'}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-base-content text-lg font-bold">{uploading ? 'Uploading...' : 'Add Cover Photo'}</p>
                                <p className="text-base-content/50 text-sm text-center">Great photos get 5x more views!</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="btn btn-outline btn-sm gap-2"
                                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                    disabled={uploading}
                                >
                                    <span className="material-symbols-outlined text-sm">photo_library</span>
                                    Gallery
                                </button>
                                <button
                                    className="btn btn-primary btn-sm gap-2"
                                    onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                                    disabled={uploading}
                                >
                                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                                    Camera
                                </button>
                            </div>
                        </>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverImageUpload}
                    />
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleCoverImageUpload}
                    />
                </div>
            </div>

            <div className="px-4 py-3">
                <label className="form-control w-full">
                    <div className="label">
                        <span className="label-text font-semibold">What's your dish called?</span>
                    </div>
                    <input
                        className="input input-bordered w-full"
                        placeholder="e.g. Grandma's Famous Lasagna"
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </label>
            </div>

            <div className="px-4 py-3">
                <label className="form-control w-full">
                    <div className="label">
                        <span className="label-text font-semibold">Give us a tasty summary</span>
                    </div>
                    <textarea
                        className="textarea textarea-bordered w-full min-h-[100px]"
                        placeholder="Tell us what makes this recipe special..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </label>
            </div>

            <div className="px-4 py-4">
                <h3 className="text-base-content text-base font-semibold mb-3">Cooking Essentials</h3>
                <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center gap-2 rounded-xl bg-base-200 p-3">
                        <span className="material-symbols-outlined text-primary">schedule</span>
                        <input
                            className="input input-ghost input-sm w-full text-center font-bold"
                            placeholder="0"
                            type="number"
                            value={prepTime}
                            onChange={e => setPrepTime(e.target.value)}
                        />
                        <p className="text-[10px] uppercase font-bold text-base-content/40">Mins</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 rounded-xl bg-base-200 p-3">
                        <span className="material-symbols-outlined text-primary">group</span>
                        <input
                            className="input input-ghost input-sm w-full text-center font-bold"
                            placeholder="0"
                            type="number"
                            value={serves}
                            onChange={e => setServes(e.target.value)}
                        />
                        <p className="text-[10px] uppercase font-bold text-base-content/40">Serves</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 rounded-xl bg-base-200 p-3">
                        <span className="material-symbols-outlined text-primary">bar_chart</span>
                        <select
                            className="select select-ghost select-sm w-full text-center font-bold"
                            value={difficulty}
                            onChange={e => setDifficulty(e.target.value)}
                        >
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                        </select>
                        <p className="text-[10px] uppercase font-bold text-base-content/40">Level</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // ─────────────────────────────────────────────
    // STEP 2: INGREDIENTS
    // ─────────────────────────────────────────────
    const renderStep2 = () => (
        <main className="flex-1 w-full p-4 pb-32 overflow-y-auto">
            <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body p-5">
                    <h2 className="card-title text-base gap-2">
                        <span className="material-symbols-outlined text-primary">add_circle</span>
                        Add Ingredient
                    </h2>
                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-3">
                            <label className="label"><span className="label-text text-xs">Qty</span></label>
                            <input
                                className="input input-bordered input-sm w-full"
                                placeholder="0"
                                type="number"
                                value={newIngQty}
                                onChange={e => setNewIngQty(e.target.value)}
                            />
                        </div>
                        <div className="col-span-4">
                            <label className="label"><span className="label-text text-xs">Unit</span></label>
                            <select
                                className="select select-bordered select-sm w-full"
                                value={newIngUnit}
                                onChange={e => setNewIngUnit(e.target.value)}
                            >
                                {UNITS.map(u => <option key={u}>{u}</option>)}
                            </select>
                        </div>
                        <div className="col-span-5">
                            <label className="label"><span className="label-text text-xs">Ingredient</span></label>
                            <input
                                className="input input-bordered input-sm w-full"
                                placeholder="e.g. Flour"
                                type="text"
                                value={newIngName}
                                onChange={e => setNewIngName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addIngredient()}
                            />
                        </div>
                    </div>
                    <button onClick={addIngredient} className="btn btn-primary w-full mt-4 gap-2">
                        <span className="material-symbols-outlined">add</span>
                        Add Ingredient
                    </button>
                </div>
            </div>

            {ingredients.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/40">
                            Ingredient List ({ingredients.length})
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {ingredients.map(ing => (
                            <div key={ing.id} className="flex items-center justify-between bg-base-100 p-4 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-[18px]">restaurant</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{ing.name}</p>
                                        <p className="text-xs text-base-content/50">{ing.qty}{ing.unit}</p>
                                    </div>
                                </div>
                                <button onClick={() => removeIngredient(ing.id)} className="btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-error">
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex flex-col items-center text-center px-6">
                        <div className="size-12 rounded-full bg-base-200 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-base-content/40">info</span>
                        </div>
                        <p className="text-xs text-base-content/50 leading-relaxed">
                            Make sure to add all essential components. You can edit quantities later in the final review step.
                        </p>
                    </div>
                </section>
            )}

            {ingredients.length === 0 && (
                <div className="mt-12 flex flex-col items-center text-center px-6">
                    <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary text-3xl">restaurant</span>
                    </div>
                    <p className="text-base-content/50 text-sm">
                        Add your first ingredient to get started!
                    </p>
                </div>
            )}
        </main>
    );

    // ─────────────────────────────────────────────
    // STEP 3: INSTRUCTIONS
    // ─────────────────────────────────────────────
    const renderStep3 = () => (
        <main className="flex-1 w-full p-4 pb-32 overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-base-content mb-2">Break down your recipe</h1>
                <p className="text-base-content/50 text-base">Add easy-to-follow steps with descriptions and optional photos.</p>
            </div>

            <div className="space-y-6">
                {instructions.map((inst, index) => {
                    return (
                        <div key={inst.id} className="card bg-base-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between bg-primary/5 px-4 py-2 border-b border-base-200">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base-content/40 cursor-grab">drag_indicator</span>
                                    <span className="font-bold text-base-content">Step {index + 1}</span>
                                </div>
                                <button onClick={() => removeInstructionStep(inst.id)} className="btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-error">
                                    <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="flex flex-col gap-4">
                                    {inst.image ? (
                                        <div className="relative w-full aspect-video rounded-lg border border-base-200 overflow-hidden">
                                            {inst.mediaType === 'video' ? (
                                                <video src={inst.image} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${inst.image}')` }} />
                                            )}
                                            <button onClick={() => removeStepImage(inst.id)} className="btn btn-circle btn-xs btn-neutral absolute top-2 right-2">
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                            {inst.mediaType === 'video' && (
                                                <div className="badge badge-neutral badge-sm absolute bottom-2 left-2 gap-1">
                                                    <span className="material-symbols-outlined text-xs">play_circle</span> VIDEO
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            className="w-full aspect-video border-2 border-dashed border-base-300 rounded-lg flex flex-col items-center justify-center text-base-content/40 hover:border-primary hover:bg-primary/5 transition-all p-4"
                                        >
                                            <span className="material-symbols-outlined text-3xl mb-1">{uploading ? 'hourglass_empty' : 'add_a_photo'}</span>
                                            <span className="text-xs font-semibold mb-3">{uploading ? 'Processing...' : 'Add Step Media'}</span>

                                            {!uploading && (
                                                <div className="flex flex-wrap justify-center gap-2">
                                                    <button
                                                        className="btn btn-xs btn-outline gap-1"
                                                        onClick={(e) => { e.stopPropagation(); stepImageRefs.current[inst.id]?.click(); }}
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">photo_library</span>
                                                        Gallery
                                                    </button>
                                                    <button
                                                        className="btn btn-xs btn-primary gap-1"
                                                        onClick={(e) => { e.stopPropagation(); stepCameraRefs.current[inst.id]?.click(); }}
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                                                        Photo
                                                    </button>
                                                    <button
                                                        className="btn btn-xs btn-secondary gap-1"
                                                        onClick={(e) => { e.stopPropagation(); stepVideoRefs.current[inst.id]?.click(); }}
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">videocam</span>
                                                        Video
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <input
                                        ref={el => { stepImageRefs.current[inst.id] = el; }}
                                        type="file"
                                        accept="image/*,video/*"
                                        className="hidden"
                                        onChange={(e) => handleStepImageUpload(inst.id, e)}
                                    />
                                    <input
                                        ref={el => { stepCameraRefs.current[inst.id] = el; }}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={(e) => handleStepImageUpload(inst.id, e)}
                                    />
                                    <input
                                        ref={el => { stepVideoRefs.current[inst.id] = el; }}
                                        type="file"
                                        accept="video/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={(e) => handleStepImageUpload(inst.id, e)}
                                    />
                                    <textarea
                                        className="textarea textarea-ghost w-full min-h-[100px] text-base leading-relaxed"
                                        placeholder="Describe this step..."
                                        value={inst.description}
                                        onChange={e => updateInstructionStep(inst.id, { description: e.target.value })}
                                    />
                                    <div className="flex items-center gap-3 pt-3 border-t border-base-200">
                                        <div className="flex items-center gap-2 text-base-content/50">
                                            <span className="material-symbols-outlined text-[20px]">timer</span>
                                            <span className="text-xs font-semibold">Step Timer (optional)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                className="input input-bordered input-xs w-16 text-center"
                                                value={inst.timer ? Math.floor(inst.timer / 60) : ''}
                                                onChange={e => {
                                                    const mins = parseInt(e.target.value);
                                                    updateInstructionStep(inst.id, { timer: isNaN(mins) ? undefined : mins * 60 });
                                                }}
                                            />
                                            <span className="text-xs text-base-content/40">min</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <button
                onClick={addInstructionStep}
                className="w-full mt-8 py-4 border-2 border-dashed border-primary rounded-xl flex items-center justify-center gap-2 text-base-content font-bold hover:bg-primary/10 transition-colors group"
            >
                <div className="size-8 aspect-square bg-primary text-primary-content rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lg leading-none">add</span>
                </div>
                Add Another Step
            </button>
        </main>
    );

    // ─────────────────────────────────────────────
    // STEP 4: REVIEW & PREVIEW
    // ─────────────────────────────────────────────
    const renderStep4 = () => (
        <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">

            <div className="p-4 space-y-6">
                {/* Hero Section */}
                <div
                    className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-3xl min-h-[380px] relative shadow-2xl ring-1 ring-base-content/5"
                    style={{
                        backgroundImage: coverImage
                            ? `linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.4) 100%), url('${coverImage}')`
                            : 'linear-gradient(135deg, #f4e225 0%, #e6d31a 100%)'
                    }}
                >
                    <div className="absolute top-4 left-4">
                        <div className="badge badge-success gap-1.5 py-3 px-4 shadow-lg border-0 backdrop-blur-md bg-success/80 text-success-content font-bold animate-pulse">
                            <span className="material-symbols-outlined text-[14px] fill-1">check_circle</span>
                            {isEditing ? 'READY TO UPDATE' : 'READY TO PUBLISH'}
                        </div>
                    </div>

                    <div className="p-6">
                        <h1 className="text-white text-3xl font-extrabold leading-tight tracking-tight drop-shadow-xl mb-2">
                            {title || 'Your Recipe Title'}
                        </h1>
                        {description && (
                            <p className="text-white/80 text-sm leading-relaxed line-clamp-2 mb-6 max-w-[90%] font-medium">
                                {description}
                            </p>
                        )}

                        {/* Glassmorphic Stats Bar */}
                        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                            <div className="flex flex-col items-center py-2 border-r border-white/10">
                                <span className="material-symbols-outlined text-primary text-[20px] mb-0.5">timer</span>
                                <span className="text-white text-xs font-bold">{prepTime || '0'}m</span>
                                <span className="text-white/40 text-[9px] uppercase font-bold tracking-widest">Time</span>
                            </div>
                            <div className="flex flex-col items-center py-2 border-r border-white/10">
                                <span className="material-symbols-outlined text-primary text-[20px] mb-0.5">bar_chart</span>
                                <span className="text-white text-xs font-bold">{difficulty}</span>
                                <span className="text-white/40 text-[9px] uppercase font-bold tracking-widest">Level</span>
                            </div>
                            <div className="flex flex-col items-center py-2">
                                <span className="material-symbols-outlined text-primary text-[20px] mb-0.5">group</span>
                                <span className="text-white text-xs font-bold">{serves || '0'}</span>
                                <span className="text-white/40 text-[9px] uppercase font-bold tracking-widest">Serves</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ingredients Section */}
                {ingredients.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[20px] fill-1">shopping_basket</span>
                            </div>
                            <h2 className="text-lg font-bold tracking-tight">Ingredients</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5">
                            {ingredients.map(ing => (
                                <div key={ing.id} className="flex items-center gap-3 p-4 rounded-2xl bg-base-100 border border-base-200 shadow-sm transition-all hover:border-primary/30">
                                    <div className="flex-1">
                                        <p className="text-base font-bold text-base-content leading-tight">{ing.name}</p>
                                        <p className="text-xs font-semibold text-base-content/40 mt-0.5">{ing.qty} {ing.unit}</p>
                                    </div>
                                    <div className="size-6 rounded-full border-2 border-primary/20 flex items-center justify-center">
                                        <div className="size-3 rounded-full bg-primary/20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Instructions Section */}
                {instructions.filter(s => s.description.trim()).length > 0 && (
                    <div className="space-y-6 pb-12">
                        <div className="flex items-center gap-2 px-2">
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[20px] fill-1">restaurant_menu</span>
                            </div>
                            <h2 className="text-lg font-bold tracking-tight">Instructions</h2>
                        </div>
                        <div className="space-y-8 relative before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-base-300">
                            {instructions.filter(s => s.description.trim()).map((inst, idx) => (
                                <div key={inst.id} className="relative pl-12 flex flex-col gap-4">
                                    {/* Number Circle */}
                                    <div className="absolute left-0 top-0 size-9 rounded-full bg-primary text-primary-content flex items-center justify-center font-black text-sm shadow-xl ring-4 ring-base-200 z-10 transition-transform hover:scale-110">
                                        {idx + 1}
                                    </div>

                                    <div className="card bg-base-100 border border-base-200 shadow-md overflow-hidden rounded-2xl hover:shadow-lg transition-all group">
                                        {inst.image && (
                                            <div className="relative aspect-video overflow-hidden">
                                                {inst.mediaType === 'video' ? (
                                                    <video src={inst.image} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                ) : (
                                                    <img src={inst.image} alt={`Step ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                )}
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                    {inst.mediaType === 'video' && (
                                                        <div className="badge badge-neutral gap-1 border-0 bg-black/60 backdrop-blur-md">
                                                            <span className="material-symbols-outlined text-xs">play_circle</span> VIDEO
                                                        </div>
                                                    )}
                                                    {inst.timer && (
                                                        <div className="badge badge-primary gap-1 border-0 shadow-lg">
                                                            <span className="material-symbols-outlined text-xs">timer</span> {Math.floor(inst.timer / 60)}m
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-4 px-5">
                                            <p className="text-base-content/70 leading-relaxed text-base font-medium">
                                                {inst.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const stepLabels = ['Basic Info', 'Ingredients', 'Instructions', 'Review & Preview'];

    return (
        <div className="flex flex-col min-h-screen bg-base-200">
            {/* Premium Header */}
            <div className={`sticky top-0 z-20 transition-all duration-300 ${step === 4 ? 'bg-success/5 shadow-lg' : 'bg-base-100/95 backdrop-blur-md'} border-b border-base-200`}>
                <div className="max-w-md mx-auto p-4 pt-2">
                    {/* Sheet Handle Vibe */}
                    <div className="flex justify-center mb-2">
                        <div className="h-1 w-10 rounded-full bg-base-300" />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={step === 1 ? onBack : prevStep}
                            className="btn btn-ghost btn-circle btn-sm -ml-2"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div className="flex-1 px-3">
                            <div className="flex items-center gap-3">
                                <div className={`size-12 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-500 ${step === 4 ? 'border-success bg-success/10 text-success' : 'border-primary bg-primary/10 text-primary'}`}>
                                    {step === 4 ? (
                                        <span className="material-symbols-outlined text-[20px] fill-icon">check</span>
                                    ) : (
                                        <span className="text-[11px]">{progressPercent}%</span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-none mb-1">Recipe Progress</h2>
                                    <p className="text-xs text-base-content/50 font-medium tracking-wide">
                                        Step {step} of 4: {stepLabels[step - 1]}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {step === 4 ? (
                            <div className="success-animate bg-success text-success-content px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                <span className="material-symbols-outlined text-[18px] fill-1">check_circle</span>
                                <span className="text-xs font-bold uppercase tracking-wider">Done!</span>
                            </div>
                        ) : (
                            <div className="badge badge-neutral badge-sm opacity-50">Draft</div>
                        )}
                    </div>
                    <div className="relative h-1.5 w-full bg-base-300 rounded-full overflow-hidden">
                        <div
                            className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out rounded-full ${step === 4 ? 'bg-success' : 'bg-primary'}`}
                            style={{ width: `${progressPercent}%` }}
                        />
                        {step === 4 && (
                            <div className="absolute top-0 left-0 h-full w-full bg-success opacity-20" />
                        )}
                    </div>
                </div>
            </div>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-base-100/80 backdrop-blur-md border-t border-base-200 p-4 z-30">
                {step === 1 ? (
                    <button onClick={nextStep} className="btn btn-primary w-full btn-lg gap-2 shadow-lg">
                        Next: Ingredients
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                ) : (
                    <div className="flex gap-4">
                        <button onClick={prevStep} className="btn btn-outline flex-1 btn-lg gap-1">
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                            Back
                        </button>
                        {step < 4 ? (
                            <button onClick={nextStep} className="btn btn-primary flex-[2] btn-lg gap-1 shadow-lg">
                                {step === 2 ? 'Next: Instructions' : 'Next: Review'}
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        ) : (
                            <button onClick={handlePublish} className="btn btn-primary flex-[2] btn-lg gap-2 shadow-lg">
                                <span className="material-symbols-outlined text-[20px]">{isEditing ? 'save' : 'publish'}</span>
                                {isEditing ? 'Update Recipe' : 'Publish Recipe'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublishRecipeScreen;
