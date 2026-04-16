
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Screen, Recipe } from '@/types';
import RecipeCard from '@/components/recipe/RecipeCard';
import { useRecipes } from '@/hooks/recipe/useRecipes';
import RecipeMasonryGrid from '@/components/recipe/RecipeMasonryGrid';
import { useAuth } from '@/hooks/auth/useAuth';
import FollowersModal from '@/components/social/FollowersModal';
import { getAvatarUrl } from '@/constants/avatars';
import { useCollections, Collection } from '@/hooks/recipe/useCollections';

interface PublicProfileScreenProps {
    userId: string;
    onBack: () => void;
    onRecipeClick: (recipe: Recipe) => void;
    toggleFavorite: (id: string) => void;
    onUserClick: (userId: string) => void;
    onMessageClick?: (userId: string, name: string, avatarUrl: string | null) => void;
}

interface Profile {
    id: string;
    full_name: string;
    avatar_url: string;
    cover_url?: string;
    bio: string;
    location?: string;
}

interface SocialStats {
    followers: number;
    following: number;
    recipes: number;
}

const PublicProfileScreen: React.FC<PublicProfileScreenProps> = ({ userId, onBack, onRecipeClick, toggleFavorite, onUserClick, onMessageClick }) => {
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [socialStats, setSocialStats] = useState<SocialStats>({ followers: 0, following: 0, recipes: 0 });
    const { fetchRecipesByUserId } = useRecipes();
    const [activeTab, setActiveTab] = useState<'recipes' | 'collections' | 'about'>('recipes');
    const [loadingRecipes, setLoadingRecipes] = useState(true);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [collectionsFetched, setCollectionsFetched] = useState(false);
    const [loadingCollections, setLoadingCollections] = useState(false);
    const { fetchCollections, fetchCollectionRecipes } = useCollections();
    const [openCollection, setOpenCollection] = useState<Collection | null>(null);
    const [collectionRecipes, setCollectionRecipes] = useState<Recipe[]>([]);
    const [loadingCollectionRecipes, setLoadingCollectionRecipes] = useState(false);
    const [followersModal, setFollowersModal] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({ isOpen: false, type: 'followers' });
    const [copiedLink, setCopiedLink] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportSubmitted, setReportSubmitted] = useState(false);

    useEffect(() => {
        const loadProfileData = async () => {
            setLoading(true);
            try {
                // Phase 1: load profile, stats, follow check in parallel (fast)
                const [profileResult, followersResult, followingResult, followCheckResult] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', userId).single(),
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
                    currentUser
                        ? supabase.from('follows').select('*').eq('follower_id', currentUser.id).eq('following_id', userId).maybeSingle()
                        : Promise.resolve({ data: null }),
                ]);

                if (profileResult.error) throw profileResult.error;
                setProfile(profileResult.data);
                setSocialStats({
                    followers: followersResult.count || 0,
                    following: followingResult.count || 0,
                    recipes: 0
                });
                setIsFollowing(!!followCheckResult.data);
            } catch (err) {
                console.error('Error loading public profile:', err);
            } finally {
                setLoading(false);
            }

            // Phase 2: load recipes in background (doesn't block the screen showing)
            try {
                setLoadingRecipes(true);
                const userRecipes = await fetchRecipesByUserId(userId);
                const publishedRecipes = userRecipes.filter(r => r.status === 'published');
                setRecipes(publishedRecipes);
                setSocialStats(prev => ({ ...prev, recipes: publishedRecipes.length }));
            } catch (err) {
                console.error('Error loading recipes:', err);
            } finally {
                setLoadingRecipes(false);
            }
        };

        loadProfileData();
    }, [userId, fetchRecipesByUserId, currentUser]);

    const handleFollow = async () => {
        if (!currentUser) {
            alert('Please sign in to follow chefs!');
            return;
        }

        const prevFollowing = isFollowing;
        const newFollowing = !isFollowing;

        // Optimistic update
        setIsFollowing(newFollowing);
        setSocialStats(prev => ({
            ...prev,
            followers: newFollowing ? prev.followers + 1 : prev.followers - 1
        }));

        try {
            const { error } = await supabase.rpc('toggle_follow', { target_user_id: userId });
            if (error) throw error;
        } catch (err) {
            console.error('Error toggling follow:', err);
            // Revert
            setIsFollowing(prevFollowing);
            setSocialStats(prev => ({
                ...prev,
                followers: prevFollowing ? prev.followers + 1 : prev.followers - 1
            }));
        }
    };

    const handleShareProfile = async () => {
        const url = `${window.location.origin}${window.location.pathname}?user=${userId}`;
        const text = `Hey, check out Chef ${profile?.full_name} on Let Em Cook! 👨‍🍳\n${url}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: `Chef ${profile?.full_name}`, text });
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

    const handleReportSubmit = async () => {
        if (!reportReason.trim() || !currentUser) return;
        try {
            const { error } = await supabase.from('reports').insert({
                reporter_id: currentUser.id,
                reported_user_id: userId,
                reason: reportReason,
            });
            if (error) throw error;
            setReportSubmitted(true);
            setTimeout(() => {
                setShowReportModal(false);
                setReportSubmitted(false);
                setReportReason('');
            }, 2000);
        } catch (err) {
            console.error('Failed to submit report:', err);
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
                                    <button onClick={handleShareProfile} className="flex items-center gap-3 py-3">
                                        <span className="material-symbols-outlined text-primary">share</span>
                                        <span className="font-bold">Share Profile</span>
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => setShowReportModal(true)} className="flex items-center gap-3 py-3 text-red-500">
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
                <section className="flex flex-col items-center bg-base-100 border-b border-base-200 shadow-sm rounded-b-[40px]">
                    {/* Cover Image — in flow, full width */}
                    <div className="relative w-full h-44">
                        {profile.cover_url ? (
                            <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/80 via-secondary/60 to-accent/40 overflow-hidden">
                                {/* Decorative food icons */}
                                <span className="material-symbols-outlined absolute top-4 left-6 text-white/10 text-[80px] rotate-[-15deg]" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                                <span className="material-symbols-outlined absolute bottom-2 right-8 text-white/10 text-[64px] rotate-[10deg]" style={{ fontVariationSettings: "'FILL' 1" }}>local_dining</span>
                                <span className="material-symbols-outlined absolute top-6 right-24 text-white/10 text-[48px] rotate-[20deg]" style={{ fontVariationSettings: "'FILL' 1" }}>egg</span>
                            </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-base-100 to-transparent" />
                    </div>

                    <div className="-mt-16 pb-8 px-8 flex flex-col items-center gap-4 w-full">
                    <div className="relative">
                        {(() => {
                            const url = getAvatarUrl(profile.avatar_url);
                            const initial = profile.full_name?.charAt(0).toUpperCase() || '?';
                            return url ? (
                                <div className="size-28 rounded-full ring-4 ring-primary ring-offset-4 ring-offset-base-100 bg-primary shadow-xl overflow-hidden">
                                    <img src={url} alt={profile.full_name} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="size-28 rounded-full ring-4 ring-primary ring-offset-4 ring-offset-base-100 bg-primary flex items-center justify-center shadow-xl">
                                    <span className="text-primary-content font-black text-5xl">{initial}</span>
                                </div>
                            );
                        })()}
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
                                    className={`flex-1 rounded-2xl h-12 font-bold transition-colors duration-200 active:scale-95 px-6 ${isFollowing
                                        ? 'bg-base-200 text-base-content hover:bg-base-300'
                                        : 'bg-primary text-primary-content hover:bg-primary/90'
                                        }`}
                                >
                                    {isFollowing ? '✓ Following' : 'Follow'}
                                </button>
                                <button
                                    onClick={() => onMessageClick?.(userId, profile.full_name, getAvatarUrl(profile.avatar_url))}
                                    className="btn btn-neutral rounded-2xl h-12 w-12 border-none bg-base-200 text-base-content hover:bg-base-300"
                                >
                                    <span className="material-symbols-outlined">chat</span>
                                </button>
                            </div>
                        )}
                    </div>
                    </div>{/* end -mt-16 wrapper */}
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
                                onClick={async () => {
                                    setActiveTab(tab as any);
                                    if (tab === 'collections' && !collectionsFetched && !loadingCollections) {
                                        setLoadingCollections(true);
                                        const result = await fetchCollections(userId);
                                        setCollections(result || []);
                                        setLoadingCollections(false);
                                        setCollectionsFetched(true);
                                    }
                                }}
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
                            {loadingRecipes ? (
                                <div className="columns-2 gap-3 min-h-[300px]">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="break-inside-avoid mb-3 rounded-2xl bg-base-200 animate-pulse"
                                            style={{ height: i % 3 === 0 ? '180px' : i % 3 === 1 ? '140px' : '160px' }}
                                        />
                                    ))}
                                </div>
                            ) : recipes.length > 0 ? (
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
                        <div className="mt-2">
                            {loadingCollections ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="rounded-2xl bg-base-200 animate-pulse h-36" />
                                    ))}
                                </div>
                            ) : collections.length === 0 ? (
                                <div className="py-12 text-center flex flex-col items-center gap-3">
                                    <span className="material-symbols-outlined text-4xl text-base-content/20">folder</span>
                                    <p className="text-base-content/40 font-medium">No public collections yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {collections.map(col => (
                                        <button
                                            key={col.id}
                                            onClick={async () => {
                                                setOpenCollection(col);
                                                setLoadingCollectionRecipes(true);
                                                const recipes = await fetchCollectionRecipes(col.id);
                                                setCollectionRecipes(recipes);
                                                setLoadingCollectionRecipes(false);
                                            }}
                                            className="rounded-2xl overflow-hidden bg-base-200 border border-base-200 flex flex-col text-left active:scale-95 transition-transform"
                                        >
                                            {col.cover_image ? (
                                                <img src={col.cover_image} alt={col.name} className="w-full h-24 object-cover" />
                                            ) : (
                                                <div className="w-full h-24 bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-3xl text-primary/40" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
                                                </div>
                                            )}
                                            <div className="p-3">
                                                <p className="font-bold text-sm truncate">{col.name}</p>
                                                <p className="text-xs text-base-content/40 mt-0.5">{col.recipe_count || 0} recipes</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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

            {/* Copied link toast */}
            {/* Collection detail bottom sheet */}
            {openCollection && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setOpenCollection(null); setCollectionRecipes([]); }}>
                    <div className="bg-base-100 rounded-t-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-10 h-1 rounded-full bg-base-300" />
                        </div>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 shrink-0">
                            <div>
                                <h2 className="font-bold text-lg">{openCollection.name}</h2>
                                <p className="text-xs text-base-content/40">{openCollection.recipe_count || 0} recipes</p>
                            </div>
                            <button onClick={() => { setOpenCollection(null); setCollectionRecipes([]); }} className="size-9 flex items-center justify-center rounded-full hover:bg-base-300 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-4 pb-8">
                            {loadingCollectionRecipes ? (
                                <div className="columns-2 gap-3 mt-2">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="break-inside-avoid mb-3 rounded-2xl bg-base-200 animate-pulse" style={{ height: i % 2 === 0 ? '180px' : '150px' }} />
                                    ))}
                                </div>
                            ) : collectionRecipes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                                    <span className="material-symbols-outlined text-5xl text-base-content/20">folder_open</span>
                                    <p className="font-bold">This collection is empty</p>
                                </div>
                            ) : (
                                <ul className="flex flex-col gap-3 mt-2">
                                    {collectionRecipes.map(recipe => (
                                        <li key={recipe.id}>
                                            <button
                                                onClick={() => { setOpenCollection(null); onRecipeClick(recipe); }}
                                                className="flex items-center gap-3 w-full bg-base-200 rounded-2xl p-3 text-left active:scale-95 transition-transform hover:bg-base-300"
                                            >
                                                <img src={recipe.image} alt={recipe.title} className="size-16 rounded-xl object-cover shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">{recipe.title}</p>
                                                    <p className="text-xs text-base-content/40 mt-0.5">{recipe.prepTime} · {recipe.level}</p>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <span className="material-symbols-outlined text-amber-400 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                        <span className="text-xs font-semibold">{recipe.rating?.toFixed(1) || '—'}</span>
                                                    </div>
                                                </div>
                                                <span className="material-symbols-outlined text-base-content/20 shrink-0">chevron_right</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
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

            {/* Report User Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-base-100 rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4">
                        {reportSubmitted ? (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <span className="material-symbols-outlined text-5xl text-success">check_circle</span>
                                <p className="font-bold text-lg">Report submitted</p>
                                <p className="text-sm text-base-content/60 text-center">Thank you. We'll review this report.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold">Report User</h2>
                                    <button onClick={() => setShowReportModal(false)} className="btn btn-ghost btn-sm btn-circle">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <p className="text-sm text-base-content/60">Why are you reporting <strong>{profile.full_name}</strong>?</p>
                                <div className="flex flex-col gap-2">
                                    {['Spam or misleading content', 'Inappropriate content', 'Harassment or bullying', 'Impersonation', 'Other'].map(reason => (
                                        <button
                                            key={reason}
                                            onClick={() => setReportReason(reason)}
                                            className={`btn btn-sm rounded-xl justify-start ${reportReason === reason ? 'btn-error text-white' : 'btn-ghost'}`}
                                        >
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleReportSubmit}
                                    disabled={!reportReason}
                                    className="btn btn-error rounded-xl w-full"
                                >
                                    Submit Report
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicProfileScreen;
