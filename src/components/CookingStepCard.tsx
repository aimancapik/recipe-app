import React, { useRef, useState } from 'react';
import { Direction } from '@/types';
import { isVideoUrl } from '@/utils/mediaHelpers';

interface CookingStepCardProps {
  step: Direction;
  stepNumber: number;
  totalSteps: number;
  fallbackImage?: string;
  onStartTimer?: (seconds: number) => void;
  note?: string;
  onNoteChange?: (note: string) => void;
}

const CookingStepCard: React.FC<CookingStepCardProps> = ({
  step,
  stepNumber,
  totalSteps,
  fallbackImage,
  onStartTimer,
  note,
  onNoteChange,
}) => {
  const hasMedia = step.image && step.image.trim() !== '';
  const mediaUrl = hasMedia ? step.image : fallbackImage;
  const isVideo = mediaUrl ? isVideoUrl(mediaUrl) : false;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPaused, setVideoPaused] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(note || '');

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

  const handleSaveNote = () => {
    onNoteChange?.(noteText.trim());
    setEditingNote(false);
  };

  return (
    <div className="h-full w-full flex flex-col bg-base-100">
      {/* Media Section (45%) */}
      <div className="relative h-[45%] w-full bg-base-200 flex-shrink-0">
        {mediaUrl ? (
          isVideo ? (
            <div className="w-full h-full relative" onClick={toggleVideo}>
              <video
                ref={videoRef}
                src={mediaUrl!}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
              {/* Play/Pause overlay */}
              {videoPaused && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-white text-4xl">play_arrow</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <img
              src={mediaUrl!}
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

      {/* Content Section (55%) */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        {/* Step Title */}
        {step.title && (
          <h2 className="text-2xl font-bold text-base-content mb-3 leading-tight">
            {step.title}
          </h2>
        )}

        {/* Step Description */}
        <p className="text-lg text-base-content/80 leading-relaxed mb-4 flex-1">
          {step.description}
        </p>

        {/* Personal Note */}
        {onNoteChange && (
          <div className="mb-4">
            {editingNote ? (
              <div className="space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a personal note for this step..."
                  className="textarea textarea-bordered w-full text-sm h-20 resize-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingNote(false); setNoteText(note || ''); }}
                    className="btn btn-ghost btn-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSaveNote(); }}
                    className="btn btn-primary btn-xs"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            ) : note ? (
              <div
                onClick={(e) => { e.stopPropagation(); setNoteText(note); setEditingNote(true); }}
                className="bg-warning/10 border border-warning/20 rounded-lg p-3 cursor-pointer hover:bg-warning/15 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-warning text-sm">edit_note</span>
                  <span className="text-xs font-semibold text-warning uppercase tracking-wider">Your Note</span>
                </div>
                <p className="text-sm text-base-content/70">{note}</p>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setEditingNote(true); }}
                className="btn btn-ghost btn-sm gap-2 text-base-content/40 hover:text-base-content/60"
              >
                <span className="material-symbols-outlined text-sm">add_notes</span>
                Add Note
              </button>
            )}
          </div>
        )}

        {/* Timer Button */}
        {step.timer && step.timer > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onStartTimer?.(step.timer!); }}
            className="btn btn-primary btn-lg w-full gap-3 mb-4"
          >
            <span className="material-symbols-outlined text-2xl">timer</span>
            <span>Start {step.timer >= 60 ? `${Math.floor(step.timer / 60)}m` : `${step.timer}s`} Timer</span>
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
