
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function generateRecipeFromIngredients(prompt: string): Promise<Recipe | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a creative recipe based on these ingredients/vibe: "${prompt}". Return as a structured JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            prepTime: { type: Type.STRING },
            serves: { type: Type.STRING },
            kcal: { type: Type.STRING },
            level: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            directions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ['step', 'title', 'description']
              }
            }
          },
          required: ['title', 'prepTime', 'ingredients', 'directions', 'serves', 'kcal', 'level']
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    return {
      ...data,
      id: `ai-${Date.now()}`,
      image: 'https://picsum.photos/800/600?random=' + Math.random(),
      rating: 5.0,
      reviews: 1,
      category: 'ai'
    } as Recipe;
  } catch (error) {
    console.error("Error generating recipe:", error);
    return null;
  }
}
