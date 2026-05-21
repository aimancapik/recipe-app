import React, { useRef, useState, useEffect } from 'react';
import { Direction } from '@/types';
import { isVideoUrl, getNormalizedVideoUrl } from '@/utils/mediaHelpers';

interface CookingStepCardProps {
  step: Direction;
  stepNumber: number;
  totalSteps: number;
  fallbackImage?: string;
  onStartTimer?: (seconds: number) => void;
  isTimerActive?: boolean;
  isCompleted?: boolean;
}

const CookingStepCard: React.FC<CookingStepCardProps> = ({
  step,
  stepNumber,
  totalSteps,
  fallbackImage,
  onStartTimer,
  isTimerActive,
  isCompleted,
}) => {
  const hasMedia = step.image && step.image.trim() !== '';
  const mediaUrl = hasMedia ? step.image : fallbackImage;
  const isVideo = mediaUrl ? isVideoUrl(mediaUrl) : false;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPaused, setVideoPaused] = useState(false);
  const toggleVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setVideoPaused(false);
    } else {
      videoRef.current.pause();
      setVideoPaused(true);
    }
  };

  const timerLabel = step.timer
    ? step.timer >= 3600
      ? `${Math.floor(step.timer / 3600)}h ${Math.floor((step.timer % 3600) / 60)}m`
      : step.timer >= 60
      ? `${Math.floor(step.timer / 60)}m ${step.timer % 60 > 0 ? `${step.timer % 60}s` : ''}`
      : `${step.timer}s`
    : '';

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Hero Media */}
      <div className="relative w-full flex-shrink-0" style={{ height: '42%' }}>
        {mediaUrl ? (
          isVideo ? (
            <div className="w-full h-full relative" onClick={toggleVideo}>
              <video
                ref={videoRef}
                src={getNormalizedVideoUrl(mediaUrl)}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
              {videoPaused && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="size-16 rounded-full bg-base-100/20 backdrop-blur-md flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-4xl fill-1">play_arrow</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <img src={mediaUrl} alt={step.title} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-base-200 to-secondary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-8xl text-base-content/10">cooking</span>
          </div>
        )}

        {/* Bottom fade into content */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-base-100 to-transparent" />

        {/* Completed overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <div className="size-20 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-primary/40">
              <span className="material-symbols-outlined text-primary-content text-4xl fill-1">check</span>
            </div>
          </div>
        )}
      </div>

      {/* Content — stop touch events so swipe/tap handlers don't fire from here */}
      <div
        className="flex-1 flex flex-col px-6 pb-4 overflow-y-auto -mt-6 relative z-10"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step pill + title */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`shrink-0 size-9 rounded-full flex items-center justify-center text-sm font-black shadow-md ${isCompleted ? 'bg-primary text-primary-content' : 'bg-base-content text-base-100'}`}>
            {isCompleted ? <span className="material-symbols-outlined text-[18px] fill-1">check</span> : stepNumber}
          </div>
          {step.title && (
            <h2 className="text-xl font-bold text-base-content leading-tight">{step.title}</h2>
          )}
        </div>

        {/* Description */}
        <p className="text-base text-base-content/75 leading-relaxed mb-5 flex-1">
          {step.description}
        </p>

        {/* Timer button — hide when timer is already running */}
        {step.timer && step.timer > 0 && !isTimerActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onStartTimer?.(step.timer!); }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="flex items-center gap-3 w-full p-4 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 active:scale-95 transition-all mb-4 group"
          >
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/30 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary-content text-xl">timer</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-base-content text-sm">Start Timer</p>
              <p className="text-primary font-black text-lg leading-none">{timerLabel}</p>
            </div>
            <span className="material-symbols-outlined text-primary/60">chevron_right</span>
          </button>
        )}

        {/* Last step indicator */}
        {stepNumber === totalSteps && !isCompleted && (
          <div className="mt-3 flex items-center justify-center gap-2 text-success text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">emoji_events</span>
            Almost done — last step!
          </div>
        )}
      </div>
    </div>
  );
};

export default CookingStepCard;
