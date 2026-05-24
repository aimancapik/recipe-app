import React, { useEffect, useRef, useState } from 'react';
import { useMadeIt } from '@/hooks/cooking/useMadeIt';
import { getAvatarUrl } from '@/constants/avatars';

interface MadeItSectionProps {
    recipeId: string;
    userId?: string;
    onRequireAuth: (action: () => void) => void;
}

const MadeItSection: React.FC<MadeItSectionProps> = ({ recipeId, userId, onRequireAuth }) => {
    const { madeItList, hasMadeIt, count, loading, markMadeIt, unmarkMadeIt } = useMadeIt(recipeId, userId);
    const [showPhotoPrompt, setShowPhotoPrompt] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (showPhotoPrompt) {
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = prevOverflow;
            };
        }
    }, [showPhotoPrompt]);

    const handleMadeIt = () => {
        onRequireAuth(() => {
            if (hasMadeIt) { unmarkMadeIt(); return; }
            setShowPhotoPrompt(true);
        });
    };

    const handlePhotoChoice = async (withPhoto: boolean) => {
        setShowPhotoPrompt(false);
        if (withPhoto) {
            fileRef.current?.click();
        } else {
            await markMadeIt();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        await markMadeIt(file);
        e.target.value = '';
    };

    const photosWithImages = madeItList.filter(m => m.photo_url);

    return (
        <div className="px-5 py-4 border-t border-base-200">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="font-bold text-base">Made It</h3>
                    {count > 0 && (
                        <p className="text-xs text-base-content/50">
                            {count.toLocaleString()} {count === 1 ? 'person' : 'people'} cooked this
                        </p>
                    )}
                </div>
                <button
                    onClick={handleMadeIt}
                    disabled={loading}
                    className={`btn btn-sm rounded-xl gap-1.5 font-bold transition-all ${
                        hasMadeIt
                            ? 'btn-success text-success-content'
                            : 'btn-outline border-2'
                    }`}
                >
                    {loading
                        ? <span className="loading loading-spinner loading-xs" />
                        : <span className="material-symbols-outlined text-[18px]">{hasMadeIt ? 'check_circle' : 'restaurant'}</span>
                    }
                    {hasMadeIt ? 'Made It!' : 'I Made This'}
                </button>
            </div>

            {/* Avatar stack of people who made it */}
            {count > 0 && (
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex -space-x-2">
                        {madeItList.slice(0, 5).map((m, i) => (
                            <div key={m.id} className="w-8 h-8 rounded-full ring-2 ring-base-100 bg-base-300 overflow-hidden" style={{ zIndex: 5 - i }}>
                                {m.profile?.avatar_url
                                    ? <img src={getAvatarUrl(m.profile.avatar_url) || ''} alt="" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-base-content/50">
                                        {(m.profile?.full_name || '?')[0].toUpperCase()}
                                      </div>
                                }
                            </div>
                        ))}
                    </div>
                    {count > 5 && (
                        <span className="text-xs text-base-content/50 font-medium">+{count - 5} more</span>
                    )}
                </div>
            )}

            {/* Photo grid */}
            {photosWithImages.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                    {photosWithImages.slice(0, 6).map((m) => (
                        <div key={m.id} className="aspect-square rounded-xl overflow-hidden bg-base-200">
                            <img src={m.photo_url!} alt="Made it photo" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {count === 0 && (
                <div className="flex flex-col items-center py-4 text-center">
                    <span className="material-symbols-outlined text-4xl text-base-content/20 mb-2">restaurant</span>
                    <p className="text-sm text-base-content/40">Be the first to cook this recipe!</p>
                </div>
            )}

            {/* Photo prompt modal */}
            {showPhotoPrompt && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-base-100 rounded-3xl w-full max-w-sm p-6 flex flex-col gap-3">
                        <div className="text-center mb-2">
                            <div className="text-4xl mb-2">🎉</div>
                            <h3 className="font-black text-xl">You made it!</h3>
                            <p className="text-sm text-base-content/50 mt-1">Want to share a photo of your creation?</p>
                        </div>
                        <button
                            onClick={() => handlePhotoChoice(true)}
                            className="btn btn-primary rounded-2xl gap-2"
                        >
                            <span className="material-symbols-outlined">photo_camera</span>
                            Add a Photo
                        </button>
                        <button
                            onClick={() => handlePhotoChoice(false)}
                            className="btn btn-ghost rounded-2xl"
                        >
                            Skip
                        </button>
                    </div>
                </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
    );
};

export default MadeItSection;
