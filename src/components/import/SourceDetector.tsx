import React from 'react';
import { detectImportType, ImportSourceType } from '@/services/recipeImportService';

const SOURCE_META: Record<ImportSourceType, { icon: string; label: string }> = {
    website: { icon: 'language', label: 'Recipe website' },
    youtube: { icon: 'play_circle', label: 'YouTube video' },
    tiktok: { icon: 'music_video', label: 'TikTok video' },
    image: { icon: 'photo_camera', label: 'Recipe image' },
    text: { icon: 'article', label: 'Pasted text' },
};

interface SourceDetectorProps {
    input: string | File | null;
}

const SourceDetector: React.FC<SourceDetectorProps> = ({ input }) => {
    if (!input || (typeof input === 'string' && !input.trim())) return null;
    const type = detectImportType(input);
    const meta = SOURCE_META[type];

    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-xs font-black text-primary">
            <span className="material-symbols-outlined text-base">{meta.icon}</span>
            {meta.label}
        </div>
    );
};

export default SourceDetector;
