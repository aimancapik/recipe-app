import React from 'react';
import { CookStreak } from '@/types';

interface CookStreakCardProps {
    streak: CookStreak;
}

const CookStreakCard: React.FC<CookStreakCardProps> = ({ streak }) => {
    const today = new Date().toISOString().split('T')[0];
    const cookedToday = streak.last_cook_date === today;

    return (
        <div className={`rounded-2xl p-4 border transition-all ${
            streak.current_streak > 0
                ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-200 dark:border-orange-800'
                : 'bg-base-200/50 border-base-200'
        }`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{streak.current_streak > 0 ? '🔥' : '💤'}</span>
                    <div>
                        <p className="font-black text-2xl leading-none text-base-content">
                            {streak.current_streak}
                            <span className="text-sm font-semibold text-base-content/50 ml-1">day{streak.current_streak !== 1 ? 's' : ''}</span>
                        </p>
                        <p className="text-xs text-base-content/50 font-medium">Cook Streak</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-base-content/40">Best</p>
                    <p className="font-bold text-base-content/70">{streak.longest_streak}d</p>
                </div>
            </div>

            {/* Week mini calendar */}
            <div className="flex gap-1.5 mb-3">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                    const isToday = new Date().getDay() === i;
                    const isPast = i < new Date().getDay();
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[9px] text-base-content/40 font-semibold">{day}</span>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all
                                ${isToday && cookedToday ? 'bg-orange-500 text-white' :
                                  isToday ? 'ring-2 ring-orange-400 ring-offset-1 bg-base-100' :
                                  isPast && streak.current_streak > new Date().getDay() - i ? 'bg-orange-400 text-white' :
                                  'bg-base-200'
                                }`}>
                                {isToday && cookedToday ? '🔥' : ''}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-between">
                <p className="text-xs text-base-content/50">
                    {cookedToday ? '✅ Cooked today!' : '⚡ Cook today to keep your streak!'}
                </p>
                <span className="text-xs font-bold text-base-content/40">{streak.total_made} total</span>
            </div>
        </div>
    );
};

export default CookStreakCard;
