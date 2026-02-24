import React, { useState, useRef, useEffect } from 'react';
import { Recipe } from '@/types';
import CookingStepCard from '@/components/CookingStepCard';
import StepTimer from '@/components/StepTimer';
import { useWakeLock } from '@/hooks/useWakeLock';

interface CookingModeScreenProps {
  recipe: Recipe;
  onExit: () => void;
}

const CookingModeScreen: React.FC<CookingModeScreenProps> = ({ recipe, onExit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timerKey, setTimerKey] = useState(0);

  // Keep screen awake during cooking
  useWakeLock();

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  const totalSteps = recipe.directions.length;
  const canGoNext = currentStep < totalSteps - 1;
  const canGoPrev = currentStep > 0;

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  // Handle touch end (swipe detection)
  const handleTouchEnd = () => {
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && canGoNext) {
        // Swipe up - next step
        setCurrentStep(prev => prev + 1);
      } else if (swipeDistance < 0 && canGoPrev) {
        // Swipe down - previous step
        setCurrentStep(prev => prev - 1);
      }
    }

    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && canGoNext) {
        setCurrentStep(prev => prev + 1);
      } else if (e.key === 'ArrowDown' && canGoPrev) {
        setCurrentStep(prev => prev - 1);
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoNext, canGoPrev, onExit]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleStartTimer = (seconds: number) => {
    setActiveTimer(seconds);
    setTimerKey(prev => prev + 1);
  };

  const handleTimerComplete = () => {
    setActiveTimer(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-base-100 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/60 to-transparent p-4 flex items-center justify-between">
        <button
          onClick={onExit}
          className="btn btn-circle btn-ghost btn-sm text-white hover:bg-white/20"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h1 className="text-white font-bold text-lg line-clamp-1 flex-1 mx-4">
          {recipe.title}
        </h1>

        <button
          onClick={() => setShowIngredients(!showIngredients)}
          className="btn btn-circle btn-ghost btn-sm text-white hover:bg-white/20"
        >
          <span className="material-symbols-outlined">list</span>
        </button>
      </div>

      {/* Main Content */}
      <div
        ref={containerRef}
        className="flex-1 relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CookingStepCard
          step={recipe.directions[currentStep]}
          stepNumber={currentStep + 1}
          totalSteps={totalSteps}
          fallbackImage={recipe.image}
          onStartTimer={handleStartTimer}
        />
      </div>

      {/* Navigation Arrows */}
      <div className="absolute left-0 right-0 bottom-0 flex justify-between items-center p-6 pointer-events-none z-20">
        {canGoPrev && (
          <button
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="btn btn-circle btn-lg bg-black/60 text-white border-none hover:bg-black/80 pointer-events-auto"
          >
            <span className="material-symbols-outlined text-2xl">arrow_upward</span>
          </button>
        )}

        <div className="flex-1" />

        {canGoNext && (
          <button
            onClick={() => setCurrentStep(prev => prev + 1)}
            className="btn btn-circle btn-lg bg-black/60 text-white border-none hover:bg-black/80 pointer-events-auto"
          >
            <span className="material-symbols-outlined text-2xl">arrow_downward</span>
          </button>
        )}
      </div>

      {/* Ingredients Overlay */}
      {showIngredients && (
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-end"
          onClick={() => setShowIngredients(false)}
        >
          <div
            className="bg-base-100 rounded-t-3xl p-6 w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Ingredients</h2>
              <button
                onClick={() => setShowIngredients(false)}
                className="btn btn-circle btn-ghost btn-sm"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <ul className="space-y-3">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-primary mt-0.5">
                    check_circle
                  </span>
                  <span className="text-base-content flex-1">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Timer Overlay */}
      {activeTimer !== null && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center">
          <StepTimer
            key={timerKey}
            durationInSeconds={activeTimer}
            stepTitle={recipe.directions[currentStep].title}
            onComplete={handleTimerComplete}
            onClose={handleTimerComplete}
          />
        </div>
      )}
    </div>
  );
};

export default CookingModeScreen;
