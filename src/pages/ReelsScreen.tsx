import React, { useState, useRef, useEffect } from 'react';
import { Recipe } from '@/types';
import { supabase } from '@/lib/supabase';

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
  const [chefProfiles, setChefProfiles] = useState<Record<string, { full_name: string; avatar_url: string }>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  // Filter recipes that have video content (either video cover or video in first direction step)
  const videoRecipes = recipes.filter(recipe => {
    const isVideo = (url: string | undefined) => {
      if (!url) return false;
      const lowerUrl = url.toLowerCase();
      return lowerUrl.includes('.mp4') ||
        lowerUrl.includes('.webm') ||
        lowerUrl.includes('.mov') ||
        lowerUrl.includes('youtube') ||
        lowerUrl.includes('vimeo') ||
        lowerUrl.includes('video/') || // For data URIs e.g., data:video/mp4
        // Supabase storage URLs for videos often contain content type headers or we can guess by presence of video keyword
        lowerUrl.includes('video%2F'); // URL encoded contentType
    };

    const hasVideoPrimary = isVideo(recipe.image);
    const hasVideoInGallery = recipe.images?.some(img => isVideo(img)) || false;
    const hasVideoInSteps = recipe.directions?.some(dir => dir.mediaType === 'video') || false;

    return hasVideoPrimary || hasVideoInGallery || hasVideoInSteps;
  });

  const currentRecipe = videoRecipes[currentIndex];

  // Get video URL from recipe
  const getVideoUrl = (recipe: Recipe): string => {
    const isVideo = (url: string | undefined) => {
      if (!url) return false;
      const lowerUrl = url.toLowerCase();
      return lowerUrl.includes('.mp4') ||
        lowerUrl.includes('.webm') ||
        lowerUrl.includes('.mov') ||
        lowerUrl.includes('video/') ||
        lowerUrl.includes('video%2F');
    };

    // Check main image
    if (isVideo(recipe.image)) return recipe.image;

    // Check gallery images
    const galleryVideo = recipe.images?.find(img => isVideo(img));
    if (galleryVideo) return galleryVideo;

    // Check steps
    const videoStep = recipe.directions?.find(dir => dir.mediaType === 'video');
    return videoStep?.image || recipe.image;
  };

  // Fetch chef profile when current recipe changes
  useEffect(() => {
    if (!currentRecipe?.userId || chefProfiles[currentRecipe.userId]) return;

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', currentRecipe.userId)
          .single();

        if (data && !error) {
          setChefProfiles(prev => ({
            ...prev,
            [currentRecipe.userId!]: data
          }));
        }
      } catch (err) {
        console.error('Error fetching chef profile config', err);
      }
    };

    fetchProfile();
  }, [currentRecipe?.userId]);

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
            (() => {
              const url = getVideoUrl(currentRecipe);
              const lowerUrl = url?.toLowerCase() || '';
              const isDefinitelyVideo = lowerUrl.includes('.mp4') ||
                lowerUrl.includes('.webm') ||
                lowerUrl.includes('.mov') ||
                lowerUrl.includes('video/') ||
                lowerUrl.includes('video%2F') ||
                currentRecipe.directions?.some(d => d.mediaType === 'video' && d.image === url);

              if (isDefinitelyVideo) {
                return (
                  <video
                    ref={(el) => { if (el) videoRefs.current.set(currentIndex, el); }}
                    src={url}
                    className="h-full w-full object-contain"
                    loop
                    playsInline
                    muted={false}
                    autoPlay
                  />
                );
              }

              // Fallback to image if video fails or is not a recognized video
              return (
                <img
                  src={currentRecipe.image}
                  alt={currentRecipe.title}
                  className="h-full w-full object-cover"
                />
              );
            })()
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

          {/* Save to Collection (Placeholder, currently no prop passed for this on ReelsScreen, can implement a toast or real collection logic) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              alert("Save to collection coming soon to Reels!");
            }}
            className="flex flex-col items-center gap-1"
          >
            <div className="btn btn-circle btn-lg bg-base-content/20 border-none hover:bg-base-content/30 backdrop-blur-sm">
              <span className={`material-symbols-outlined text-3xl text-white`}>
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
                onProfileClick?.(currentRecipe.userId!);
              }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="avatar">
                <div className="w-10 h-10 rounded-full bg-base-200 overflow-hidden flex items-center justify-center">
                  {chefProfiles[currentRecipe.userId]?.avatar_url ? (
                    <img src={chefProfiles[currentRecipe.userId].avatar_url} alt="Chef" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-2xl text-base-content/50">
                      person
                    </span>
                  )}
                </div>
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-sm drop-shadow-md">
                  {chefProfiles[currentRecipe.userId]?.full_name || 'Chef'}
                </p>
                <p className="text-white/80 text-xs drop-shadow-md">
                  @{chefProfiles[currentRecipe.userId]?.full_name?.toLowerCase().replace(/\s+/g, '_') || 'chef'}
                </p>
              </div>
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
              className={`h-0.5 flex-1 rounded-full transition-all ${idx === currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReelsScreen;
