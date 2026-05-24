import { Recipe } from '@/types';
import { parseRecipeText, recipeFromStructuredData } from './openaiService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

async function fetchHtml(url: string): Promise<string> {
    const proxyUrl = `${SUPABASE_URL}/functions/v1/fetch-url?url=${encodeURIComponent(url)}`;

    try {
        const proxied = await fetch(proxyUrl);
        if (proxied.ok) return proxied.text();
        const body = await proxied.text().catch(() => '');
        if (proxied.status === 404 || body.includes('NOT_FOUND')) {
            throw new Error('The fetch-url Supabase Edge Function is not deployed yet. Run: supabase functions deploy fetch-url');
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes('fetch-url Supabase Edge Function')) {
            throw error;
        }
        // Fall through to direct fetch for local/dev cases where CORS allows it.
    }

    const direct = await fetch(url);
    if (!direct.ok) throw new Error(`Could not fetch website (${direct.status}).`);
    return direct.text();
}

function extractJsonLd(html: string) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
        .map(script => script.textContent || '')
        .map(text => {
            try {
                return JSON.parse(text.replace(/^\s*<!--|-->\s*$/g, ''));
            } catch {
                return null;
            }
        })
        .filter(Boolean);
}

function htmlToReadableText(html: string) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, nav, footer, header, aside').forEach(node => node.remove());
    return doc.body?.textContent?.replace(/\s+/g, ' ').trim() || '';
}

export async function extractWebsiteRecipe(url: string): Promise<Recipe> {
    const html = await fetchHtml(url);
    for (const json of extractJsonLd(html)) {
        const recipe = recipeFromStructuredData(json, url);
        if (recipe) return recipe;
    }

    return parseRecipeText(htmlToReadableText(html), {
        source: 'imported_web',
        sourceUrl: url,
        sourceName: new URL(url).hostname.replace(/^www\./, ''),
    });
}
