import React, { useState, useEffect, useRef } from 'react';

interface StepTimerProps {
    seconds: number;
    label: string;
    onComplete?: () => void;
    onClose?: () => void;
    fullScreen?: boolean;
}

const StepTimer: React.FC<StepTimerProps> = ({ seconds, label, onComplete, onClose }) => {
    const [timeLeft, setTimeLeft] = useState(seconds);
    const [isActive, setIsActive] = useState(true); // auto-start
    const intervalRef = useRef<number | null>(null);
    const hasCompleted = useRef(false);

    useEffect(() => {
        if (!isActive || timeLeft <= 0) return;

        intervalRef.current = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    if (!hasCompleted.current) {
                        hasCompleted.current = true;
                        setIsActive(false);
                        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
                        setTimeout(() => onComplete?.(), 0);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isActive]);

    const toggle = () => setIsActive(p => !p);
    const reset = () => {
        setIsActive(false);
        setTimeLeft(seconds);
        hasCompleted.current = false;
    };

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const progress = seconds > 0 ? (seconds - timeLeft) / seconds : 1;
    const isFinished = timeLeft === 0;

    // SVG ring params
    const size = 56;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    const ringColor = isFinished ? '#22c55e' : isActive ? 'hsl(var(--p))' : 'hsl(var(--bc) / 0.2)';

    return (
        <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
            isFinished
                ? 'bg-success/10 border-success/30'
                : isActive
                ? 'bg-base-200 border-primary/20'
                : 'bg-base-200 border-base-300'
        }`}>
            {/* Circular progress ring with time */}
            <div className="relative shrink-0" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    {/* Track */}
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        className="text-base-300"
                    />
                    {/* Progress */}
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none"
                        stroke={ringColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    {isFinished ? (
                        <span className="material-symbols-outlined text-success text-xl fill-1">check</span>
                    ) : (
                        <span className={`font-mono font-black tabular-nums text-xs leading-none ${isActive ? 'text-base-content' : 'text-base-content/50'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    )}
                </div>
            </div>

            {/* Label + status */}
            <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold uppercase tracking-wider truncate ${isFinished ? 'text-success' : 'text-base-content/50'}`}>
                    {label}
                </p>
                <p className={`text-base font-black tabular-nums ${isFinished ? 'text-success' : isActive ? 'text-base-content' : 'text-base-content/40'}`}>
                    {isFinished ? 'Done!' : formatTime(timeLeft)}
                </p>
                <p className="text-[10px] text-base-content/30 font-medium">
                    {isFinished ? 'Tap × to dismiss' : isActive ? 'Running' : 'Paused'}
                </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
                {!isFinished && (
                    <>
                        <button
                            onClick={reset}
                            className="size-8 flex items-center justify-center rounded-xl bg-base-300 hover:bg-base-content/20 transition-colors"
                            title="Reset"
                        >
                            <span className="material-symbols-outlined text-[16px] text-base-content/60">restart_alt</span>
                        </button>
                        <button
                            onClick={toggle}
                            className={`size-8 flex items-center justify-center rounded-xl transition-all ${
                                isActive
                                    ? 'bg-warning/20 text-warning hover:bg-warning/30'
                                    : 'bg-primary text-primary-content hover:opacity-90'
                            }`}
                            title={isActive ? 'Pause' : 'Resume'}
                        >
                            <span className="material-symbols-outlined text-[18px] fill-1">
                                {isActive ? 'pause' : 'play_arrow'}
                            </span>
                        </button>
                    </>
                )}
                <button
                    onClick={onClose}
                    className="size-8 flex items-center justify-center rounded-xl bg-base-300 hover:bg-error/20 hover:text-error transition-colors"
                    title="Dismiss"
                >
                    <span className="material-symbols-outlined text-[16px] text-base-content/50">close</span>
                </button>
            </div>
        </div>
    );
};

export default StepTimer;
