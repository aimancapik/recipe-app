import React, { useRef, useCallback } from 'react';
import { Recipe } from '@/types';

interface ShareableCardProps {
    recipe: Recipe;
    onClose: () => void;
}

const getYoutubeThumbnail = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
};

const isVideoUrl = (url: string) =>
    /\.(mp4|webm|mov|avi)(\?|$)/i.test(url) ||
    /youtube\.com|youtu\.be|vimeo\.com/i.test(url);

const resolveCardImage = (recipe: { image?: string; images?: string[] }): string => {
    const candidates = [recipe.image, ...(recipe.images ?? [])].filter(Boolean) as string[];
    // Prefer first non-video url
    const photo = candidates.find(u => !isVideoUrl(u));
    if (photo) return photo;
    // All are videos — try YouTube thumbnail
    for (const u of candidates) {
        const yt = getYoutubeThumbnail(u);
        if (yt) return yt;
    }
    return candidates[0] ?? '';
};

const ShareableCard: React.FC<ShareableCardProps> = ({ recipe, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const cardImage = resolveCardImage(recipe);

    const handleShare = useCallback(async () => {
        const shareData = {
            title: recipe.title,
            text: `🍳 ${recipe.title}\n⏱ ${recipe.prepTime} · ⭐ ${recipe.rating.toFixed(1)} · 🔥 ${recipe.kcal} kcal\n\nMade with Let Em Cook 👨‍🍳`,
            url: `${window.location.origin}/recipe/${recipe.id}`,
        };
        try {
            if (navigator.share) await navigator.share(shareData);
            else {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                alert('Copied to clipboard!');
            }
        } catch { /* user cancelled */ }
    }, [recipe]);

    const handleDownload = useCallback(async () => {
        // Use html2canvas if available, else fallback to share text
        try {
            const { default: html2canvas } = await import('html2canvas');
            if (!cardRef.current) return;
            const canvas = await html2canvas(cardRef.current, { useCORS: true, scale: 2 });
            const link = document.createElement('a');
            link.download = `${recipe.title.replace(/\s+/g, '-')}.png`;
            link.href = canvas.toDataURL();
            link.click();
        } catch {
            handleShare();
        }
    }, [recipe, handleShare]);

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 gap-4">
            {/* The card */}
            <div
                ref={cardRef}
                className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-base-100"
                style={{ fontFamily: 'system-ui, sans-serif' }}
            >
                {/* Hero image */}
                <div className="relative h-64">
                    <img src={cardImage} alt={recipe.title} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {/* App watermark */}
                    <div className="absolute top-3 right-3 bg-base-100/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
                        <span className="text-xs font-black text-orange-500">Let Em Cook</span>
                        <span className="text-base">👨‍🍳</span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="text-white font-black text-xl leading-tight">{recipe.title}</h2>
                        <p className="text-white/80 text-sm mt-1 line-clamp-2">{recipe.description}</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-base-100 px-5 py-4">
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {[
                            { icon: '⏱', label: 'Time', value: recipe.prepTime },
                            { icon: '⭐', label: 'Rating', value: recipe.rating.toFixed(1) },
                            { icon: '🔥', label: 'Kcal', value: recipe.kcal },
                            { icon: '👨‍🍳', label: 'Level', value: recipe.level },
                        ].map(({ icon, label, value }) => (
                            <div key={label} className="flex flex-col items-center bg-orange-50 rounded-2xl py-2 px-1">
                                <span className="text-lg">{icon}</span>
                                <span className="text-xs font-bold text-base-content mt-0.5">{value}</span>
                                <span className="text-[9px] text-base-content/40 uppercase tracking-wider">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Ingredients preview */}
                    <div className="border-t border-base-200 pt-3">
                        <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mb-2">Ingredients ({recipe.ingredients.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                            {recipe.ingredients.slice(0, 6).map((ing, i) => (
                                <span key={i} className="text-[11px] bg-base-200 text-base-content/60 rounded-full px-2 py-0.5">{ing}</span>
                            ))}
                            {recipe.ingredients.length > 6 && (
                                <span className="text-[11px] bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 font-semibold">+{recipe.ingredients.length - 6} more</span>
                            )}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-3 pt-3 border-t border-base-200 flex items-center justify-between">
                        <p className="text-[10px] text-base-content/40">Cook it on <span className="font-bold text-orange-500">Let Em Cook</span></p>
                        <p className="text-[10px] font-mono text-base-content/30">{window.location.origin}</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full max-w-sm">
                <button
                    onClick={handleShare}
                    className="flex-1 btn btn-primary rounded-2xl gap-2"
                >
                    <span className="material-symbols-outlined text-[20px]">share</span>
                    Share
                </button>
                <button
                    onClick={handleDownload}
                    className="flex-1 btn btn-outline btn-primary rounded-2xl gap-2"
                >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Save Image
                </button>
            </div>
            <button onClick={onClose} className="text-white/60 text-sm font-semibold">Cancel</button>
        </div>
    );
};

export default ShareableCard;
