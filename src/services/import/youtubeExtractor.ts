import { Recipe } from '@/types';
import { parseRecipeText } from './openaiService';
import { getNormalizedVideoUrl, getYouTubeThumbnail } from '@/utils/mediaHelpers';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

async function fetchPage(url: string) {
    const proxyUrl = `${SUPABASE_URL}/functions/v1/fetch-url?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
        const body = await response.text().catch(() => '');
        if (response.status === 404 || body.includes('NOT_FOUND')) {
            throw new Error('The fetch-url Supabase Edge Function is not deployed yet. Run: supabase functions deploy fetch-url');
        }
        throw new Error(`Could not fetch YouTube page (${response.status}).`);
    }
    return response.text();
}

function decodeEntities(value: string) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
}

async function fetchTranscript(captionUrl: string) {
    const proxyUrl = `${SUPABASE_URL}/functions/v1/fetch-url?url=${encodeURIComponent(captionUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Could not fetch YouTube captions (${response.status}).`);
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    return Array.from(doc.querySelectorAll('text'))
        .map(node => decodeEntities(node.textContent || ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function findCaptionUrl(html: string) {
    const match = html.match(/"captionTracks":(\[.*?\])\s*,\s*"audioTracks"/);
    if (!match) return null;
    try {
        const tracks = JSON.parse(match[1].replace(/\\"/g, '"'));
        return tracks[0]?.baseUrl || null;
    } catch {
        return null;
    }
}

function findMeta(html: string, property: string) {
    const escaped = property.replace(':', '\\:');
    const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'));
    return match?.[1] ? decodeEntities(match[1]) : '';
}

async function fetchOEmbed(url: string) {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!response.ok) throw new Error(`Could not fetch YouTube metadata (${response.status}).`);
    return response.json();
}

export async function extractYouTubeRecipe(url: string): Promise<Recipe> {
    const normalizedUrl = getNormalizedVideoUrl(url);
    let title = '';
    let description = '';
    let transcript = '';
    let thumbnail = getYouTubeThumbnail(normalizedUrl) || undefined;

    try {
        const html = await fetchPage(normalizedUrl);
        const captionUrl = findCaptionUrl(html);
        transcript = captionUrl ? await fetchTranscript(captionUrl) : '';
        title = findMeta(html, 'og:title');
        description = findMeta(html, 'og:description');
    } catch (error) {
        const metadata = await fetchOEmbed(normalizedUrl);
        title = metadata.title || '';
        description = metadata.author_name ? `Video by ${metadata.author_name}` : '';
        thumbnail = metadata.thumbnail_url || thumbnail;

        if (error instanceof Error && error.message.includes('fetch-url Supabase Edge Function')) {
            description += `\nNote: ${error.message}`;
        }
    }

    const recipe = await parseRecipeText(
        [title, description, transcript].filter(Boolean).join('\n\n'),
        {
            source: 'imported_youtube',
            sourceUrl: normalizedUrl,
            sourceName: 'YouTube',
            image: thumbnail,
        }
    );

    return {
        ...recipe,
        sourceUrl: normalizedUrl,
        image: thumbnail || recipe.image,
        images: [thumbnail || recipe.image],
    };
}
