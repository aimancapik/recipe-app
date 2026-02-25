import React, { useState, useRef, useEffect } from 'react';
import { Recipe } from '@/types';
import { supabase } from '@/lib/supabase';
import { useCollections } from '@/hooks/useCollections';
import { useAuth } from '@/hooks/useAuth';

interface BitesScreenProps {
  recipes: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
  onProfileClick?: (userId: string) => void;
}

const BitesScreen: React.FC<BitesScreenProps> = ({
  recipes,
  onRecipeClick,
  onToggleFavorite,
  onBack,
  onProfileClick
}) => {
  const { user } = useAuth();
  const { collections, fetchCollections, addRecipeToCollection, removeRecipeFromCollection, isRecipeInCollection } = useCollections();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [chefProfiles, setChefProfiles] = useState<Record<string, { full_name: string; avatar_url: string }>>({});
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [recipeCollections, setRecipeCollections] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

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
        lowerUrl.includes('youtube') ||
        lowerUrl.includes('vimeo') ||
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

  // Fetch collections on mount when user is logged in
  useEffect(() => {
    if (user) {
      fetchCollections();
    }
  }, [user, fetchCollections]);

  // Check which collections contain current recipe when modal opens
  useEffect(() => {
    const checkCollections = async () => {
      const inCollections = new Set<string>();
      for (const c of collections) {
        const isThere = await isRecipeInCollection(c.id, currentRecipe.id);
        if (isThere) inCollections.add(c.id);
      }
      setRecipeCollections(inCollections);
    };
    if (collections.length > 0 && showCollectionModal && currentRecipe) {
      checkCollections();
    }
  }, [collections, currentRecipe?.id, showCollectionModal, isRecipeInCollection]);

  const handleToggleCollection = async (collectionId: string) => {
    try {
      setIsSaving(true);
      if (recipeCollections.has(collectionId)) {
        await removeRecipeFromCollection(collectionId, currentRecipe.id);
        setRecipeCollections(prev => {
          const next = new Set(prev);
          next.delete(collectionId);
          return next;
        });
      } else {
        await addRecipeToCollection(collectionId, currentRecipe.id);
        setRecipeCollections(prev => new Set(prev).add(collectionId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
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
        // Swipe up - next bite
        goToBite(currentIndex + 1);
      } else if (swipeDistance < 0 && currentIndex > 0) {
        // Swipe down - previous bite
        goToBite(currentIndex - 1);
      }
    }

    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  const goToBite = (index: number) => {
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
        goToBite(currentIndex - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < videoRecipes.length - 1) {
        goToBite(currentIndex + 1);
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

  const isRecipeSaved = recipeCollections.size > 0;

  if (videoRecipes.length === 0) {
    return (
      <div className="fixed inset-0 bg-base-100 flex flex-col items-center justify-center p-8">
        <span className="material-symbols-outlined text-6xl text-base-content/20 mb-4">
          video_library
        </span>
        <h2 className="text-xl font-bold text-base-content/60 mb-2">No Recipe Bites Yet</h2>
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
                lowerUrl.includes('youtube.com/') ||
                lowerUrl.includes('youtu.be/') ||
                lowerUrl.includes('vimeo.com/') ||
                lowerUrl.includes('video/') ||
                lowerUrl.includes('video%2F') ||
                currentRecipe.directions?.some(d => d.mediaType === 'video' && d.image === url);

              const isYouTube = lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be');

              if (isDefinitelyVideo) {
                if (isYouTube) {
                  // Extract YouTube ID
                  let videoId = '';
                  if (lowerUrl.includes('youtube.com/watch')) {
                    videoId = url.split('v=')[1]?.split('&')[0];
                  } else if (lowerUrl.includes('youtu.be/')) {
                    videoId = url.split('youtu.be/')[1]?.split('?')[0];
                  } else if (lowerUrl.includes('youtube.com/embed/')) {
                    videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
                  } else if (lowerUrl.includes('youtube.com/shorts/')) {
                    videoId = url.split('shorts/')[1]?.split('?')[0];
                  }

                  if (videoId) {
                    return (
                      <div className="h-full w-full bg-black flex items-center justify-center">
                        <iframe
                          className="w-full aspect-video max-h-full"
                          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&rel=0&playlist=${videoId}`}
                          title={currentRecipe.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    );
                  }
                }

                return (
                  <video
                    ref={(el) => { if (el) videoRefs.current.set(currentIndex, el); }}
                    src={url}
                    className="h-full w-full object-contain"
                    loop
                    playsInline
                    muted={true}
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
            Recipe Bites
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
              if (!user) {
                alert('Please log in to save recipes to collections.');
                return;
              }
              setShowCollectionModal(true);
            }}
            className="flex flex-col items-center gap-1"
          >
            <div className="btn btn-circle btn-lg bg-base-content/20 border-none hover:bg-base-content/30 backdrop-blur-sm">
              <span className={`material-symbols-outlined text-3xl ${isRecipeSaved ? 'fill-1 text-primary' : 'text-white'}`}>
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
            <div className="bg-black/50 rounded-full w-20 h-20 flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-white text-5xl">
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


      </div>

      {/* Collection Modal */}
      <dialog className={`modal modal-bottom sm:modal-middle ${showCollectionModal ? 'modal-open' : ''}`} style={{ zIndex: 60 }}>
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
  );
};

export default BitesScreen;
