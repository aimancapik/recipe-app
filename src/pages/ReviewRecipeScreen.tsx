import React, { useState, useEffect, useRef } from 'react';
import { Recipe } from '@/types';
import { useReviews } from '@/hooks/useReviews';
import LoadingAnimation from '@/components/LoadingAnimation';
import { supabase } from '@/lib/supabase';
import { uploadOptimizedImage } from '@/lib/storage';

interface ReviewRecipeScreenProps {
    recipe: Recipe;
    onBack: () => void;
    onSubmit?: (review: { rating: number; comment: string; photos: string[] }) => void;
}

const ReviewRecipeScreen: React.FC<ReviewRecipeScreenProps> = ({ recipe, onBack, onSubmit }) => {
    const [rating, setRating] = useState(5);
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);
    const [comment, setComment] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
    const [chefName, setChefName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { getUserReview, addReview, updateReview, error } = useReviews();

    // Fetch chef name
    useEffect(() => {
        if (!recipe.userId) return;
        supabase
            .from('profiles')
            .select('full_name')
            .eq('id', recipe.userId)
            .single()
            .then(({ data }) => {
                if (data?.full_name) setChefName(data.full_name);
            });
    }, [recipe.userId]);

    // Check if user has already reviewed this recipe
    useEffect(() => {
        const loadUserReview = async () => {
            const userReview = await getUserReview(recipe.id);
            if (userReview) {
                setRating(userReview.rating);
                setComment(userReview.comment || '');
                setPhotos(userReview.photos || []);
                setExistingReviewId(userReview.id);
            }
        };
        loadUserReview();
    }, [recipe.id]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const remaining = 5 - photos.length;
        const toUpload = files.slice(0, remaining);

        setUploadingPhoto(true);
        try {
            const results = await Promise.all(
                toUpload.map(file => uploadOptimizedImage(file, 'reviews'))
            );
            setPhotos(prev => [...prev, ...results.map(res => res.url)]);
        } catch (err) {
            console.error('Error uploading photo:', err);
        } finally {
            setUploadingPhoto(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removePhoto = (idx: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (existingReviewId) {
                await updateReview(existingReviewId, { rating, comment, photos });
            } else {
                await addReview(recipe.id, { rating, comment, photos });
            }
            onSubmit?.({ rating, comment, photos });
            onBack();
        } catch (err) {
            console.error('Error submitting review:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const displayStars = hoveredStar ?? rating;

    const ratingLabels: Record<number, string> = {
        1: 'Terrible',
        2: 'Not great',
        3: 'It was okay',
        4: 'Pretty good!',
        5: 'Absolutely loved it!',
    };

    return (
        <div className="flex min-h-screen flex-col bg-base-100 font-display">
            <header className="sticky top-0 z-10 bg-base-100/80 backdrop-blur-md border-b border-base-200">
                <div className="flex items-center justify-between p-4 max-w-lg mx-auto w-full">
                    <button
                        onClick={onBack}
                        className="size-10 flex items-center justify-center rounded-full hover:bg-base-200 transition-colors"
                    >
                        <span className="material-symbols-outlined text-base-content">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold tracking-tight">Rate the Recipe</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-8 pb-28">
                {/* Recipe card */}
                <section className="flex items-center gap-4 bg-base-200/60 p-3 rounded-2xl border border-base-200">
                    <div className="size-16 rounded-xl overflow-hidden shrink-0">
                        <img alt={recipe.title} className="w-full h-full object-cover" src={recipe.image} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-base-content/40">Reviewing</span>
                        <h2 className="text-base font-bold leading-tight truncate">{recipe.title}</h2>
                        {chefName && <p className="text-sm text-base-content/50 mt-0.5">by {chefName}</p>}
                    </div>
                </section>

                {/* Star rating */}
                <section className="text-center space-y-3 py-2">
                    <h3 className="text-2xl font-bold">How was it?</h3>
                    <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredStar(star)}
                                onMouseLeave={() => setHoveredStar(null)}
                                onTouchStart={() => setHoveredStar(star)}
                                onTouchEnd={() => { setRating(star); setHoveredStar(null); }}
                                className="p-1 transition-transform active:scale-90"
                            >
                                <span
                                    className={`material-symbols-outlined text-5xl transition-all duration-150 ${star <= displayStars ? 'text-amber-400' : 'text-base-content/20'}`}
                                    style={{ fontVariationSettings: `'FILL' ${star <= displayStars ? 1 : 0}` }}
                                >
                                    star
                                </span>
                            </button>
                        ))}
                    </div>
                    <p className="text-sm font-semibold text-primary h-5">
                        {ratingLabels[displayStars] || ''}
                    </p>
                </section>

                {/* Comment */}
                <section className="space-y-3">
                    <div className="flex justify-between items-end px-1">
                        <label className="text-lg font-bold" htmlFor="comment">Tell us more</label>
                        <span className="text-xs text-base-content/40">Optional</span>
                    </div>
                    <textarea
                        id="comment"
                        className="w-full bg-base-200 border border-base-300 rounded-2xl p-4 text-sm text-base-content focus:outline-none focus:border-primary resize-none min-h-[110px] placeholder:text-base-content/30"
                        placeholder="Was it easy to follow? How did it taste? Any tips for others?"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                        {['Easy to follow', 'Delicious', 'Would make again', 'Pro tip', 'Needs tweaking'].map(tag => (
                            <button
                                key={tag}
                                onClick={() => setComment(prev => prev ? `${prev} ${tag}` : tag)}
                                className="px-3 py-1.5 bg-base-200 text-base-content/70 text-xs font-semibold rounded-full border border-base-300 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Photos */}
                <section className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <h3 className="text-lg font-bold">Show off your creation</h3>
                        <span className="text-[11px] text-base-content/40">{photos.length}/5 photos</span>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoUpload}
                    />

                    <div className="grid grid-cols-3 gap-3">
                        {/* Uploaded photos */}
                        {photos.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-base-200">
                                <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => removePhoto(idx)}
                                    className="absolute top-1.5 right-1.5 size-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-error transition-colors"
                                >
                                    <span className="material-symbols-outlined text-white text-[14px]">close</span>
                                </button>
                            </div>
                        ))}

                        {/* Add photo button */}
                        {photos.length < 5 && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPhoto}
                                className="aspect-square rounded-2xl border-2 border-dashed border-base-300 bg-base-200 flex flex-col items-center justify-center gap-1 hover:bg-base-300 hover:border-primary/40 transition-colors group disabled:opacity-50"
                            >
                                {uploadingPhoto ? (
                                    <span className="loading loading-spinner loading-sm text-primary" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-base-content/40 text-3xl group-hover:text-primary transition-colors">add_a_photo</span>
                                        <span className="text-[11px] font-semibold text-base-content/40 group-hover:text-primary transition-colors">Add Photo</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </section>
            </main>

            {/* Submit button */}
            <div className="fixed bottom-0 left-0 right-0 bg-base-100/90 backdrop-blur-lg border-t border-base-200 p-4 max-w-md mx-auto">
                {error && (
                    <div className="flex items-center gap-2 text-error text-sm mb-3 px-1">
                        <span className="material-symbols-outlined text-[18px]">error</span>
                        <span>{error}</span>
                    </div>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={submitting || uploadingPhoto}
                    className="btn btn-primary w-full h-14 rounded-2xl shadow-lg shadow-primary/20 normal-case text-base font-bold disabled:opacity-60"
                >
                    {submitting ? (
                        <><span className="loading loading-spinner loading-sm" />{existingReviewId ? 'Updating...' : 'Posting...'}</>
                    ) : (
                        <>{existingReviewId ? 'Update Review' : 'Post Review'}<span className="material-symbols-outlined">send</span></>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ReviewRecipeScreen;
