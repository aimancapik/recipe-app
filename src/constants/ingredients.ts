export interface IngredientOption {
    name: string;
    emoji: string;
    category: 'Protein' | 'Vegetables' | 'Grains' | 'Dairy' | 'Spices' | 'Pantry';
}

export const INGREDIENTS: IngredientOption[] = [
    { name: 'Eggs', emoji: 'egg', category: 'Protein' },
    { name: 'Chicken', emoji: 'local_dining', category: 'Protein' },
    { name: 'Tofu', emoji: 'deployed_code', category: 'Protein' },
    { name: 'Beef', emoji: 'lunch_dining', category: 'Protein' },
    { name: 'Fish', emoji: 'set_meal', category: 'Protein' },
    { name: 'Prawns', emoji: 'phishing', category: 'Protein' },
    { name: 'Rice', emoji: 'rice_bowl', category: 'Grains' },
    { name: 'Noodles', emoji: 'ramen_dining', category: 'Grains' },
    { name: 'Pasta', emoji: 'restaurant', category: 'Grains' },
    { name: 'Bread', emoji: 'bakery_dining', category: 'Grains' },
    { name: 'Onion', emoji: 'nutrition', category: 'Vegetables' },
    { name: 'Garlic', emoji: 'spa', category: 'Vegetables' },
    { name: 'Tomato', emoji: 'nutrition', category: 'Vegetables' },
    { name: 'Spinach', emoji: 'eco', category: 'Vegetables' },
    { name: 'Carrot', emoji: 'nutrition', category: 'Vegetables' },
    { name: 'Potato', emoji: 'nutrition', category: 'Vegetables' },
    { name: 'Milk', emoji: 'local_cafe', category: 'Dairy' },
    { name: 'Cheese', emoji: 'breakfast_dining', category: 'Dairy' },
    { name: 'Butter', emoji: 'bakery_dining', category: 'Dairy' },
    { name: 'Yogurt', emoji: 'icecream', category: 'Dairy' },
    { name: 'Soy sauce', emoji: 'water_drop', category: 'Pantry' },
    { name: 'Coconut milk', emoji: 'local_drink', category: 'Pantry' },
    { name: 'Flour', emoji: 'grain', category: 'Pantry' },
    { name: 'Sugar', emoji: 'cookie', category: 'Pantry' },
    { name: 'Chili flakes', emoji: 'local_fire_department', category: 'Spices' },
    { name: 'Curry powder', emoji: 'scatter_plot', category: 'Spices' },
    { name: 'Black pepper', emoji: 'grain', category: 'Spices' },
    { name: 'Cumin', emoji: 'scatter_plot', category: 'Spices' },
];

export const QUICK_INGREDIENTS = ['Eggs', 'Chicken', 'Rice', 'Onion', 'Garlic', 'Tomato', 'Noodles', 'Tofu'];
export const PANTRY_STAPLES = ['Salt', 'Black pepper', 'Cooking oil'];
