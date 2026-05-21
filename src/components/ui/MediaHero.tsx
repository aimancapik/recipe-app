import React from 'react';

interface MediaHeroProps {
    image?: string;
    title: string;
    eyebrow?: string;
    meta?: React.ReactNode;
    action?: React.ReactNode;
    heightClass?: string;
}

const MediaHero: React.FC<MediaHeroProps> = ({ image, title, eyebrow, meta, action, heightClass = 'min-h-[230px]' }) => (
    <div className={`relative overflow-hidden rounded-[28px] bg-base-200 shadow-xl shadow-base-content/10 ${heightClass}`}>
        {image && <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        <div className={`relative z-10 flex ${heightClass} flex-col justify-end p-5 text-white`}>
            {eyebrow && <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/70">{eyebrow}</p>}
            <h1 className="text-3xl font-black leading-[0.98]">{title}</h1>
            {(meta || action) && (
                <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">{meta}</div>
                    {action}
                </div>
            )}
        </div>
    </div>
);

export default MediaHero;
