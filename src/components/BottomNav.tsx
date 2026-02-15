
import React from 'react';
import { Screen } from '@/types';

interface BottomNavProps {
    currentScreen: Screen;
    onNavigate: (screen: Screen) => void;
    onQuickAction?: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, onQuickAction }) => {
    const navItems = [
        { screen: Screen.HOME, icon: 'home', label: 'Home' },
        { screen: Screen.EXPLORE, icon: 'explore', label: 'Discover' },
        null, // placeholder for center button
        { screen: Screen.SAVED, icon: 'bookmark', label: 'Saved' },
        { screen: Screen.PROFILE, icon: 'person', label: 'Profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-[480px] mx-auto">
            <div className="bg-base-100/95 backdrop-blur-md border-t border-base-200 px-2 pb-[env(safe-area-inset-bottom)]">
                <div className="flex items-end justify-around h-16">
                    {navItems.map((item, idx) => {
                        if (!item) {
                            // Center Create button
                            return (
                                <button
                                    key="create"
                                    onClick={() => onQuickAction?.()}
                                    className="flex flex-col items-center -mt-5 group"
                                >
                                    <span className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-base-100 group-active:scale-90 transition-transform">
                                        <span className="material-symbols-outlined text-primary-content text-2xl font-bold">add</span>
                                    </span>
                                    <span className="text-[10px] font-medium text-base-content/50 mt-0.5">Create</span>
                                </button>
                            );
                        }

                        const isActive = currentScreen === item.screen;
                        return (
                            <button
                                key={item.screen}
                                onClick={() => onNavigate(item.screen)}
                                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 transition-colors ${isActive ? 'text-primary' : 'text-base-content/40'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-xl ${isActive ? 'fill-icon' : ''}`}>
                                    {item.icon}
                                </span>
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default BottomNav;
