import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC = () => {
    const [phase, setPhase] = useState(0);
    // phase 0: initial → phase 1: logo in → phase 2: text in → phase 3: loader in

    useEffect(() => {
        const t1 = setTimeout(() => setPhase(1), 100);
        const t2 = setTimeout(() => setPhase(2), 600);
        const t3 = setTimeout(() => setPhase(3), 1000);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-white">

            {/* Logo + wordmark */}
            <div className="relative flex flex-col items-center">
                {/* Logo */}
                <div
                    className="transition-all duration-700 ease-out"
                    style={{
                        opacity: phase >= 1 ? 1 : 0,
                        transform: phase >= 1 ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(24px)',
                    }}
                >
                    <div className="mb-6">
                        <img
                            src="/logo.png"
                            alt="Let Em Cook"
                            className="w-screen max-w-sm object-contain drop-shadow-2xl"
                        />
                    </div>
                </div>

            </div>

            {/* Dot loader */}
            <div
                className="absolute bottom-16 flex items-center gap-2 transition-all duration-500"
                style={{ opacity: phase >= 3 ? 1 : 0 }}
            >
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                            background: '#f97316',
                            animation: `splashDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }}
                    />
                ))}
            </div>

            <style>{`
                @keyframes splashDot {
                    0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
                    40% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
};

export default SplashScreen;
