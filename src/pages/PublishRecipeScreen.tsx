
import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { uploadOptimizedImage, UploadProgress } from '@/lib/storage';
import { videoToGif } from '@/lib/videoToGif';
import { compressVideo, shouldCompressVideo, formatFileSize } from '@/lib/videoCompression';
import LoadingAnimation from '@/components/LoadingAnimation';
import { Recipe } from '@/types';
import { CATEGORIES } from '@/data/constants';

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
    onPublish?: (data: RecipeFormData) => Promise<void>;
    onUpdate?: (id: string, data: RecipeFormData) => Promise<void>;
    onSaveDraft?: (data: RecipeFormData) => Promise<void>;
    onSuccess?: () => void;
    editingRecipe?: Recipe | null;
}

export interface RecipeFormData {
    title: string;
    description: string;
    coverImages: string[];
    prepTime: string;
    serves: string;
    difficulty: string;
    category: string;
    ingredients: Ingredient[];
    instructions: InstructionStep[];
}

const UNITS = ['g', 'kg', 'ml', 'tsp', 'tbsp', 'cup', 'pcs'];

const PublishRecipeScreen: React.FC<PublishRecipeScreenProps> = ({
    onBack,
    onPublish,
    onUpdate,
    onSaveDraft,
    onSuccess,
    editingRecipe
}) => {
    const isEditing = !!editingRecipe;
    const [step, setStep] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const stepImageRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const stepCameraRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const stepVideoRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [coverImages, setCoverImages] = useState<string[]>([]);
    const [prepTime, setPrepTime] = useState('');
    const [serves, setServes] = useState('');
    const [difficulty, setDifficulty] = useState('Easy');
    const [category, setCategory] = useState('breakfast');

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
            setDescription(editingRecipe.description || '');
            setCoverImages(editingRecipe.images && editingRecipe.images.length > 0 ? editingRecipe.images : (editingRecipe.image ? [editingRecipe.image] : []));
            setPrepTime(editingRecipe.prepTime?.replace(/[^0-9]/g, '') || '');
            setServes(editingRecipe.serves || '');
            setDifficulty(editingRecipe.level || 'Easy');
            setCategory(editingRecipe.category || 'breakfast');

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
    const [isPublishing, setIsPublishing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [mediaErrors, setMediaErrors] = useState<{ [key: number]: boolean }>({});
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [compressionStatus, setCompressionStatus] = useState<string>('');
    const [showExitModal, setShowExitModal] = useState(false);

    // Helper function to detect if URL is likely a video
    const isVideoUrl = (url: string): boolean => {
        const videoExtensions = /\.(mp4|webm|ogg|mov|m4v|avi|wmv|flv|mkv)(\?|$)/i;
        const videoIndicators = ['video', 'stream', 'youtube', 'vimeo', 'dailymotion'];

        return videoExtensions.test(url) || videoIndicators.some(indicator => url.toLowerCase().includes(indicator));
    };

    const handleMediaError = (index: number) => {
        setMediaErrors(prev => ({ ...prev, [index]: true }));
    };

    const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const remainingSlots = 10 - coverImages.length;
        if (remainingSlots <= 0) {
            alert('Maximum 10 media files allowed');
            return;
        }

        const filesToUpload = files.slice(0, remainingSlots);
        setUploading(true);
        setUploadProgress(0);

        try {
            const urls: string[] = [];

            for (let i = 0; i < filesToUpload.length; i++) {
                let file = filesToUpload[i];
                const isVideo = file.type.startsWith('video/');

                // Compress video if needed
                if (isVideo && shouldCompressVideo(file)) {
                    const originalSize = formatFileSize(file.size);
                    setCompressionStatus(`Compressing video (${originalSize})...`);

                    try {
                        const compressedFile = await compressVideo(file, {
                            maxWidthOrHeight: 1280,
                            quality: 0.8,
                        });

                        const newSize = formatFileSize(compressedFile.size);
                        const saved = formatFileSize(file.size - compressedFile.size);
                        setCompressionStatus(`Compressed! Saved ${saved} (${originalSize} → ${newSize})`);

                        file = compressedFile;

                        // Show compression result briefly
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    } catch (compressionErr) {
                        console.warn('Compression failed, uploading original:', compressionErr);
                        setCompressionStatus('Using original video...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

                setCompressionStatus('');

                // Upload with optimization and progress
                const { url } = await uploadOptimizedImage(file as File, 'covers', (progress) => {
                    const totalProgress = ((i + progress.percentage / 100) / filesToUpload.length) * 100;
                    setUploadProgress(Math.round(totalProgress));
                });

                urls.push(url);
            }

            setCoverImages(prev => [...prev, ...urls]);
            setUploadProgress(100);
        } catch (err) {
            console.error('Upload failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Upload failed';
            alert(`Upload Error: ${errorMessage}. Please check your connection and try again.`);
        } finally {
            setUploading(false);
            setUploadProgress(0);
            setCompressionStatus('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    };

    const removeCoverImage = (index: number) => {
        setCoverImages(prev => prev.filter((_, i) => i !== index));
        // Clean up error state
        setMediaErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[index];
            // Reindex remaining errors
            const reindexed: { [key: number]: boolean } = {};
            Object.keys(newErrors).forEach(key => {
                const idx = parseInt(key);
                if (idx > index) {
                    reindexed[idx - 1] = newErrors[idx];
                } else {
                    reindexed[idx] = newErrors[idx];
                }
            });
            return reindexed;
        });
    };

    const setAsMain = (index: number) => {
        setCoverImages(prev => {
            const newImages = [...prev];
            const [selected] = newImages.splice(index, 1);
            return [selected, ...newImages];
        });
    };

    const handleStepImageUpload = async (stepId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const isVideo = file.type.startsWith('video/');
        setUploading(true);
        setUploadProgress(0);

        try {
            let fileToUpload = file;

            // Compress video if needed
            if (isVideo && shouldCompressVideo(file)) {
                setCompressionStatus('Compressing video...');
                try {
                    const compressedFile = await compressVideo(file, {
                        maxWidthOrHeight: 1280,
                        quality: 0.8,
                    });
                    fileToUpload = compressedFile;
                    setCompressionStatus('Compression complete!');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (compressionErr) {
                    console.warn('Compression failed, uploading original:', compressionErr);
                    setCompressionStatus('Using original video...');
                    await new Promise(resolve => setTimeout(resolve, 800));
                }
            } else if (isVideo) {
                // Convert smaller videos to GIF
                fileToUpload = await videoToGif(file);
            }

            setCompressionStatus('');

            // Upload with optimization
            const { url } = await uploadOptimizedImage(fileToUpload, 'steps', (progress) => {
                setUploadProgress(progress.percentage);
            });

            setInstructions(prev => prev.map(s =>
                s.id === stepId ? { ...s, image: url, mediaType: isVideo ? 'video' : 'image' } : s
            ));
        } catch (err) {
            console.error('Upload failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Upload failed';
            alert(`Upload Error: ${errorMessage}. Please try again.`);
        } finally {
            setUploading(false);
            setUploadProgress(0);
            setCompressionStatus('');
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

    const handleStepVideoUrl = (stepId: string, url: string) => {
        setInstructions(prev => prev.map(s =>
            s.id === stepId ? { ...s, image: url, mediaType: 'video' } : s
        ));
    };

    const moveInstructionStep = (id: string, dir: 'up' | 'down') => {
        const index = instructions.findIndex(s => s.id === id);
        if (index === -1) return;
        if (dir === 'up' && index === 0) return;
        if (dir === 'down' && index === instructions.length - 1) return;

        const newIndex = dir === 'up' ? index - 1 : index + 1;
        const newInstructions = [...instructions];
        const [removed] = newInstructions.splice(index, 1);
        newInstructions.splice(newIndex, 0, removed);
        setInstructions(newInstructions);
    };

    const removeStepImage = (stepId: string) => {
        setInstructions(prev => prev.map(s =>
            s.id === stepId ? { ...s, image: null } : s
        ));
    };

    const handleSaveDraftAndExit = async () => {
        const data = {
            title,
            description,
            coverImages,
            prepTime,
            serves,
            difficulty,
            category,
            ingredients,
            instructions
        };

        const finalData = {
            ...data,
            image: coverImages[0] || '',
            images: coverImages,
            rating: editingRecipe?.rating || 0,
            reviews: editingRecipe?.reviews || 0,
        } as any;

        setIsPublishing(true);
        try {
            if (onSaveDraft) {
                await onSaveDraft(finalData);
            }
            setIsSuccess(true);
            // Brief delay to show success state
            await new Promise(resolve => setTimeout(resolve, 1500));
            onBack();
        } catch (err) {
            console.error('Saving draft failed:', err);
            alert('Failed to save draft. Please try again.');
        } finally {
            setIsPublishing(false);
            setIsSuccess(false);
            setShowExitModal(false);
        }
    };

    const isFormDirty = () => {
        if (isEditing && editingRecipe) {
            // Check for changes relative to editingRecipe
            // Simplified check for now: just see if anything is filled
            return true; // If we're editing, we usually want confirmation if they click back
        }
        return title.trim().length > 0 ||
            description.trim().length > 0 ||
            coverImages.length > 0 ||
            ingredients.length > 0 ||
            (instructions.length > 1 || (instructions.length === 1 && instructions[0].description.trim().length > 0));
    };

    const handleBackWithSafety = () => {
        if (isFormDirty()) {
            setShowExitModal(true);
        } else {
            onBack();
        }
    };

    const handlePublish = async () => {
        const data = {
            title,
            description,
            coverImages,
            prepTime,
            serves,
            difficulty,
            category,
            ingredients,
            instructions
        };

        // Prepare data for API (mapping coverImages array to image string for compatibility)
        const finalData = {
            ...data,
            image: coverImages[0] || '',
            images: coverImages,
            rating: editingRecipe?.rating || 0,
            reviews: editingRecipe?.reviews || 0,
        } as any;

        const isTempDraft = editingRecipe?.id.startsWith('temp-');

        setIsPublishing(true);
        try {
            if (isTempDraft && onSaveDraft) {
                await onSaveDraft(finalData);
            } else if (isEditing && editingRecipe && !isTempDraft) {
                await onUpdate?.(editingRecipe.id, finalData);
            } else {
                await onPublish?.(finalData);
            }
            setIsSuccess(true);
            // Brief delay to show success state before App.tsx navigation kicks in (if it hasn't already)
            // Note: App.tsx navigates at the end of its handlers, so we need to be careful.
            await new Promise(resolve => setTimeout(resolve, 1500));
            if (onSuccess) onSuccess();
            else onBack();
        } catch (err) {
            console.error('Publishing failed:', err);
            alert('Failed to publish recipe. Please try again.');
        } finally {
            setIsPublishing(false);
            setIsSuccess(false);
        }
    };

    const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
    const progressPercent = step === 4 ? 100 : Math.round((step - 1) * 33.33);

    // ─────────────────────────────────────────────
    // STEP 1: BASIC INFO
    // ─────────────────────────────────────────────
    const renderStep1 = () => (
        <div className="flex-1 overflow-y-auto pb-24">
            <div className="p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h3 className="text-sm font-medium text-base-content/70">Cover Media</h3>
                        <p className="text-[11px] text-base-content/40">{coverImages.length}/10</p>
                    </div>

                    {/* Horizontal Gallery */}
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                        {coverImages.map((src, idx) => {
                            const isVideo = isVideoUrl(src);
                            const hasError = mediaErrors[idx];

                            return (
                                <div key={idx} className="relative flex-none w-48 aspect-video rounded-2xl overflow-hidden shadow-md group border border-base-200">
                                    {hasError ? (
                                        // Error state - show placeholder
                                        <div className="w-full h-full bg-gradient-to-br from-base-200 to-base-300 flex flex-col items-center justify-center gap-2">
                                            <div className="size-12 rounded-full bg-base-content/10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-2xl text-base-content/40">
                                                    {isVideo ? 'videocam_off' : 'broken_image'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-base-content/40 font-semibold px-4 text-center">
                                                {isVideo ? 'Video unavailable' : 'Image failed to load'}
                                            </p>
                                        </div>
                                    ) : isVideo ? (
                                        <div className="w-full h-full bg-base-300 flex items-center justify-center relative">
                                            <div className="w-full h-full pointer-events-none">
                                                <ReactPlayer
                                                    src={src}
                                                    playing={false}
                                                    muted
                                                    playsInline
                                                    width="100%"
                                                    height="100%"
                                                    className="absolute top-0 left-0 object-cover"
                                                    onError={() => handleMediaError(idx)}
                                                />
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="size-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-white text-xl">play_arrow</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={src}
                                            alt={`Cover ${idx + 1}`}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                            onError={() => handleMediaError(idx)}
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />

                                    {/* Minimalist remove button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeCoverImage(idx); }}
                                        className="absolute top-2 right-2 size-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                    >
                                        <span className="material-symbols-outlined text-white text-[16px]">close</span>
                                    </button>

                                    {/* Minimalist set as main button */}
                                    {idx !== 0 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setAsMain(idx); }}
                                            className="absolute bottom-2 left-2 size-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                        >
                                            <span className="material-symbols-outlined text-base-content text-[16px]">star_border</span>
                                        </button>
                                    )}

                                    {/* Main cover indicator */}
                                    {idx === 0 && (
                                        <div className="absolute bottom-2 left-2 size-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                                            <span className="material-symbols-outlined text-amber-500 text-[16px] fill-1">star</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {coverImages.length < 10 && !uploading && (
                            <div
                                className="flex-none w-48 aspect-video rounded-2xl border border-dashed border-base-300 bg-base-100 flex flex-col items-center justify-center gap-2 hover:border-base-content/30 hover:bg-base-200/50 transition-all cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <span className="material-symbols-outlined text-3xl text-base-content/30 group-hover:text-base-content/50 transition-colors">add_circle</span>
                                <span className="text-[11px] font-medium text-base-content/40">Add media</span>
                            </div>
                        )}

                        {uploading && (
                            <div className="flex-none w-48 aspect-video rounded-2xl border border-base-300 bg-base-100 flex flex-col items-center justify-center gap-3 p-4">
                                <div className="relative size-12">
                                    <svg className="size-12 -rotate-90">
                                        <circle
                                            cx="24"
                                            cy="24"
                                            r="20"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            fill="none"
                                            className="text-base-300"
                                        />
                                        <circle
                                            cx="24"
                                            cy="24"
                                            r="20"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 20}`}
                                            strokeDashoffset={`${2 * Math.PI * 20 * (1 - uploadProgress / 100)}`}
                                            className="text-base-content/60 transition-all duration-300"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-[10px] font-medium text-base-content/60">{uploadProgress}%</span>
                                    </div>
                                </div>
                                <span className="text-[11px] text-base-content/40">
                                    {compressionStatus || 'Uploading...'}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Paste video URL..."
                                    className="input input-sm border-base-300 w-full rounded-lg pl-3 pr-16 bg-base-100 text-sm focus:border-base-content/30"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            setCoverImages(prev => [...prev, e.currentTarget.value.trim()]);
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                                <button
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-[11px] font-medium text-base-content/60 hover:text-base-content transition-colors"
                                    onClick={(e) => {
                                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                                        if (input.value.trim()) {
                                            setCoverImages(prev => [...prev, input.value.trim()]);
                                            input.value = '';
                                        }
                                    }}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-base-content/40 px-1">
                            Video will autoplay if set as main cover
                        </p>
                    </div>

                    {coverImages.length === 0 && (
                        <div
                            className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-base-300 bg-base-100 px-6 py-12 transition-all hover:border-base-content/30 hover:bg-base-200/30 cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="flex size-16 items-center justify-center rounded-full bg-base-200">
                                <span className="material-symbols-outlined text-3xl text-base-content/40">{uploading ? 'hourglass_empty' : 'image'}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5">
                                <p className="text-base-content/70 text-base font-medium">{uploading ? 'Uploading...' : 'Add cover media'}</p>
                                <p className="text-base-content/40 text-xs text-center">Tap to choose from gallery or camera</p>
                            </div>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/mp4,video/webm,video/quicktime"
                        multiple
                        className="hidden"
                        onChange={handleCoverImageUpload}
                    />
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*,video/mp4,video/webm,video/quicktime"
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

            <div className="px-4 py-4">
                <h3 className="text-base-content text-base font-semibold mb-3">Recipe Category</h3>
                <div className="grid grid-cols-2 gap-3">
                    {CATEGORIES.filter(cat => cat.id !== 'popular').map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`flex items-center gap-3 rounded-xl p-4 transition-all ${category === cat.id
                                ? 'bg-primary text-primary-content shadow-lg shadow-primary/20 scale-105'
                                : 'bg-base-200 text-base-content hover:bg-base-300'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-2xl ${category === cat.id ? 'fill-1' : ''}`}>
                                {cat.icon}
                            </span>
                            <span className="text-sm font-bold">{cat.name}</span>
                        </button>
                    ))}
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
                                <button onClick={() => removeIngredient(ing.id)} className="btn btn-ghost btn-circle btn-xs text-base-content/70 md:text-base-content/40 hover:text-error">
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
                                    <div className="flex flex-col">
                                        <button
                                            onClick={(e) => { e.preventDefault(); moveInstructionStep(inst.id, 'up'); }}
                                            disabled={index === 0}
                                            className="btn btn-ghost btn-circle btn-xs h-4 min-h-4 disabled:opacity-20"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">keyboard_arrow_up</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.preventDefault(); moveInstructionStep(inst.id, 'down'); }}
                                            disabled={index === instructions.length - 1}
                                            className="btn btn-ghost btn-circle btn-xs h-4 min-h-4 disabled:opacity-20"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
                                        </button>
                                    </div>
                                    <span className="font-bold text-base-content whitespace-nowrap">Step {index + 1}</span>
                                </div>
                                <button onClick={() => removeInstructionStep(inst.id)} className="btn btn-ghost btn-circle btn-xs text-base-content/70 md:text-base-content/40 hover:text-error">
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
                                                <div className="flex flex-col w-full gap-3 px-4">
                                                    <div className="flex justify-center gap-2">
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
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-base-200/50 rounded-lg px-3 py-1.5 ring-1 ring-base-content/10">
                                                        <span className="material-symbols-outlined text-sm text-base-content/40">link</span>
                                                        <input
                                                            type="text"
                                                            placeholder="Video URL (mp4, mov...)"
                                                            className="bg-transparent text-[10px] w-full focus:outline-none"
                                                            onClick={(e) => e.stopPropagation()}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleStepVideoUrl(inst.id, e.currentTarget.value);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <input
                                        ref={el => { stepImageRefs.current[inst.id] = el; }}
                                        type="file"
                                        accept="image/*"
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
                    className="flex flex-col justify-end overflow-hidden rounded-3xl min-h-[380px] relative shadow-2xl ring-1 ring-base-content/5"
                    style={{ backgroundColor: '#f4e225' }}
                >
                    {/* Background Gallery Scroll */}
                    <div className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
                        {coverImages.length > 0 ? (
                            coverImages.map((src, idx) => {
                                const isVideo = isVideoUrl(src);
                                const hasError = mediaErrors[idx];

                                if (hasError) {
                                    return (
                                        <div key={idx} className="w-full h-full flex-none snap-center bg-gradient-to-br from-base-200 to-base-300 flex flex-col items-center justify-center gap-3">
                                            <div className="size-16 rounded-full bg-base-content/10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-4xl text-base-content/40">
                                                    {isVideo ? 'videocam_off' : 'broken_image'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-base-content/40 font-semibold">
                                                {isVideo ? 'Video unavailable' : 'Image failed to load'}
                                            </p>
                                        </div>
                                    );
                                }

                                return isVideo ? (
                                    <video
                                        key={idx}
                                        src={src}
                                        autoPlay={idx === 0}
                                        muted
                                        loop
                                        playsInline
                                        className="w-full h-full object-cover flex-none snap-center"
                                        onError={() => handleMediaError(idx)}
                                    />
                                ) : (
                                    <img
                                        key={idx}
                                        src={src}
                                        alt={`Preview ${idx + 1}`}
                                        className="w-full h-full object-cover flex-none snap-center"
                                        onError={() => handleMediaError(idx)}
                                    />
                                );
                            })
                        ) : (
                            <div className="w-full h-full flex-none bg-gradient-to-br from-primary to-primary-focus" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />
                    </div>

                    {/* Image Indicators */}
                    {coverImages.length > 1 && (
                        <div className="absolute top-4 right-4 flex gap-1">
                            {coverImages.map((_, idx) => (
                                <div key={idx} className="size-1.5 rounded-full bg-white/50" />
                            ))}
                        </div>
                    )}

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
                {instructions.length > 0 && (
                    <div className="space-y-6 pb-12">
                        <div className="flex items-center gap-2 px-2">
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[20px] fill-1">restaurant_menu</span>
                            </div>
                            <h2 className="text-lg font-bold tracking-tight">Instructions</h2>
                        </div>
                        <div className="space-y-8 relative before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-base-300">
                            {instructions.map((inst, idx) => (
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
            {/* Upload Progress Indicator */}
            {uploading && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4">
                    <div className="bg-base-100 rounded-xl shadow-lg border border-base-200/50 p-3">
                        <div className="flex items-center gap-3">
                            <div className="relative size-9 flex-shrink-0">
                                <svg className="size-9 -rotate-90">
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="16"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                        className="text-base-300"
                                    />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="16"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 16}`}
                                        strokeDashoffset={`${2 * Math.PI * 16 * (1 - uploadProgress / 100)}`}
                                        className="text-base-content transition-all duration-300"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] font-medium text-base-content/70">{uploadProgress}%</span>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-base-content/70 mb-1.5 truncate">
                                    {compressionStatus || 'Uploading media...'}
                                </p>
                                <div className="w-full h-1 bg-base-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-base-content/60 transition-all duration-300 ease-out"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Header */}
            <div className={`sticky top-0 z-20 transition-all duration-300 ${step === 4 ? 'bg-success/5 shadow-lg' : 'bg-base-100/95 backdrop-blur-md'} border-b border-base-200`}>
                <div className="max-w-md mx-auto p-4 pt-2">
                    {/* Sheet Handle Vibe */}
                    <div className="flex justify-center mb-2">
                        <div className="h-1 w-10 rounded-full bg-base-300" />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={step === 1 ? handleBackWithSafety : prevStep}
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
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing || isSuccess}
                                className={`btn flex-[2] btn-lg gap-2 shadow-lg transition-all duration-300 ${isSuccess ? 'btn-success text-success-content' : 'btn-primary disabled:opacity-70'}`}
                            >
                                {isPublishing ? (
                                    <LoadingAnimation size={24} />
                                ) : isSuccess ? (
                                    <>
                                        <span className="material-symbols-outlined text-[20px] animate-bounce">check_circle</span>
                                        {editingRecipe?.id.startsWith('temp-') ? 'Saved!' : isEditing ? 'Updated!' : 'Published!'}
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[20px]">
                                            {editingRecipe?.id.startsWith('temp-') ? 'check_circle' : isEditing ? 'save' : 'publish'}
                                        </span>
                                        {editingRecipe?.id.startsWith('temp-') ? 'Save Changes' : isEditing ? 'Update Recipe' : 'Publish Recipe'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Exit Confirmation Modal */}
            {showExitModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-base-100 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
                        <div className="p-8 pb-6 text-center">
                            <div className="size-16 rounded-2xl bg-warning/20 text-warning flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-4xl fill-icon">warning</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Save your draft?</h3>
                            <p className="text-sm text-base-content/60 leading-relaxed">
                                You have unsaved changes. Would you like to save this recipe to your drafts before leaving?
                            </p>
                        </div>
                        <div className="p-6 pt-0 flex flex-col gap-3">
                            <button
                                onClick={handleSaveDraftAndExit}
                                disabled={isPublishing || isSuccess}
                                className={`btn btn-lg w-full gap-2 rounded-2xl shadow-lg transition-all duration-300 ${isSuccess ? 'btn-success text-success-content' : 'btn-primary shadow-primary/20'}`}
                            >
                                {isPublishing ? <LoadingAnimation size={20} /> : isSuccess ? (
                                    <>
                                        <span className="material-symbols-outlined text-[20px] animate-bounce">check_circle</span>
                                        Saved!
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                                        Save as Draft
                                    </>
                                )}
                            </button>
                            <button
                                onClick={onBack}
                                className="btn btn-ghost btn-lg w-full gap-2 rounded-2xl text-error hover:bg-error/10"
                            >
                                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                                Discard Changes
                            </button>
                            <button
                                onClick={() => setShowExitModal(false)}
                                className="btn btn-ghost w-full font-bold text-xs uppercase tracking-widest opacity-40 hover:opacity-100"
                            >
                                Continue Editing
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublishRecipeScreen;
