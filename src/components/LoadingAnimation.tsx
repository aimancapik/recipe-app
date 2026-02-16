import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/animations/loading.json';

interface LoadingAnimationProps {
    size?: number | string;
    className?: string;
    fullScreen?: boolean;
    text?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
    size = 120,
    className = "",
    fullScreen = false,
    text
}) => {
    const animation = (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <div style={{ width: size, height: size }}>
                <Lottie
                    animationData={loadingAnimation}
                    loop={true}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
            {text && (
                <span className="text-xs text-gray-400 font-medium tracking-wide uppercase mt-2">
                    {text}
                </span>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center overflow-hidden">
                {animation}
            </div>
        );
    }

    return animation;
};

export default LoadingAnimation;
