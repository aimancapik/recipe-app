
import React from 'react';
import { Screen } from '@/types';

interface BottomNavProps {
    currentScreen: Screen;
    onNavigate: (screen: Screen) => void;
    onQuickAction?: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, onQuickAction }) => {
    return (
        <nav className="btm-nav btm-nav-md z-50 bg-base-100/95 backdrop-blur-md border-t border-base-200">
            <button
                onClick={() => onNavigate(Screen.HOME)}
                className={currentScreen === Screen.HOME ? 'active text-primary' : 'text-base-content/40'}
            >
                <span className={`material-symbols-outlined ${currentScreen === Screen.HOME ? 'fill-icon' : ''}`}>home</span>
                <span className="btm-nav-label text-[10px] font-medium">Home</span>
            </button>

            <button
                onClick={() => onNavigate(Screen.EXPLORE)}
                className={currentScreen === Screen.EXPLORE ? 'active text-primary' : 'text-base-content/40'}
            >
                <span className={`material-symbols-outlined ${currentScreen === Screen.EXPLORE ? 'fill-icon' : ''}`}>explore</span>
                <span className="btm-nav-label text-[10px] font-medium">Discover</span>
            </button>

            <div className="flex flex-col items-center justify-center">
                <button
                    onClick={() => onQuickAction?.()}
                    className="btn btn-primary btn-circle btn-md -mt-8 shadow-lg border-4 border-base-100"
                >
                    <span className="material-symbols-outlined text-primary-content font-bold">add</span>
                </button>
                <span className="text-[10px] font-medium text-base-content/40 mt-1">Create</span>
            </div>

            <button
                onClick={() => onNavigate(Screen.SAVED)}
                className={currentScreen === Screen.SAVED ? 'active text-primary' : 'text-base-content/40'}
            >
                <span className={`material-symbols-outlined ${currentScreen === Screen.SAVED ? 'fill-icon' : ''}`}>bookmark</span>
                <span className="btm-nav-label text-[10px] font-medium">Saved</span>
            </button>

            <button
                onClick={() => onNavigate(Screen.PROFILE)}
                className={currentScreen === Screen.PROFILE ? 'active text-primary' : 'text-base-content/40'}
            >
                <span className={`material-symbols-outlined ${currentScreen === Screen.PROFILE ? 'fill-icon' : ''}`}>person</span>
                <span className="btm-nav-label text-[10px] font-medium">Profile</span>
            </button>
        </nav>
    );
};

export default BottomNav;
