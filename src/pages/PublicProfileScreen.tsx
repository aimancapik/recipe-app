
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Screen, Recipe } from '@/types';
import RecipeCard from '@/components/RecipeCard';
import { useRecipes } from '@/hooks/useRecipes';
import RecipeMasonryGrid from '@/components/RecipeMasonryGrid';
import { useAuth } from '@/hooks/useAuth';
import FollowersModal from '@/components/FollowersModal';

interface PublicProfileScreenProps {
    userId: string;
    onBack: () => void;
    onRecipeClick: (recipe: Recipe) => void;
    toggleFavorite: (id: string) => void;
    onUserClick: (userId: string) => void;
}

interface Profile {
    id: string;
    full_name: string;
    avatar_url: string;
    bio: string;
    location?: string;
}

interface SocialStats {
    followers: number;
    following: number;
    recipes: number;
}

const PublicProfileScreen: React.FC<PublicProfileScreenProps> = ({ userId, onBack, onRecipeClick, toggleFavorite, onUserClick }) => {
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [socialStats, setSocialStats] = useState<SocialStats>({ followers: 0, following: 0, recipes: 0 });
    const { fetchRecipesByUserId } = useRecipes();
    const [activeTab, setActiveTab] = useState<'recipes' | 'collections' | 'about'>('recipes');
    const [followersModal, setFollowersModal] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({ isOpen: false, type: 'followers' });

    useEffect(() => {
        const loadProfileData = async () => {
            setLoading(true);
            try {
                // Fetch all profile data in parallel instead of sequentially
                const [profileResult, userRecipes, followersResult, followingResult, followCheckResult] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', userId).single(),
                    fetchRecipesByUserId(userId),
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
                    currentUser
                        ? supabase.from('follows').select('*').eq('follower_id', currentUser.id).eq('following_id', userId).maybeSingle()
                        : Promise.resolve({ data: null }),
                ]);

                if (profileResult.error) throw profileResult.error;
                setProfile(profileResult.data);

                const publishedRecipes = userRecipes.filter(r => r.status === 'published');
                setRecipes(publishedRecipes);

                setSocialStats({
                    followers: followersResult.count || 0,
                    following: followingResult.count || 0,
                    recipes: publishedRecipes.length
                });

                setIsFollowing(!!followCheckResult.data);
            } catch (err) {
                console.error('Error loading public profile:', err);
            } finally {
                setLoading(false);
            }
        };

        loadProfileData();
    }, [userId, fetchRecipesByUserId, currentUser]);

    const handleFollow = async () => {
        if (!currentUser) {
            // In a real app, prompt login
            alert('Please sign in to follow chefs!');
            return;
        }

        try {
            // Optimistic update
            const newFollowingState = !isFollowing;
            setIsFollowing(newFollowingState);
            setSocialStats(prev => ({
                ...prev,
                followers: newFollowingState ? prev.followers + 1 : prev.followers - 1
            }));

            // Call RPC
            const { data, error } = await supabase.rpc('toggle_follow', { target_user_id: userId });

            if (error) throw error;
            // Sync with actual result from RPC
            setIsFollowing(data);
        } catch (err) {
            console.error('Error toggling follow:', err);
            // Revert on error
            setIsFollowing(!isFollowing);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-base-100">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-base-100 p-6 text-center">
                <span className="material-symbols-outlined text-6xl text-base-content/20">person_off</span>
                <h2 className="text-xl font-bold">Profile not found</h2>
                <button onClick={onBack} className="btn btn-primary rounded-xl">Go Back</button>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-base-200 font-display">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-200">
                <div className="flex items-center p-4 justify-between max-w-2xl mx-auto w-full text-base-content">
                    <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full hover:bg-base-300 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold flex-1 text-center truncate px-4">Chef {profile.full_name}</h1>
                    <div className="size-10 flex items-center justify-end">
                        <div className="dropdown dropdown-end">
                            <button tabIndex={0} className="flex size-10 items-center justify-center rounded-full hover:bg-base-300 transition-colors">
                                <span className="material-symbols-outlined">more_vert</span>
                            </button>
                            <ul tabIndex={0} className="dropdown-content z-[100] menu p-2 shadow-xl bg-base-100 rounded-2xl w-52 mt-2 border border-base-200">
                                <li>
                                    <button onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        // You could add a toast here
                                    }} className="flex items-center gap-3 py-3">
                                        <span className="material-symbols-outlined text-primary">share</span>
                                        <span className="font-bold">Share Profile</span>
                                    </button>
                                </li>
                                <li>
                                    <button className="flex items-center gap-3 py-3 text-red-500">
                                        <span className="material-symbols-outlined">report</span>
                                        <span className="font-bold">Report User</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full pb-24">
                {/* Profile Header Summary */}
                <section className="flex p-8 flex-col items-center gap-4 bg-base-100 border-b border-base-200 shadow-sm rounded-b-[40px]">
                    <div className="relative">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={profile.full_name}
                                className="size-28 rounded-full border-4 border-primary object-cover shadow-xl"
                                onError={(e) => {
                                    // Replace broken image with default avatar
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent && !parent.querySelector('.default-avatar-profile')) {
                                        const fallback = document.createElement('div');
                                        fallback.className = 'size-28 rounded-full border-4 border-primary bg-base-200 flex items-center justify-center shadow-xl default-avatar-profile';
                                        fallback.innerHTML = '<span class="material-symbols-outlined text-5xl text-base-content/40">person</span>';
                                        parent.insertBefore(fallback, parent.lastElementChild);
                                    }
                                }}
                            />
                        ) : (
                            <div className="size-28 rounded-full border-4 border-primary bg-base-200 flex items-center justify-center shadow-xl">
                                <span className="material-symbols-outlined text-5xl text-base-content/40">person</span>
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 size-8 bg-green-500 border-4 border-base-100 rounded-full"></div>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-base-content">{profile.full_name}</h2>
                        <p className="text-base-content/60 text-sm mt-2 max-w-xs leading-relaxed">
                            {profile.bio || "No bio yet."}
                        </p>
                        {profile.location && (
                            <div className="flex items-center gap-2 mt-3 text-base-content/40 text-xs font-semibold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                                {profile.location}
                            </div>
                        )}

                        {currentUser?.id !== userId && (
                            <div className="flex gap-3 mt-6 w-full px-4">
                                <button
                                    onClick={handleFollow}
                                    className={`btn flex-1 rounded-2xl h-12 normal-case font-bold shadow-lg transition-all duration-300 ${isFollowing
                                        ? 'btn-neutral bg-base-200 text-base-content hover:bg-base-300 border-none'
                                        : 'btn-primary shadow-primary/20 hover:scale-105 active:scale-95'
                                        }`}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                                <button className="btn btn-neutral rounded-2xl h-12 w-12 border-none bg-base-200 text-base-content hover:bg-base-300">
                                    <span className="material-symbols-outlined">mail</span>
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Stats Section */}
                <section className="flex px-4 -mt-6 gap-3 z-10 relative">
                    {[
                        { label: 'Recipes', val: socialStats.recipes, onClick: null },
                        { label: 'Followers', val: socialStats.followers > 999 ? (socialStats.followers / 1000).toFixed(1) + 'k' : socialStats.followers, onClick: () => setFollowersModal({ isOpen: true, type: 'followers' }) },
                        { label: 'Following', val: socialStats.following > 999 ? (socialStats.following / 1000).toFixed(1) + 'k' : socialStats.following, onClick: () => setFollowersModal({ isOpen: true, type: 'following' }) }
                    ].map(stat => (
                        <div
                            key={stat.label}
                            onClick={stat.onClick || undefined}
                            className={`flex flex-1 flex-col gap-1 rounded-[24px] bg-base-100 border border-base-200 p-4 items-center shadow-lg shadow-black/5 ${stat.onClick ? 'cursor-pointer hover:bg-base-200 transition-colors active:scale-95' : ''}`}
                        >
                            <p className="text-base-content text-xl font-black">{stat.val}</p>
                            <p className="text-base-content/40 text-[10px] uppercase tracking-widest font-bold">{stat.label}</p>
                        </div>
                    ))}
                </section>

                {/* Tab Navigation */}
                <nav className="sticky top-[73px] z-40 bg-base-200/80 backdrop-blur-md mt-6 border-b border-base-200">
                    <div className="flex px-4 justify-between">
                        {['recipes', 'collections', 'about'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex flex-col items-center justify-center border-b-2 pb-4 pt-4 flex-1 transition-all ${activeTab === tab ? 'border-primary text-base-content' : 'border-transparent text-base-content/40'}`}
                            >
                                <p className="text-xs font-black tracking-widest uppercase">{tab}</p>
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Content Area */}
                <div className="p-4">
                    {activeTab === 'recipes' && (
                        <div className="mt-2">
                            {recipes.length > 0 ? (
                                <RecipeMasonryGrid
                                    recipes={recipes}
                                    onRecipeClick={onRecipeClick}
                                    onToggleFavorite={toggleFavorite}
                                />
                            ) : (
                                <div className="py-12 text-center flex flex-col items-center gap-3">
                                    <span className="material-symbols-outlined text-4xl text-slate-200">restaurant</span>
                                    <p className="text-slate-400 font-medium">No recipes shared yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'collections' && (
                        <div className="py-12 text-center text-slate-400 font-medium">Collections feature coming soon.</div>
                    )}
                    {activeTab === 'about' && (
                        <div className="p-4 bg-base-100 rounded-3xl border border-base-200 shadow-sm leading-relaxed text-base-content/70">
                            {profile.bio || "No detailed information provided."}
                        </div>
                    )}
                </div>
            </main>

            {/* Followers/Following Modal */}
            <FollowersModal
                userId={userId}
                type={followersModal.type}
                isOpen={followersModal.isOpen}
                onClose={() => setFollowersModal({ ...followersModal, isOpen: false })}
                onUserClick={onUserClick}
            />
        </div>
    );
};

export default PublicProfileScreen;
