import { Recipe } from '@/types';

// Environment variables
const API_URL = import.meta.env.VITE_LLAMA_API_URL || 'http://localhost:3000/api/chat/completions';
const API_KEY = import.meta.env.VITE_LLAMA_API_KEY || ''; // Optional Bearer token
const MODEL = import.meta.env.VITE_LLAMA_MODEL || 'llama3.2:1b';

const SYSTEM_PROMPT = `
You are a professional chef. Create a unique recipe based on the user's ingredients.
You MUST return ONLY a valid JSON object with the following structure:
{
  "title": "Recipe Title",
  "prepTime": "30 mins",
  "serves": "2 people",
  "kcal": "500 kcal",
  "rating": 4.8,
  "reviews": 120,
  "level": "Medium",
  "ingredients": ["1 cup flour", "2 eggs"],
  "directions": [
    { "step": 1, "title": "Prep", "description": "Chop vegetables." },
    { "step": 2, "title": "Cook", "description": "Sauté in pan." }
  ],
  "category": "Dinner",
  "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
}
Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
For the image, pick a relevant Unsplash URL or leave generic.
`;

export const generateRecipeFromIngredients = async (ingredients: string): Promise<Recipe | null> => {
    try {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (API_KEY) {
            headers['Authorization'] = `Bearer ${API_KEY}`;
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `Ingredients: ${ingredients}` }
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

        // Ensure required fields
        const recipe: Recipe = {
            id: `temp-${Date.now()}`, // Temporary ID
            ...parsed,
            rating: parsed.rating || 4.5,
            reviews: parsed.reviews || 0,
            image: parsed.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c', // Fallback
            isFavorite: false,
        };

        return recipe;

    } catch (error) {
        console.error('Error generating recipe:', error);
        return null;
    }
};
