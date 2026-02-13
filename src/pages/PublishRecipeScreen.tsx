
import React, { useState, useRef } from 'react';

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

const PublishRecipeScreen: React.FC<PublishRecipeScreenProps> = ({ onBack, onPublish }) => {
    const [step, setStep] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stepImageRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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

    const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setCoverImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleStepImageUpload = (stepId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const isVideo = file.type.startsWith('video/');
            const reader = new FileReader();
            reader.onloadend = () => {
                setInstructions(prev => prev.map(s =>
                    s.id === stepId ? { ...s, image: reader.result as string, mediaType: isVideo ? 'video' : 'image' } : s
                ));
            };
            reader.readAsDataURL(file);
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
        onPublish?.({
            title, description, coverImage, prepTime, serves, difficulty, ingredients, instructions,
        });
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
                                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-base-content text-lg font-bold">Add Cover Photo</p>
                                <p className="text-base-content/50 text-sm text-center">Great photos get 5x more views!</p>
                            </div>
                            <button className="btn btn-outline btn-sm">Upload image</button>
                        </>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
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
                {instructions.map((inst, index) => (
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
                                        className="w-full aspect-video border-2 border-dashed border-base-300 rounded-lg flex flex-col items-center justify-center text-base-content/40 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                                        onClick={() => stepImageRefs.current[inst.id]?.click()}
                                    >
                                        <span className="material-symbols-outlined text-3xl mb-1">add_a_photo</span>
                                        <span className="text-xs font-medium">Add Photo or Short Video</span>
                                    </div>
                                )}
                                <input
                                    ref={el => { stepImageRefs.current[inst.id] = el; }}
                                    type="file"
                                    accept="image/*,video/mp4,video/webm,video/quicktime"
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
                ))}
            </div>

            <button
                onClick={addInstructionStep}
                className="w-full mt-8 py-4 border-2 border-dashed border-primary rounded-xl flex items-center justify-center gap-2 text-base-content font-bold hover:bg-primary/10 transition-colors group"
            >
                <div className="bg-primary text-primary-content p-1 rounded-full group-hover:scale-110 transition-transform">
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
        <div className="flex-1 overflow-y-auto pb-32">
            <div className="p-4">
                <div
                    className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-xl min-h-[350px] relative"
                    style={{
                        backgroundImage: coverImage
                            ? `linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%), url('${coverImage}')`
                            : 'linear-gradient(135deg, #f4e225 0%, #e6d31a 100%)'
                    }}
                >
                    <div className="p-6">
                        <div className="badge badge-primary badge-sm mb-2">PREVIEW MODE</div>
                        <h1 className="text-white text-3xl font-bold leading-tight drop-shadow-md">
                            {title || 'Your Recipe Title'}
                        </h1>
                        {description && (
                            <p className="text-white/80 text-sm mt-1">{description}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-3 px-4 py-2 flex-wrap">
                {prepTime && (
                    <div className="badge badge-lg badge-primary badge-outline gap-1">
                        <span className="material-symbols-outlined text-sm">timer</span>
                        {prepTime} mins
                    </div>
                )}
                <div className="badge badge-lg badge-primary badge-outline gap-1">
                    <span className="material-symbols-outlined text-sm">bar_chart</span>
                    {difficulty}
                </div>
                {serves && (
                    <div className="badge badge-lg badge-primary badge-outline gap-1">
                        <span className="material-symbols-outlined text-sm">group</span>
                        {serves} Servings
                    </div>
                )}
            </div>

            <div className="p-4 space-y-6">
                {ingredients.length > 0 && (
                    <div className="card bg-base-200">
                        <div className="card-body p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-primary">shopping_basket</span>
                                <h2 className="text-xl font-bold">Ingredients</h2>
                            </div>
                            <div className="space-y-1">
                                {ingredients.map(ing => (
                                    <label key={ing.id} className="flex gap-x-3 py-2.5 border-b border-base-300 last:border-0 items-center">
                                        <input checked disabled className="checkbox checkbox-primary checkbox-sm" type="checkbox" />
                                        <p className="text-base-content text-base">{ing.qty}{ing.unit} {ing.name}</p>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {instructions.filter(s => s.description.trim()).length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-primary">restaurant_menu</span>
                            <h2 className="text-xl font-bold">Instructions</h2>
                        </div>
                        <ul className="steps steps-vertical w-full">
                            {instructions.filter(s => s.description.trim()).map((inst, idx) => (
                                <li key={inst.id} className="step step-primary" data-content={idx + 1}>
                                    <div className="flex flex-col sm:flex-row gap-4 text-left ml-2">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg mb-1">Step {idx + 1}</h3>
                                            <p className="text-base-content/70 leading-relaxed mb-2">{inst.description}</p>
                                            {inst.timer && (
                                                <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider">
                                                    <span className="material-symbols-outlined text-[16px]">timer</span>
                                                    <span>{Math.floor(inst.timer / 60)} Minute Timer</span>
                                                </div>
                                            )}
                                        </div>
                                        {inst.image && (
                                            <div className="w-full sm:w-32 h-32 shrink-0 overflow-hidden rounded-lg bg-base-200">
                                                {inst.mediaType === 'video' ? (
                                                    <video src={inst.image} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={inst.image} alt={`Step ${idx + 1}`} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );

    const stepLabels = ['Basic Info', 'Ingredients', 'Instructions', 'Review & Preview'];

    return (
        <div className="flex flex-col min-h-screen bg-base-200">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200">
                <div className="flex items-center p-4 pb-2 justify-between">
                    <button
                        onClick={step === 1 ? onBack : prevStep}
                        className="btn btn-ghost btn-circle btn-sm"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center text-base-content">
                        {step === 4 ? 'Review & Preview' : `Step ${step} of 4: ${stepLabels[step - 1]}`}
                    </h2>
                    <div className="size-10" />
                </div>
                <div className="flex flex-col gap-2 px-4 pb-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold uppercase tracking-wider text-base-content/40">
                            {stepLabels[step - 1]}
                        </span>
                        <span className="text-sm font-bold text-base-content">{progressPercent}%</span>
                    </div>
                    <progress className="progress progress-primary w-full" value={progressPercent} max="100"></progress>
                </div>
            </div>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-base-100/80 backdrop-blur-md border-t border-base-200 p-4 z-30">
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
                                <span className="material-symbols-outlined text-[20px]">publish</span>
                                Publish Recipe
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublishRecipeScreen;
