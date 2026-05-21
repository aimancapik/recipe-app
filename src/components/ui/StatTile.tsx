import React from 'react';

interface StatTileProps {
    icon: string;
    value: string | number;
    label: string;
    tone?: 'primary' | 'secondary' | 'accent' | 'neutral';
    onClick?: () => void;
}

const toneClass = {
    primary: 'text-primary bg-primary/10',
    secondary: 'text-secondary bg-secondary/10',
    accent: 'text-accent bg-accent/10',
    neutral: 'text-base-content bg-base-200',
};

const StatTile: React.FC<StatTileProps> = ({ icon, value, label, tone = 'primary', onClick }) => {
    const Comp = onClick ? 'button' : 'div';
    return (
        <Comp
            onClick={onClick}
            className={`lec-card-compact flex min-w-0 flex-col p-3 text-left ${onClick ? 'transition-all active:scale-95 hover:border-primary/30' : ''}`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="truncate text-lg font-black text-base-content">{value}</span>
                <span className={`flex size-8 items-center justify-center rounded-full ${toneClass[tone]}`}>
                    <span className="material-symbols-outlined text-[18px]">{icon}</span>
                </span>
            </div>
            <span className="mt-1 truncate text-[10px] font-black uppercase tracking-wide text-base-content/40">{label}</span>
        </Comp>
    );
};

export default StatTile;
