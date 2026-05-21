import React from 'react';

interface SkeletonCardProps {
  index?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ index = 0 }) => {
  // Match the aspect ratios from RecipeCard for consistency
  const aspectRatios = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-[1/1]', 'aspect-[4/3]'];
  const aspectClass = aspectRatios[index % aspectRatios.length];

  return (
    <div className="relative bg-base-100 rounded-2xl overflow-hidden break-inside-avoid mb-4 shadow-sm border border-base-200/80 animate-pulse">
      {/* Image Skeleton */}
      <figure className={`relative w-full ${aspectClass} bg-base-200`}>
        <div className="absolute inset-0 bg-gradient-to-r from-base-200 via-base-300 to-base-200 animate-shimmer" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </figure>

      {/* Content Skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-3 pt-6 space-y-2 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        {/* Title Skeleton */}
        <div className="h-4 bg-base-100/20 rounded w-3/4 backdrop-blur-sm" />

        {/* Info Row Skeleton */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-base-100/20 rounded-full backdrop-blur-sm" />
            <div className="h-3 bg-base-100/20 rounded w-16 backdrop-blur-sm" />
          </div>
          <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
            <div className="w-3 h-3 bg-base-100/20 rounded-full" />
            <div className="h-3 bg-base-100/20 rounded w-8" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Component to render a grid of skeleton cards
export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} index={index} />
      ))}
    </>
  );
};

export default SkeletonCard;
