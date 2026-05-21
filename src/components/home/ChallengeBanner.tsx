import React from 'react';
import { Challenge } from '@/types';

interface ChallengeBannerProps {
    challenge: Challenge;
    participantCount: number;
    hasJoined: boolean;
    onJoin: () => void;
}

const ChallengeBanner: React.FC<ChallengeBannerProps> = ({
    challenge, participantCount, hasJoined, onJoin,
}) => {
    const daysLeft = 7 - new Date().getDay();

    return (
        <div className="mx-5 mb-5 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
            <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-content/60">Weekly Challenge</span>
                        <span className="text-[10px] bg-base-100/20 text-primary-content px-2 py-0.5 rounded-full font-bold">{daysLeft}d left</span>
                    </div>
                    <p className="text-primary-content font-black text-base leading-tight">
                        {challenge.emoji} {challenge.title}
                    </p>
                    <p className="text-primary-content/70 text-xs mt-0.5 line-clamp-1">{challenge.description}</p>
                    {participantCount > 0 && (
                        <p className="text-primary-content/60 text-[10px] mt-1 font-medium">
                            {participantCount.toLocaleString()} cooking this week
                        </p>
                    )}
                </div>
                <button
                    onClick={onJoin}
                    disabled={hasJoined}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        hasJoined
                            ? 'bg-base-100/20 text-primary-content cursor-default'
                            : 'bg-base-100 text-primary shadow-md active:scale-95'
                    }`}
                >
                    {hasJoined ? '✓ Joined' : 'Join'}
                </button>
            </div>
        </div>
    );
};

export default ChallengeBanner;
