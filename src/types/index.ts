
export enum Screen {
    HOME = 'home',
    EXPLORE = 'explore',
    SAVED = 'saved',
    PROFILE = 'profile',
    DETAIL = 'detail',
    AI_GENERATE = 'ai_generate',
    FILTER = 'filter',
    GROCERY = 'grocery'
}

export interface Direction {
    step: number;
    title: string;
    description: string;
}

export interface Recipe {
    id: string;
    title: string;
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
