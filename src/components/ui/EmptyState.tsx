import React from 'react';

interface EmptyStateProps {
    icon: string;
    title: string;
    body?: string;
    action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, body, action }) => (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <div className="mb-5 flex size-24 items-center justify-center rounded-[24px] bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-5xl">{icon}</span>
        </div>
        <h3 className="text-xl font-black text-base-content">{title}</h3>
        {body && <p className="mt-2 max-w-xs text-sm leading-relaxed text-base-content/50">{body}</p>}
        {action && <div className="mt-6">{action}</div>}
    </div>
);

export default EmptyState;
