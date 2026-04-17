import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Recipe } from '@/types';
import { supabase } from '@/lib/supabase';
import { useCollections } from '@/hooks/recipe/useCollections';
import { useAuth } from '@/hooks/auth/useAuth';
import { getAvatarUrl } from '@/constants/avatars';
import { getNormalizedVideoUrl } from '@/utils/mediaHelpers';
import CommentsSection from '@/components/social/CommentsSection';

interface BitesScreenProps {
  recipes: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
  onProfileClick?: (userId: string) => void;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const VIDEO_EXTS = ['.mp4', '.webm', '.mov', 'video/', 'video%2f'];
const isVideoUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const low = url.toLowerCase();
  return (
    VIDEO_EXTS.some(ext => low.includes(ext)) ||
    low.includes('youtube.com') ||
    low.includes('youtu.be') ||
    low.includes('vimeo.com') ||
    low.includes('tiktok.com')
  );
};

const getVideoUrl = (recipe: Recipe): string => {
  if (isVideoUrl(recipe.image)) return recipe.image;
  const galleryVideo = recipe.images?.find(isVideoUrl);
  if (galleryVideo) return galleryVideo;
  const stepVideo = recipe.directions?.find(d => d.mediaType === 'video' && d.image);
  return stepVideo?.image ?? recipe.image;
};

const extractYouTubeId = (url: string): string | null => {
  const low = url.toLowerCase();
  if (low.includes('youtube.com/watch')) return url.split('v=')[1]?.split('&')[0] ?? null;
  if (low.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0] ?? null;
  if (low.includes('youtube.com/embed/')) return url.split('embed/')[1]?.split('?')[0] ?? null;
  if (low.includes('youtube.com/shorts/')) return url.split('shorts/')[1]?.split('?')[0] ?? null;
  return null;
};

// TikTok: only full URLs with /video/ID are embeddable; vm.tiktok.com short links are not
const extractTikTokId = (url: string): string | null => {
  const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i);
  return match?.[1] ?? null;
};

// ─── sub-components ────────────────────────────────────────────────────────────

interface VideoSlideProps {
  recipe: Recipe;
  isActive: boolean;
  isMuted: boolean;
  onToggleFavorite: (id: string) => void;
  onRecipeClick: (recipe: Recipe) => void;
  onProfileClick?: (userId: string) => void;
  chefProfile?: { full_name: string; avatar_url: string };
  onToggleMute: () => void;
  onOpenCollection: () => void;
  isRecipeSaved: boolean;
  shouldPreload: boolean;
  onOpenComments: (recipeId: string) => void;
  commentCount?: number;
}

// Load YouTube IFrame API once
function loadYTApi(): Promise<void> {
  if ((window as any).YT?.Player) return Promise.resolve();
  return new Promise(resolve => {
    if (document.getElementById('yt-api-script')) {
      // Script already injected, wait for it
      const interval = setInterval(() => {
        if ((window as any).YT?.Player) { clearInterval(interval); resolve(); }
      }, 100);
      return;
    }
    (window as any).onYouTubeIframeAPIReady = resolve;
    const s = document.createElement('script');
    s.id = 'yt-api-script';
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });
}

const VideoSlide: React.FC<VideoSlideProps> = ({
  recipe,
  isActive,
  isMuted,
  onToggleFavorite,
  onRecipeClick,
  onProfileClick,
  chefProfile,
  onToggleMute,
  onOpenCollection,
  isRecipeSaved,
  shouldPreload,
  onOpenComments,
  commentCount,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);

  const videoUrl = getVideoUrl(recipe) || '';
  const isYouTube = videoUrl.toLowerCase().includes('youtube.com') || videoUrl.toLowerCase().includes('youtu.be');
  const isTikTok = videoUrl.toLowerCase().includes('tiktok.com');
  const youtubeId = isYouTube ? extractYouTubeId(videoUrl) : null;
  const tiktokId = isTikTok ? extractTikTokId(videoUrl) : null;
  const isActualVideo = isVideoUrl(videoUrl);

  const [tiktokThumb, setTiktokThumb] = useState<string | null>(null);
  useEffect(() => {
    if (!isTikTok || !videoUrl) return;
    fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`)
      .then(r => r.json())
      .then(d => { if (d.thumbnail_url) setTiktokThumb(d.thumbnail_url); })
      .catch(() => {});
  }, [isTikTok, videoUrl]);

  // Init YouTube IFrame API player
  useEffect(() => {
    if (!youtubeId || !ytContainerRef.current) return;
    let destroyed = false;
    loadYTApi().then(() => {
      if (destroyed || !ytContainerRef.current) return;
      ytPlayerRef.current = new (window as any).YT.Player(ytContainerRef.current, {
        videoId: youtubeId,
        playerVars: {
          autoplay: 0,
          mute: 1,
          loop: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playlist: youtubeId,
        },
        events: {
          onReady: (e: any) => {
            if (isMuted) e.target.mute(); else e.target.unMute();
            if (isActive) e.target.playVideo();
          },
        },
      });
    });
    return () => {
      destroyed = true;
      ytPlayerRef.current?.destroy?.();
      ytPlayerRef.current = null;
    };
  // Only create player once per youtubeId
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  // Auto play/pause on active state
  useEffect(() => {
    if (youtubeId) {
      const p = ytPlayerRef.current;
      if (!p?.playVideo) return;
      if (isActive) p.playVideo();
      else p.pauseVideo();
      return;
    }
    const vid = videoRef.current;
    if (!vid) return;

    if (isActive) {
      vid.currentTime = 0;
      setIsPausedByUser(false);
      vid.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      vid.pause();
      setIsPlaying(false);
      setProgress(0);
    }
  }, [isActive, youtubeId]);

  // Sync mute — YouTube via API, native via ref
  useEffect(() => {
    if (youtubeId) {
      const p = ytPlayerRef.current;
      if (!p?.mute) return;
      if (isMuted) p.mute(); else p.unMute();
      return;
    }
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted, youtubeId]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(Number.isFinite(p) ? p : 0);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: recipe.title,
      text: `Check out this recipe: ${recipe.title}`,
      url: `${window.location.origin}/recipe/${recipe.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Recipe link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap → like
      setShowHeart(true);
      onToggleFavorite(recipe.id);
      setTimeout(() => setShowHeart(false), 900);
    } else {
      // Single tap → play/pause (native video only)
      if (!isYouTube && videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
          setIsPausedByUser(true);
        } else {
          setIsPausedByUser(false);
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }
    }
    lastTapRef.current = now;
  };

  return (
    <div className="relative w-full h-full flex-shrink-0 overflow-hidden bg-black">
      {/* ── Media layer ─────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        onClick={handleTap}
        style={{ zIndex: 1 }}
        aria-label="Tap to play/pause, double tap to like"
      >
        {isActualVideo && youtubeId ? (
          <div className="w-full h-full">
            <div ref={ytContainerRef} className="w-full h-full" />
          </div>
        ) : isActualVideo && isTikTok ? (
          <div className="w-full h-full relative bg-black flex items-center justify-center">
            {tiktokThumb
              ? <img src={tiktokThumb} alt={recipe.title} className="w-full h-full object-cover" />
              : <span className="material-symbols-outlined text-white/20" style={{ fontSize: 72 }}>tiktok</span>
            }
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40" />
            {/* Open in TikTok button */}
            <button
              onClick={(e) => { e.stopPropagation(); window.open(videoUrl, '_blank'); }}
              className="absolute flex flex-col items-center gap-2 z-10"
            >
              <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white" style={{ fontSize: 40 }}>play_circle</span>
              </div>
              <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Watch on TikTok</span>
            </button>
          </div>
        ) : isActualVideo ? (
          <video
            ref={videoRef}
            src={getNormalizedVideoUrl(videoUrl)}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={isMuted}
            preload={shouldPreload ? 'auto' : 'metadata'}
            onTimeUpdate={handleTimeUpdate}
          />
        ) : (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* ── Gradient overlays ────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.75) 100%)',
          zIndex: 2,
        }}
      />

      {/* ── Double-tap heart ─────────────────────────────────── */}
      {showHeart && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 10 }}
        >
          <span
            className="material-symbols-outlined fill-1 text-red-500"
            style={{
              fontSize: 96,
              animation: 'bites-heart 0.7s ease-out forwards',
              filter: 'drop-shadow(0 0 16px rgba(239,68,68,0.6))',
            }}
          >
            favorite
          </span>
        </div>
      )}

      {/* ── Pause indicator ──────────────────────────────────── */}
      {!isPlaying && isPausedByUser && !isYouTube && isActive && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 9 }}
        >
          <div className="bg-black/50 rounded-full w-20 h-20 flex items-center justify-center backdrop-blur-sm shadow-2xl">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 48 }}>play_arrow</span>
          </div>
        </div>
      )}

      {/* ── Right action rail ────────────────────────────────── */}
      <div
        className="absolute right-3 flex flex-col items-center gap-5"
        style={{ bottom: 100, zIndex: 5 }}
      >
        {/* Like */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id); }}
          className="flex flex-col items-center gap-1 group"
          aria-label="Like recipe"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-active:scale-90 transition-transform">
            <span className={`material-symbols-outlined ${recipe.isFavorite ? 'fill-1 text-red-500' : 'text-white'}`} style={{ fontSize: 26 }}>
              favorite
            </span>
          </div>
          <span className="text-[11px] text-white/90 font-medium font-mono">
            {((recipe.reviews || 0) * 12) + (recipe.isFavorite ? 1 : 0)}
          </span>
        </button>

        {/* Comment */}
        <button
          onClick={(e) => { e.stopPropagation(); onOpenComments(recipe.id); }}
          className="flex flex-col items-center gap-1 group"
          aria-label="View Q&A"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 26 }}>chat_bubble</span>
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow-lg">{commentCount ?? recipe.reviews ?? 0}</span>
        </button>

        {/* Save */}
        <button
          onClick={(e) => { e.stopPropagation(); onOpenCollection(); }}
          className="flex flex-col items-center gap-1"
          aria-label="Save to collection"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10">
            <span className={`material-symbols-outlined ${isRecipeSaved ? 'fill-1 text-yellow-300' : 'text-white'}`} style={{ fontSize: 24 }}>
              bookmark
            </span>
          </div>
          <span className="text-white text-[11px] font-semibold drop-shadow">Save</span>
        </button>

        {/* Share */}
        <button
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
          className="flex flex-col items-center gap-1 group"
          aria-label="Share recipe"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 26 }}>share</span>
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow-lg">Share</span>
        </button>

        {/* Mute toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="flex flex-col items-center gap-1 group"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 26 }}>
              {isMuted ? 'volume_off' : 'volume_up'}
            </span>
          </div>
        </button>
      </div>

      {/* ── Bottom info ──────────────────────────────────────── */}
      <div
        className="absolute left-0 right-16 px-4 pb-6"
        style={{ bottom: 0, zIndex: 5 }}
      >
        {/* Chef */}
        {recipe.userId && (
          <button
            onClick={(e) => { e.stopPropagation(); onProfileClick?.(recipe.userId!); }}
            className="flex items-center gap-2 mb-3 relative z-[20] active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary flex items-center justify-center ring-2 ring-white/40 shadow-lg">
              {(() => {
                const url = getAvatarUrl(chefProfile?.avatar_url);
                return url
                  ? <img src={url} alt="Chef" className="w-full h-full object-cover" />
                  : <span className="text-primary-content font-black text-sm">{(chefProfile?.full_name || '?')[0].toUpperCase()}</span>;
              })()}
            </div>
            <div className="text-left drop-shadow-lg">
              <p className="text-white font-bold text-sm leading-tight">
                {chefProfile?.full_name ?? 'Chef'}
              </p>
              <p className="text-white/80 text-[10px] leading-tight">
                @{(chefProfile?.full_name ?? 'chef').toLowerCase().replace(/\s+/g, '_')}
              </p>
            </div>
          </button>
        )}

        {/* Title */}
        <h2 className="text-white font-extrabold text-lg mb-1 leading-snug" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          {recipe.title}
        </h2>

        {recipe.description && (
          <p className="text-white/75 text-sm line-clamp-2 mb-2 leading-snug">
            {recipe.description}
          </p>
        )}

        {/* Stats pills */}
        <div className="flex items-center flex-wrap gap-2 mb-3">
          {[
            { icon: 'schedule', value: recipe.prepTime },
            { icon: 'star', value: recipe.rating.toFixed(1) },
            { icon: 'local_fire_department', value: `${recipe.kcal} kcal` },
            { icon: 'restaurant', value: recipe.level },
          ].map(({ icon, value }) => (
            <span
              key={icon}
              className="flex items-center gap-1 text-white/90 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{icon}</span>
              {value}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); onRecipeClick(recipe); }}
          className="btn btn-primary btn-sm w-full font-bold"
          style={{ borderRadius: 12 }}
        >
          View Full Recipe
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
        </button>
      </div>

      {/* ── Progress Bar ─────────────────────────────────────── */}
      {isActive && !isYouTube && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/20 z-[10]">
          <div
            className="h-full bg-primary transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

const BitesScreen: React.FC<BitesScreenProps> = ({
  recipes,
  onRecipeClick,
  onToggleFavorite,
  onBack,
  onProfileClick,
  initialIndex = 0,
  onIndexChange,
  onLoadMore,
  loadingMore,
  hasMore = true,
}) => {
  const { user } = useAuth();
  const { collections, fetchCollections, addRecipeToCollection, removeRecipeFromCollection, isRecipeInCollection } = useCollections();

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [chefProfiles, setChefProfiles] = useState<Record<string, { full_name: string; avatar_url: string }>>({});
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [commentRecipeId, setCommentRecipeId] = useState<string | null>(null);
  const [activeCommentCount, setActiveCommentCount] = useState(0);
  const [localCommentCounts, setLocalCommentCounts] = useState<Record<string, number>>({});

  // Sync initial count when drawer opens
  useEffect(() => {
    if (commentRecipeId) {
      const recipe = recipes.find(r => r.id === commentRecipeId);
      const currentCount = localCommentCounts[commentRecipeId] ?? recipe?.reviews ?? 0;
      setActiveCommentCount(currentCount);
    }
  }, [commentRecipeId, recipes, localCommentCounts]);
  const [recipeCollections, setRecipeCollections] = useState<Set<string>>(new Set());
  const [allSavedRecipeIds, setAllSavedRecipeIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Filter to video-only recipes
  const videoRecipes = recipes.filter(r =>
    isVideoUrl(r.image) ||
    r.images?.some(isVideoUrl) ||
    r.directions?.some(d => d.mediaType === 'video')
  );

  const activeRecipe = videoRecipes[activeIndex];

  // ── IntersectionObserver to track which slide is visible ──────────────────
  useEffect(() => {
    if (!scrollRef.current) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!isNaN(idx)) {
              setActiveIndex(idx);
              onIndexChange?.(idx);

              // Check if we need to load more (TikTok style: load before the last one)
              if (idx >= videoRecipes.length - 2 && hasMore && !loadingMore) {
                onLoadMore?.();
              }
            }
          }
        });
      },
      { root: scrollRef.current, threshold: 0.5, rootMargin: '0px' }
    );

    const slides = scrollRef.current.querySelectorAll('[data-index]');
    slides.forEach(slide => observerRef.current!.observe(slide));

    // Restore scroll position — rAF ensures layout is complete before reading clientHeight
    if (initialIndex > 0) {
      requestAnimationFrame(() => {
        if (!scrollRef.current) return;
        const h = scrollRef.current.clientHeight;
        if (h > 0) {
          scrollRef.current.scrollTop = initialIndex * h;
        }
      });
    }

    return () => observerRef.current?.disconnect();
  }, [videoRecipes.length]);

  // ── Fetch chef profile when active changes ─────────────────────────────────
  useEffect(() => {
    const currentUserId = activeRecipe?.userId;
    if (!currentUserId || chefProfiles[currentUserId]) return;

    supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', currentUserId)
      .single()
      .then(({ data }) => {
        if (data && currentUserId) {
          setChefProfiles(prev => ({ ...prev, [currentUserId]: data }));
        }
      });
  }, [activeRecipe?.userId, chefProfiles]);

  // ── Fetch collections when user is logged in ───────────────────────────────
  useEffect(() => {
    if (user) fetchCollections();
  }, [user, fetchCollections]);

  // ── Fetch all saved recipe IDs for the user ───────────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase
      .from('collection_recipes')
      .select('recipe_id')
      .then(({ data }) => {
        if (data) {
          setAllSavedRecipeIds(new Set(data.map(d => d.recipe_id)));
        }
      });
  }, [user]);

  useEffect(() => {
    const currentRecipeId = activeRecipe?.id;
    if (!showCollectionModal || !currentRecipeId || collections.length === 0) return;
    (async () => {
      const inCollections = new Set<string>();
      for (const c of collections) {
        if (await isRecipeInCollection(c.id, currentRecipeId)) inCollections.add(c.id);
      }
      setRecipeCollections(inCollections);
    })();
  }, [collections, activeRecipe?.id, showCollectionModal, isRecipeInCollection]);

  // ── Prevent body scroll while Bites is open ────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Keyboard navigation ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!scrollRef.current) return;
      const h = scrollRef.current.clientHeight;
      if (e.key === 'ArrowDown') scrollRef.current.scrollBy({ top: h, behavior: 'smooth' });
      if (e.key === 'ArrowUp') scrollRef.current.scrollBy({ top: -h, behavior: 'smooth' });
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onBack]);

  const handleToggleCollection = async (collectionId: string) => {
    if (!activeRecipe) return;
    try {
      setIsSaving(true);
      const recipeId = activeRecipe.id;
      if (recipeCollections.has(collectionId)) {
        await removeRecipeFromCollection(collectionId, recipeId);
        setRecipeCollections(prev => {
          const s = new Set(prev);
          s.delete(collectionId);
          return s;
        });

        // After removing, check if it's still in ANY collection to update the bookmark icon
        // For simplicity and speed in the UI, if it's removed from this one and was only in this one,
        // we update the global set.
        // But a more robust way is to re-check or just let the user see it's unsaved if they uncheck all.
        // We'll update the global set if this was the last collection (though we don't know for sure without checking all)
        // Let's just update based on the modal's recipeCollections state after this operation.
      } else {
        await addRecipeToCollection(collectionId, recipeId);
        setRecipeCollections(prev => new Set(prev).add(collectionId));
        setAllSavedRecipeIds(prev => new Set(prev).add(recipeId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (videoRecipes.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 z-50">
        <button onClick={onBack} className="absolute top-4 left-4 btn btn-circle btn-ghost text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="material-symbols-outlined text-white/20 mb-4" style={{ fontSize: 72 }}>video_library</span>
        <h2 className="text-white font-bold text-xl mb-2">No Recipe Bites Yet</h2>
        <p className="text-white/50 text-center text-sm mb-6">Recipe videos will appear here when chefs upload video content.</p>
        <button onClick={onBack} className="btn btn-primary">Go Back</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 pb-2 z-20"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)' }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <div className="text-white font-bold text-base tracking-wide">Bites</div>
        {/* Slide counter */}
        <div className="text-white/60 text-xs font-semibold px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm">
          {activeIndex + 1} / {videoRecipes.length}
        </div>
      </div>

      {/* ── Progress dots ────────────────────────────────────────────────────── */}
      <div
        className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20"
      >
        {videoRecipes.slice(0, 10).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              scrollRef.current?.scrollTo({ top: i * scrollRef.current.clientHeight, behavior: 'smooth' });
            }}
            className="transition-all duration-300"
            style={{
              width: 3,
              height: i === activeIndex ? 18 : 6,
              borderRadius: 99,
              background: i === activeIndex ? 'white' : 'rgba(255,255,255,0.3)',
            }}
            aria-label={`Go to video ${i + 1}`}
          />
        ))}
      </div>

      {/* ── Scroll container (THE KEY PART) ─────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="w-full h-full overflow-y-scroll no-scrollbar touch-pan-y"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          overscrollBehaviorY: 'contain'
        }}
      >
        {videoRecipes.map((recipe, idx) => (
          <div
            key={recipe.id}
            data-index={idx}
            className="w-full flex-shrink-0"
            style={{
              height: '100dvh',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
            }}
          >
            <VideoSlide
              recipe={recipe}
              isActive={idx === activeIndex}
              isMuted={isMuted}
              onToggleFavorite={onToggleFavorite}
              onRecipeClick={onRecipeClick}
              onProfileClick={onProfileClick}
              chefProfile={recipe.userId ? chefProfiles[recipe.userId] : undefined}
              onToggleMute={() => setIsMuted(m => !m)}
              onOpenCollection={() => {
                setShowCollectionModal(true);
              }}
              isRecipeSaved={allSavedRecipeIds.has(recipe.id)}
              shouldPreload={Math.abs(idx - activeIndex) <= 1}
              onOpenComments={setCommentRecipeId}
              commentCount={localCommentCounts[recipe.id]}
            />
          </div>
        ))}
      </div>

      {/* ── Collection modal ─────────────────────────────────────────────────── */}
      <dialog
        className={`modal modal-bottom sm:modal-middle ${showCollectionModal ? 'modal-open' : ''}`}
        style={{ zIndex: 60 }}
      >
        <div className="modal-box p-0 overflow-hidden bg-base-100 flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-base-200 flex justify-between items-center sticky top-0 bg-base-100 z-10">
            <h3 className="font-bold text-lg">Save to Collection</h3>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setShowCollectionModal(false)}>✕</button>
          </div>
          <div className="p-4 overflow-y-auto flex-1">
            {collections.length === 0 ? (
              <div className="text-center py-8 text-base-content/60">
                <span className="material-symbols-outlined text-5xl mb-2 opacity-50 block">folder_off</span>
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
                      className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${inCollection ? 'border-primary bg-primary/5' : 'border-base-200 hover:bg-base-200/50'} ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-base-200 w-10 h-10 rounded-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-base-content/50">folder</span>
                        </div>
                        <p className="font-semibold">{c.name}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${inCollection ? 'border-primary bg-primary text-primary-content' : 'border-base-300'}`}>
                        {inCollection && <span className="material-symbols-outlined text-[16px]">check</span>}
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

      {/* ── Q&A Drawer (TikTok Style) ────────────────────────────── */}
      {commentRecipeId && (
        <div 
          className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
          onClick={() => setCommentRecipeId(null)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 h-[80vh] bg-base-100 rounded-t-[32px] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-500"
            onClick={e => e.stopPropagation()}
          >
            {/* Grab handle */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-base-content/10" />
            </div>

            {/* Header */}
            <div className="px-5 py-2 border-b border-base-200 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-base-content/40 flex items-center gap-2">
                  Q&A
                  <span className="px-2 py-0.5 bg-base-200 rounded-full text-[10px] text-base-content/60">
                    {localCommentCounts[commentRecipeId] || 0}
                  </span>
                </h3>
              </div>
              <button 
                onClick={() => setCommentRecipeId(null)}
                className="btn btn-circle btn-ghost btn-sm"
              >
                <span className="material-symbols-outlined text-xl opacity-50">close</span>
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-safe">
              <div className="px-5 py-2">
                <CommentsSection 
                  recipeId={commentRecipeId} 
                  recipeOwnerId={recipes.find(r => r.id === commentRecipeId)?.userId} 
                  onCountChange={(count) => {
                    setLocalCommentCounts(prev => ({ ...prev, [commentRecipeId]: count }));
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BitesScreen;
