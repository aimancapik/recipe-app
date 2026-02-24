import React from 'react';
import ReactPlayer from 'react-player';
import { Direction } from '@/types';
import { isVideoUrl } from '@/utils/mediaHelpers';

interface CookingStepCardProps {
  step: Direction;
  stepNumber: number;
  totalSteps: number;
  fallbackImage?: string;
  onStartTimer?: (seconds: number) => void;
}

const CookingStepCard: React.FC<CookingStepCardProps> = ({
  step,
  stepNumber,
  totalSteps,
  fallbackImage,
  onStartTimer,
}) => {
  const hasMedia = step.image && step.image.trim() !== '';
  const mediaUrl = hasMedia ? step.image : fallbackImage;
  const isVideo = mediaUrl ? isVideoUrl(mediaUrl) : false;

  return (
    <div className="h-full w-full flex flex-col bg-base-100">
      {/* Progress Indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-base-200 z-20">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
        />
      </div>

      {/* Media Section (50%) */}
      <div className="relative h-1/2 w-full bg-base-200 flex-shrink-0">
        {mediaUrl ? (
          isVideo ? (
            <div className="w-full h-full">
              <ReactPlayer
                url={mediaUrl}
                playing
                muted
                loop
                playsInline
                width="100%"
                height="100%"
                className="object-cover"
              />
            </div>
          ) : (
            <img
              src={mediaUrl}
              alt={step.title}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-9xl text-base-content/20">
              restaurant
            </span>
          </div>
        )}

        {/* Step Counter Badge */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold">
          Step {stepNumber} of {totalSteps}
        </div>
      </div>

      {/* Content Section (50%) */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        {/* Step Title */}
        {step.title && (
          <h2 className="text-2xl font-bold text-base-content mb-4 leading-tight">
            {step.title}
          </h2>
        )}

        {/* Step Description */}
        <p className="text-lg text-base-content/80 leading-relaxed mb-6 flex-1">
          {step.description}
        </p>

        {/* Timer Button */}
        {step.timer && step.timer > 0 && (
          <button
            onClick={() => onStartTimer?.(step.timer!)}
            className="btn btn-primary btn-lg w-full gap-3 mb-4"
          >
            <span className="material-symbols-outlined text-2xl">timer</span>
            <span>Start {Math.floor(step.timer / 60)}m Timer</span>
          </button>
        )}

        {/* Swipe Hint */}
        {stepNumber < totalSteps && (
          <div className="text-center text-base-content/40 text-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">swipe_up</span>
            <span>Swipe up for next step</span>
          </div>
        )}

        {stepNumber === totalSteps && (
          <div className="text-center text-success text-sm font-medium flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>Last step - You're almost done!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookingStepCard;
