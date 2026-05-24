import { Recipe } from '@/types';
import { parseRecipeImage } from './openaiService';

export async function extractImageRecipe(file: File): Promise<Recipe> {
    return parseRecipeImage(file);
}
