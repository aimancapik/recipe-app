import { Recipe } from '@/types';
import { getFoodImage } from '@/services/foodImageService';

// Environment variables
const API_URL = import.meta.env.VITE_LLAMA_API_URL || 'http://localhost:3000/api/chat/completions';
const API_KEY = import.meta.env.VITE_LLAMA_API_KEY || ''; // Optional Bearer token
const MODEL = import.meta.env.VITE_LLAMA_MODEL || 'llama3.2:1b';

const SYSTEM_PROMPT = `
You are a professional chef. Create a unique recipe based on the user's input.
You MUST return ONLY a valid JSON object with the following structure:
{
  "title": "Recipe Title",
  "prepTime": "30 mins",
  "serves": "2 people",
  "kcal": "500 kcal",
  "level": "Medium",
  "ingredients": ["1 cup flour", "2 eggs"],
  "directions": [
    { "step": 1, "title": "Prep", "description": "Chop vegetables." },
    { "step": 2, "title": "Cook", "description": "Sauté in pan." }
  ],
  "category": "Dinner"
}
Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
Do not include an "image" field — images are handled separately.
`;

export const generateRecipeFromIngredients = async (
    ingredients: string,
    dietaryFilters?: string[]
): Promise<Recipe | null> => {
    try {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (API_KEY) {
            headers['Authorization'] = `Bearer ${API_KEY}`;
        }

        // Build user message with dietary constraints
        let userMessage = `Ingredients: ${ingredients}`;
        if (dietaryFilters && dietaryFilters.length > 0) {
            userMessage += `\n\nDietary requirements (MUST follow): ${dietaryFilters.join(', ')}. Ensure the recipe strictly adheres to these dietary constraints.`;
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userMessage }
                ],
            }),
        });

        if (!response.ok) {
            console.error('Llama API Error:', response.statusText);
            throw new Error('Failed to fetch from Llama API');
        }

        const data = await response.json();

        let content = '';
        // Handle OpenAI-compatible response format
        if (data.choices && data.choices[0] && data.choices[0].message) {
            content = data.choices[0].message.content;
        } else if (data.response) {
            // Fallback for raw Ollama generate endpoint if user switches back
            content = data.response;
        } else {
            console.error('Unknown API response:', data);
            throw new Error('Unknown API response format');
        }

        // Clean up markdown if present
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(content);

        // Get a relevant food image based on the recipe title
        const image = getFoodImage(parsed.title || ingredients);

        // Safely parse ingredients — ensure it's always a string array
        // AI may return strings ("1 cup flour") or objects ({name: "flour", quantity: "1 cup"})
        const safeIngredients: string[] = Array.isArray(parsed.ingredients)
            ? parsed.ingredients.map((i: any) => {
                if (typeof i === 'string') return i;
                if (i && typeof i === 'object' && i.name) {
                    return i.quantity ? `${i.quantity} ${i.name}` : i.name;
                }
                return String(i);
            })
            : [];

        // Safely parse directions — ensure each has step, title, description
        const safeDirections = Array.isArray(parsed.directions)
            ? parsed.directions.map((d: any, idx: number) => ({
                step: d?.step || idx + 1,
                title: d?.title || `Step ${idx + 1}`,
                description: typeof d === 'string' ? d : (d?.description || ''),
                image: d?.image || null,
                mediaType: d?.mediaType || 'image' as const,
                timer: d?.timer || undefined,
            }))
            : [];

        // Ensure required fields with safe defaults
        const recipe: Recipe = {
            id: `temp-${Date.now()}`,
            title: parsed.title || 'AI Generated Recipe',
            image,
            prepTime: parsed.prepTime || '30m',
            rating: 0,
            reviews: 0,
            serves: parsed.serves || '2',
            kcal: parsed.kcal || '—',
            level: parsed.level || 'Medium',
            ingredients: safeIngredients,
            directions: safeDirections,
            category: parsed.category || 'popular',
            isFavorite: false,
        };

        return recipe;

    } catch (error) {
        console.error('Error generating recipe:', error);
        return null;
    }
};
