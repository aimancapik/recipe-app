import React from 'react';

interface StickyActionBarProps {
    children: React.ReactNode;
    className?: string;
}

const StickyActionBar: React.FC<StickyActionBarProps> = ({ children, className = '' }) => (
    <div className={`fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-[480px] bg-gradient-to-t from-base-100 via-base-100/95 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-8 ${className}`}>
        <div className="lec-surface rounded-[28px] p-3">{children}</div>
    </div>
);

export default StickyActionBar;
