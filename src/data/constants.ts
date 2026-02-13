
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
        directions: [
            { step: 1, title: 'Toast bread', description: 'Toast the sourdough slices until golden.' },
            { step: 2, title: 'Mash avocado', description: 'Mash avocado and spread it.', image: 'https://images.unsplash.com/photo-1603046891726-36cefd07da7b?w=400' }
        ]
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
        directions: [
            { step: 1, title: 'Blend', description: 'Blend acai and berries until smooth and thick.' },
            { step: 2, title: 'Add toppings', description: 'Pour into a bowl and top with granola, chia seeds, and fresh berries.', image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400' }
        ]
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
        directions: [
            { step: 1, title: 'Boil pasta', description: 'Cook spaghetti in a large pot of well-salted boiling water until al dente.' },
            { step: 2, title: 'Cook pancetta', description: 'Fry pancetta in a pan until crispy and golden. Reserve the rendered fat.', image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400' },
            { step: 3, title: 'Mix eggs and cheese', description: 'Whisk eggs with grated Pecorino Romano and black pepper in a bowl.' },
            { step: 4, title: 'Combine and serve', description: 'Toss hot pasta with pancetta, then quickly stir in egg mixture off heat. Serve immediately.', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400' }
        ]
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
        directions: [
            { step: 1, title: 'Season the salmon', description: 'Pat salmon dry and season with salt, pepper, and minced garlic.' },
            { step: 2, title: 'Sear salmon', description: 'Heat oil in a pan and sear salmon skin-side down for 4 minutes until crispy.', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400' },
            { step: 3, title: 'Add lemon and asparagus', description: 'Flip the salmon, add lemon slices and asparagus. Cook for another 3 minutes.' }
        ]
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
            { step: 3, title: 'Cook the crepes', description: 'Heat a non-stick pan over medium heat and pour a thin layer of batter. Swirl to coat the pan.', image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400' },
            { step: 4, title: 'Serve and enjoy', description: 'Cook until golden brown on both sides. Serve warm with a drizzle of honey and orange slices.', image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400' }
        ]
    },
    {
        id: '6',
        title: 'Chicken Tikka Masala',
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600',
        prepTime: '45m',
        rating: 4.9,
        reviews: 312,
        serves: '04',
        kcal: '520',
        level: 'Medium',
        category: 'dinner',
        isFavorite: false,
        ingredients: [
            '500g Chicken breast, cubed',
            '1 Cup plain yogurt',
            '2 tbsp Tikka masala paste',
            '1 Can crushed tomatoes',
            '1 Cup heavy cream',
            '1 Large onion, diced',
            '3 Cloves garlic, minced',
            'Fresh cilantro for garnish'
        ],
        directions: [
            { step: 1, title: 'Marinate the chicken', description: 'Mix chicken with yogurt and tikka paste. Refrigerate for at least 30 minutes, or overnight for best results.' },
            { step: 2, title: 'Cook the chicken', description: 'Grill or pan-sear the marinated chicken until charred and cooked through. Set aside.', image: 'https://images.unsplash.com/photo-1532636875304-0c89f5610bba?w=400' },
            { step: 3, title: 'Make the sauce', description: 'Sauté onion and garlic, add crushed tomatoes and simmer for 15 minutes. Stir in heavy cream.' },
            { step: 4, title: 'Combine and serve', description: 'Add the cooked chicken to the sauce. Simmer for 5 minutes. Garnish with cilantro and serve with rice or naan.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400' }
        ]
    },
    {
        id: '7',
        title: 'Mediterranean Greek Salad',
        image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600',
        prepTime: '10m',
        rating: 4.6,
        reviews: 98,
        serves: '02',
        kcal: '220',
        level: 'Easy',
        category: 'vegan',
        isFavorite: false,
        ingredients: [
            '2 Large tomatoes, chopped',
            '1 Cucumber, sliced',
            '1/2 Red onion, thinly sliced',
            '200g Feta cheese, cubed',
            'Kalamata olives',
            'Extra virgin olive oil',
            '1 tsp Dried oregano'
        ],
        directions: [
            { step: 1, title: 'Prep vegetables', description: 'Chop the tomatoes into wedges, slice the cucumber, and thinly slice the red onion.' },
            { step: 2, title: 'Assemble the salad', description: 'Combine all vegetables in a large bowl. Add olives and feta cheese on top.', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400' },
            { step: 3, title: 'Dress and serve', description: 'Drizzle generously with olive oil, sprinkle with oregano, and season with salt and pepper.' }
        ]
    },
    {
        id: '8',
        title: 'Fluffy Banana Pancakes',
        image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
        prepTime: '20m',
        rating: 4.7,
        reviews: 185,
        serves: '02',
        kcal: '380',
        level: 'Easy',
        category: 'breakfast',
        isFavorite: false,
        ingredients: [
            '2 Ripe bananas, mashed',
            '2 Large eggs',
            '1 Cup all-purpose flour',
            '1/2 Cup milk',
            '2 tbsp Maple syrup',
            '1 tsp Baking powder',
            'Butter for cooking'
        ],
        directions: [
            { step: 1, title: 'Make batter', description: 'Mash the bananas in a bowl. Add eggs and milk, whisk until smooth. Fold in flour and baking powder.' },
            { step: 2, title: 'Cook pancakes', description: 'Heat a buttered pan over medium-low heat. Pour 1/4 cup batter per pancake. Cook until bubbles form, then flip.', image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400' },
            { step: 3, title: 'Serve', description: 'Stack the pancakes, drizzle with maple syrup, and top with sliced bananas and a pat of butter.' }
        ]
    },
    {
        id: '9',
        title: 'Shrimp Pad Thai',
        image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600',
        prepTime: '30m',
        rating: 4.8,
        reviews: 234,
        serves: '02',
        kcal: '450',
        level: 'Medium',
        category: 'seafood',
        isFavorite: false,
        ingredients: [
            '200g Rice noodles',
            '300g Large shrimp, peeled',
            '2 Eggs, beaten',
            '1 Cup Bean sprouts',
            '3 tbsp Fish sauce',
            '2 tbsp Tamarind paste',
            '2 tbsp Brown sugar',
            'Crushed peanuts & lime wedges'
        ],
        directions: [
            { step: 1, title: 'Prep noodles', description: 'Soak rice noodles in warm water for 20 minutes until pliable. Drain and set aside.' },
            { step: 2, title: 'Make the sauce', description: 'Whisk together fish sauce, tamarind paste, and brown sugar in a small bowl.' },
            { step: 3, title: 'Stir-fry', description: 'Cook shrimp in a hot wok until pink. Push to side, scramble the eggs, then add noodles and sauce. Toss everything together.', image: 'https://images.unsplash.com/photo-1543826173-1beeb97525d8?w=400' },
            { step: 4, title: 'Serve', description: 'Top with bean sprouts, crushed peanuts, and a squeeze of fresh lime juice.', image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400' }
        ]
    },
    {
        id: '10',
        title: 'Creamy Mushroom Risotto',
        image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600',
        prepTime: '40m',
        rating: 4.5,
        reviews: 142,
        serves: '03',
        kcal: '480',
        level: 'Hard',
        category: 'dinner',
        isFavorite: false,
        ingredients: [
            '1.5 Cups Arborio rice',
            '300g Mixed mushrooms, sliced',
            '4 Cups warm chicken or vegetable broth',
            '1/2 Cup dry white wine',
            '1 Medium onion, finely diced',
            '3 tbsp Butter',
            '1/2 Cup Parmesan cheese, grated',
            'Fresh thyme sprigs'
        ],
        directions: [
            { step: 1, title: 'Sauté mushrooms', description: 'Cook sliced mushrooms in butter over high heat until golden brown and caramelized. Season and set aside.', image: 'https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=400' },
            { step: 2, title: 'Toast the rice', description: 'Sauté onion until translucent, add Arborio rice and stir for 2 minutes until the edges become translucent.' },
            { step: 3, title: 'Add wine and broth', description: 'Pour in wine and stir until absorbed. Add warm broth one ladle at a time, stirring constantly, waiting for each addition to be absorbed.' },
            { step: 4, title: 'Finish and serve', description: 'After about 18 minutes, stir in mushrooms, butter and Parmesan. The risotto should be creamy and flow like lava. Garnish with thyme.', image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400' }
        ]
    }
];
