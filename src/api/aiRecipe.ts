import { Recipe } from '@/types';
import { getFoodImage } from './foodImages';

// Environment variables
const API_URL = import.meta.env.VITE_LLAMA_API_URL || 'http://localhost:3000/api/chat/completions';
const API_KEY = import.meta.env.VITE_LLAMA_API_KEY || ''; // Optional Bearer token
const MODEL = import.meta.env.VITE_LLAMA_MODEL || 'llama3.2:1b';

const SYSTEM_PROMPT = `
You are a world-class professional chef and recipe creator. When given ingredients, you MUST create a DETAILED, realistic, and delicious recipe that someone would actually want to cook.

RULES:
1. Generate at least 5-8 detailed cooking steps with clear, descriptive instructions (not just "Cook noodles" — explain HOW).
2. Each step description should be 1-3 sentences explaining the technique, temperature, visual cues, etc.
3. If a step involves waiting, boiling, simmering, baking, marinating, or any timed action, include a "timer" field with the duration in SECONDS.
4. Suggest additional complementary ingredients beyond what the user provides to make the dish truly delicious (e.g. garlic, sesame oil, green onions for ramen).
5. Include realistic nutritional info and proper serving sizes.
6. Ingredient quantities must be specific (e.g. "2 tablespoons soy sauce", not just "soy sauce").

You MUST return ONLY a valid JSON object with this structure:
{
  "title": "Spicy Garlic Soy Ramen",
  "prepTime": "25 mins",
  "serves": "2 people",
  "kcal": "480 kcal",
  "level": "Easy",
  "ingredients": ["200g ramen noodles", "3 tablespoons soy sauce", "2 cloves garlic, minced", "1 tablespoon sesame oil"],
  "directions": [
    { "step": 1, "title": "Boil the Water", "description": "Fill a large pot with water and bring it to a rolling boil over high heat. Add a pinch of salt.", "timer": 300 },
    { "step": 2, "title": "Cook the Noodles", "description": "Add the ramen noodles to the boiling water. Cook until al dente, stirring occasionally to prevent sticking.", "timer": 180 },
    { "step": 3, "title": "Prepare the Sauce", "description": "While noodles cook, whisk together soy sauce, sesame oil, and minced garlic in a small bowl." },
    { "step": 4, "title": "Sauté Aromatics", "description": "Heat a wok or large skillet over medium-high heat. Add oil and sauté garlic until fragrant and golden, about 1 minute.", "timer": 60 },
    { "step": 5, "title": "Combine & Toss", "description": "Drain the noodles and add them to the wok. Pour the sauce over and toss everything together using tongs until evenly coated.", "timer": 120 },
    { "step": 6, "title": "Garnish & Serve", "description": "Plate the noodles into bowls. Top with sliced green onions, a soft-boiled egg, and a sprinkle of sesame seeds. Serve immediately while hot." }
  ],
  "category": "Dinner"
}

IMPORTANT:
- Do NOT include markdown formatting like \`\`\`json. Return ONLY the raw JSON string.
- Do NOT include an "image" field — images are handled separately.
- The "timer" field is in SECONDS (60 = 1 minute, 300 = 5 minutes). Only include it for steps that involve waiting or timed cooking.
- Make the recipe genuinely appetizing and practical. Be creative with the title.
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

        console.log('AI Generation raw content:', content);

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            console.error('Failed to parse AI response as JSON:', content);
            throw new Error('Invalid JSON format from AI');
        }

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
