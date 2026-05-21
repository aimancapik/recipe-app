import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Recipe } from '@/types';
import CookingStepCard from '@/components/recipe/CookingStepCard';
import StepTimer from '@/components/recipe/StepTimer';
import { useWakeLock } from '@/hooks/cooking/useWakeLock';
import { useSpeech } from '@/hooks/cooking/useSpeech';

interface CookingModeScreenProps {
  recipe: Recipe;
  onExit: () => void;
}

const fractionMap: Record<string, number> = {
  '½': 0.5, '⅓': 1/3, '⅔': 2/3, '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 1/6, '⅚': 5/6, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

function scaleIngredient(ingredient: string, multiplier: number): string {
  if (multiplier === 1) return ingredient;
  const match = ingredient.match(/^(\d+\s*)?([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|\d+\/\d+)?(\s*.+)$/);
  if (!match) return ingredient;
  const [, wholeStr, fracStr, rest] = match;
  let value = 0;
  if (wholeStr) value += parseFloat(wholeStr.trim());
  if (fracStr) {
    if (fractionMap[fracStr]) value += fractionMap[fracStr];
    else if (fracStr.includes('/')) {
      const [num, den] = fracStr.split('/').map(Number);
      if (den && den !== 0) value += num / den;
    }
  }
  if (value === 0) return ingredient;
  const scaled = value * multiplier;
  const formatted = scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1).replace(/\.0$/, '');
  return `${formatted}${rest}`;
}

function loadProgress(recipeId: string) {
  try {
    const data = localStorage.getItem(`cooking_progress_${recipeId}`);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function saveProgress(recipeId: string, currentStep: number, completedSteps: Set<number>) {
  try {
    localStorage.setItem(`cooking_progress_${recipeId}`, JSON.stringify({
      currentStep, completedSteps: [...completedSteps], lastUpdated: Date.now(),
    }));
  } catch {}
}

function clearProgress(recipeId: string) {
  try { localStorage.removeItem(`cooking_progress_${recipeId}`); } catch {}
}


const CookingModeScreen: React.FC<CookingModeScreenProps> = ({ recipe, onExit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // Map of stepIndex -> { seconds, key } for multiple concurrent timers
  const [activeTimers, setActiveTimers] = useState<Record<number, { seconds: number; timerKey: number }>>({});
  const timerKeyCounter = useRef(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState<{ currentStep: number; completedSteps: number[] } | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);

  useWakeLock();
  const { speak, stop: stopSpeech, toggle: toggleSpeech, isEnabled: ttsEnabled, isSpeaking, isSupported: ttsSupported, voices, settings, updateSettings } = useSpeech();

  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const lastTapTime = useRef<number>(0);

  const totalSteps = recipe.directions.length;
  const canGoNext = currentStep < totalSteps - 1;
  const canGoPrev = currentStep > 0;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;
  const isCurrentCompleted = completedSteps.has(currentStep);

  useEffect(() => {
    const progress = loadProgress(recipe.id);
    if (progress && progress.currentStep > 0) {
      setSavedProgress(progress);
      setShowResumePrompt(true);
    }
  }, [recipe.id]);

  useEffect(() => {
    if (!showResumePrompt) saveProgress(recipe.id, currentStep, completedSteps);
  }, [currentStep, completedSteps, recipe.id, showResumePrompt]);


  useEffect(() => {
    if (ttsEnabled && recipe.directions[currentStep]) {
      const step = recipe.directions[currentStep];
      speak([step.title, step.description].filter(Boolean).join('. '));
    }
  }, [currentStep, ttsEnabled]);

  useEffect(() => {
    if (completedSteps.size === totalSteps && totalSteps > 0 && !showCompletion) {
      setShowCompletion(true);
      clearProgress(recipe.id);
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
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

  const toggleStepComplete = useCallback((stepIndex: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepIndex)) next.delete(stepIndex);
      else next.add(stepIndex);
      return next;
    });
  }, []);

  const goNext = useCallback(() => {
    if (canGoNext) {
      setCurrentStep(prev => prev + 1);
      if ('vibrate' in navigator) navigator.vibrate(30);
    }
  }, [canGoNext]);

  const goPrev = useCallback(() => {
    if (canGoPrev) {
      setCurrentStep(prev => prev - 1);
      if ('vibrate' in navigator) navigator.vibrate(30);
    }
  }, [canGoPrev]);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = () => {
    const dist = touchStartY.current - touchEndY.current;
    if (Math.abs(dist) > 50) {
      if (dist > 0) goNext();
      else goPrev();
    }
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  // Double-tap to complete
  const handleContentTap = () => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      toggleStepComplete(currentStep);
      if ('vibrate' in navigator) navigator.vibrate(50);
    }
    lastTapTime.current = now;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onExit();
      else if (e.key === ' ') { e.preventDefault(); toggleStepComplete(currentStep); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, currentStep, onExit, toggleStepComplete]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => { return () => { stopSpeech(); }; }, [stopSpeech]);


  const handleStartTimer = (seconds: number) => {
    timerKeyCounter.current += 1;
    setActiveTimers(prev => ({
      ...prev,
      [currentStep]: { seconds, timerKey: timerKeyCounter.current }
    }));
  };

  const handleTimerComplete = (stepIndex: number) => {
    toggleStepComplete(stepIndex);
    setActiveTimers(prev => {
      const next = { ...prev };
      delete next[stepIndex];
      return next;
    });
    if (autoAdvance && stepIndex === currentStep && canGoNext) {
      setTimeout(goNext, 1000);
    }
  };

  const handleTimerDismiss = (stepIndex: number) => {
    setActiveTimers(prev => {
      const next = { ...prev };
      delete next[stepIndex];
      return next;
    });
  };

  const handleExit = () => {
    saveProgress(recipe.id, currentStep, completedSteps);
    stopSpeech();
    setActiveTimers({});
    onExit();
  };

  return (
    <div className="fixed inset-0 z-50 bg-base-100 lec-food-gradient flex flex-col select-none">

      {/* ── Top progress bar ── */}
      <div className="absolute top-0 left-0 right-0 z-50 h-0.5 bg-base-300">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ── Header ── */}
      <header className="relative z-40 flex items-center gap-3 px-4 pt-5 pb-3 bg-base-100/85 backdrop-blur-xl border-b border-base-200/60">
        <button
          onClick={handleExit}
          className="size-10 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Now Cooking</p>
          <h1 className="font-bold text-base text-base-content truncate leading-tight">{recipe.title}</h1>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {ttsSupported && (
            <button
              onClick={toggleSpeech}
              className={`size-10 flex items-center justify-center rounded-full transition-all ${ttsEnabled ? 'bg-primary text-primary-content shadow-md shadow-primary/30' : 'bg-base-200 text-base-content/60 hover:bg-base-300'}`}
              title={ttsEnabled ? 'Disable voice' : 'Enable voice'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {ttsEnabled ? 'record_voice_over' : 'volume_off'}
              </span>
            </button>
          )}
          <button
            onClick={() => setShowIngredients(true)}
            className="size-10 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors text-base-content/70"
            title="Ingredients"
          >
            <span className="material-symbols-outlined text-[20px]">grocery</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="size-10 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors text-base-content/70"
            title="Settings"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>
      </header>

      {/* ── Step Content ── */}
      <div
        className="flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleContentTap}
      >
        <CookingStepCard
          step={recipe.directions[currentStep]}
          stepNumber={currentStep + 1}
          totalSteps={totalSteps}
          fallbackImage={recipe.image}
          onStartTimer={handleStartTimer}
          isTimerActive={currentStep in activeTimers}
          isCompleted={isCurrentCompleted}
        />
      </div>

      {/* ── Persistent Timer Bar ── */}
      {Object.keys(activeTimers).length > 0 && (
        <div className="relative z-40 px-4 pt-3 pb-1 bg-base-100 border-t border-base-200 space-y-2">
          {Object.entries(activeTimers).map(([stepIdx, timer]) => {
            const idx = parseInt(stepIdx);
            const stepTitle = recipe.directions[idx]?.title;
            return (
              <StepTimer
                key={timer.timerKey}
                seconds={timer.seconds}
                label={`Step ${idx + 1}${stepTitle ? ` · ${stepTitle}` : ''}`}
                onComplete={() => handleTimerComplete(idx)}
                onClose={() => handleTimerDismiss(idx)}
              />
            );
          })}
        </div>
      )}

      {/* ── Bottom Navigation Bar ── */}
        <div className="relative z-40 px-4 pb-6 pt-3 bg-base-100/95 backdrop-blur-xl border-t border-base-200">
        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mb-4">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'w-6 h-2 bg-primary'
                  : completedSteps.has(idx)
                  ? 'w-2 h-2 bg-primary/40'
                  : 'w-2 h-2 bg-base-300'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Prev */}
          <button
            onClick={goPrev}
            disabled={!canGoPrev}
            className="size-12 flex items-center justify-center rounded-2xl bg-base-200 disabled:opacity-30 hover:bg-base-300 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          {/* Complete toggle — center, prominent */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleStepComplete(currentStep); if ('vibrate' in navigator) navigator.vibrate(50); }}
            className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl font-bold transition-all active:scale-95 ${
              isCurrentCompleted
                ? 'bg-secondary text-secondary-content shadow-lg shadow-secondary/30'
                : 'bg-base-200 text-base-content hover:bg-base-300'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isCurrentCompleted ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            <span className="text-sm">{isCurrentCompleted ? 'Done!' : 'Mark Done'}</span>
          </button>

          {/* Next */}
          <button
            onClick={goNext}
            disabled={!canGoNext}
            className="size-12 flex items-center justify-center rounded-2xl bg-base-content text-base-100 disabled:opacity-30 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        <p className="text-center text-[11px] text-base-content/30 mt-3 font-medium">
          Swipe or use arrows for steps. Double-tap the card to mark done.
        </p>
      </div>

      {/* ── Ingredients Sheet ── */}
      {showIngredients && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowIngredients(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-base-100 rounded-t-3xl w-full max-h-[80vh] overflow-y-auto pb-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-base-300" />
            </div>

            <div className="px-6 pb-2 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Ingredients</h2>
                {servingMultiplier !== 1 && (
                  <p className="text-xs text-primary font-semibold mt-0.5">{servingMultiplier}× serving adjustment</p>
                )}
              </div>
              <div className="flex items-center gap-2 bg-base-200 rounded-xl px-3 py-2">
                <button
                  onClick={() => setServingMultiplier(m => Math.max(0.5, m - 0.5))}
                  className="size-6 flex items-center justify-center rounded-lg hover:bg-base-300"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <span className="text-sm font-black w-8 text-center">{servingMultiplier}×</span>
                <button
                  onClick={() => setServingMultiplier(m => Math.min(4, m + 0.5))}
                  className="size-6 flex items-center justify-center rounded-lg hover:bg-base-300"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
            </div>

            <ul className="px-6 pt-3 space-y-2">
              {recipe.ingredients.map((ingredient, idx) => (
                <li key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-base-200/60">
                  <div className="size-2 rounded-full bg-primary shrink-0" />
                  <span className="text-sm text-base-content font-medium">
                    {scaleIngredient(ingredient, servingMultiplier)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Settings Sheet ── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowSettings(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-base-100 rounded-t-3xl w-full max-h-[70vh] overflow-y-auto pb-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-base-300" />
            </div>

            <div className="px-6 pb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Settings</h2>
              <span className="text-sm text-base-content/40 font-medium">{completedSteps.size}/{totalSteps} done</span>
            </div>

            <div className="px-6 space-y-1">
              {/* Auto-advance */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-base-200/60">
                <div>
                  <p className="font-semibold text-sm">Auto-advance</p>
                  <p className="text-xs text-base-content/50 mt-0.5">Move to next step when timer ends</p>
                </div>
                <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={autoAdvance} onChange={e => setAutoAdvance(e.target.checked)} />
              </div>

              {/* TTS */}
              {ttsSupported && (
                <div className="rounded-2xl bg-base-200/60 overflow-hidden">
                  {/* Enable toggle */}
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold text-sm">Read Steps Aloud</p>
                      <p className="text-xs text-base-content/50 mt-0.5">Text-to-speech narration</p>
                    </div>
                    <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={ttsEnabled} onChange={toggleSpeech} />
                  </div>

                  {ttsEnabled && (
                    <div className="px-4 pb-4 space-y-4 border-t border-base-300">
                      {/* Voice selector */}
                      {voices.length > 0 && (
                        <div className="pt-3">
                          <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-2">Voice</p>
                          <select
                            value={settings.voiceURI}
                            onChange={e => updateSettings({ voiceURI: e.target.value })}
                            className="w-full bg-base-100 border border-base-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                          >
                            <option value="">System Default</option>
                            {voices.map(v => (
                              <option key={v.voiceURI} value={v.voiceURI}>
                                {v.name} {v.localService ? '' : '(Online)'}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Speed */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Speed</p>
                          <span className="text-xs font-black text-primary">{settings.rate.toFixed(1)}×</span>
                        </div>
                        <input
                          type="range" min="0.5" max="2" step="0.1"
                          value={settings.rate}
                          onChange={e => updateSettings({ rate: parseFloat(e.target.value) })}
                          className="range range-primary range-xs w-full"
                        />
                        <div className="flex justify-between text-[10px] text-base-content/40 mt-1 font-medium">
                          <span>Slow</span><span>Normal</span><span>Fast</span>
                        </div>
                      </div>

                      {/* Pitch */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Pitch</p>
                          <span className="text-xs font-black text-primary">{settings.pitch.toFixed(1)}</span>
                        </div>
                        <input
                          type="range" min="0.5" max="2" step="0.1"
                          value={settings.pitch}
                          onChange={e => updateSettings({ pitch: parseFloat(e.target.value) })}
                          className="range range-primary range-xs w-full"
                        />
                        <div className="flex justify-between text-[10px] text-base-content/40 mt-1 font-medium">
                          <span>Low</span><span>Normal</span><span>High</span>
                        </div>
                      </div>

                      {/* Preview button */}
                      <button
                        onClick={() => speak('Here is a preview of how your steps will sound while cooking.')}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">play_circle</span>
                        Preview Voice
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Jump to step */}
              <div className="p-4 rounded-2xl bg-base-200/60">
                <p className="font-semibold text-sm mb-3">Jump to Step</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: totalSteps }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setCurrentStep(idx); setShowSettings(false); }}
                      className={`size-9 rounded-xl text-sm font-bold transition-all ${
                        idx === currentStep ? 'bg-primary text-primary-content shadow-md' :
                        completedSteps.has(idx) ? 'bg-success/20 text-success' : 'bg-base-300 text-base-content/60'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={() => { setCompletedSteps(new Set()); setCurrentStep(0); clearProgress(recipe.id); setShowSettings(false); }}
                className="w-full p-4 rounded-2xl border border-error/30 text-error text-sm font-bold hover:bg-error/5 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── Resume Prompt ── */}
      {showResumePrompt && savedProgress && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-base-100 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">bookmark_added</span>
            </div>
            <h3 className="text-xl font-bold mb-1">Resume Cooking?</h3>
            <p className="text-base-content/50 text-sm mb-6">
              You left off at <span className="font-bold text-primary">Step {savedProgress.currentStep + 1}</span> with {savedProgress.completedSteps.length}/{totalSteps} steps done.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleResume(false)} className="btn flex-1 rounded-2xl btn-ghost border border-base-200 normal-case font-bold">
                Start Over
              </button>
              <button onClick={() => handleResume(true)} className="btn flex-1 rounded-2xl btn-primary normal-case font-bold">
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Completion Screen ── */}
      {showCompletion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-base-100 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-[24px] bg-secondary/10 text-secondary">
              <span className="material-symbols-outlined text-5xl fill-1">celebration</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">All Done!</h2>
            <p className="text-base-content/50 text-sm mb-1">You've completed every step of</p>
            <p className="font-bold text-base text-primary mb-8 line-clamp-2">{recipe.title}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { clearProgress(recipe.id); handleExit(); }}
                className="btn btn-primary w-full rounded-2xl normal-case font-bold"
              >
                Back to Recipe
              </button>
              <button
                onClick={() => setShowCompletion(false)}
                className="btn btn-ghost btn-sm w-full normal-case text-base-content/40"
              >
                Review Steps
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookingModeScreen;
