
import { Category, Recipe } from '@/types';

export const CATEGORIES: Category[] = [
    { id: 'popular', name: 'Popular', icon: 'local_fire_department', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' },
    { id: 'breakfast', name: 'Breakfast', icon: 'sunny', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400' },
    { id: 'dinner', name: 'Dinner', icon: 'restaurant', image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400' },
    { id: 'seafood', name: 'Seafood', icon: 'set_meal', image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400' },
    { id: 'vegan', name: 'Vegan', icon: 'eco', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400' },
];

export const RECIPES: Recipe[] = [
    {
        id: '1',
        title: 'Avocado & Egg Toast',
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600',
        prepTime: '15m',
        rating: 4.8,
        reviews: 156,
        serves: '01',
        kcal: '320',
        level: 'Easy',
        category: 'breakfast',
        isFavorite: true,
        ingredients: ['1 Ripe avocado', '2 Slices sourdough', '1 Poached egg', 'Red pepper flakes'],
        directions: [{ step: 1, title: 'Toast bread', description: 'Toast the sourdough slices until golden.' }, { step: 2, title: 'Mash avocado', description: 'Mash avocado and spread it.' }]
    },
    {
        id: '2',
        title: 'Acai Smoothie Bowl',
        image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600',
        prepTime: '10m',
        rating: 4.9,
        reviews: 120,
        serves: '01',
        kcal: '280',
        level: 'Easy',
        category: 'vegan',
        isFavorite: true,
        ingredients: ['Acai puree', 'Frozen berries', 'Granola', 'Chia seeds'],
        directions: [{ step: 1, title: 'Blend', description: 'Blend acai and berries.' }]
    },
    {
        id: '3',
        title: 'Classic Carbonara',
        image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600',
        prepTime: '25m',
        rating: 4.5,
        reviews: 210,
        serves: '02',
        kcal: '650',
        level: 'Medium',
        category: 'dinner',
        isFavorite: true,
        ingredients: ['Spaghetti', 'Pancetta', 'Eggs', 'Pecorino Romano'],
        directions: [{ step: 1, title: 'Boil pasta', description: 'Cook pasta in salted water.' }]
    },
    {
        id: '4',
        title: 'Lemon Garlic Salmon',
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600',
        prepTime: '20m',
        rating: 4.7,
        reviews: 89,
        serves: '01',
        kcal: '410',
        level: 'Medium',
        category: 'seafood',
        isFavorite: true,
        ingredients: ['Salmon fillet', 'Garlic', 'Lemon', 'Asparagus'],
        directions: [{ step: 1, title: 'Sear salmon', description: 'Sear salmon skin-side down.' }]
    },
    {
        id: '5',
        title: 'Crepes with Orange and Honey',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4bDORqJU5HbmYgi-2yZGNFoHdinjtjPSXHa1_HNGMKsAbiV2XxkjSGposR-8nTaEFxUaTg_oGZI0o_po4eJpMrfsVsi7GEinelDgBEJY8YbKPumMSL9H3u_cP5PdaFxjO_IozYoIefJqMIhPmeteTtKDKGNY-l98EVlh2tR4MeK6E0ICk5--U9GTAKoeeABM5H69k30CeuT8_cTOGc9CxlpTd1dA8cEjU8tkFBrgtJ4XCIc2I5MXI3KlYQVc51ru7gKiU1QShA9k',
        prepTime: '35m',
        rating: 4.8,
        reviews: 120,
        serves: '03',
        kcal: '103',
        level: 'Easy',
        category: 'breakfast',
        isFavorite: false,
        ingredients: [
            '2 Large organic eggs',
            '1 Cup all-purpose flour',
            '1/2 Cup whole milk',
            '2 tbsp unsalted butter, melted',
            '1 tbsp organic honey',
            '1 tsp Fresh orange zest'
        ],
        directions: [
            { step: 1, title: 'Prepare the batter', description: 'In a large mixing bowl, whisk the eggs and flour together until well combined.' },
            { step: 2, title: 'Add liquids', description: 'Gradually add the milk and melted butter, whisking constantly to prevent lumps from forming.' },
            { step: 3, title: 'Cook the crepes', description: 'Heat a non-stick pan over medium heat and pour a thin layer of batter. Swirl to coat the pan.' },
            { step: 4, title: 'Serve and enjoy', description: 'Cook until golden brown on both sides. Serve warm with a drizzle of honey and orange slices.' }
        ]
    }
];
