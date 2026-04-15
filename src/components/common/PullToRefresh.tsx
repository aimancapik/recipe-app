import React, { useState, useRef, useCallback } from 'react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    /** Pull distance in px before refresh triggers (default: 80) */
    threshold?: number;
    /** Max pull distance in px (default: 130) */
    maxPull?: number;
    className?: string;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
    onRefresh,
    children,
    threshold = 80,
    maxPull = 130,
    className = '',
}) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const touchStartY = useRef(0);
    const isPulling = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isAtTop = useCallback(() => {
        // Check if scrolled to top
        return window.scrollY <= 0;
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (isRefreshing) return;
        if (isAtTop()) {
            touchStartY.current = e.touches[0].clientY;
            isPulling.current = true;
        }
    }, [isRefreshing, isAtTop]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPulling.current || isRefreshing) return;

        const touchY = e.touches[0].clientY;
        const diff = touchY - touchStartY.current;

        if (diff > 0 && isAtTop()) {
            // Apply resistance — pull feels heavier the further you go
            const resistance = Math.min(diff * 0.45, maxPull);
            setPullDistance(resistance);
        } else {
            setPullDistance(0);
        }
    }, [isRefreshing, isAtTop, maxPull]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling.current || isRefreshing) return;
        isPulling.current = false;

        if (pullDistance >= threshold) {
            // Trigger refresh
            setPullDistance(60); // Snap to a fixed position while refreshing
            setIsRefreshing(true);
            try {
                await onRefresh();
            } catch (err) {
                console.error('Pull to refresh failed:', err);
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            // Snap back
            setPullDistance(0);
        }
    }, [pullDistance, threshold, isRefreshing, onRefresh]);

    const progress = Math.min(pullDistance / threshold, 1);
    const rotation = progress * 180;
    const indicatorOpacity = Math.min(progress * 1.5, 1);

    return (
        <div
            ref={containerRef}
            className={className}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull indicator */}
            <div
                className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
                style={{
                    height: pullDistance > 0 || isRefreshing ? `${pullDistance}px` : '0px',
                    transition: isPulling.current ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                <div
                    className="flex flex-col items-center gap-2"
                    style={{ opacity: indicatorOpacity }}
                >
                    {isRefreshing ? (
                        <div className="flex items-center gap-2.5">
                            <span className="loading loading-spinner loading-sm text-primary"></span>
                            <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                                Refreshing...
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2.5">
                            <span
                                className="material-symbols-outlined text-xl text-primary transition-transform"
                                style={{
                                    transform: `rotate(${rotation}deg)`,
                                    transition: isPulling.current ? 'none' : 'transform 0.2s ease',
                                }}
                            >
                                arrow_downward
                            </span>
                            <span className="text-xs font-semibold text-base-content/50 tracking-wide uppercase">
                                {progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            {children}
        </div>
    );
};

export default PullToRefresh;
