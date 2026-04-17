import { Recipe } from '@/types';
import type { RecipeFormData } from '@/pages/recipe/PublishRecipeScreen';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600';

const mapDirections = (instructions: RecipeFormData['instructions']) =>
    instructions
        .filter(s => s.description.trim() || s.image)
        .map((s, idx) => ({
            step: idx + 1,
            title: `Step ${idx + 1}`,
            description: s.description,
            image: s.image || null,
            mediaType: (s.mediaType || 'image') as 'image' | 'video',
            timer: s.timer,
        }));

/** Build a new recipe object from PublishRecipeScreen form data. */
export const buildNewRecipe = (data: RecipeFormData): Omit<Recipe, 'id'> => ({
    title: data.title || 'Untitled Recipe',
    description: data.description,
    image: data.coverImages[0] || DEFAULT_COVER,
    prepTime: data.prepTime ? `${data.prepTime}m` : '30m',
    rating: 0,
    reviews: 0,
    serves: data.serves || '01',
    kcal: '0',
    level: (data.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Easy',
    ingredients: data.ingredients.map(i => `${i.qty}${i.unit} ${i.name}`),
    directions: mapDirections(data.instructions),
    category: data.category || 'breakfast',
    isFavorite: false,
    status: 'published',
    images: data.coverImages || [],
});

/** Build an updated recipe object, preserving existing fields where form data is absent. */
export const buildUpdatedRecipe = (data: RecipeFormData, existing: Recipe): Omit<Recipe, 'id'> => ({
    title: data.title || 'Untitled Recipe',
    description: data.description,
    image: data.coverImages[0] || DEFAULT_COVER,
    prepTime: data.prepTime ? `${data.prepTime}m` : '30m',
    rating: existing.rating,
    reviews: existing.reviews,
    serves: data.serves || '01',
    kcal: existing.kcal,
    level: (data.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Easy',
    ingredients: data.ingredients.map(i => `${i.qty}${i.unit} ${i.name}`),
    directions: mapDirections(data.instructions),
    category: data.category || existing.category,
    isFavorite: false,
    status: existing.status || 'published',
    images: data.coverImages || [],
});

/** Build a draft recipe, merging form data over the existing draft. */
export const buildDraftRecipe = (data: RecipeFormData, existing: Recipe): Recipe => ({
    ...existing,
    title: data.title || 'Untitled Recipe',
    description: data.description || existing.description,
    image: data.coverImages[0] || existing.image,
    images: data.coverImages || existing.images || [],
    prepTime: data.prepTime ? `${data.prepTime}m` : existing.prepTime,
    serves: data.serves || existing.serves,
    level: (data.difficulty as 'Easy' | 'Medium' | 'Hard') || existing.level,
    category: data.category || existing.category,
    ingredients: data.ingredients.map(i => `${i.qty}${i.unit} ${i.name}`),
    directions: mapDirections(data.instructions),
    status: 'draft',
});
