import React, { useState, useEffect } from 'react';
import { Recipe } from '@/types';
import { useReviews } from '@/hooks/useReviews';
import LoadingAnimation from '@/components/LoadingAnimation';

interface ReviewRecipeScreenProps {
    recipe: Recipe;
    onBack: () => void;
    onSubmit?: (review: { rating: number; comment: string; photos: string[] }) => void;
}

const ReviewRecipeScreen: React.FC<ReviewRecipeScreenProps> = ({ recipe, onBack, onSubmit }) => {
    const [rating, setRating] = useState(4);
    const [comment, setComment] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [existingReviewId, setExistingReviewId] = useState<string | null>(null);

    const { getUserReview, addReview, updateReview, error } = useReviews();

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

    const handleRating = (value: number) => {
        setRating(value);
    };

    const handleSubmit = async () => {
        setSubmitting(true);

        try {
            if (existingReviewId) {
                // Update existing review
                await updateReview(existingReviewId, { rating, comment, photos });
            } else {
                // Add new review
                await addReview(recipe.id, { rating, comment, photos });
            }

            // Call optional onSubmit callback
            onSubmit?.({ rating, comment, photos });

            // Go back on success
            onBack();
        } catch (err) {
            console.error('Error submitting review:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-base-100 font-display">
            <header className="sticky top-0 z-10 bg-base-100/80 backdrop-blur-md border-b border-base-200">
                <div className="flex items-center justify-between p-4 max-w-lg mx-auto w-full">
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center p-2 rounded-full hover:bg-base-200 transition-colors"
                    >
                        <span className="material-symbols-outlined text-base-content">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold tracking-tight">Rate the Recipe</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-8 pb-24">
                <section className="flex items-center gap-4 bg-base-200 p-3 rounded-xl shadow-sm border border-base-300">
                    <div className="size-20 rounded-lg overflow-hidden shrink-0">
                        <img
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                            src={recipe.image}
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">Reviewing</span>
                        <h2 className="text-xl font-bold leading-tight">{recipe.title}</h2>
                        <p className="text-sm text-base-content/60">by Chef Mario</p>
                    </div>
                </section>

                <section className="text-center space-y-4">
                    <div className="text-center space-y-4 py-4">
                        <h3 className="text-2xl font-bold text-base-content">How was it?</h3>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    onClick={() => handleRating(star)}
                                    className={`material-symbols-outlined text-5xl cursor-pointer transition-all ${star <= rating ? 'text-primary' : 'text-base-content/20'
                                        } ${star <= rating ? 'filled-star' : ''}`}
                                    style={{
                                        fontVariationSettings: `'FILL' ${star <= rating ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`
                                    }}
                                >
                                    star
                                </span>
                            ))}
                        </div>
                        <p className="text-sm font-medium text-base-content/40">Tap to rate your experience</p>
                    </div>
                </section>

                <section className="space-y-3">
                    <div className="flex justify-between items-end px-1">
                        <label className="text-lg font-bold" htmlFor="comment">Tell us more</label>
                        <span className="text-xs text-base-content/40 mb-1">Optional</span>
                    </div>
                    <div className="relative">
                        <textarea
                            className="textarea textarea-bordered w-full bg-base-200 border-none rounded-2xl p-4 text-base-content focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-base-content/40 min-h-[120px]"
                            id="comment"
                            placeholder="Was it easy to follow? How did it taste? Any tips for others?"
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 px-1">
                        {['Easy to follow', 'Delicious', 'Pro tip'].map(tag => (
                            <span
                                key={tag}
                                className="px-3 py-1 bg-primary/10 text-base-content text-xs font-medium rounded-full border border-primary/20 hover:bg-primary/20 cursor-pointer transition-colors"
                                onClick={() => setComment(prev => prev + (prev ? ' ' : '') + tag)}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <h3 className="text-lg font-bold text-base-content/70">Show off your creation</h3>
                        <span className="text-[11px] font-medium text-base-content/40">Up to 5 photos</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <button className="aspect-square rounded-2xl border-2 border-dashed border-base-300 bg-base-200 flex flex-col items-center justify-center gap-1 hover:bg-base-300 transition-colors group">
                            <span className="material-symbols-outlined text-base-content/40 text-3xl group-hover:text-primary transition-colors">add_a_photo</span>
                            <span className="text-[11px] font-semibold text-base-content/40">Add Photo</span>
                        </button>
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="aspect-square rounded-2xl bg-base-200 border border-base-300 animate-pulse"></div>
                        ))}
                    </div>
                </section>
            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-base-100/80 backdrop-blur-lg border-t border-base-200 p-4 max-w-md mx-auto">
                {error && (
                    <div className="alert alert-error mb-3 text-sm">
                        <span className="material-symbols-outlined">error</span>
                        <span>{error}</span>
                    </div>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn btn-primary w-full h-14 rounded-2xl shadow-lg shadow-primary/20 normal-case text-lg font-bold"
                >
                    {submitting ? (
                        <>
                            <LoadingAnimation size={24} />
                            {existingReviewId ? 'Updating...' : 'Posting...'}
                        </>
                    ) : (
                        <>
                            {existingReviewId ? 'Update Review' : 'Post Review'}
                            <span className="material-symbols-outlined font-bold">send</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ReviewRecipeScreen;
