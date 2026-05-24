import { Recipe } from '@/types';
import { extractImageRecipe } from './import/imageExtractor';
import { extractTikTokRecipe } from './import/tiktokExtractor';
import { extractWebsiteRecipe } from './import/websiteExtractor';
import { extractYouTubeRecipe } from './import/youtubeExtractor';
import { parseRecipeText } from './import/openaiService';

export type ImportSourceType = 'website' | 'youtube' | 'tiktok' | 'image' | 'text';

export function detectImportType(input: string | File): ImportSourceType {
    if (input instanceof File) return 'image';

    const value = input.trim();
    try {
        const url = new URL(value);
        const host = url.hostname.replace(/^www\./, '');
        if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
        if (host.includes('tiktok.com')) return 'tiktok';
        return 'website';
    } catch {
        return 'text';
    }
}

export async function importRecipe(input: string | File): Promise<Recipe> {
    const type = detectImportType(input);

    if (type === 'image') return extractImageRecipe(input as File);
    if (type === 'youtube') return extractYouTubeRecipe(String(input));
    if (type === 'tiktok') return extractTikTokRecipe(String(input));
    if (type === 'website') return extractWebsiteRecipe(String(input));

    return parseRecipeText(String(input), {
        source: 'imported_web',
        sourceName: 'Pasted text',
    });
}
