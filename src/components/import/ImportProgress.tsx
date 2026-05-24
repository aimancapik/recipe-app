import React from 'react';
import { ImportSourceType } from '@/services/recipeImportService';

const MESSAGES: Record<ImportSourceType, string[]> = {
    website: ['Fetching page', 'Reading recipe schema', 'Structuring recipe'],
    youtube: ['Fetching video page', 'Reading captions', 'Extracting recipe'],
    tiktok: ['Reading metadata', 'Checking caption', 'Extracting recipe'],
    image: ['Reading image', 'Running vision model', 'Structuring recipe'],
    text: ['Reading text', 'Finding ingredients', 'Structuring recipe'],
};

interface ImportProgressProps {
    type: ImportSourceType;
    step: number;
}

const ImportProgress: React.FC<ImportProgressProps> = ({ type, step }) => {
    const messages = MESSAGES[type];
    const active = Math.min(step, messages.length - 1);

    return (
        <div className="rounded-2xl border border-primary/15 bg-base-100 p-4 shadow-lg shadow-primary/5">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-black">{messages[active]}...</p>
                <span className="text-xs font-bold text-base-content/45">{active + 1}/{messages.length}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-base-200">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${((active + 1) / messages.length) * 100}%` }} />
            </div>
        </div>
    );
};

export default ImportProgress;
