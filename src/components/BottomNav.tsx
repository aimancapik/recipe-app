
import React from 'react';
import { Screen } from '@/types';

interface BottomNavProps {
    currentScreen: Screen;
    onNavigate: (screen: Screen) => void;
    onQuickAction?: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, onQuickAction }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pb-4 pt-2 shadow-2xl z-50">
            <div className="flex max-w-md mx-auto items-center">
                <button
                    onClick={() => onNavigate(Screen.HOME)}
                    className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${currentScreen === Screen.HOME ? 'text-black dark:text-primary' : 'text-slate-400'}`}
                >
                    <span className={`material-symbols-outlined ${currentScreen === Screen.HOME ? 'fill-icon' : ''}`}>home</span>
                    <p className={`text-[10px] ${currentScreen === Screen.HOME ? 'font-bold' : 'font-medium'}`}>Home</p>
                </button>

                <button
                    onClick={() => onNavigate(Screen.EXPLORE)}
                    className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${currentScreen === Screen.EXPLORE ? 'text-black dark:text-primary' : 'text-slate-400'}`}
                >
                    <span className={`material-symbols-outlined ${currentScreen === Screen.EXPLORE ? 'fill-icon' : ''}`}>explore</span>
                    <p className={`text-[10px] ${currentScreen === Screen.EXPLORE ? 'font-bold' : 'font-medium'}`}>Discover</p>
                </button>

                <div className="flex flex-1 flex-col items-center justify-center">
                    <button
                        onClick={() => onQuickAction?.()}
                        className="bg-primary size-12 rounded-full flex items-center justify-center -mt-8 shadow-lg border-4 border-slate-50 dark:border-background-dark active:scale-90 transition-transform"
                    >
                        <span className="material-symbols-outlined text-black font-bold">add</span>
                    </button>
                    <p className="text-[10px] font-medium text-slate-400 mt-1">Create</p>
                </div>

                <button
                    onClick={() => onNavigate(Screen.SAVED)}
                    className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${currentScreen === Screen.SAVED ? 'text-black dark:text-primary' : 'text-slate-400'}`}
                >
                    <span className={`material-symbols-outlined ${currentScreen === Screen.SAVED ? 'fill-icon' : ''}`}>bookmark</span>
                    <p className={`text-[10px] ${currentScreen === Screen.SAVED ? 'font-bold' : 'font-medium'}`}>Saved</p>
                </button>

                <button
                    onClick={() => onNavigate(Screen.PROFILE)}
                    className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${currentScreen === Screen.PROFILE ? 'text-black dark:text-primary' : 'text-slate-400'}`}
                >
                    <span className={`material-symbols-outlined ${currentScreen === Screen.PROFILE ? 'fill-icon' : ''}`}>person</span>
                    <p className={`text-[10px] ${currentScreen === Screen.PROFILE ? 'font-bold' : 'font-medium'}`}>Profile</p>
                </button>
            </div>
        </nav>
    );
};

export default BottomNav;
