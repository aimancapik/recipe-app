import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import LoadingAnimation from '@/components/LoadingAnimation';
import { Recipe } from '@/types';
import StepTimer from '@/components/StepTimer';
import ReviewsSection from '@/components/ReviewsSection';
import { shareRecipe } from '@/lib/shareHelpers';

interface RecipeDetailScreenProps {
    recipe: Recipe;
    onBack: () => void;
    onToggleFavorite: (id: string) => void;
    onAddToGrocery: (recipe: Recipe) => void;
    onOpenGrocery: () => void;
    onPublish?: () => Promise<void> | void;
    onEdit?: (recipe: Recipe) => void;
    onChefClick?: (userId: string) => void;
    onRate?: () => void;
    onStartCooking?: () => void;
}

interface ChefProfile {
    full_name: string;
    avatar_url: string;
}

const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({ recipe, onBack, onToggleFavorite, onAddToGrocery, onOpenGrocery, onPublish, onEdit, onChefClick, onRate, onStartCooking }) => {
    const [publishing, setPublishing] = useState(false);
    const [chef, setChef] = useState<ChefProfile | null>(null);
    const [viewMediaIndex, setViewMediaIndex] = useState<number | null>(null);
    const [shareToast, setShareToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
    const carouselRef = useRef<HTMLDivElement>(null);

    // Handle initial scroll when gallery opens
    useEffect(() => {
        if (viewMediaIndex !== null && carouselRef.current) {
            carouselRef.current.scrollTo({
                left: viewMediaIndex * carouselRef.current.clientWidth,
                behavior: 'auto'
            });
        }
    }, [viewMediaIndex === null]); // Only run when it transition from null to non-null
    const galleryItems = (recipe.images && recipe.images.length > 0) ? recipe.images : (recipe.image ? [recipe.image] : []);

    const isVideo = (url: string) => {
        const lowerUrl = url.toLowerCase();
        return lowerUrl.match(/\.(mp4|webm|ogg|mov)$/) ||
            lowerUrl.includes('video') ||
            lowerUrl.includes('youtube.com') ||
            lowerUrl.includes('youtu.be') ||
            lowerUrl.includes('vimeo.com');
    };

    React.useEffect(() => {
        if (recipe.userId) {
            import('@/lib/supabase').then(({ supabase }) => {
                supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', recipe.userId)
                    .single()
                    .then(({ data }) => setChef(data));
            });
        }
    }, [recipe.userId]);

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

    const handleShare = async () => {
        const result = await shareRecipe(recipe);

        if (result.success) {
            if (result.method === 'clipboard') {
                setShareToast({ show: true, message: 'Link copied to clipboard!' });
                setTimeout(() => setShareToast({ show: false, message: '' }), 3000);
            }
        } else {
            setShareToast({ show: true, message: 'Failed to share recipe' });
            setTimeout(() => setShareToast({ show: false, message: '' }), 3000);
        }
    };

    return (
        <div className={`relative flex min-h-screen w-full flex-col bg-base-100 ${onPublish ? 'pb-24' : ''}`}>
            {/* Header Image & Overlay Nav */}
            <div className="relative w-full h-80 bg-base-200">
                <div className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth">
                    {recipe.images && recipe.images.length > 0 ? (
                        recipe.images.map((src, idx) => (
                            <div
                                key={idx}
                                className="w-full h-full flex-none snap-center relative cursor-zoom-in"
                                onClick={() => setViewMediaIndex(idx)}
                            >
                                {isVideo(src) ? (
                                    <div className="w-full h-full pointer-events-none">
                                        <ReactPlayer
                                            src={src}
                                            playing={idx === 0}
                                            muted
                                            loop
                                            playsInline
                                            width="100%"
                                            height="100%"
                                            className="absolute top-0 left-0 object-cover"
                                        />
                                    </div>
                                ) : (
                                    <img
                                        src={src}
                                        alt={`${recipe.title} - ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                            </div>
                        ))
                    ) : (
                        <div
                            className="w-full h-full flex-none snap-center relative cursor-zoom-in"
                            onClick={() => recipe.image && setViewMediaIndex(0)}
                        >
                            <img
                                src={recipe.image || ''}
                                alt={recipe.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                        </div>
                    )}
                </div>

                {/* Image Indicators */}
                {recipe.images && recipe.images.length > 1 && (
                    <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                        {recipe.images.map((_, idx) => (
                            <div key={idx} className="size-1.5 rounded-full bg-white/40 ring-1 ring-black/10" />
                        ))}
                    </div>
                )}
                {/* Navigation */}
                <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4">
                    <button onClick={onBack} className="btn btn-circle btn-sm glass text-white">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    {!onPublish && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleShare}
                                className="btn btn-circle btn-sm glass text-white border-none transition-all active:scale-90"
                            >
                                <span className="material-symbols-outlined">share</span>
                            </button>
                            <button
                                onClick={() => onToggleFavorite(recipe.id)}
                                className={`btn btn-circle btn-sm glass border-none transition-all active:scale-90 ${recipe.isFavorite ? 'text-red-500' : 'text-white'}`}
                            >
                                <span className={`material-symbols-outlined ${recipe.isFavorite ? 'fill-icon scale-110' : ''}`}>
                                    {recipe.isFavorite ? 'heart_check' : 'favorite'}
                                </span>
                            </button>
                        </div>
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

                {recipe.description && (
                    <p className="text-sm text-base-content/60 leading-relaxed mb-6 italic">
                        {recipe.description}
                    </p>
                )}

                {/* Chef Profile Link */}
                {recipe.userId && (
                    <div
                        onClick={() => onChefClick?.(recipe.userId!)}
                        className="flex items-center gap-3 mb-8 p-3 rounded-2xl bg-base-200 border border-base-300 cursor-pointer hover:bg-base-300/50 transition-all active:scale-[0.98] group"
                    >
                        <div className="relative">
                            {chef?.avatar_url ? (
                                <img
                                    src={chef.avatar_url}
                                    alt={chef.full_name}
                                    className="size-11 rounded-full object-cover border-2 border-primary"
                                    onError={(e) => {
                                        // Replace broken image with default avatar
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        const parent = (e.target as HTMLImageElement).parentElement;
                                        if (parent && !parent.querySelector('.default-avatar-large')) {
                                            const fallback = document.createElement('div');
                                            fallback.className = 'size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 default-avatar-large';
                                            fallback.innerHTML = '<span class="material-symbols-outlined text-xl">person</span>';
                                            parent.insertBefore(fallback, parent.lastElementChild);
                                        }
                                    }}
                                />
                            ) : (
                                <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20">
                                    <span className="material-symbols-outlined text-xl">person</span>
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 size-3.5 bg-green-500 border-2 border-base-100 rounded-full"></div>
                        </div>
                        <div className="flex flex-col flex-1">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Recipe By</span>
                            <span className="text-sm font-bold text-base-content group-hover:text-primary transition-colors">{chef?.full_name || 'Loading Chef...'}</span>
                        </div>
                        <span className="material-symbols-outlined text-base-content/20 group-hover:text-primary transition-all group-hover:translate-x-1">chevron_right</span>
                    </div>
                )}

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

                {/* Rate Action Section */}
                {!onPublish && (
                    <div className="mb-10 p-5 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-between group overflow-hidden relative">
                        <div className="absolute -right-4 -top-4 size-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
                        <div className="flex flex-col gap-1 relative z-10">
                            <span className="text-base font-bold text-base-content">Enjoyed this recipe?</span>
                            <span className="text-[12px] font-medium text-base-content/50 leading-tight pr-4">Rate it and let the chef know! 🧑‍🍳</span>
                        </div>
                        <button
                            onClick={onRate}
                            className="btn btn-primary h-12 px-6 rounded-2xl normal-case font-bold shadow-lg shadow-primary/20 relative z-10 hover:scale-105 active:scale-95 transition-all"
                        >
                            Rate Now
                        </button>
                    </div>
                )}

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

                {/* Start Cooking Button */}
                {onStartCooking && recipe.directions.length > 0 && (
                    <div className="mb-10">
                        <button
                            onClick={onStartCooking}
                            className="btn btn-primary w-full h-14 rounded-2xl gap-3 text-lg shadow-lg hover:shadow-xl transition-all"
                        >
                            <span className="material-symbols-outlined text-2xl">restaurant</span>
                            Start Cooking
                        </button>
                        <p className="text-center text-sm text-base-content/60 mt-3">
                            Follow step-by-step with hands-free navigation
                        </p>
                    </div>
                )}

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
                                        <div
                                            className="w-full aspect-video rounded-2xl overflow-hidden mb-3 border border-base-200 shadow-sm relative group cursor-zoom-in"
                                            onClick={() => {
                                                const stepImageIdx = galleryItems.indexOf(dir.image!);
                                                if (stepImageIdx !== -1) setViewMediaIndex(stepImageIdx);
                                                else setViewMediaIndex(0); // Fallback to start if not in gallery
                                            }}
                                        >
                                            {dir.mediaType === 'video' ? (
                                                <div className="w-full h-full pointer-events-none">
                                                    <ReactPlayer
                                                        src={dir.image}
                                                        playing
                                                        loop
                                                        muted
                                                        playsInline
                                                        width="100%"
                                                        height="100%"
                                                        className="absolute top-0 left-0 object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                </div>
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

                {/* Reviews Section */}
                {!onPublish && (
                    <div className="mb-8">
                        <ReviewsSection recipeId={recipe.id} />
                    </div>
                )}
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
            {/* Full-Screen Premium Media Viewer */}
            {viewMediaIndex !== null && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-300"
                    onClick={() => setViewMediaIndex(null)}
                >
                    {/* Viewer Header */}
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/60 to-transparent">
                        <div className="flex flex-col">
                            <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Gallery</span>
                            <span className="text-white font-bold text-sm">
                                {viewMediaIndex + 1} <span className="text-white/40 font-medium mx-1">/</span> {galleryItems.length}
                            </span>
                        </div>
                        <button
                            className="btn btn-circle btn-sm glass text-white border-none hover:bg-white/20"
                            onClick={() => setViewMediaIndex(null)}
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Main Gallery Carousel */}
                    <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                        <div
                            ref={carouselRef}
                            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
                            onScroll={(e) => {
                                const target = e.currentTarget;
                                const index = Math.round(target.scrollLeft / target.clientWidth);
                                if (index !== viewMediaIndex) setViewMediaIndex(index);
                            }}>
                            {galleryItems.map((src, idx) => (
                                <div key={idx} className="w-screen h-full flex-none snap-center flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
                                    <div className="w-full max-w-5xl h-full flex items-center justify-center">
                                        {isVideo(src) ? (
                                            <div className="w-full max-w-full aspect-video rounded-2xl overflow-hidden shadow-2xl">
                                                <ReactPlayer
                                                    src={src}
                                                    controls
                                                    playing
                                                    width="100%"
                                                    height="100%"
                                                    className="object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <img
                                                src={src}
                                                alt={`View ${idx + 1}`}
                                                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Overlay dots */}
                        {galleryItems.length > 1 && (
                            <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-2 z-50">
                                {galleryItems.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`size-1.5 rounded-full transition-all duration-300 ${idx === viewMediaIndex ? 'bg-white w-4' : 'bg-white/20'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Viewer Footer */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center z-50 bg-gradient-to-t from-black/80 to-transparent">
                        <h3 className="text-white font-bold text-xl mb-1 text-center">{recipe.title}</h3>
                        <p className="text-white/40 text-[10px] font-medium uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px]">swipe</span>
                            Swipe to explore
                        </p>
                    </div>
                </div>
            )}

            {/* Share Toast Notification */}
            {shareToast.show && (
                <div className="toast toast-top toast-center z-[200]">
                    <div className="alert alert-success shadow-lg">
                        <span className="material-symbols-outlined">check_circle</span>
                        <span>{shareToast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecipeDetailScreen;
