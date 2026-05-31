import React, { useState } from 'react';

interface OnboardingScreenProps {
    onComplete: () => void;
}

const slides = [
    {
        title: "What's in your fridge?",
        description: "Add the ingredients you already have and WhatsCookin will find recipes that fit.",
        icon: "kitchen",
        color: "from-teal-500 to-cyan-500",
        bg: "bg-teal-50"
    },
    {
        title: "We find the recipes",
        description: "See strong matches first, plus what you are missing before you start cooking.",
        icon: "fact_check",
        color: "from-cyan-500 to-sky-500",
        bg: "bg-cyan-50"
    },
    {
        title: "Import from anywhere",
        description: "Paste a URL, upload a screenshot, or snap a cookbook photo and save the recipe.",
        icon: "post_add",
        color: "from-amber-400 to-teal-500",
        bg: "bg-amber-50"
    },
    {
        title: "Set up your pantry",
        description: "Keep staples like salt, oil, and pepper ready so matches get smarter over time.",
        icon: "inventory_2",
        color: "from-emerald-500 to-teal-500",
        bg: "bg-emerald-50"
    }
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < slides.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const slide = slides[currentStep];

    return (
        <div className="fixed inset-0 z-50 bg-base-100 flex flex-col items-center justify-between pb-10">
            {/* Skip Button */}
            <div className="w-full flex justify-end p-6">
                <button
                    onClick={onComplete}
                    className="text-base-content/50 font-medium tracking-wide hover:text-base-content active:scale-95 transition-all"
                >
                    Skip
                </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm px-8 animate-fade-in" key={currentStep}>
                {/* Illustration Circle */}
                <div className={`relative size-64 rounded-[3rem] ${slide.bg} mb-12 flex items-center justify-center shadow-inner overflow-hidden`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${slide.color} opacity-20`}></div>
                    <div className="absolute inset-4 bg-base-100/40 rounded-[2.5rem] backdrop-blur-md border border-white/50"></div>
                    <span className={`material-symbols-outlined text-[100px] relative z-10 bg-gradient-to-br ${slide.color} bg-clip-text text-transparent drop-shadow-sm`}>
                        {slide.icon}
                    </span>

                    {/* Decorative elements */}
                    <div className="absolute top-10 right-10 size-4 rounded-full bg-base-100 animate-pulse-soft"></div>
                    <div className="absolute bottom-12 left-12 size-6 rounded-full bg-base-100 opacity-60 animate-bounce-in" style={{ animationDelay: '200ms' }}></div>
                </div>

                {/* Text Content */}
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-black tracking-tight text-base-content leading-tight">
                        {slide.title}
                    </h1>
                    <p className="text-base text-base-content/60 leading-relaxed font-medium">
                        {slide.description}
                    </p>
                </div>
            </div>

            {/* Progress & Controls */}
            <div className="w-full max-w-sm px-8 flex flex-col items-center gap-8">
                {/* Dot Indicators */}
                <div className="flex items-center gap-2">
                    {slides.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-2 transition-all duration-300 rounded-full ${idx === currentStep
                                    ? 'w-8 bg-primary shadow-sm shadow-primary/30'
                                    : 'w-2 bg-base-300'
                                }`}
                        />
                    ))}
                </div>

                {/* Action Button */}
                <button
                    onClick={handleNext}
                    className="btn btn-primary w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {currentStep === slides.length - 1 ? (
                        <>
                            Get Started
                            <span className="material-symbols-outlined text-xl">done</span>
                        </>
                    ) : (
                        <>
                            Next
                            <span className="material-symbols-outlined text-xl">arrow_forward_ios</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default OnboardingScreen;
