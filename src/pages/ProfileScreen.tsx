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
        <div className="bg-base-200 text-base-content min-h-screen flex flex-col w-full font-display">
            {/* Top Navigation Bar with Glassmorphism */}
            <header className="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-200">
                <div className="flex items-center p-4 justify-between max-w-2xl mx-auto w-full">
                    <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full hover:bg-base-300 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold flex-1 text-center">My Profile</h1>
                    <div className="flex gap-1">
                        {isEditing ? (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn btn-primary btn-sm rounded-xl px-4 normal-case font-bold"
                            >
                                {saving ? <span className="loading loading-spinner loading-xs"></span> : 'Save'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex size-10 items-center justify-center rounded-full hover:bg-base-300 transition-colors text-primary"
                            >
                                <span className="material-symbols-outlined filled-icon">edit</span>
                            </button>
                        )}
                        <button onClick={handleSignOut} className="flex size-10 items-center justify-center rounded-full hover:bg-red-500/10 transition-colors text-error">
                            <span className="material-symbols-outlined">logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full pb-24 overflow-y-auto">
                {/* Profile Header with Mesh Gradient Glow */}
                <section className="relative flex p-8 flex-col items-center gap-4 bg-base-100 border-b border-base-200 shadow-sm rounded-b-[40px] overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-[-50px] left-[-50px] size-64 bg-primary/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-50px] right-[-50px] size-64 bg-secondary/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10 group">
                        <div
                            className={`avatar placeholder online relative transition-transform duration-500 hover:scale-105 ${isEditing ? 'cursor-pointer' : ''}`}
                            onClick={handleAvatarClick}
                        >
                            {avatarUrl ? (
                                <div className="w-32 aspect-square rounded-full ring-4 ring-primary ring-offset-base-100 ring-offset-4 overflow-hidden shadow-2xl">
                                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                            <span className="loading loading-spinner loading-lg text-white"></span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-32 aspect-square rounded-full ring-4 ring-primary ring-offset-base-100 ring-offset-4 bg-primary text-primary-content flex items-center justify-center shadow-2xl">
                                    {uploading ? (
                                        <span className="loading loading-spinner loading-lg"></span>
                                    ) : (
                                        <span className="text-5xl font-black">{initial}</span>
                                    )}
                                </div>
                            )}
                            {isEditing && !uploading && (
                                <div className="absolute bottom-1 right-1 bg-primary text-primary-content p-2 rounded-full shadow-lg scale-110">
                                    <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-center text-center z-10 w-full px-4">
                        {isEditing ? (
                            <div className="space-y-4 w-full max-w-sm mt-2">
                                <div className="form-control w-full">
                                    <input
                                        type="text"
                                        className="input input-bordered input-md text-center font-bold text-lg rounded-2xl bg-base-200/50 border-base-300 focus:border-primary"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your Name"
                                        autoFocus
                                    />
                                </div>
                                <div className="form-control w-full">
                                    <textarea
                                        className="textarea textarea-bordered h-24 text-center text-sm rounded-2xl bg-base-200/50 border-base-300 focus:border-primary"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell the world about your culinary passion..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center gap-3 bg-base-200/50 p-3 rounded-2xl border border-base-300">
                                        <div className="size-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-purple-500 to-pink-500 text-white">
                                            <span className="material-symbols-outlined text-[18px]">link</span>
                                        </div>
                                        <input
                                            type="text"
                                            className="bg-transparent flex-1 focus:outline-none text-sm font-medium"
                                            value={socials.instagram}
                                            onChange={(e) => setSocials(prev => ({ ...prev, instagram: e.target.value }))}
                                            placeholder="Instagram URL"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 bg-base-200/50 p-3 rounded-2xl border border-base-300">
                                        <div className="size-8 rounded-lg flex items-center justify-center bg-sky-500 text-white">
                                            <span className="material-symbols-outlined text-[18px]">link</span>
                                        </div>
                                        <input
                                            type="text"
                                            className="bg-transparent flex-1 focus:outline-none text-sm font-medium"
                                            value={socials.twitter}
                                            onChange={(e) => setSocials(prev => ({ ...prev, twitter: e.target.value }))}
                                            placeholder="Twitter URL"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-3xl font-black tracking-tight text-base-content uppercase">{displayName}</h2>
                                <p className="text-primary font-bold text-xs mt-1 bg-primary/10 px-3 py-1 rounded-full">{email}</p>

                                <div className="mt-4 max-w-sm px-4">
                                    <p className="text-base-content/60 text-sm leading-relaxed italic">
                                        {bio || "Mastering the art of cooking, one recipe at a time."}
                                    </p>
                                </div>

                                {(socials.instagram || socials.twitter || socials.youtube) && (
                                    <div className="flex gap-4 mt-6">
                                        {socials.instagram && (
                                            <a href={socials.instagram} target="_blank" rel="noreferrer" className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-lg hover:scale-110 active:scale-95 transition-all">
                                                <span className="material-symbols-outlined text-[24px]">link</span>
                                            </a>
                                        )}
                                        {socials.twitter && (
                                            <a href={socials.twitter} target="_blank" rel="noreferrer" className="flex size-11 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg hover:scale-110 active:scale-95 transition-all">
                                                <span className="material-symbols-outlined text-[24px]">link</span>
                                            </a>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>

                {/* Floating Stats Section Cards */}
                <section className="flex px-4 -mt-8 gap-3 z-20 relative">
                    {[
                        { label: 'Recipes', val: recipeCount || 0, icon: 'restaurant_menu', color: 'bg-primary/10 text-primary', onClick: onMyRecipes },
                        { label: 'Favorites', val: favoriteCount || 0, icon: 'favorite', color: 'bg-red-500/10 text-red-500', onClick: onFavorites },
                        { label: 'Saved Lists', val: groceryCount || 0, icon: 'shopping_bag', color: 'bg-amber-500/10 text-amber-500', onClick: onGroceryList }
                    ].map(stat => (
                        <div
                            key={stat.label}
                            onClick={stat.onClick}
                            className="flex flex-1 flex-col gap-2 rounded-[32px] bg-base-100 border border-base-200 p-5 items-center shadow-xl shadow-black/5 hover:translate-y-[-4px] active:scale-95 transition-all cursor-pointer group"
                        >
                            <div className={`size-10 rounded-2xl ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <span className="material-symbols-outlined text-[22px]">{stat.icon}</span>
                            </div>
                            <div className="text-center">
                                <p className="text-base-content text-2xl font-black">{stat.val}</p>
                                <p className="text-base-content/40 text-[9px] uppercase tracking-widest font-black">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Menu Section with Premium Cards */}
                <div className="mt-10 px-4 space-y-8">
                    <div>
                        <h3 className="px-2 text-xs font-black text-base-content/30 uppercase tracking-[0.2em] mb-4">Chef Dashboard</h3>
                        <div className="bg-base-100 rounded-[32px] border border-base-200 p-3 shadow-sm space-y-1">
                            <button onClick={onMyRecipes} className="flex w-full items-center gap-4 p-4 rounded-2xl hover:bg-base-200 transition-all group">
                                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-[26px]">menu_book</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-base-content">My Published Recipes</p>
                                    <p className="text-[11px] text-base-content/50 font-medium">Manage and view your creations</p>
                                </div>
                                <span className="material-symbols-outlined text-base-content/20 group-hover:text-primary transition-colors">chevron_right</span>
                            </button>

                            <button onClick={onFavorites} className="flex w-full items-center gap-4 p-4 rounded-2xl hover:bg-base-200 transition-all group">
                                <div className="size-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-[26px]">stars</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-base-content">Favorite Collections</p>
                                    <p className="text-[11px] text-base-content/50 font-medium">Your most loved discoveries</p>
                                </div>
                                <span className="material-symbols-outlined text-base-content/20 group-hover:text-secondary transition-colors">chevron_right</span>
                            </button>

                            <button className="flex w-full items-center gap-4 p-4 rounded-2xl hover:bg-base-200 transition-all group">
                                <div className="size-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-[26px]">notifications_active</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-base-content">Activity Center</p>
                                    <p className="text-[11px] text-base-content/50 font-medium">Stay updated with reviews and likes</p>
                                </div>
                                <span className="material-symbols-outlined text-base-content/20 group-hover:text-accent transition-colors">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="px-2 text-xs font-black text-base-content/30 uppercase tracking-[0.2em] mb-4">Settings & Support</h3>
                        <div className="bg-base-100 rounded-[32px] border border-base-200 p-3 shadow-sm space-y-1">
                            <div className="flex items-center gap-4 p-4 rounded-2xl">
                                <div className="size-12 rounded-2xl bg-base-200 text-base-content/40 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[26px]">{isDark ? 'dark_mode' : 'light_mode'}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-base-content">{isDark ? 'Midnight Theme' : 'Daylight Theme'}</p>
                                    <p className="text-[11px] text-base-content/50 font-medium">Customize your visual experience</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary h-7 w-12"
                                    checked={isDark}
                                    onChange={onToggleTheme}
                                />
                            </div>

                            <button className="flex w-full items-center gap-4 p-4 rounded-2xl hover:bg-base-200 transition-all group">
                                <div className="size-12 rounded-2xl bg-base-200 text-base-content/40 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[26px]">help</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-base-content">Help & Community</p>
                                    <p className="text-[11px] text-base-content/50 font-medium">Get support or report an issue</p>
                                </div>
                                <span className="material-symbols-outlined text-base-content/20 group-hover:text-base-content/60 transition-colors">chevron_right</span>
                            </button>
                        </div>
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
