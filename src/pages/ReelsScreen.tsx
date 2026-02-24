import React, { useState, useRef, useEffect } from 'react';
import { Recipe } from '@/types';

interface ReelsScreenProps {
  recipes: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
  onProfileClick?: (userId: string) => void;
}

const ReelsScreen: React.FC<ReelsScreenProps> = ({
  recipes,
  onRecipeClick,
  onToggleFavorite,
  onBack,
  onProfileClick
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  // Filter recipes that have video content (either video cover or video in first direction step)
  const videoRecipes = recipes.filter(recipe => {
    const hasVideoImage = recipe.image?.includes('.mp4') || recipe.image?.includes('.webm') ||
                         recipe.image?.includes('.mov') || recipe.image?.includes('youtube') ||
                         recipe.image?.includes('vimeo');
    const hasVideoInSteps = recipe.directions?.some(dir => dir.mediaType === 'video');
    return hasVideoImage || hasVideoInSteps;
  });

  const currentRecipe = videoRecipes[currentIndex];

  // Get video URL from recipe
  const getVideoUrl = (recipe: Recipe): string => {
    // Check if main image is a video
    const imageIsVideo = recipe.image?.includes('.mp4') || recipe.image?.includes('.webm') ||
                        recipe.image?.includes('.mov');
    if (imageIsVideo) return recipe.image;

    // Otherwise get video from first direction with video
    const videoStep = recipe.directions?.find(dir => dir.mediaType === 'video');
    return videoStep?.image || recipe.image;
  };

  // Handle swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && currentIndex < videoRecipes.length - 1) {
        // Swipe up - next reel
        goToReel(currentIndex + 1);
      } else if (swipeDistance < 0 && currentIndex > 0) {
        // Swipe down - previous reel
        goToReel(currentIndex - 1);
      }
    }

    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  const goToReel = (index: number) => {
    // Pause current video
    const currentVideo = videoRefs.current.get(currentIndex);
    if (currentVideo) currentVideo.pause();

    setCurrentIndex(index);
    setIsPlaying(true);
  };

  // Play/pause video when index changes or isPlaying changes
  useEffect(() => {
    const video = videoRefs.current.get(currentIndex);
    if (video) {
      if (isPlaying) {
        video.play().catch(err => console.log('Video play error:', err));
      } else {
        video.pause();
      }
    }
  }, [currentIndex, isPlaying]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        goToReel(currentIndex - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < videoRecipes.length - 1) {
        goToReel(currentIndex + 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.key === 'Escape') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videoRecipes.length, onBack]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentRecipe.title,
        text: `Check out this recipe: ${currentRecipe.title}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (videoRecipes.length === 0) {
    return (
      <div className="fixed inset-0 bg-base-100 flex flex-col items-center justify-center p-8">
        <span className="material-symbols-outlined text-6xl text-base-content/20 mb-4">
          video_library
        </span>
        <h2 className="text-xl font-bold text-base-content/60 mb-2">No Recipe Reels Yet</h2>
        <p className="text-base-content/40 text-center mb-6">
          Recipe videos will appear here when users upload video recipes
        </p>
        <button onClick={onBack} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video Container */}
      <div className="relative h-full w-full">
        {/* Main Video */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          onClick={togglePlayPause}
        >
          {currentRecipe && (
            getVideoUrl(currentRecipe).includes('.mp4') ||
            getVideoUrl(currentRecipe).includes('.webm') ||
            getVideoUrl(currentRecipe).includes('.mov') ? (
              <video
                ref={(el) => el && videoRefs.current.set(currentIndex, el)}
                src={getVideoUrl(currentRecipe)}
                className="h-full w-full object-contain"
                loop
                playsInline
                muted={false}
                autoPlay
              />
            ) : (
              // Fallback to image if video fails
              <img
                src={currentRecipe.image}
                alt={currentRecipe.title}
                className="h-full w-full object-cover"
              />
            )
          )}
        </div>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <button
            onClick={onBack}
            className="btn btn-circle btn-ghost btn-sm text-white hover:bg-white/20"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="text-white text-sm font-semibold">
            Recipe Reels
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Right Side Actions */}
        <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10">
          {/* Like/Favorite */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(currentRecipe.id);
            }}
            className="flex flex-col items-center gap-1"
          >
            <div className="btn btn-circle btn-lg bg-base-content/20 border-none hover:bg-base-content/30 backdrop-blur-sm">
              <span className={`material-symbols-outlined text-3xl ${currentRecipe.isFavorite ? 'fill-1 text-error' : 'text-white'}`}>
                favorite
              </span>
            </div>
            <span className="text-white text-xs font-semibold">
              {currentRecipe.reviews || 0}
            </span>
          </button>

          {/* Comment/Reviews */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRecipeClick(currentRecipe);
            }}
            className="flex flex-col items-center gap-1"
          >
            <div className="btn btn-circle btn-lg bg-base-content/20 border-none hover:bg-base-content/30 backdrop-blur-sm">
              <span className="material-symbols-outlined text-3xl text-white">
                chat_bubble
              </span>
            </div>
            <span className="text-white text-xs font-semibold">
              {currentRecipe.reviews}
            </span>
          </button>

          {/* Save to Collection */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(currentRecipe.id);
            }}
            className="flex flex-col items-center gap-1"
          >
            <div className="btn btn-circle btn-lg bg-base-content/20 border-none hover:bg-base-content/30 backdrop-blur-sm">
              <span className={`material-symbols-outlined text-3xl ${currentRecipe.isFavorite ? 'fill-1 text-primary' : 'text-white'}`}>
                bookmark
              </span>
            </div>
            <span className="text-white text-xs font-semibold">Save</span>
          </button>

          {/* Share */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="flex flex-col items-center gap-1"
          >
            <div className="btn btn-circle btn-lg bg-base-content/20 border-none hover:bg-base-content/30 backdrop-blur-sm">
              <span className="material-symbols-outlined text-3xl text-white">
                share
              </span>
            </div>
            <span className="text-white text-xs font-semibold">Share</span>
          </button>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-20 p-6 z-10">
          {/* Chef Info */}
          {currentRecipe.userId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onProfileClick?.(currentRecipe.userId);
              }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="avatar">
                <div className="w-10 h-10 rounded-full bg-base-200">
                  <span className="material-symbols-outlined text-2xl">
                    person
                  </span>
                </div>
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-sm">Chef Name</p>
                <p className="text-white/60 text-xs">@chef_username</p>
              </div>
              <button className="btn btn-primary btn-sm ml-2">Follow</button>
            </button>
          )}

          {/* Recipe Info */}
          <h2 className="text-white font-bold text-xl mb-2 line-clamp-2">
            {currentRecipe.title}
          </h2>
          {currentRecipe.description && (
            <p className="text-white/80 text-sm line-clamp-2 mb-3">
              {currentRecipe.description}
            </p>
          )}

          {/* Recipe Stats */}
          <div className="flex items-center gap-4 text-white/70 text-xs">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {currentRecipe.prepTime}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">star</span>
              {currentRecipe.rating}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">local_fire_department</span>
              {currentRecipe.kcal} kcal
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">restaurant</span>
              {currentRecipe.level}
            </span>
          </div>

          {/* View Full Recipe Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRecipeClick(currentRecipe);
            }}
            className="btn btn-primary btn-sm mt-4 w-full"
          >
            View Full Recipe
          </button>
        </div>

        {/* Play/Pause Indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 rounded-full p-6 backdrop-blur-sm">
              <span className="material-symbols-outlined text-white text-6xl">
                play_arrow
              </span>
            </div>
          </div>
        )}

        {/* Navigation Hints */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 flex flex-col items-center gap-2 z-10 pointer-events-none">
          <div className="text-white/40 text-xs flex items-center gap-2">
            {currentIndex < videoRecipes.length - 1 && (
              <span className="animate-bounce">Swipe up for more ↑</span>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="absolute top-20 left-4 right-4 flex gap-1 z-10">
          {videoRecipes.map((_, idx) => (
            <div
              key={idx}
              className={`h-0.5 flex-1 rounded-full transition-all ${
                idx === currentIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReelsScreen;
