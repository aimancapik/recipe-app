import React, { useEffect } from 'react';
import { useReviews } from '@/hooks/useReviews';
import LoadingAnimation from './LoadingAnimation';

interface ReviewsSectionProps {
  recipeId: string;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ recipeId }) => {
  const { reviews, loading, fetchReviews } = useReviews();

  useEffect(() => {
    fetchReviews(recipeId);
  }, [recipeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingAnimation size={40} />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-6xl text-base-content/20 mb-3">
          reviews
        </span>
        <p className="text-base-content/50 text-sm">No reviews yet</p>
        <p className="text-base-content/40 text-xs mt-1">Be the first to review this recipe!</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-base-content mb-4">
        Reviews ({reviews.length})
      </h3>

      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-base-100 border border-base-200 rounded-2xl p-4 shadow-sm"
        >
          {/* User Info */}
          <div className="flex items-center gap-3 mb-3">
            {review.user?.avatar_url ? (
              <img
                src={review.user.avatar_url}
                alt={review.user.full_name}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent && !parent.querySelector('.default-avatar-review')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center default-avatar-review';
                    fallback.innerHTML = '<span class="material-symbols-outlined text-primary">person</span>';
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
            )}

            <div className="flex-1">
              <p className="font-semibold text-sm text-base-content">
                {review.user?.full_name || 'Anonymous'}
              </p>
              <p className="text-xs text-base-content/50">
                {formatDate(review.created_at)}
              </p>
            </div>

            {/* Rating Stars */}
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`material-symbols-outlined text-lg ${
                    star <= review.rating ? 'text-warning' : 'text-base-content/20'
                  }`}
                  style={{
                    fontVariationSettings: `'FILL' ${star <= review.rating ? 1 : 0}`
                  }}
                >
                  star
                </span>
              ))}
            </div>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-sm text-base-content/80 leading-relaxed">
              {review.comment}
            </p>
          )}

          {/* Photos */}
          {review.photos && review.photos.length > 0 && (
            <div className="flex gap-2 mt-3">
              {review.photos.map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`Review photo ${idx + 1}`}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReviewsSection;
