
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

    // Step 1: Basic Info
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [prepTime, setPrepTime] = useState('');
    const [serves, setServes] = useState('');
    const [difficulty, setDifficulty] = useState('Easy');

    // Step 2: Ingredients
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [newIngName, setNewIngName] = useState('');
    const [newIngQty, setNewIngQty] = useState('');
    const [newIngUnit, setNewIngUnit] = useState('g');

    // Step 3: Instructions
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
            const reader = new FileReader();
            reader.onloadend = () => {
                setInstructions(prev => prev.map(s =>
                    s.id === stepId ? { ...s, image: reader.result as string } : s
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

    const updateInstructionStep = (id: string, desc: string) => {
        setInstructions(prev => prev.map(s =>
            s.id === id ? { ...s, description: desc } : s
        ));
    };

    const removeStepImage = (stepId: string) => {
        setInstructions(prev => prev.map(s =>
            s.id === stepId ? { ...s, image: null } : s
        ));
    };

    const handlePublish = () => {
        onPublish?.({
            title,
            description,
            coverImage,
            prepTime,
            serves,
            difficulty,
            ingredients,
            instructions,
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
            {/* Upload Cover Photo */}
            <div className="p-4">
                <div
                    className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-primary/40 dark:border-primary/20 bg-primary/5 dark:bg-primary/5 px-6 py-10 transition-colors hover:bg-primary/10 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {coverImage ? (
                        <div className="w-full aspect-video rounded-lg overflow-hidden relative">
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                            <button
                                onClick={(e) => { e.stopPropagation(); setCoverImage(null); }}
                                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 backdrop-blur-sm hover:bg-black/70"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex size-16 items-center justify-center rounded-full bg-primary text-[#181711]">
                                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-[#181711] dark:text-white text-lg font-bold tracking-tight">Add Cover Photo</p>
                                <p className="text-gray-600 dark:text-gray-400 text-sm text-center">Great photos get 5x more views!</p>
                            </div>
                            <button className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-11 px-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[#181711] dark:text-white text-sm font-bold shadow-sm active:scale-95 transition-transform">
                                <span>Upload image</span>
                            </button>
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

            {/* Recipe Name */}
            <div className="px-4 py-3">
                <label className="flex flex-col gap-2">
                    <span className="text-[#181711] dark:text-white text-base font-semibold">What's your dish called?</span>
                    <input
                        className="form-input w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder="e.g. Grandma's Famous Lasagna"
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </label>
            </div>

            {/* Short Description */}
            <div className="px-4 py-3">
                <label className="flex flex-col gap-2">
                    <span className="text-[#181711] dark:text-white text-base font-semibold">Give us a tasty summary</span>
                    <textarea
                        className="form-textarea w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-base min-h-[100px] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder="Tell us what makes this recipe special..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </label>
            </div>

            {/* Cooking Essentials */}
            <div className="px-4 py-4">
                <h3 className="text-[#181711] dark:text-white text-base font-semibold mb-3">Cooking Essentials</h3>
                <div className="grid grid-cols-3 gap-3">
                    {/* Prep Time */}
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3">
                        <span className="material-symbols-outlined text-primary">schedule</span>
                        <div className="text-center">
                            <input
                                className="w-full bg-transparent border-none p-0 text-center font-bold text-[#181711] dark:text-white focus:ring-0 placeholder:font-normal"
                                placeholder="0"
                                type="number"
                                value={prepTime}
                                onChange={e => setPrepTime(e.target.value)}
                            />
                            <p className="text-[10px] uppercase font-bold text-gray-400">Mins</p>
                        </div>
                    </div>
                    {/* Serves */}
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3">
                        <span className="material-symbols-outlined text-primary">group</span>
                        <div className="text-center">
                            <input
                                className="w-full bg-transparent border-none p-0 text-center font-bold text-[#181711] dark:text-white focus:ring-0 placeholder:font-normal"
                                placeholder="0"
                                type="number"
                                value={serves}
                                onChange={e => setServes(e.target.value)}
                            />
                            <p className="text-[10px] uppercase font-bold text-gray-400">Serves</p>
                        </div>
                    </div>
                    {/* Difficulty */}
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3">
                        <span className="material-symbols-outlined text-primary">bar_chart</span>
                        <div className="text-center">
                            <select
                                className="w-full bg-transparent border-none p-0 text-center font-bold text-[#181711] dark:text-white focus:ring-0 appearance-none text-xs"
                                value={difficulty}
                                onChange={e => setDifficulty(e.target.value)}
                            >
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                            </select>
                            <p className="text-[10px] uppercase font-bold text-gray-400">Level</p>
                        </div>
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
            {/* Add Ingredient Section */}
            <section className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
                <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">add_circle</span>
                    Add Ingredient
                </h2>
                <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-3">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Qty</label>
                        <input
                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-primary focus:border-primary text-sm p-2.5"
                            placeholder="0"
                            type="number"
                            value={newIngQty}
                            onChange={e => setNewIngQty(e.target.value)}
                        />
                    </div>
                    <div className="col-span-4">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Unit</label>
                        <select
                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-primary focus:border-primary text-sm p-2.5"
                            value={newIngUnit}
                            onChange={e => setNewIngUnit(e.target.value)}
                        >
                            {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="col-span-5">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Ingredient</label>
                        <input
                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-primary focus:border-primary text-sm p-2.5"
                            placeholder="e.g. Flour"
                            type="text"
                            value={newIngName}
                            onChange={e => setNewIngName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addIngredient()}
                        />
                    </div>
                </div>
                <button
                    onClick={addIngredient}
                    className="w-full mt-4 bg-primary hover:bg-yellow-400 text-slate-900 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined">add</span>
                    Add Ingredient
                </button>
            </section>

            {/* Added Ingredients List */}
            {ingredients.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Ingredient List ({ingredients.length})
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {ingredients.map(ing => (
                            <div key={ing.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-[18px]">restaurant</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{ing.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{ing.qty}{ing.unit}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeIngredient(ing.id)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Hint */}
                    <div className="mt-8 flex flex-col items-center text-center px-6">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-slate-400">info</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Make sure to add all essential components. You can edit quantities later in the final review step.
                        </p>
                    </div>
                </section>
            )}

            {ingredients.length === 0 && (
                <div className="mt-12 flex flex-col items-center text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary text-3xl">restaurant</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
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
                <h1 className="text-3xl font-bold tracking-tight text-[#181711] dark:text-white mb-2">Break down your recipe</h1>
                <p className="text-[#8a8760] dark:text-slate-400 text-base">Add easy-to-follow steps with descriptions and optional photos to help others cook your masterpiece.</p>
            </div>

            {/* Instructions List */}
            <div className="space-y-6">
                {instructions.map((inst, index) => (
                    <div
                        key={inst.id}
                        className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[#e6e5db] dark:border-slate-800 overflow-hidden"
                    >
                        {/* Step Header */}
                        <div className="flex items-center justify-between bg-primary/5 dark:bg-primary/10 px-4 py-2 border-b border-[#e6e5db] dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#8a8760] dark:text-slate-500 cursor-grab">drag_indicator</span>
                                <span className="font-bold text-[#181711] dark:text-white">Step {index + 1}</span>
                            </div>
                            <button
                                onClick={() => removeInstructionStep(inst.id)}
                                className="text-[#8a8760] dark:text-slate-500 hover:text-red-500 transition-colors"
                            >
                                <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                        </div>

                        {/* Step Content */}
                        <div className="p-4">
                            <div className="flex flex-col gap-4">
                                {/* Step Image Area */}
                                {inst.image ? (
                                    <div
                                        className="relative w-full aspect-video bg-cover bg-center rounded-lg border border-[#e6e5db] dark:border-slate-700"
                                        style={{ backgroundImage: `url('${inst.image}')` }}
                                    >
                                        <button
                                            onClick={() => removeStepImage(inst.id)}
                                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 backdrop-blur-sm hover:bg-black/70"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        className="w-full aspect-video border-2 border-dashed border-[#e6e5db] dark:border-slate-700 rounded-lg flex flex-col items-center justify-center text-[#8a8760] dark:text-slate-500 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                                        onClick={() => stepImageRefs.current[inst.id]?.click()}
                                    >
                                        <span className="material-symbols-outlined text-3xl mb-1">add_a_photo</span>
                                        <span className="text-xs font-medium">Add Photo</span>
                                    </div>
                                )}
                                <input
                                    ref={el => { stepImageRefs.current[inst.id] = el; }}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleStepImageUpload(inst.id, e)}
                                />

                                {/* Step Description */}
                                <textarea
                                    className="w-full min-h-[100px] border-0 focus:ring-0 p-0 text-[#181711] dark:text-white dark:bg-transparent placeholder:text-[#8a8760] dark:placeholder:text-slate-500 resize-none text-base leading-relaxed"
                                    placeholder="Describe this step..."
                                    value={inst.description}
                                    onChange={e => updateInstructionStep(inst.id, e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Step Button */}
            <button
                onClick={addInstructionStep}
                className="w-full mt-8 py-4 border-2 border-dashed border-primary rounded-xl flex items-center justify-center gap-2 text-[#181711] dark:text-white font-bold hover:bg-primary/10 transition-colors group"
            >
                <div className="bg-primary p-1 rounded-full group-hover:scale-110 transition-transform">
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
            {/* Hero Section */}
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
                        <span className="bg-primary text-[#181711] text-xs font-bold px-2 py-1 rounded mb-2 inline-block">PREVIEW MODE</span>
                        <h1 className="text-white text-3xl font-bold leading-tight drop-shadow-md">
                            {title || 'Your Recipe Title'}
                        </h1>
                        {description && (
                            <p className="text-white/80 text-sm mt-1">{description}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Info Chips */}
            <div className="flex gap-3 px-4 py-2 flex-wrap">
                {prepTime && (
                    <div className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20 pl-3 pr-4">
                        <span className="material-symbols-outlined text-[#181711] dark:text-primary text-[20px]">timer</span>
                        <p className="text-[#181711] dark:text-primary text-sm font-semibold leading-normal">{prepTime} mins</p>
                    </div>
                )}
                <div className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20 pl-3 pr-4">
                    <span className="material-symbols-outlined text-[#181711] dark:text-primary text-[20px]">bar_chart</span>
                    <p className="text-[#181711] dark:text-primary text-sm font-semibold leading-normal">{difficulty}</p>
                </div>
                {serves && (
                    <div className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20 pl-3 pr-4">
                        <span className="material-symbols-outlined text-[#181711] dark:text-primary text-[20px]">group</span>
                        <p className="text-[#181711] dark:text-primary text-sm font-semibold leading-normal">{serves} Servings</p>
                    </div>
                )}
            </div>

            <div className="p-4 space-y-6">
                {/* Ingredients Section */}
                {ingredients.length > 0 && (
                    <div className="bg-[#f5f4f0] dark:bg-slate-900 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary">shopping_basket</span>
                            <h2 className="text-[#181711] dark:text-white text-xl font-bold leading-tight">Ingredients</h2>
                        </div>
                        <div className="space-y-1">
                            {ingredients.map(ing => (
                                <label key={ing.id} className="flex gap-x-3 py-2.5 border-b border-[#e6e5db] dark:border-slate-700 last:border-0 flex-row items-center">
                                    <input
                                        checked
                                        disabled
                                        className="h-5 w-5 rounded border-[#e6e5db] border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0"
                                        type="checkbox"
                                    />
                                    <p className="text-[#181711] dark:text-white text-base font-normal leading-normal">
                                        {ing.qty}{ing.unit} {ing.name}
                                    </p>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Instructions Section */}
                {instructions.filter(s => s.description.trim()).length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-primary">restaurant_menu</span>
                            <h2 className="text-[#181711] dark:text-white text-xl font-bold leading-tight">Instructions</h2>
                        </div>
                        <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-primary/20">
                            {instructions.filter(s => s.description.trim()).map((inst, idx) => (
                                <div key={inst.id} className="relative pl-12">
                                    <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-[#181711] z-10 shadow-sm">
                                        {idx + 1}
                                    </div>
                                    <p className="text-[#181711]/70 dark:text-white/70 leading-relaxed">{inst.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // ─────────────────────────────────────────────
    // TOP APP BAR (shared)
    // ─────────────────────────────────────────────
    const stepLabels = ['Basic Info', 'Ingredients', 'Instructions', 'Review & Preview'];

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center p-4 pb-2 justify-between">
                    <button
                        onClick={step === 1 ? onBack : prevStep}
                        className="text-[#181711] dark:text-primary flex size-10 shrink-0 items-center justify-center cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-[#181711] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
                        {step === 4 ? 'Review & Preview' : `Step ${step} of 4: ${stepLabels[step - 1]}`}
                    </h2>
                    <div className="size-10" /> {/* Spacer */}
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col gap-2 px-4 pb-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold uppercase tracking-wider text-[#8a8760] dark:text-slate-400">
                            {stepLabels[step - 1]}
                        </span>
                        <span className="text-sm font-bold text-[#181711] dark:text-white">{progressPercent}%</span>
                    </div>
                    <div className="rounded-full bg-gray-100 dark:bg-gray-800 h-2 w-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 p-4 z-30">
                {step === 1 ? (
                    <button
                        onClick={nextStep}
                        className="flex w-full items-center justify-center gap-2 rounded-xl h-14 bg-primary text-[#181711] text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all"
                    >
                        <span>Next: Ingredients</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                ) : (
                    <div className="flex gap-4">
                        <button
                            onClick={prevStep}
                            className="flex-1 flex items-center justify-center gap-2 h-14 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                            Back
                        </button>
                        {step < 4 ? (
                            <button
                                onClick={nextStep}
                                className="flex-[2] flex items-center justify-center gap-2 h-14 rounded-xl bg-primary text-[#181711] font-bold shadow-lg shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all"
                            >
                                {step === 2 ? 'Next: Instructions' : 'Next: Review'}
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        ) : (
                            <button
                                onClick={handlePublish}
                                className="flex-[2] flex items-center justify-center gap-2 h-14 rounded-xl bg-primary text-[#181711] font-bold shadow-lg shadow-primary/20 hover:bg-[#ebd91a] active:scale-[0.98] transition-all"
                            >
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
