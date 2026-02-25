
import React, { useState, useEffect, useRef } from 'react';

interface StepTimerProps {
    seconds: number;
    label: string;
    onComplete?: () => void;
    onClose?: () => void;
    fullScreen?: boolean;
}

const StepTimer: React.FC<StepTimerProps> = ({ seconds, label, onComplete, onClose, fullScreen = false }) => {
    const [timeLeft, setTimeLeft] = useState(seconds);
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef<number | null>(null);
    const hasCompleted = useRef(false);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            intervalRef.current = window.setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && !hasCompleted.current) {
            hasCompleted.current = true;
            setIsActive(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }
            onComplete?.();
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, timeLeft, onComplete]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(seconds);
        hasCompleted.current = false;
    };

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = ((seconds - timeLeft) / seconds) * 100;
    const isFinished = timeLeft === 0;

    if (fullScreen) {
        return (
            <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto px-6">
                {/* Close button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 btn btn-circle btn-ghost text-white hover:bg-white/20"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                )}

                {/* Step label */}
                <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
                    {label}
                </p>

                {/* Timer circle */}
                <div className="relative w-56 h-56 mb-8">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                        <circle
                            cx="50" cy="50" r="45" fill="none"
                            stroke={isFinished ? '#22c55e' : isActive ? '#3b82f6' : 'rgba(255,255,255,0.3)'}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 45}`}
                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                            className="transition-all duration-1000"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`font-mono font-bold tabular-nums ${isFinished ? 'text-4xl text-success' : 'text-5xl text-white'}`}>
                            {isFinished ? 'Done!' : formatTime(timeLeft)}
                        </span>
                        {!isFinished && (
                            <span className="text-white/40 text-xs mt-1">
                                {isActive ? 'Cooking...' : 'Paused'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                    {!isFinished ? (
                        <>
                            <button
                                onClick={resetTimer}
                                className="btn btn-circle btn-lg btn-ghost text-white border border-white/20 hover:bg-white/10"
                            >
                                <span className="material-symbols-outlined text-2xl">restart_alt</span>
                            </button>
                            <button
                                onClick={toggleTimer}
                                className={`btn btn-circle btn-xl ${isActive ? 'btn-warning' : 'btn-primary'}`}
                            >
                                <span className="material-symbols-outlined text-3xl">
                                    {isActive ? 'pause' : 'play_arrow'}
                                </span>
                            </button>
                            <div className="w-14" /> {/* Spacer for symmetry */}
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="btn btn-success btn-lg gap-2"
                        >
                            <span className="material-symbols-outlined">check_circle</span>
                            Continue
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Compact/inline version (used in RecipeDetailScreen)
    return (
        <div className="mt-3 bg-primary/10 rounded-xl border border-primary/20 overflow-hidden">
            <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">timer</span>
                        <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider">{label}</span>
                    </div>
                    <span className="font-mono font-bold text-lg tabular-nums text-primary">
                        {formatTime(timeLeft)}
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={toggleTimer}
                        className={`btn btn-sm flex-1 gap-2 ${isActive ? 'btn-warning' : 'btn-primary'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {isActive ? 'pause_circle' : 'play_circle'}
                        </span>
                        {isActive ? 'Pause' : timeLeft === seconds ? 'Start Timer' : 'Resume'}
                    </button>
                    <button
                        onClick={resetTimer}
                        className="btn btn-outline btn-sm btn-square"
                    >
                        <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                    </button>
                </div>
            </div>
            {/* Progress Bar */}
            <progress className="progress progress-primary w-full h-1" value={progress} max="100"></progress>
        </div>
    );
};

export default StepTimer;
