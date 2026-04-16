
import React from 'react';
import { Screen } from '@/types';

interface BottomNavProps {
    currentScreen: Screen;
    onNavigate: (screen: Screen) => void;
    onQuickAction?: () => void;
    unreadMessages?: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, onQuickAction, unreadMessages = 0 }) => {
    const navItems = [
        { screen: Screen.HOME, icon: 'home', label: 'Home' },
        { screen: Screen.BITES, icon: 'play_circle', label: 'Bites' },
        null, // placeholder for center button
        { screen: Screen.SAVED, icon: 'bookmark', label: 'Saved' },
        { screen: Screen.PROFILE, icon: 'person', label: 'Profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-[480px] mx-auto">
            <div className="bg-base-100 backdrop-blur-xl border-t border-base-200 px-2 pb-[env(safe-area-inset-bottom)]">
                <div className="flex items-end justify-around h-16">
                    {navItems.map((item, idx) => {
                        if (!item) {
                            // Center Create button
                            return (
                                <button
                                    key="create"
                                    onClick={() => onQuickAction?.()}
                                    className="flex flex-col items-center -mt-7 group"
                                >
                                    <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-base-100 group-active:scale-90 transition-all duration-200 hover:shadow-xl hover:shadow-primary/40">
                                        <span className="material-symbols-outlined text-primary-content text-3xl font-bold">add</span>
                                    </span>
                                    <span className="text-[10px] font-semibold text-primary mt-0.5">Create</span>
                                </button>
                            );
                        }

                        const isActive = currentScreen === item.screen;
                        return (
                            <button
                                key={item.screen}
                                onClick={() => onNavigate(item.screen)}
                                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 transition-all duration-200 relative ${isActive ? 'text-primary' : 'text-base-content/40 hover:text-base-content/60'
                                    }`}
                            >
                                {/* Active indicator dot */}
                                {isActive && (
                                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
                                )}
                                <div className="relative">
                                    <span className={`material-symbols-outlined text-xl transition-all ${isActive ? 'fill-icon scale-110' : ''}`}>
                                        {item.icon}
                                    </span>
                                    {false && unreadMessages > 0 && (
                                        <span className="absolute -top-1 -right-1 size-4 bg-primary text-primary-content text-[9px] font-bold rounded-full flex items-center justify-center">
                                            {unreadMessages > 9 ? '9+' : unreadMessages}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default BottomNav;
