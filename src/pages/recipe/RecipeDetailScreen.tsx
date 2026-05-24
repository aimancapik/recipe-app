import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactPlayer from 'react-player';
import { createTimeline, stagger } from 'animejs';
import LoadingAnimation from '@/components/common/LoadingAnimation';
import { Recipe } from '@/types';
import StepTimer from '@/components/recipe/StepTimer';
import ReviewsSection from '@/components/social/ReviewsSection';
import CommentsSection from '@/components/social/CommentsSection';
import { shareRecipe } from '@/utils/shareHelpers';
import { useCollections } from '@/hooks/recipe/useCollections';
import { useAuth } from '@/hooks/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { getAvatarUrl } from '@/constants/avatars';
import MadeItSection from '@/components/recipe/MadeItSection';
import ShareableCard from '@/components/recipe/ShareableCard';
import { getNormalizedVideoUrl } from '@/utils/mediaHelpers';
import { useRecipeView } from '@/hooks/recipe/useRecipeView';
import StickyActionBar from '@/components/ui/StickyActionBar';

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
    const { user } = useAuth();
    useRecipeView(recipe.id);
    const { collections, fetchCollections, addRecipeToCollection, removeRecipeFromCollection, isRecipeInCollection } = useCollections();
    const [publishing, setPublishing] = useState(false);
    const [chef, setChef] = useState<ChefProfile | null>(null);
    const [viewMediaIndex, setViewMediaIndex] = useState<number | null>(null);
    const [shareToast, setShareToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
    const carouselRef = useRef<HTMLDivElement>(null);
    const dragState = useRef<{ active: boolean; startX: number; scrollLeft: number }>({ active: false, startX: 0, scrollLeft: 0 });
    const ingredients = recipe.ingredients ?? [];
    const directions = recipe.directions ?? [];
    const baseServes = parseInt((recipe.serves || '1').replace(/[^0-9]/g, '')) || 1;
    const [currentServes, setCurrentServes] = useState(baseServes);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [showShareCard, setShowShareCard] = useState(false);
    const [recipeCollections, setRecipeCollections] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [activeStepTimers, setActiveStepTimers] = useState<Set<number>>(new Set());
    const [stepImageViewer, setStepImageViewer] = useState<string | null>(null);
    const detailRootRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const root = detailRootRef.current;
        if (!root) return;

        const hero = root.querySelector<HTMLElement>('[data-recipe-hero]');
        const navItems = root.querySelectorAll<HTMLElement>('[data-recipe-nav] > *');
        const sheet = root.querySelector<HTMLElement>('[data-recipe-sheet]');
        const contentItems = root.querySelectorAll<HTMLElement>('[data-recipe-motion]');
        const statItems = root.querySelectorAll<HTMLElement>('[data-recipe-stat]');
        const ingredientItems = root.querySelectorAll<HTMLElement>('[data-recipe-ingredient]');
        const stepItems = root.querySelectorAll<HTMLElement>('[data-recipe-step]');
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const reset = (items: Iterable<HTMLElement>) => {
            Array.from(items).forEach(item => {
                item.style.opacity = '';
                item.style.transform = '';
            });
        };

        if (prefersReducedMotion) {
            reset([hero, sheet].filter(Boolean) as HTMLElement[]);
            reset(navItems);
            reset(contentItems);
            reset(statItems);
            reset(ingredientItems);
            reset(stepItems);
            return;
        }

        if (hero) {
            hero.style.opacity = '0';
            hero.style.transform = 'scale(1.04)';
        }
        if (sheet) {
            sheet.style.opacity = '0';
            sheet.style.transform = 'translateY(42px)';
        }

        [...navItems, ...contentItems, ...statItems, ...ingredientItems, ...stepItems].forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(18px)';
        });

        const timeline = createTimeline({
            defaults: {
                duration: 520,
                ease: 'outCubic',
            },
        });

        if (hero) {
            timeline.add(hero, { opacity: [0, 1], scale: [1.04, 1], duration: 680 });
        }
        if (navItems.length) {
            timeline.add(navItems, { opacity: [0, 1], y: [-14, 0], delay: stagger(45), duration: 420 }, '-=560');
        }
        if (sheet) {
            timeline.add(sheet, { opacity: [0, 1], y: [42, 0], duration: 640 }, '-=390');
        }
        if (contentItems.length) {
            timeline.add(contentItems, { opacity: [0, 1], y: [22, 0], delay: stagger(55), duration: 480 }, '-=390');
        }
        if (statItems.length) {
            timeline.add(statItems, { opacity: [0, 1], y: [16, 0], scale: [0.96, 1], delay: stagger(38), duration: 420 }, '-=420');
        }
        if (ingredientItems.length) {
            timeline.add(ingredientItems, { opacity: [0, 1], x: [-14, 0], delay: stagger(34), duration: 380 }, '-=260');
        }
        if (stepItems.length) {
            timeline.add(stepItems, { opacity: [0, 1], y: [24, 0], delay: stagger(58), duration: 480 }, '-=160');
        }

        return () => {
            timeline.cancel();
            if (hero) {
                hero.style.opacity = '';
                hero.style.transform = '';
            }
            if (sheet) {
                sheet.style.opacity = '';
                sheet.style.transform = '';
            }
            reset(navItems);
            reset(contentItems);
            reset(statItems);
            reset(ingredientItems);
            reset(stepItems);
        };
    }, [recipe.id]);

    // Handle initial scroll when gallery opens
    useEffect(() => {
        if (viewMediaIndex !== null && carouselRef.current) {
            carouselRef.current.scrollTo({
                left: viewMediaIndex * carouselRef.current.clientWidth,
                behavior: 'auto'
            });
        }
    }, [viewMediaIndex]);
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

        // Fetch collection mapping for this user's recipe
        if (user) {
            fetchCollections();
        }
    }, [recipe.userId, user, fetchCollections]);

    React.useEffect(() => {
        // Find out which collections contain this recipe
        const checkCollections = async () => {
            const inCollections = new Set<string>();
            for (const c of collections) {
                const isThere = await isRecipeInCollection(c.id, recipe.id);
                if (isThere) inCollections.add(c.id);
            }
            setRecipeCollections(inCollections);
        };
        if (collections.length > 0 && showCollectionModal) {
            checkCollections();
        }
    }, [collections, recipe.id, showCollectionModal, isRecipeInCollection]);

    const handleToggleCollection = async (collectionId: string) => {
        try {
            setIsSaving(true);
            if (recipeCollections.has(collectionId)) {
                await removeRecipeFromCollection(collectionId, recipe.id);
                setRecipeCollections(prev => {
                    const next = new Set(prev);
                    next.delete(collectionId);
                    return next;
                });
            } else {
                await addRecipeToCollection(collectionId, recipe.id);
                setRecipeCollections(prev => new Set(prev).add(collectionId));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

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
        <>
        <div ref={detailRootRef} className={`relative flex min-h-screen w-full flex-col bg-base-100 ${onPublish ? 'pb-24' : 'pb-28'}`}>
            {/* Header Image & Overlay Nav */}
            <div data-recipe-hero className="relative w-full h-80 bg-base-200">
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
                                            src={getNormalizedVideoUrl(src)}
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
                            <div key={idx} className="size-1.5 rounded-full bg-base-100/40 ring-1 ring-black/10" />
                        ))}
                    </div>
                )}
                {/* Navigation */}
                <div data-recipe-nav className="absolute top-0 left-0 right-0 flex justify-between items-center p-4">
                    <button onClick={onBack} className="btn btn-circle btn-sm glass text-white">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    {!onPublish && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCollectionModal(true)}
                                className="btn btn-circle btn-sm glass text-white border-none transition-all active:scale-90"
                            >
                                <span className="material-symbols-outlined">bookmark_add</span>
                            </button>
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
            <div data-recipe-sheet className="relative -mt-8 rounded-t-3xl bg-base-100 px-6 pt-8 pb-8 shadow-2xl">
                {/* Title and Rating */}
                <div data-recipe-motion className="flex justify-between items-start mb-6">
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
                    <p data-recipe-motion className="text-sm text-base-content/60 leading-relaxed mb-6 italic">
                        {recipe.description}
                    </p>
                )}

                {/* Chef Profile Link */}
                {recipe.userId && (
                    <div
                        data-recipe-motion
                        onClick={() => onChefClick?.(recipe.userId!)}
                        className="flex items-center gap-3 mb-8 p-3 rounded-2xl bg-base-200 border border-base-300 cursor-pointer hover:bg-base-300/50 transition-all active:scale-[0.98] group"
                    >
                        <div className="relative">
                            {(() => {
                                const url = getAvatarUrl(chef?.avatar_url);
                                const initial = (chef?.full_name || '?').charAt(0).toUpperCase();
                                return url ? (
                                    <div className="size-11 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-200 bg-primary overflow-hidden">
                                        <img src={url} alt={chef?.full_name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="size-11 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-200 bg-primary flex items-center justify-center">
                                        <span className="text-primary-content font-black text-lg">{initial}</span>
                                    </div>
                                );
                            })()}
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
                        { label: 'Time', val: recipe.prepTime || 'Quick', icon: 'schedule' },
                        { label: 'Serves', val: currentServes.toString(), icon: 'group' },
                        { label: 'Kcal', val: recipe.kcal, icon: 'bolt' },
                        { label: 'Level', val: recipe.level, icon: 'bar_chart' }
                    ].map(stat => (
                        <div key={stat.label} data-recipe-stat className="flex flex-col items-center py-3 bg-base-100/50 rounded-xl shadow-sm first:bg-primary/5 last:bg-primary/5">
                            <span className="material-symbols-outlined text-primary text-[20px] mb-1">{stat.icon}</span>
                            <span className="text-base-content font-bold text-xs">{stat.val}</span>
                            <span className="text-[9px] uppercase font-bold text-base-content/40 tracking-wider">{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Rate Action Section — hidden for recipe owner */}
                {!onPublish && user?.id !== recipe.userId && (
                    <div data-recipe-motion className="mb-10 p-5 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-between group overflow-hidden relative">
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
                <div data-recipe-motion className="mb-10">
                    <div className="flex items-center justify-between mb-5 px-1">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <div className="size-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                                <span className="material-symbols-outlined text-[20px] fill-1">shopping_basket</span>
                            </div>
                            Ingredients
                        </h2>
                        <div className="flex items-center gap-2 rounded-full bg-base-200 p-1">
                            <button
                                onClick={() => setCurrentServes(v => Math.max(1, v - 1))}
                                className="flex size-7 items-center justify-center rounded-full bg-base-100 text-base-content/60"
                                title="Decrease servings"
                            >
                                <span className="material-symbols-outlined text-[16px]">remove</span>
                            </button>
                            <span className="min-w-12 text-center text-xs font-black text-secondary">{currentServes} serve{currentServes === 1 ? '' : 's'}</span>
                            <button
                                onClick={() => setCurrentServes(v => Math.min(24, v + 1))}
                                className="flex size-7 items-center justify-center rounded-full bg-secondary text-secondary-content"
                                title="Increase servings"
                            >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                            </button>
                        </div>
                    </div>
                    {currentServes !== baseServes && (
                        <p className="mb-3 rounded-2xl bg-secondary/10 px-4 py-2 text-xs font-bold text-secondary">
                            Ingredient quantities are shown as written. Use {currentServes} servings as your prep target.
                        </p>
                    )}
                    <div className="grid grid-cols-1 gap-2.5">
                        {ingredients.map((ing, idx) => (
                            <div key={idx} data-recipe-ingredient className="flex items-center gap-3 p-4 rounded-xl bg-base-100 border border-base-200 hover:border-primary/20 transition-colors shadow-sm group">
                                <div className="size-6 rounded-full border-2 border-secondary/20 flex items-center justify-center group-hover:border-secondary/50 transition-colors">
                                    <div className="size-2 rounded-full bg-secondary/40" />
                                </div>
                                <span className="text-sm font-medium text-base-content/80">{ing}</span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => onAddToGrocery(recipe)}
                        className="btn btn-outline w-full mt-6 h-12 rounded-xl gap-2 border-secondary/30 hover:bg-secondary/5 hover:border-secondary text-secondary"
                    >
                        <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                        Add all to Shopping List
                    </button>
                </div>

                {/* Start Cooking Button */}
                {onStartCooking && directions.length > 0 && (
                    <div data-recipe-motion className="mb-10">
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
                <div data-recipe-motion className="mb-8">
                    <h2 className="text-xl font-bold mb-6 px-1">Directions</h2>
                    <div className="space-y-6 relative before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-base-300">
                        {directions.map((dir, idx) => (
                            <div key={idx} data-recipe-step className="relative pl-12 flex flex-col gap-3">
                                {/* Number Circle */}
                                <div className="absolute left-0 top-0 size-9 rounded-full bg-primary text-primary-content flex items-center justify-center font-black text-sm shadow-lg ring-4 ring-base-100 z-10">
                                    {idx + 1}
                                </div>

                                <div className="flex flex-col flex-1 text-left">
                                    <h3 className="font-bold text-base mb-2 text-base-content">{dir.title}</h3>

                                    {dir.image && (
                                        <div
                                            className="w-full aspect-video rounded-2xl overflow-hidden mb-3 border border-base-200 shadow-sm relative group cursor-zoom-in"
                                            onClick={() => setStepImageViewer(dir.image!)}
                                        >
                                            {dir.mediaType === 'video' ? (
                                                <div className="w-full h-full pointer-events-none">
                                                    <ReactPlayer
                                                        src={getNormalizedVideoUrl(dir.image)}
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
                                            {activeStepTimers.has(idx) ? (
                                                <StepTimer
                                                    seconds={dir.timer}
                                                    label={`Step ${idx + 1}`}
                                                    onClose={() => setActiveStepTimers(prev => {
                                                        const next = new Set(prev);
                                                        next.delete(idx);
                                                        return next;
                                                    })}
                                                />
                                            ) : (
                                                <button
                                                    onClick={() => setActiveStepTimers(prev => new Set([...prev, idx]))}
                                                    className="flex items-center gap-3 w-full p-3 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 active:scale-95 transition-all group"
                                                >
                                                    <div className="size-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/30 group-hover:scale-110 transition-transform">
                                                        <span className="material-symbols-outlined text-primary-content text-lg">timer</span>
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className="font-bold text-base-content text-xs">Start Timer</p>
                                                        <p className="text-primary font-black text-sm leading-none">
                                                            {dir.timer >= 3600
                                                                ? `${Math.floor(dir.timer / 3600)}h ${Math.floor((dir.timer % 3600) / 60)}m`
                                                                : dir.timer >= 60
                                                                ? `${Math.floor(dir.timer / 60)}m${dir.timer % 60 > 0 ? ` ${dir.timer % 60}s` : ''}`
                                                                : `${dir.timer}s`}
                                                        </p>
                                                    </div>
                                                    <span className="material-symbols-outlined text-primary/60 text-sm">chevron_right</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Made It */}
                {!onPublish && (
                    <MadeItSection
                        recipeId={recipe.id}
                        userId={user?.id}
                        onRequireAuth={(action) => {
                            if (user) action();
                            else alert('Sign in to mark recipes as made!');
                        }}
                    />
                )}

                {/* Share Recipe Card */}
                {!onPublish && (
                    <div data-recipe-motion className="px-5 pb-4">
                        <button
                            onClick={() => setShowShareCard(true)}
                            className="w-full btn btn-outline rounded-2xl gap-2 border-2"
                        >
                            <span className="material-symbols-outlined">share</span>
                            Share Recipe Card
                        </button>
                    </div>
                )}

                {/* Reviews Section */}
                {!onPublish && (
                    <div data-recipe-motion className="mb-8 space-y-8">
                        <ReviewsSection recipeId={recipe.id} />
                        <hr className="border-base-200" />
                        <CommentsSection recipeId={recipe.id} recipeOwnerId={recipe.userId} />
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
            {!onPublish && (
                <StickyActionBar>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onToggleFavorite(recipe.id)}
                            className={`btn btn-square rounded-2xl ${recipe.isFavorite ? 'btn-primary' : 'btn-ghost bg-base-200'}`}
                            title={recipe.isFavorite ? 'Saved' : 'Save recipe'}
                        >
                            <span className={`material-symbols-outlined ${recipe.isFavorite ? 'fill-icon' : ''}`}>
                                {recipe.isFavorite ? 'favorite' : 'favorite_border'}
                            </span>
                        </button>
                        <button onClick={() => onAddToGrocery(recipe)} className="btn btn-square rounded-2xl btn-ghost bg-secondary/10 text-secondary" title="Add ingredients">
                            <span className="material-symbols-outlined">add_shopping_cart</span>
                        </button>
                        <button onClick={handleShare} className="btn btn-square rounded-2xl btn-ghost bg-base-200" title="Share recipe">
                            <span className="material-symbols-outlined">share</span>
                        </button>
                        {onStartCooking && directions.length > 0 && (
                            <button onClick={onStartCooking} className="btn btn-primary flex-1 rounded-2xl gap-2">
                                <span className="material-symbols-outlined">restaurant</span>
                                Cook
                            </button>
                        )}
                    </div>
                </StickyActionBar>
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
                            className="btn btn-circle btn-sm glass text-white border-none hover:bg-base-100/20"
                            onClick={() => setViewMediaIndex(null)}
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Main Gallery Carousel */}
                    <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                        <div
                            ref={carouselRef}
                            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing"
                            onScroll={(e) => {
                                const target = e.currentTarget;
                                const index = Math.round(target.scrollLeft / target.clientWidth);
                                if (index !== viewMediaIndex) setViewMediaIndex(index);
                            }}
                            onMouseDown={(e) => {
                                const el = carouselRef.current;
                                if (!el) return;
                                dragState.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
                                el.style.scrollBehavior = 'auto';
                            }}
                            onMouseMove={(e) => {
                                const ds = dragState.current;
                                const el = carouselRef.current;
                                if (!ds.active || !el) return;
                                e.preventDefault();
                                const x = e.pageX - el.offsetLeft;
                                el.scrollLeft = ds.scrollLeft - (x - ds.startX);
                            }}
                            onMouseUp={() => {
                                dragState.current.active = false;
                                if (carouselRef.current) carouselRef.current.style.scrollBehavior = '';
                            }}
                            onMouseLeave={() => {
                                dragState.current.active = false;
                                if (carouselRef.current) carouselRef.current.style.scrollBehavior = '';
                            }}>
                            {galleryItems.map((src, idx) => (
                                <div key={idx} className="w-screen h-full flex-none snap-center flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
                                    <div className="w-full max-w-5xl h-full flex items-center justify-center">
                                        {isVideo(src) ? (
                                            <div className="w-full max-w-full aspect-video rounded-2xl overflow-hidden shadow-2xl">
                                                <ReactPlayer
                                                    src={getNormalizedVideoUrl(src)}
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
                                                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl select-none"
                                                draggable={false}
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
                                        className={`size-1.5 rounded-full transition-all duration-300 ${idx === viewMediaIndex ? 'bg-base-100 w-4' : 'bg-base-100/20'}`}
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
            {/* Step Image Lightbox */}
            {stepImageViewer && (
                <div
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setStepImageViewer(null)}
                >
                    <button
                        className="absolute top-4 right-4 size-10 flex items-center justify-center rounded-full bg-base-100/10 hover:bg-base-100/20 transition-colors"
                        onClick={() => setStepImageViewer(null)}
                    >
                        <span className="material-symbols-outlined text-white">close</span>
                    </button>
                    <img
                        src={stepImageViewer}
                        alt="Step"
                        className="max-w-full max-h-full rounded-2xl object-contain"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}

            {shareToast.show && (
                <div className="toast toast-top toast-center z-[200]">
                    <div className="alert alert-success shadow-lg">
                        <span className="material-symbols-outlined">check_circle</span>
                        <span>{shareToast.message}</span>
                    </div>
                </div>
            )}

            {/* Collection Modal */}
            <dialog className={`modal modal-bottom sm:modal-middle ${showCollectionModal ? 'modal-open' : ''}`}>
                <div className="modal-box p-0 overflow-hidden bg-base-100 flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b border-base-200 flex justify-between items-center sticky top-0 bg-base-100 z-10">
                        <h3 className="font-bold text-lg">Save to Collection</h3>
                        <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setShowCollectionModal(false)}>✕</button>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1">
                        {collections.length === 0 ? (
                            <div className="text-center py-8 text-base-content/60">
                                <span className="material-symbols-outlined text-5xl mb-2 opacity-50">folder_off</span>
                                <p>You don't have any collections yet.</p>
                                <p className="text-sm mt-1">Go to Saved Recipes to create one.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {collections.map(c => {
                                    const inCollection = recipeCollections.has(c.id);
                                    return (
                                        <div
                                            key={c.id}
                                            onClick={() => !isSaving && handleToggleCollection(c.id)}
                                            className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${inCollection ? 'border-primary bg-primary/5' : 'border-base-200 hover:bg-base-200/50'
                                                } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-base-200 w-10 h-10 rounded-lg flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-base-content/50">folder</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-base">{c.name}</p>
                                                </div>
                                            </div>

                                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${inCollection ? 'border-primary bg-primary text-primary-content' : 'border-base-300'
                                                }`}>
                                                {inCollection && <span className="material-symbols-outlined text-[16px] font-bold">check</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop" onClick={() => setShowCollectionModal(false)}>
                    <button>close</button>
                </form>
            </dialog>
        </div>

        {showShareCard && (
            <ShareableCard recipe={recipe} onClose={() => setShowShareCard(false)} />
        )}
        </>
    );
};

export default RecipeDetailScreen;
