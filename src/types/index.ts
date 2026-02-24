

export enum Screen {
    HOME = 'home',
    EXPLORE = 'explore',
    SAVED = 'saved',
    PROFILE = 'profile',
    DETAIL = 'detail',
    AI_GENERATE = 'ai_generate',
    FILTER = 'filter',
    GROCERY = 'grocery',
    PUBLISH = 'publish',
    LOGIN = 'login',
    SIGNUP = 'signup',
    MY_RECIPES = 'my_recipes',
    PUBLIC_PROFILE = 'public_profile',
    REVIEW = 'review',
    COOKING_MODE = 'cooking_mode',
    REELS = 'reels'
}

export interface Direction {
    step: number;
    title: string;
    description: string;
    image?: string | null;
    mediaType?: 'image' | 'video';
    timer?: number; // duration in seconds
}

export interface Recipe {
    id: string;
    title: string;
    description?: string;
    image: string;
    prepTime: string;
    rating: number;
    reviews: number;
    serves: string;
    kcal: string;
    level: 'Easy' | 'Medium' | 'Hard';
    ingredients: string[];
    directions: Direction[];
    category: string;
    isFavorite?: boolean;
    userId?: string;
    status?: 'published' | 'draft';
    images?: string[];
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    image?: string;
}

export interface GroceryItem {
    id: string;
    name: string;
    checked: boolean;
    recipeTitle: string;
    recipeImage: string;
}
