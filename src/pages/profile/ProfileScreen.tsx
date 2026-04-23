import React, { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import AvatarPickerModal from '@/components/user/AvatarPickerModal';
import { getAvatarUrl } from '@/constants/avatars';
import { clearProfileCache } from '@/components/recipe/RecipeCard';
import { uploadOptimizedImage } from '@/lib/storage';
import { useCollections } from '@/hooks/recipe/useCollections';
import { useCookStreak } from '@/hooks/cooking/useCookStreak';
import CookStreakCard from '@/components/profile/CookStreakCard';
import FollowersModal from '@/components/social/FollowersModal';
import { supabase } from '@/lib/supabase';

interface ProfileScreenProps {
    onBack: () => void;
    isDark: boolean;
    onToggleTheme: () => void;
    user: User | null;
    onSignOut: () => Promise<void>;
    onUpdateProfile: (updates: {
        full_name?: string;
        avatar_id?: string;
        cover_url?: string;
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
    onCollections?: () => void;
    onGroceryList?: () => void;
    onMealPlan?: () => void;
    onNotifications?: () => void;
    onMessages?: () => void;
    totalUnreadMessages?: number;
    onMessageClick?: (userId: string, name: string, avatarUrl: string | null) => void;
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
    onCollections,
    onGroceryList,
    onMealPlan,
    onNotifications,
    onMessages,
    totalUnreadMessages = 0,
    onMessageClick,
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
    const [uploadingCover, setUploadingCover] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showHelpSheet, setShowHelpSheet] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [collectionCount, setCollectionCount] = useState(0);
    const { fetchCollections } = useCollections();
    const cookStreak = useCookStreak(user?.id);
    const [socialStats, setSocialStats] = useState({ followers: 0, following: 0 });
    const [followersModal, setFollowersModal] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({ isOpen: false, type: 'followers' });

    useEffect(() => {
        if (user?.id) {
            fetchCollections(user.id).then(result => setCollectionCount(result?.length || 0));
            Promise.all([
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
            ]).then(([followersRes, followingRes]) => {
                setSocialStats({ followers: followersRes.count || 0, following: followingRes.count || 0 });
            });
        }
    }, [user?.id]);
    const [copiedLink, setCopiedLink] = useState(false);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest';
    const email = user?.email || '';
    const avatarId = user?.user_metadata?.avatar_id || null;
    const avatarUrl = avatarId ? getAvatarUrl(avatarId) : null;
    const coverUrl = user?.user_metadata?.cover_url || null;
    const initial = displayName.charAt(0).toUpperCase();

    const handleShareProfile = async () => {
        const url = `${window.location.origin}${window.location.pathname}?user=${user?.id}`;
        const text = `Hey, check out my profile on Let Em Cook! 👨‍🍳\n${url}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: `Chef ${displayName}`, text });
            } else {
                await navigator.clipboard.writeText(text);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
            }
        } catch {
            await navigator.clipboard.writeText(text);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        }
    };

    const handleSignOut = async () => {
        try {
            await onSignOut();
            onBack();
        } catch (err) {
            console.error('Sign out failed:', err);
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploadingCover(true);
            const { url } = await uploadOptimizedImage(file, 'covers');
            await onUpdateProfile({ cover_url: url });
        } catch (err) {
            console.error('Failed to upload cover:', err);
            alert('Failed to upload cover image. Please try again.');
        } finally {
            setUploadingCover(false);
            if (coverInputRef.current) coverInputRef.current.value = '';
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
            if (user?.id) {
                clearProfileCache(user.id);
            }
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
            if (user?.id) {
                clearProfileCache(user.id);
            }
            setIsEditing(false);
        } catch (err: any) {
            console.error('Profile update failed:', err);
            alert(`Failed to update profile: ${err.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-base-100 text-base-content min-h-screen flex flex-col w-full font-display">
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
                        {onMessages && (
                            <button onClick={onMessages} className="flex size-10 items-center justify-center rounded-full hover:bg-base-300 transition-colors text-primary relative">
                                <span className="material-symbols-outlined">chat_bubble</span>
                                {totalUnreadMessages > 0 && (
                                    <span className="absolute top-1 right-1 size-4 bg-error text-error-content text-[9px] font-bold rounded-full flex items-center justify-center">
                                        {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                                    </span>
                                )}
                            </button>
                        )}
                        <button onClick={handleShareProfile} className="flex size-10 items-center justify-center rounded-full hover:bg-base-300 transition-colors text-primary">
                            <span className="material-symbols-outlined">share</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full pb-24 overflow-y-auto">
                {/* Profile Header */}
                <section className="relative flex flex-col items-center bg-base-100 border-b border-base-200 shadow-sm rounded-b-[40px]">
                    {/* Cover Image — full width, sits in flow */}
                    <div className="relative w-full h-44">
                        {coverUrl ? (
                            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover rounded-t-[0px] rounded-b-none" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/80 via-secondary/60 to-accent/40 overflow-hidden">
                                <span className="material-symbols-outlined absolute top-4 left-6 text-white/10 text-[80px] rotate-[-15deg]" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                                <span className="material-symbols-outlined absolute bottom-2 right-8 text-white/10 text-[64px] rotate-[10deg]" style={{ fontVariationSettings: "'FILL' 1" }}>local_dining</span>
                                <span className="material-symbols-outlined absolute top-6 right-24 text-white/10 text-[48px] rotate-[20deg]" style={{ fontVariationSettings: "'FILL' 1" }}>egg</span>
                            </div>
                        )}
                        {/* Gradient fade */}
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-base-100 to-transparent pointer-events-none" />
                        {isEditing && <button
                            onClick={() => coverInputRef.current?.click()}
                            disabled={uploadingCover}
                            className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-bold hover:bg-black/70 transition-all"
                        >
                            {uploadingCover
                                ? <span className="loading loading-spinner loading-xs" />
                                : <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                            }
                            {uploadingCover ? 'Uploading...' : 'Edit Cover'}
                        </button>}
                        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    </div>

                    {/* Avatar overlapping the cover */}
                    <div className="-mt-16 pb-8 px-8 flex flex-col items-center gap-4 w-full drop-shadow-2xl">

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
                    </div>{/* end -mt-16 wrapper */}
                </section>

                {/* Floating Stats Section Cards */}
                <section className="flex px-4 -mt-8 gap-3 z-20 relative">
                    {[
                        { label: 'Recipes', val: recipeCount || 0, icon: 'restaurant_menu', color: 'bg-primary/20 text-primary', onClick: onMyRecipes },
                        { label: 'Favorites', val: favoriteCount || 0, icon: 'favorite', color: 'bg-red-500/20 text-red-400', onClick: onFavorites },
                        { label: 'Collections', val: collectionCount, icon: 'collections_bookmark', color: 'bg-amber-500/20 text-amber-400', onClick: onCollections }
                    ].map(stat => (
                        <div
                            key={stat.label}
                            onClick={stat.onClick}
                            className="flex flex-1 flex-col gap-2 rounded-[32px] bg-base-200 border border-base-300 p-5 items-center shadow-xl shadow-black/5 hover:translate-y-[-4px] active:scale-95 transition-all cursor-pointer group"
                        >
                            <div className={`size-10 rounded-2xl ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                            </div>
                            <div className="text-center">
                                <p className="text-base-content text-2xl font-black">{stat.val}</p>
                                <p className="text-base-content/40 text-[9px] uppercase tracking-widest font-black">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Followers / Following row */}
                <section className="flex px-4 mt-3 gap-3 z-20 relative">
                    {[
                        { label: 'Followers', val: socialStats.followers, type: 'followers' as const },
                        { label: 'Following', val: socialStats.following, type: 'following' as const },
                    ].map(stat => (
                        <button
                            key={stat.label}
                            onClick={() => setFollowersModal({ isOpen: true, type: stat.type })}
                            className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-base-200 border border-base-300 py-3 px-4 hover:bg-base-300 active:scale-95 transition-all"
                        >
                            <span className="text-base-content text-lg font-black">
                                {stat.val > 999 ? (stat.val / 1000).toFixed(1) + 'k' : stat.val}
                            </span>
                            <span className="text-base-content/50 text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                            <span className="material-symbols-outlined text-base-content/30 text-[16px]">chevron_right</span>
                        </button>
                    ))}
                </section>

                {/* Cook Streak */}
                <div className="px-4 mt-4">
                    <CookStreakCard streak={cookStreak} />
                </div>

                {/* Menu Section with Premium Cards */}
                <div className="mt-10 px-4 space-y-8">
                    <div>
                        <h3 className="px-2 text-xs font-black text-base-content/30 uppercase tracking-[0.2em] mb-4">Chef Dashboard</h3>
                        <div className="bg-base-200 rounded-[32px] border border-base-300 p-3 shadow-sm space-y-1">
                            <button onClick={onMyRecipes} className="flex w-full items-center gap-4 p-4 rounded-2xl hover:bg-base-300 transition-all group">
                                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-[26px]">menu_book</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-base-content">My Published Recipes</p>
                                    <p className="text-[11px] text-base-content/50 font-medium">Manage and view your creations</p>
                                </div>
                                <span className="material-symbols-outlined text-base-content/20 group-hover:text-primary transition-colors">chevron_right</span>
                            </button>


                            <button onClick={onNotifications} className="flex w-full items-center gap-4 p-4 rounded-2xl hover:bg-base-300 transition-all group">
                                <div className="size-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-[26px]">notifications_active</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-base-content">Activity Center</p>
                                    <p className="text-[11px] text-base-content/50 font-medium">Stay updated with reviews and likes</p>
                                </div>
                                <span className="material-symbols-outlined text-base-content/20 group-hover:text-accent transition-colors">chevron_right</span>
                            </button>

                            <button onClick={onMealPlan} className="flex w-full items-center gap-4 p-4 rounded-2xl hover:bg-base-300 transition-all group">
                                <div className="size-12 rounded-2xl bg-warning/10 text-warning flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-[26px]">calendar_today</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-base-content">Weekly Meal Planner</p>
                                    <p className="text-[11px] text-base-content/50 font-medium">Organize your cooking schedule</p>
                                </div>
                                <span className="material-symbols-outlined text-base-content/20 group-hover:text-warning transition-colors">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="px-2 text-xs font-black text-base-content/30 uppercase tracking-[0.2em] mb-4">Settings & Support</h3>
                        <div className="bg-base-200 rounded-[32px] border border-base-300 p-3 shadow-sm space-y-1">
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

                            <button onClick={() => setShowHelpSheet(true)} className="flex w-full items-center gap-4 p-4 rounded-2xl hover:bg-base-300 transition-all group">
                                <div className="size-12 rounded-2xl bg-base-200 text-base-content/40 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[26px]">help</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-base-content">Help & Community</p>
                                    <p className="text-[11px] text-base-content/50 font-medium">Get support or report an issue</p>
                                </div>
                                <span className="material-symbols-outlined text-base-content/20 group-hover:text-base-content/60 transition-colors">chevron_right</span>
                            </button>

                            <button onClick={() => setShowSignOutConfirm(true)} className="flex w-full items-center gap-4 p-4 rounded-2xl hover:bg-red-500/10 transition-all group">
                                <div className="size-12 rounded-2xl bg-error/10 text-error flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-[26px]">logout</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-error">Sign Out</p>
                                    <p className="text-[11px] text-base-content/50 font-medium">Log out of your account</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Help & Community bottom sheet */}
            {showHelpSheet && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowHelpSheet(false)}>
                    <div className="bg-base-100 rounded-t-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-base-300" />
                        </div>

                        <div className="px-5 pt-3 pb-24">
                            <h3 className="text-[17px] font-bold mb-1">Help & Community</h3>
                            <p className="text-xs text-base-content/40 mb-5">What can we help you with?</p>

                            <div className="space-y-2">
                                <a
                                    href="https://t.me/letemcooksuppport"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-base-200/50 hover:bg-base-200 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-blue-500 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-semibold">Join Community</p>
                                        <p className="text-[11px] text-base-content/40">Chat with other cooks on Telegram</p>
                                    </div>
                                </a>

                                <a
                                    href="mailto:aimancapik@gmail.com"
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-base-200/50 hover:bg-base-200 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-success text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-semibold">Contact Dev</p>
                                        <p className="text-[11px] text-base-content/40">aimancapik@gmail.com</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sign out confirmation */}
            {showSignOutConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setShowSignOutConfirm(false)}>
                    <div className="bg-base-100 rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center mb-4 mx-auto">
                            <span className="material-symbols-outlined text-error text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>logout</span>
                        </div>
                        <h3 className="text-[17px] font-bold text-center mb-1.5">Sign out?</h3>
                        <p className="text-[13px] text-base-content/50 text-center mb-6 leading-relaxed">
                            You'll need to sign in again to access your recipes and saved items.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowSignOutConfirm(false)} className="flex-1 btn btn-ghost rounded-xl font-semibold">
                                Cancel
                            </button>
                            <button onClick={() => { setShowSignOutConfirm(false); handleSignOut(); }} className="flex-1 btn btn-error rounded-xl font-semibold text-white">
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {copiedLink && (
                <div className="toast toast-top toast-center z-[200]">
                    <div className="alert alert-success shadow-lg rounded-2xl">
                        <span className="material-symbols-outlined">check_circle</span>
                        <span className="font-bold">Link copied!</span>
                    </div>
                </div>
            )}

            <AvatarPickerModal
                isOpen={isAvatarModalOpen}
                currentAvatarId={avatarId || ''}
                onClose={() => {
                    setIsAvatarModalOpen(false);
                    onModalToggle?.(false);
                }}
                onSelect={handleAvatarSelect}
            />

            {user?.id && (
                <FollowersModal
                    userId={user.id}
                    type={followersModal.type}
                    isOpen={followersModal.isOpen}
                    onClose={() => setFollowersModal(prev => ({ ...prev, isOpen: false }))}
                    onUserClick={(uid) => {
                        setFollowersModal(prev => ({ ...prev, isOpen: false }));
                        onModalToggle?.(false);
                    }}
                    onMessageClick={onMessageClick}
                />
            )}
        </div>
    );
};

export default ProfileScreen;
