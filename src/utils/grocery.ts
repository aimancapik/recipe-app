
import { GroceryItem } from '@/types';

export const GROCERY_CATEGORIES = [
    'Produce',
    'Meat & Seafood',
    'Dairy & Eggs',
    'Pantry & Grains',
    'Bakery',
    'Frozen',
    'Household & Others'
] as const;

export type GroceryCategory = typeof GROCERY_CATEGORIES[number];

const CATEGORY_KEYWORDS: Record<GroceryCategory, string[]> = {
    'Produce': [
        'onion', 'garlic', 'tomato', 'potato', 'carrot', 'leaf', 'herb', 'spinach', 'lemon', 'lime', 
        'apple', 'banana', 'berry', 'pepper', 'chili', 'broccoli', 'cucumber', 'lettuce', 'cabbage', 
        'ginger', 'stalk', 'mushroom', 'cilantro', 'parsley', 'basil', 'veg', 'fruit', 'kale'
    ],
    'Meat & Seafood': [
        'chicken', 'beef', 'pork', 'lamb', 'fish', 'shrimp', 'prawn', 'salmon', 'tuna', 'steak', 
        'meat', 'bacon', 'sausage', 'breast', 'thigh', 'fillet', 'crab', 'mussel', 'pork', 'duck', 'turkey'
    ],
    'Dairy & Eggs': [
        'milk', 'cheese', 'egg', 'butter', 'cream', 'yogurt', 'curd', 'parmesan', 'mozzarella', 
        'cheddar', 'feta', 'ghee', 'dairy'
    ],
    'Pantry & Grains': [
        'oil', 'vinegar', 'salt', 'sugar', 'flour', 'spices', 'sauce', 'pasta', 'rice', 'bean', 
        'lentil', 'can', 'jar', 'broth', 'stock', 'honey', 'syrup', 'cereal', 'nut', 'seed', 
        'bread', 'tortilla', 'pepper', 'soy', 'dressing', 'ketchup', 'mustard', 'mayo'
    ],
    'Bakery': ['bread', 'bun', 'loaf', 'pastry', 'croissant', 'bagel'],
    'Frozen': ['frozen', 'ice', 'pizza', 'nugget'],
    'Household & Others': [] // Fallback
};

/**
 * Smart categorization based on ingredient name
 */
export function categorizeIngredient(name: string): GroceryCategory {
    const lowerName = name.toLowerCase();
    
    for (const category of GROCERY_CATEGORIES) {
        if (category === 'Household & Others') continue;
        const keywords = CATEGORY_KEYWORDS[category as GroceryCategory];
        if (keywords.some(keyword => lowerName.includes(keyword))) {
            return category as GroceryCategory;
        }
    }
    
    return 'Household & Others';
}

/**
 * Formats the list for WhatsApp/Clipboard
 */
export function formatGroceryListForSharing(items: GroceryItem[]): string {
    if (items.length === 0) return "My Shopping List is empty!";
    
    const unchecked = items.filter(i => !i.checked);
    const checked = items.filter(i => i.checked);
    
    let text = "🛒 *My Shopping List (Let Em Cook)*\n\n";
    
    if (unchecked.length > 0) {
        text += "*To Buy:*\n";
        unchecked.forEach(item => {
            text += `☐ ${item.name}\n`;
        });
    }
    
    if (checked.length > 0) {
        text += "\n*Completed:*\n";
        checked.forEach(item => {
            text += `☑ ~${item.name}~\n`;
        });
    }
    
    text += "\nSent via Let Em Cook App 🍳";
    return text;
}
