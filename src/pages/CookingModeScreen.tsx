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
  const [showSettings, setShowSettings] = useState(false);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [servingMultiplier, setServingMultiplier] = useState(1);

  // Keep screen awake during cooking
  useWakeLock();

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const touchStartX = useRef<number>(0);

  const totalSteps = recipe.directions.length;
  const canGoNext = currentStep < totalSteps - 1;
  const canGoPrev = currentStep > 0;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  // Handle tap zones (top 20% = previous, bottom 20% = next)
  const handleTapZone = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const relativeY = y - rect.top;
    const zoneHeight = rect.height * 0.2;

    if (relativeY < zoneHeight && canGoPrev) {
      // Top zone - previous step
      setCurrentStep(prev => prev - 1);
    } else if (relativeY > rect.height - zoneHeight && canGoNext) {
      // Bottom zone - next step
      setCurrentStep(prev => prev + 1);
    }
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
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
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        if (canGoNext) setCurrentStep(prev => prev + 1);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        if (canGoPrev) setCurrentStep(prev => prev - 1);
      } else if (e.key === 'Escape') {
        onExit();
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleStepComplete(currentStep);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoNext, canGoPrev, currentStep, onExit]);

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

    // Auto-advance to next step if enabled
    if (autoAdvance && canGoNext) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setCompletedSteps(prev => new Set([...prev, currentStep]));
      }, 1000);
    }
  };

  const toggleStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepIndex)) {
        newSet.delete(stepIndex);
      } else {
        newSet.add(stepIndex);
      }
      return newSet;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-base-100 flex flex-col">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 h-1 bg-base-300">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Header */}
      <div className="absolute top-1 left-0 right-0 z-30 bg-gradient-to-b from-black/60 to-transparent p-4 flex items-center justify-between">
        <button
          onClick={onExit}
          className="btn btn-circle btn-ghost btn-sm text-white hover:bg-white/20"
          aria-label="Exit cooking mode"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="flex flex-col items-center flex-1 mx-4">
          <h1 className="text-white font-bold text-lg line-clamp-1">
            {recipe.title}
          </h1>
          <p className="text-white/60 text-xs font-medium">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-circle btn-ghost btn-sm text-white hover:bg-white/20"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button
            onClick={() => setShowIngredients(!showIngredients)}
            className="btn btn-circle btn-ghost btn-sm text-white hover:bg-white/20"
            aria-label="View ingredients"
          >
            <span className="material-symbols-outlined">list</span>
          </button>
        </div>
      </div>

      {/* Tap Zones Hint */}
      <div className="absolute left-0 right-0 top-20 z-10 pointer-events-none">
        <div className="flex justify-center">
          <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full text-white/80 text-xs font-medium animate-pulse">
            Tap top ↑ or bottom ↓ to navigate
          </div>
        </div>
      </div>

      {/* Main Content with Tap Zones */}
      <div
        ref={containerRef}
        className="flex-1 relative cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTapZone}
      >
        <CookingStepCard
          step={recipe.directions[currentStep]}
          stepNumber={currentStep + 1}
          totalSteps={totalSteps}
          fallbackImage={recipe.image}
          onStartTimer={handleStartTimer}
        />

        {/* Step Completion Checkbox */}
        <div className="absolute bottom-24 right-6 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStepComplete(currentStep);
            }}
            className={`btn btn-circle btn-lg border-2 transition-all ${
              completedSteps.has(currentStep)
                ? 'bg-primary border-primary text-primary-content'
                : 'bg-black/60 border-white/40 text-white hover:bg-black/80'
            }`}
            aria-label={completedSteps.has(currentStep) ? 'Mark as incomplete' : 'Mark as complete'}
          >
            <span className="material-symbols-outlined text-2xl">
              {completedSteps.has(currentStep) ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Indicators */}
      <div className="absolute left-0 right-0 bottom-8 flex justify-center items-center gap-2 pointer-events-none z-20">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div
            key={idx}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentStep
                ? 'w-8 bg-primary'
                : completedSteps.has(idx)
                ? 'w-2 bg-primary/60'
                : 'w-2 bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-end"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-base-100 rounded-t-3xl p-6 w-full max-h-[60vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Cooking Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="btn btn-circle btn-ghost btn-sm"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Auto-advance */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Auto-advance</h3>
                  <p className="text-sm text-base-content/60">
                    Automatically move to next step when timer ends
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={autoAdvance}
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                />
              </div>

              {/* Serving Size Multiplier */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Serving Size</h3>
                  <span className="badge badge-primary">{servingMultiplier}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4"
                  step="0.5"
                  value={servingMultiplier}
                  onChange={(e) => setServingMultiplier(parseFloat(e.target.value))}
                  className="range range-primary range-sm"
                />
                <div className="flex justify-between text-xs text-base-content/50 mt-1">
                  <span>0.5x</span>
                  <span>1x</span>
                  <span>2x</span>
                  <span>4x</span>
                </div>
              </div>

              {/* Completed Steps */}
              <div>
                <h3 className="font-semibold mb-3">
                  Progress ({completedSteps.size}/{totalSteps} completed)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: totalSteps }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentStep(idx);
                        setShowSettings(false);
                      }}
                      className={`btn btn-sm ${
                        idx === currentStep
                          ? 'btn-primary'
                          : completedSteps.has(idx)
                          ? 'btn-success'
                          : 'btn-outline'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div>
                <h2 className="text-2xl font-bold">Ingredients</h2>
                {servingMultiplier !== 1 && (
                  <p className="text-sm text-primary font-semibold">
                    Adjusted for {servingMultiplier}x servings
                  </p>
                )}
              </div>
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
