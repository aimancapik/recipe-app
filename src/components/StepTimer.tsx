
import React, { useState, useEffect, useRef } from 'react';

interface StepTimerProps {
    seconds: number;
    label: string;
}

const StepTimer: React.FC<StepTimerProps> = ({ seconds, label }) => {
    const [timeLeft, setTimeLeft] = useState(seconds);
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            intervalRef.current = window.setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(seconds);
    };

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = ((seconds - timeLeft) / seconds) * 100;

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
