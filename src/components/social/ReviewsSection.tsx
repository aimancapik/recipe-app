import React, { useEffect, useState, useRef } from 'react';
import { useReviews } from '@/hooks/recipe/useReviews';
import LoadingAnimation from '@/components/common/LoadingAnimation';
import { getAvatarUrl } from '@/constants/avatars';

interface ReviewsSectionProps {
  recipeId: string;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ recipeId }) => {
  const { reviews, loading, fetchReviews } = useReviews();
  
  // Gallery state
  const [gallery, setGallery] = useState<{ photos: string[], startIndex: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchReviews(recipeId);
  }, [recipeId]);

  useEffect(() => {
    if (gallery && scrollRef.current) {
      // Delay slightly to ensure layout is computed before scrolling
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            left: scrollRef.current.clientWidth * gallery.startIndex,
            behavior: 'instant'
          });
          setCurrentIndex(gallery.startIndex);
        }
      }, 10);
    }
  }, [gallery]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.clientWidth > 0) {
      const index = Math.round(el.scrollLeft / el.clientWidth);
      if (index !== currentIndex) {
        setCurrentIndex(index);
      }
    }
  };

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
            {(() => {
              const url = getAvatarUrl(review.user?.avatar_url);
              const initial = (review.user?.full_name || '?').charAt(0).toUpperCase();
              return url ? (
                <img src={url} alt={review.user?.full_name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-content font-black text-base">{initial}</span>
                </div>
              );
            })()}

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
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 hide-scrollbar">
              {review.photos.map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`Review photo ${idx + 1}`}
                  className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                  onClick={() => setGallery({ photos: review.photos!, startIndex: idx })}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Image Gallery Modal */}
      {gallery && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-300"
          onClick={() => setGallery(null)}
        >
          {/* Viewer Header */}
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex flex-col">
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Gallery</span>
              <span className="text-white font-bold text-sm">
                {currentIndex + 1} <span className="text-white/40 font-medium mx-1">/</span> {gallery.photos.length}
              </span>
            </div>
            <button
              className="btn btn-circle btn-sm glass text-white border-none hover:bg-white/20"
              onClick={() => setGallery(null)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Main Gallery Carousel */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <div 
              ref={scrollRef}
              className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
              onScroll={handleScroll}
            >
              {gallery.photos.map((photo, i) => (
                <div 
                  key={i} 
                  className="w-screen h-full flex-none snap-center flex items-center justify-center p-4"
                  onClick={(e) => e.stopPropagation()} 
                >
                  <div className="w-full max-w-5xl h-full flex items-center justify-center">
                    <img 
                      src={photo} 
                      alt={`Gallery photo ${i + 1}`} 
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Overlay dots */}
            {gallery.photos.length > 1 && (
                <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-2 z-50 pointer-events-none">
                    {gallery.photos.map((_, idx) => (
                        <div
                            key={idx}
                            className={`size-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/20'}`}
                        />
                    ))}
                </div>
            )}
          </div>

          {/* Viewer Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center z-50 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
            <h3 className="text-white font-bold text-xl mb-1 text-center">Review Photo</h3>
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">swipe</span>
              Swipe to explore
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;
