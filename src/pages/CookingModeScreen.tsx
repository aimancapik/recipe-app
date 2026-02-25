import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Recipe } from '@/types';
import CookingStepCard from '@/components/CookingStepCard';
import StepTimer from '@/components/StepTimer';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useSpeech } from '@/hooks/useSpeech';

interface CookingModeScreenProps {
  recipe: Recipe;
  onExit: () => void;
}

// --- Serving size calculator helper ---
const fractionMap: Record<string, number> = {
  '½': 0.5, '⅓': 1/3, '⅔': 2/3, '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 1/6, '⅚': 5/6, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

function scaleIngredient(ingredient: string, multiplier: number): string {
  if (multiplier === 1) return ingredient;

  // Match leading number (integer, decimal, or fraction) at the start
  // Examples: "2 cups", "1.5 tsp", "½ cup", "1 ½ cups", "1/2 cup"
  const match = ingredient.match(/^(\d+\s*)?([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|\d+\/\d+)?(\s*.+)$/);

  if (!match) return ingredient;

  const [, wholeStr, fracStr, rest] = match;
  let value = 0;

  if (wholeStr) {
    value += parseFloat(wholeStr.trim());
  }

  if (fracStr) {
    if (fractionMap[fracStr]) {
      value += fractionMap[fracStr];
    } else if (fracStr.includes('/')) {
      const [num, den] = fracStr.split('/').map(Number);
      if (den && den !== 0) value += num / den;
    }
  }

  if (value === 0) return ingredient;

  const scaled = value * multiplier;
  // Format nicely: remove trailing .0 for whole numbers
  const formatted = scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1).replace(/\.0$/, '');

  return `${formatted}${rest}`;
}

// --- LocalStorage helpers ---
function loadProgress(recipeId: string): { currentStep: number; completedSteps: number[] } | null {
  try {
    const data = localStorage.getItem(`cooking_progress_${recipeId}`);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function saveProgress(recipeId: string, currentStep: number, completedSteps: Set<number>) {
  try {
    localStorage.setItem(`cooking_progress_${recipeId}`, JSON.stringify({
      currentStep,
      completedSteps: [...completedSteps],
      lastUpdated: Date.now(),
    }));
  } catch { /* ignore quota errors */ }
}

function clearProgress(recipeId: string) {
  try { localStorage.removeItem(`cooking_progress_${recipeId}`); } catch {}
}

function loadNotes(recipeId: string): Record<number, string> {
  try {
    const data = localStorage.getItem(`cooking_notes_${recipeId}`);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

function saveNotes(recipeId: string, notes: Record<number, string>) {
  try {
    localStorage.setItem(`cooking_notes_${recipeId}`, JSON.stringify(notes));
  } catch {}
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
  const [stepNotes, setStepNotes] = useState<Record<number, string>>({});
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState<{ currentStep: number; completedSteps: number[] } | null>(null);
  const [showHints, setShowHints] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);

  // Keep screen awake during cooking
  useWakeLock();
  const { speak, stop: stopSpeech, toggle: toggleSpeech, isEnabled: ttsEnabled, isSpeaking, isSupported: ttsSupported } = useSpeech();

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  const longPressTimer = useRef<number | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const totalSteps = recipe.directions.length;
  const canGoNext = currentStep < totalSteps - 1;
  const canGoPrev = currentStep > 0;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  // --- Load saved progress on mount ---
  useEffect(() => {
    const progress = loadProgress(recipe.id);
    if (progress && progress.currentStep > 0) {
      setSavedProgress(progress);
      setShowResumePrompt(true);
    }
    const notes = loadNotes(recipe.id);
    setStepNotes(notes);
  }, [recipe.id]);

  // --- Auto-hide tap hints after 3 seconds ---
  useEffect(() => {
    const timer = setTimeout(() => setShowHints(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // --- Save progress on step/completion changes ---
  useEffect(() => {
    if (!showResumePrompt) {
      saveProgress(recipe.id, currentStep, completedSteps);
    }
  }, [currentStep, completedSteps, recipe.id, showResumePrompt]);

  // --- Save notes when they change ---
  useEffect(() => {
    saveNotes(recipe.id, stepNotes);
  }, [stepNotes, recipe.id]);

  // --- TTS: read step when it changes ---
  useEffect(() => {
    if (ttsEnabled && recipe.directions[currentStep]) {
      const step = recipe.directions[currentStep];
      const text = [step.title, step.description].filter(Boolean).join('. ');
      speak(text);
    }
  }, [currentStep, ttsEnabled]);

  // --- Check for all steps completion ---
  useEffect(() => {
    if (completedSteps.size === totalSteps && totalSteps > 0 && !showCompletion) {
      setShowCompletion(true);
      clearProgress(recipe.id);
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    }
  }, [completedSteps.size, totalSteps, recipe.id]);

  const handleResume = (resume: boolean) => {
    if (resume && savedProgress) {
      setCurrentStep(savedProgress.currentStep);
      setCompletedSteps(new Set(savedProgress.completedSteps));
    }
    setShowResumePrompt(false);
    setSavedProgress(null);
  };

  // --- Double-tap detection ---
  const handleDoubleTap = useCallback(() => {
    toggleStepComplete(currentStep);
    if ('vibrate' in navigator) navigator.vibrate(50);
  }, [currentStep]);

  // Handle tap zones with double-tap detection
  const handleTapZone = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const timeDiff = now - lastTapTime.current;
    lastTapTime.current = now;

    // Double-tap detection (center zone)
    if (timeDiff < 300) {
      handleDoubleTap();
      return;
    }

    // Single tap after delay — navigate
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const y = 'touches' in e ? e.touches[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY;
    const relativeY = y - rect.top;
    const zoneHeight = rect.height * 0.2;

    if (relativeY < zoneHeight && canGoPrev) {
      setCurrentStep(prev => prev - 1);
      if ('vibrate' in navigator) navigator.vibrate(30);
    } else if (relativeY > rect.height - zoneHeight && canGoNext) {
      setCurrentStep(prev => prev + 1);
      if ('vibrate' in navigator) navigator.vibrate(30);
    }
  };

  // --- Long-press detection ---
  const handleLongPressStart = () => {
    longPressTimer.current = window.setTimeout(() => {
      setShowQuickActions(true);
      if ('vibrate' in navigator) navigator.vibrate(50);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    handleLongPressStart();
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
    // Cancel long press if finger moves
    if (Math.abs(touchStartY.current - touchEndY.current) > 10) {
      handleLongPressEnd();
    }
  };

  // Handle touch end (swipe detection)
  const handleTouchEnd = () => {
    handleLongPressEnd();
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && canGoNext) {
        setCurrentStep(prev => prev + 1);
        if ('vibrate' in navigator) navigator.vibrate(30);
      } else if (swipeDistance < 0 && canGoPrev) {
        setCurrentStep(prev => prev - 1);
        if ('vibrate' in navigator) navigator.vibrate(30);
      }
    }

    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        if (canGoNext) {
          setCurrentStep(prev => prev + 1);
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        if (canGoPrev) {
          setCurrentStep(prev => prev - 1);
        }
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

  // Stop speech on exit
  useEffect(() => {
    return () => { stopSpeech(); };
  }, [stopSpeech]);

  const handleStartTimer = (seconds: number) => {
    setActiveTimer(seconds);
    setTimerKey(prev => prev + 1);
  };

  const handleTimerComplete = () => {
    setActiveTimer(null);
    setCompletedSteps(prev => new Set([...prev, currentStep]));

    if (autoAdvance && canGoNext) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
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

  const handleNoteChange = (stepIndex: number, note: string) => {
    setStepNotes(prev => {
      const updated = { ...prev };
      if (note) {
        updated[stepIndex] = note;
      } else {
        delete updated[stepIndex];
      }
      return updated;
    });
  };

  const handleExit = () => {
    saveProgress(recipe.id, currentStep, completedSteps);
    stopSpeech();
    onExit();
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
          onClick={handleExit}
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

        <div className="flex gap-1">
          {/* TTS Toggle */}
          {ttsSupported && (
            <button
              onClick={toggleSpeech}
              className={`btn btn-circle btn-ghost btn-sm hover:bg-white/20 ${ttsEnabled ? 'text-primary' : 'text-white'}`}
              aria-label={ttsEnabled ? 'Disable voice' : 'Enable voice'}
            >
              <span className="material-symbols-outlined">
                {ttsEnabled ? (isSpeaking ? 'volume_up' : 'record_voice_over') : 'volume_off'}
              </span>
            </button>
          )}
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

      {/* Tap Zones Hint - auto-hides */}
      {showHints && (
        <div className="absolute left-0 right-0 top-20 z-10 pointer-events-none animate-fade-in">
          <div className="flex justify-center">
            <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full text-white/80 text-xs font-medium">
              Tap top/bottom to navigate, double-tap to complete
            </div>
          </div>
        </div>
      )}

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
          note={stepNotes[currentStep]}
          onNoteChange={(note) => handleNoteChange(currentStep, note)}
        />

        {/* Step Completion Checkbox */}
        <div className="absolute bottom-24 right-6 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStepComplete(currentStep);
              if ('vibrate' in navigator) navigator.vibrate(50);
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
          <div key={idx} className="relative">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'w-8 bg-primary'
                  : completedSteps.has(idx)
                  ? 'w-2 bg-primary/60'
                  : 'w-2 bg-white/30'
              }`}
            />
            {/* Note indicator dot */}
            {stepNotes[idx] && (
              <div className="absolute -top-1.5 -right-1 w-2 h-2 bg-warning rounded-full" />
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions Menu (from long-press) */}
      {showQuickActions && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center"
          onClick={() => setShowQuickActions(false)}
        >
          <div
            className="bg-base-100 rounded-2xl p-4 w-64 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-center mb-3">Quick Actions</h3>
            <button
              onClick={() => { toggleStepComplete(currentStep); setShowQuickActions(false); }}
              className="btn btn-ghost btn-sm w-full justify-start gap-3"
            >
              <span className="material-symbols-outlined text-lg">
                {completedSteps.has(currentStep) ? 'remove_done' : 'check_circle'}
              </span>
              {completedSteps.has(currentStep) ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
            {recipe.directions[currentStep]?.timer && recipe.directions[currentStep].timer! > 0 && (
              <button
                onClick={() => { handleStartTimer(recipe.directions[currentStep].timer!); setShowQuickActions(false); }}
                className="btn btn-ghost btn-sm w-full justify-start gap-3"
              >
                <span className="material-symbols-outlined text-lg">timer</span>
                Start Timer
              </button>
            )}
            {ttsSupported && (
              <button
                onClick={() => {
                  const step = recipe.directions[currentStep];
                  speak([step.title, step.description].filter(Boolean).join('. '));
                  setShowQuickActions(false);
                }}
                className="btn btn-ghost btn-sm w-full justify-start gap-3"
              >
                <span className="material-symbols-outlined text-lg">record_voice_over</span>
                Read Step Aloud
              </button>
            )}
            <button
              onClick={() => setShowQuickActions(false)}
              className="btn btn-ghost btn-sm w-full text-base-content/50 mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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

              {/* TTS Toggle */}
              {ttsSupported && (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Read Steps Aloud</h3>
                    <p className="text-sm text-base-content/60">
                      Automatically read each step using text-to-speech
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={ttsEnabled}
                    onChange={toggleSpeech}
                  />
                </div>
              )}

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

              {/* Clear Progress */}
              <button
                onClick={() => {
                  setCompletedSteps(new Set());
                  setCurrentStep(0);
                  clearProgress(recipe.id);
                  setShowSettings(false);
                }}
                className="btn btn-outline btn-error btn-sm w-full"
              >
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ingredients Overlay with real serving calculator */}
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
                  <span className="text-base-content flex-1">
                    {scaleIngredient(ingredient, servingMultiplier)}
                  </span>
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
            seconds={activeTimer}
            label={recipe.directions[currentStep].title || `Step ${currentStep + 1}`}
            onComplete={handleTimerComplete}
            onClose={() => setActiveTimer(null)}
            fullScreen
          />
        </div>
      )}

      {/* Resume Prompt */}
      {showResumePrompt && savedProgress && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-base-100 rounded-2xl p-6 max-w-sm w-full text-center">
            <span className="material-symbols-outlined text-5xl text-primary mb-4">bookmark_added</span>
            <h3 className="text-xl font-bold mb-2">Resume Cooking?</h3>
            <p className="text-base-content/60 mb-6">
              You left off at <span className="font-semibold text-primary">Step {savedProgress.currentStep + 1}</span> with {savedProgress.completedSteps.length}/{totalSteps} steps completed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleResume(false)}
                className="btn btn-outline flex-1"
              >
                Start Over
              </button>
              <button
                onClick={() => handleResume(true)}
                className="btn btn-primary flex-1"
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Celebration */}
      {showCompletion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-base-100 rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Done Cooking!</h2>
            <p className="text-base-content/60 mb-2">
              You've completed all {totalSteps} steps of
            </p>
            <p className="font-bold text-lg text-primary mb-6">{recipe.title}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  clearProgress(recipe.id);
                  handleExit();
                }}
                className="btn btn-primary w-full"
              >
                Back to Recipe
              </button>
              <button
                onClick={() => setShowCompletion(false)}
                className="btn btn-ghost btn-sm w-full text-base-content/50"
              >
                Keep Reviewing Steps
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookingModeScreen;
