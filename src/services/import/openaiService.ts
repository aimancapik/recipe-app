import { Recipe, RecipeSource } from '@/types';
import { getFoodImage } from '@/services/foodImageService';

const API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

const RECIPE_SCHEMA_PROMPT = `You extract recipes into strict JSON.
Return only one JSON object with:
title, description, prepTime, serves, kcal, level, ingredients, directions, category.
directions must be an array of objects with step, title, description, optional timer in seconds.
level must be Easy, Medium, or Hard. category should be breakfast, lunch, dinner, dessert, drinks, snack, popular, or healthy.
If information is missing, infer sensible practical defaults.`;

interface RecipeMetadata {
    source: RecipeSource;
    sourceUrl?: string;
    sourceName?: string;
    image?: string;
}

export function assertOpenAIConfigured() {
    if (!API_KEY) {
        throw new Error('Missing VITE_OPENAI_API_KEY. Add your OpenAI API key to .env and restart the dev server.');
    }
}

function cleanJson(content: string) {
    return content.replace(/```json/g, '').replace(/```/g, '').trim();
}

function normalizeRecipe(parsed: any, meta: RecipeMetadata): Recipe {
    const ingredients = Array.isArray(parsed.ingredients)
        ? parsed.ingredients.map((item: any) => {
            if (typeof item === 'string') return item;
            if (item?.name) return [item.quantity, item.unit, item.name].filter(Boolean).join(' ');
            return String(item);
        })
        : [];

    const directions = Array.isArray(parsed.directions)
        ? parsed.directions.map((item: any, index: number) => ({
            step: Number(item?.step) || index + 1,
            title: item?.title || `Step ${index + 1}`,
            description: typeof item === 'string' ? item : item?.description || '',
            image: item?.image || null,
            mediaType: item?.mediaType || 'image' as const,
            timer: item?.timer || undefined,
        }))
        : [];

    const image = meta.image || parsed.image || getFoodImage(parsed.title || 'recipe');

    return {
        id: `temp-import-${Date.now()}`,
        title: parsed.title || 'Imported Recipe',
        description: parsed.description || '',
        image,
        images: image ? [image] : [],
        prepTime: parsed.prepTime || parsed.prep_time || '30m',
        rating: 0,
        reviews: 0,
        serves: parsed.serves || '2',
        kcal: parsed.kcal || '0',
        level: ['Easy', 'Medium', 'Hard'].includes(parsed.level) ? parsed.level : 'Easy',
        ingredients,
        directions,
        category: parsed.category || 'popular',
        isFavorite: false,
        source: meta.source,
        sourceUrl: meta.sourceUrl,
        sourceName: meta.sourceName,
    };
}

export async function parseRecipeText(text: string, meta: RecipeMetadata): Promise<Recipe> {
    assertOpenAIConfigured();

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: RECIPE_SCHEMA_PROMPT },
                { role: 'user', content: `Extract the recipe from this content:\n\n${text.slice(0, 30000)}` },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI recipe extraction failed (${response.status}).`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned an empty recipe extraction response.');

    return normalizeRecipe(JSON.parse(cleanJson(content)), meta);
}

export async function parseRecipeImage(file: File): Promise<Recipe> {
    assertOpenAIConfigured();

    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read image file.'));
        reader.readAsDataURL(file);
    });

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: RECIPE_SCHEMA_PROMPT },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Extract the recipe from this image, including ingredients and cooking steps.' },
                        { type: 'image_url', image_url: { url: dataUrl } },
                    ],
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI image extraction failed (${response.status}).`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned an empty image extraction response.');

    return normalizeRecipe(JSON.parse(cleanJson(content)), {
        source: 'imported_image',
        sourceName: file.name,
        image: dataUrl,
    });
}

export function recipeFromStructuredData(data: any, sourceUrl: string): Recipe | null {
    const recipe = Array.isArray(data) ? data.find(isRecipeLike) : findRecipeNode(data);
    if (!recipe) return null;

    const image = Array.isArray(recipe.image) ? recipe.image[0]?.url || recipe.image[0] : recipe.image?.url || recipe.image;
    const instructions = Array.isArray(recipe.recipeInstructions) ? recipe.recipeInstructions : [];

    return normalizeRecipe({
        title: recipe.name,
        description: recipe.description,
        prepTime: recipe.totalTime || recipe.cookTime || recipe.prepTime || '30m',
        serves: String(recipe.recipeYield || recipe.yield || '2'),
        kcal: recipe.nutrition?.calories || '0',
        level: 'Easy',
        ingredients: recipe.recipeIngredient || [],
        directions: instructions.map((step: any, index: number) => ({
            step: index + 1,
            title: step.name || `Step ${index + 1}`,
            description: typeof step === 'string' ? step : step.text || step.itemListElement?.map((s: any) => s.text).join(' ') || '',
        })),
        category: recipe.recipeCategory || 'popular',
        image,
    }, {
        source: 'imported_web',
        sourceUrl,
        sourceName: new URL(sourceUrl).hostname.replace(/^www\./, ''),
        image,
    });
}

function isRecipeLike(value: any) {
    const type = value?.['@type'];
    return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
}

function findRecipeNode(value: any): any | null {
    if (!value || typeof value !== 'object') return null;
    if (isRecipeLike(value)) return value;
    if (Array.isArray(value['@graph'])) {
        const graphRecipe = value['@graph'].find(isRecipeLike);
        if (graphRecipe) return graphRecipe;
    }
    for (const child of Object.values(value)) {
        if (Array.isArray(child)) {
            const nested = child.find(isRecipeLike);
            if (nested) return nested;
        }
    }
    return null;
}
