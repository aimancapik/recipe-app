import { Recipe } from '@/types';
import { parseRecipeText } from './openaiService';

export async function extractTikTokRecipe(url: string): Promise<Recipe> {
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('Could not read TikTok metadata.');
    const data = await response.json();

    return parseRecipeText(
        [data.title, data.author_name, data.html].filter(Boolean).join('\n\n'),
        {
            source: 'imported_tiktok',
            sourceUrl: url,
            sourceName: data.author_name ? `TikTok - ${data.author_name}` : 'TikTok',
            image: data.thumbnail_url,
        }
    );
}
