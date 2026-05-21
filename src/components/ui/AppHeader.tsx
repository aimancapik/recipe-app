import React from 'react';

interface AppHeaderProps {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    onBack?: () => void;
    actions?: React.ReactNode;
    className?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ eyebrow, title, subtitle, onBack, actions, className = '' }) => (
    <header className={`sticky top-0 z-30 bg-base-100/95 backdrop-blur-xl border-b border-base-200/70 px-5 pt-6 pb-4 ${className}`}>
        <div className="flex items-center gap-3">
            {onBack && (
                <button onClick={onBack} className="btn btn-ghost btn-circle btn-sm shrink-0" title="Back">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
            )}
            <div className="min-w-0 flex-1">
                {eyebrow && <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">{eyebrow}</p>}
                <h1 className="truncate text-2xl font-black leading-tight text-base-content">{title}</h1>
                {subtitle && <p className="mt-0.5 truncate text-xs font-medium text-base-content/45">{subtitle}</p>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </div>
    </header>
);

export default AppHeader;
