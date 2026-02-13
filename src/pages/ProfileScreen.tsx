
import React from 'react';

interface ProfileScreenProps {
    onBack: () => void;
    isDark: boolean;
    onToggleTheme: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, isDark, onToggleTheme }) => {
    return (
        <div className="bg-base-200 text-base-content min-h-screen flex flex-col">
            {/* Top App Bar */}
            <div className="navbar sticky top-0 z-10 bg-base-100/80 backdrop-blur-md border-b border-base-200">
                <div className="navbar-start">
                    <button onClick={onBack} className="btn btn-ghost btn-circle btn-sm">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                </div>
                <div className="navbar-center">
                    <h2 className="text-lg font-bold">Profile</h2>
                </div>
                <div className="navbar-end">
                    <button className="btn btn-ghost btn-circle btn-sm">
                        <span className="material-symbols-outlined">edit</span>
                    </button>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto pb-20">
                {/* Profile Header */}
                <div className="flex p-6 flex-col items-center">
                    <div className="avatar online">
                        <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-4">
                            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" alt="Profile" />
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col items-center text-center">
                        <h1 className="text-2xl font-bold tracking-tight">Alex Miller</h1>
                        <p className="text-base-content/50 font-medium">Chef & Food Enthusiast</p>
                        <div className="flex items-center gap-1 mt-1 text-sm text-base-content/40">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            <span>New York, NY</span>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="stats stats-horizontal shadow mx-4 w-auto bg-base-100">
                    {[
                        { label: 'Recipes', val: '124' },
                        { label: 'Followers', val: '1.2k' },
                        { label: 'Following', val: '850' }
                    ].map(stat => (
                        <div key={stat.label} className="stat place-items-center">
                            <div className="stat-value text-xl">{stat.val}</div>
                            <div className="stat-desc text-xs font-medium uppercase tracking-wider">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Menu Section */}
                <div className="px-4 mt-6 flex flex-col gap-2">
                    <h3 className="px-2 text-xs font-bold text-base-content/40 uppercase tracking-widest mb-1">Account</h3>
                    <ul className="menu bg-base-100 rounded-box gap-1 shadow-sm">
                        <li>
                            <a className="flex items-center gap-3">
                                <div className="btn btn-sm btn-ghost bg-primary/20 text-primary">
                                    <span className="material-symbols-outlined">menu_book</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">My Recipes</p>
                                    <p className="text-xs text-base-content/50">42 saved, 12 published</p>
                                </div>
                                <span className="material-symbols-outlined text-base-content/30">chevron_right</span>
                            </a>
                        </li>
                        <li>
                            <a className="flex items-center gap-3">
                                <div className="btn btn-sm btn-ghost bg-primary/20 text-primary">
                                    <span className="material-symbols-outlined">notifications</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">Notifications</p>
                                </div>
                                <div className="badge badge-primary badge-sm">3 NEW</div>
                                <span className="material-symbols-outlined text-base-content/30">chevron_right</span>
                            </a>
                        </li>
                        <li>
                            <a className="flex items-center gap-3">
                                <div className="btn btn-sm btn-ghost bg-primary/20 text-primary">
                                    <span className="material-symbols-outlined">settings</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">Settings</p>
                                </div>
                                <span className="material-symbols-outlined text-base-content/30">chevron_right</span>
                            </a>
                        </li>
                    </ul>

                    {/* Dark Mode Toggle */}
                    <div className="flex items-center gap-4 bg-base-100 px-4 py-4 rounded-xl shadow-sm">
                        <div className="btn btn-sm btn-ghost bg-primary/20 text-primary">
                            <span className="material-symbols-outlined">{isDark ? 'dark_mode' : 'light_mode'}</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-semibold">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                            <p className="text-xs text-base-content/50">{isDark ? 'Switch to light theme' : 'Switch to dark theme'}</p>
                        </div>
                        <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={isDark}
                            onChange={onToggleTheme}
                        />
                    </div>

                    <h3 className="px-2 text-xs font-bold text-base-content/40 uppercase tracking-widest mt-4 mb-1">Support</h3>
                    <ul className="menu bg-base-100 rounded-box shadow-sm">
                        <li>
                            <a className="flex items-center gap-3">
                                <div className="btn btn-sm btn-ghost bg-primary/20 text-primary">
                                    <span className="material-symbols-outlined">help_center</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">Help Center</p>
                                </div>
                                <span className="material-symbols-outlined text-base-content/30">chevron_right</span>
                            </a>
                        </li>
                    </ul>

                    <button className="btn btn-outline btn-error mt-4 gap-3">
                        <span className="material-symbols-outlined">logout</span>
                        Sign Out
                    </button>
                </div>
            </main>
        </div>
    );
};

export default ProfileScreen;
