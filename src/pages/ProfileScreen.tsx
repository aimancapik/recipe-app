import React, { useState } from 'react';
import LoadingAnimation from '@/components/LoadingAnimation';
import { User } from '@supabase/supabase-js';
import AvatarPickerModal from '@/components/AvatarPickerModal';
import { getAvatarUrl } from '@/data/avatars';

interface ProfileScreenProps {
    onBack: () => void;
    isDark: boolean;
    onToggleTheme: () => void;
    user: User | null;
    onSignOut: () => Promise<void>;
    onUpdateProfile: (updates: {
        full_name?: string;
        avatar_id?: string;
        bio?: string;
        socials?: {
            instagram?: string;
            twitter?: string;
            youtube?: string;
        }
    }) => Promise<void>;
    recipeCount: number;
    favoriteCount: number;
    groceryCount: number;
    onModalToggle?: (hidden: boolean) => void;
    onMyRecipes?: () => void;
    onFavorites?: () => void;
    onGroceryList?: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
    onBack,
    isDark,
    onToggleTheme,
    user,
    onSignOut,
    onUpdateProfile,
    recipeCount,
    favoriteCount,
    groceryCount,
    onModalToggle,
    onMyRecipes,
    onFavorites,
    onGroceryList
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [name, setName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
    const [bio, setBio] = useState(user?.user_metadata?.bio || '');
    const [socials, setSocials] = useState({
        instagram: user?.user_metadata?.socials?.instagram || '',
        twitter: user?.user_metadata?.socials?.twitter || '',
        youtube: user?.user_metadata?.socials?.youtube || '',
    });
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest';
    const email = user?.email || '';
    const avatarId = user?.user_metadata?.avatar_id || null;
    const avatarUrl = avatarId ? getAvatarUrl(avatarId) : null;
    const initial = displayName.charAt(0).toUpperCase();

    const handleSignOut = async () => {
        try {
            await onSignOut();
            onBack();
        } catch (err) {
            console.error('Sign out failed:', err);
        }
    };

    const handleAvatarClick = () => {
        if (isEditing) {
            setIsAvatarModalOpen(true);
            onModalToggle?.(true);
        }
    };

    const handleAvatarSelect = async (id: string) => {
        try {
            setUploading(true);
            await onUpdateProfile({ avatar_id: id });
        } catch (err) {
            console.error('Failed to update avatar:', err);
            alert('Failed to update your avatar. Please try again.');
        } finally {
            setUploading(false);
            onModalToggle?.(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await onUpdateProfile({
                full_name: name,
                bio,
                socials
            });
            setIsEditing(false);
        } catch (err: any) {
            console.error('Profile update failed:', err);
            alert(`Failed to update profile: ${err.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-base-200 text-base-content min-h-screen flex flex-col w-full overflow-hidden">
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
                    {isEditing ? (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-ghost text-primary font-bold btn-sm"
                        >
                            {saving ? <LoadingAnimation size={16} /> : 'Save'}
                        </button>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="btn btn-ghost btn-circle btn-sm">
                            <span className="material-symbols-outlined">edit</span>
                        </button>
                    )}
                </div>
            </div>

            <main className="flex-1 overflow-y-auto">
                {/* Profile Header */}
                <div className="flex p-6 flex-col items-center">
                    <div
                        className={`avatar placeholder online relative ${isEditing ? 'cursor-pointer' : ''}`}
                        onClick={handleAvatarClick}
                    >
                        {avatarUrl ? (
                            <div className="w-28 aspect-square rounded-full ring ring-primary ring-offset-base-100 ring-offset-4 overflow-hidden">
                                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                        <LoadingAnimation size={32} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-28 aspect-square rounded-full ring ring-primary ring-offset-base-100 ring-offset-4 bg-primary text-primary-content flex items-center justify-center">
                                {uploading ? (
                                    <LoadingAnimation size={32} />
                                ) : (
                                    <span className="text-4xl font-bold">{initial}</span>
                                )}
                            </div>
                        )}
                        {isEditing && !uploading && (
                            <div className="absolute bottom-0 right-0 bg-primary text-primary-content p-1.5 rounded-full shadow-lg">
                                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex flex-col items-center text-center w-full px-4">
                        {isEditing ? (
                            <div className="space-y-4 w-full max-w-sm">
                                <div className="form-control w-full">
                                    <input
                                        type="text"
                                        className="input input-bordered input-md text-center font-bold text-lg"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your Name"
                                        autoFocus
                                    />
                                </div>
                                <div className="form-control w-full">
                                    <textarea
                                        className="textarea textarea-bordered h-20 text-center text-sm"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Write a short bio about yourself..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center gap-2 bg-base-100 p-2 rounded-lg border border-base-300">
                                        <div className="size-8 rounded flex items-center justify-center bg-gradient-to-tr from-purple-500 to-pink-500 text-white">
                                            <span className="material-symbols-outlined text-[18px]">link</span>
                                        </div>
                                        <input
                                            type="text"
                                            className="input input-sm border-none bg-transparent flex-1 focus:outline-none"
                                            value={socials.instagram}
                                            onChange={(e) => setSocials(prev => ({ ...prev, instagram: e.target.value }))}
                                            placeholder="Instagram URL"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 bg-base-100 p-2 rounded-lg border border-base-300">
                                        <div className="size-8 rounded flex items-center justify-center bg-sky-500 text-white">
                                            <span className="material-symbols-outlined text-[18px]">link</span>
                                        </div>
                                        <input
                                            type="text"
                                            className="input input-sm border-none bg-transparent flex-1 focus:outline-none"
                                            value={socials.twitter}
                                            onChange={(e) => setSocials(prev => ({ ...prev, twitter: e.target.value }))}
                                            placeholder="Twitter URL"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
                                <p className="text-base-content/50 font-medium text-sm mb-3">{email}</p>
                                {bio && (
                                    <p className="text-sm text-base-content/70 max-w-xs mb-4 leading-relaxed group">
                                        {bio}
                                    </p>
                                )}
                                {(socials.instagram || socials.twitter || socials.youtube) && (
                                    <div className="flex gap-3 mb-2">
                                        {socials.instagram && (
                                            <a href={socials.instagram} target="_blank" rel="noreferrer" className="btn btn-ghost btn-circle btn-sm bg-gradient-to-tr from-purple-500/10 to-pink-500/10 hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-300">
                                                <span className="material-symbols-outlined text-[20px]">link</span>
                                            </a>
                                        )}
                                        {socials.twitter && (
                                            <a href={socials.twitter} target="_blank" rel="noreferrer" className="btn btn-ghost btn-circle btn-sm bg-sky-500/10 hover:bg-sky-500 hover:text-white transition-all duration-300">
                                                <span className="material-symbols-outlined text-[20px]">link</span>
                                            </a>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="stats stats-horizontal shadow bg-base-100 w-full rounded-none">
                    <div
                        className="stat place-items-center px-4 py-3 cursor-pointer hover:bg-base-200 transition-colors"
                        onClick={onMyRecipes}
                    >
                        <div className="stat-value text-xl">{recipeCount || 0}</div>
                        <div className="stat-desc text-xs font-medium uppercase tracking-wider">Recipes</div>
                    </div>
                    <div
                        className="stat place-items-center px-4 py-3 cursor-pointer hover:bg-base-200 transition-colors"
                        onClick={onFavorites}
                    >
                        <div className="stat-value text-xl">{favoriteCount || 0}</div>
                        <div className="stat-desc text-xs font-medium uppercase tracking-wider">Favorites</div>
                    </div>
                    <div
                        className="stat place-items-center px-4 py-3 cursor-pointer hover:bg-base-200 transition-colors"
                        onClick={onGroceryList}
                    >
                        <div className="stat-value text-xl">{groceryCount || 0}</div>
                        <div className="stat-desc text-xs font-medium uppercase tracking-wider">Lists</div>
                    </div>
                </div>

                {/* Menu Section */}
                <div className="mt-6 flex flex-col gap-2">
                    <h3 className="px-4 text-xs font-bold text-base-content/40 uppercase tracking-widest mb-1">Account</h3>
                    <ul className="menu bg-base-100 gap-1 shadow-sm w-full p-2">
                        <li>
                            <a onClick={onMyRecipes} className="flex items-center gap-3 py-3 cursor-pointer">
                                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[22px]">menu_book</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">My Recipes</p>
                                    <p className="text-[11px] text-base-content/50">Recipes you've published</p>
                                </div>
                                <span className="material-symbols-outlined text-base-content/30 text-[20px]">chevron_right</span>
                            </a>
                        </li>
                        <li>
                            <a className="flex items-center gap-3 py-3">
                                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[22px]">notifications</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">Notifications</p>
                                </div>
                                <span className="material-symbols-outlined text-base-content/30 text-[20px]">chevron_right</span>
                            </a>
                        </li>
                    </ul>

                    {/* Dark Mode Toggle */}
                    <div className="flex items-center gap-4 bg-base-100 px-5 py-4 shadow-sm mt-2">
                        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[22px]">{isDark ? 'dark_mode' : 'light_mode'}</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                            <p className="text-[11px] text-base-content/50">{isDark ? 'Switch to light theme' : 'Switch to dark theme'}</p>
                        </div>
                        <input
                            type="checkbox"
                            className="toggle toggle-primary toggle-sm"
                            checked={isDark}
                            onChange={onToggleTheme}
                        />
                    </div>

                    <h3 className="px-4 text-xs font-bold text-base-content/40 uppercase tracking-widest mt-6 mb-1">Support</h3>
                    <ul className="menu bg-base-100 shadow-sm w-full p-2">
                        <li>
                            <a className="flex items-center gap-3 py-3">
                                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[22px]">help_center</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">Help Center</p>
                                </div>
                                <span className="material-symbols-outlined text-base-content/30 text-[20px]">chevron_right</span>
                            </a>
                        </li>
                    </ul>

                    <div className="px-4 mt-6">
                        <button onClick={handleSignOut} className="btn btn-outline btn-error gap-3 w-full">
                            <span className="material-symbols-outlined">logout</span>
                            Sign Out
                        </button>
                    </div>
                </div>
            </main>

            <AvatarPickerModal
                isOpen={isAvatarModalOpen}
                currentAvatarId={avatarId || ''}
                onClose={() => {
                    setIsAvatarModalOpen(false);
                    onModalToggle?.(false);
                }}
                onSelect={handleAvatarSelect}
            />
        </div>
    );
};

export default ProfileScreen;
