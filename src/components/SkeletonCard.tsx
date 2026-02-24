import React from 'react';

interface SkeletonCardProps {
  index?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ index = 0 }) => {
  // Match the aspect ratios from RecipeCard for consistency
  const aspectRatios = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-[1/1]', 'aspect-[4/3]'];
  const aspectClass = aspectRatios[index % aspectRatios.length];

  return (
    <div className="card card-compact bg-base-100 shadow-sm border border-base-200 overflow-hidden break-inside-avoid mb-4 animate-pulse">
      {/* Image Skeleton */}
      <figure className={`relative w-full ${aspectClass} bg-base-200`}>
        <div className="absolute inset-0 bg-gradient-to-r from-base-200 via-base-300 to-base-200 animate-shimmer" />
      </figure>

      {/* Content Skeleton */}
      <div className="card-body !p-3 space-y-2">
        {/* Title Skeleton */}
        <div className="h-4 bg-base-200 rounded w-3/4" />

        {/* Info Row Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-base-200 rounded-full" />
            <div className="h-3 bg-base-200 rounded w-12" />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-base-200 rounded-full" />
            <div className="h-3 bg-base-200 rounded w-8" />
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
