/**
 * Food Image Service
 * Maps food keywords to curated, high-quality Unsplash photo URLs.
 * No API key required — all URLs are direct Unsplash image links.
 */

interface FoodImageEntry {
    keywords: string[];
    urls: string[];
}

const FOOD_IMAGE_MAP: FoodImageEntry[] = [
    {
        keywords: ['pasta', 'spaghetti', 'penne', 'linguine', 'fettuccine', 'carbonara', 'bolognese', 'alfredo', 'macaroni', 'lasagna'],
        urls: [
            'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600',
            'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600',
            'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600',
            'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600',
        ],
    },
    {
        keywords: ['chicken', 'poultry', 'wings', 'drumstick', 'grilled chicken', 'roast chicken'],
        urls: [
            'https://images.unsplash.com/photo-1598103442097-8b74f0e9643d?w=600',
            'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600',
            'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600',
            'https://images.unsplash.com/photo-1610057099443-fde6c99db7b3?w=600',
        ],
    },
    {
        keywords: ['salad', 'greens', 'lettuce', 'caesar', 'coleslaw', 'arugula'],
        urls: [
            'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
            'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600',
            'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=600',
            'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=600',
        ],
    },
    {
        keywords: ['soup', 'stew', 'broth', 'chowder', 'bisque', 'ramen', 'pho'],
        urls: [
            'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600',
            'https://images.unsplash.com/photo-1603105037880-880cd4f0647d?w=600',
            'https://images.unsplash.com/photo-1588566565463-180a5b2090d2?w=600',
            'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=600',
        ],
    },
    {
        keywords: ['burger', 'hamburger', 'cheeseburger', 'sandwich'],
        urls: [
            'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
            'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600',
            'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600',
        ],
    },
    {
        keywords: ['pizza', 'flatbread', 'calzone'],
        urls: [
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
            'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600',
            'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=600',
        ],
    },
    {
        keywords: ['rice', 'fried rice', 'risotto', 'biryani', 'pilaf', 'nasi'],
        urls: [
            'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600',
            'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600',
            'https://images.unsplash.com/photo-1645696301019-35adcc988950?w=600',
        ],
    },
    {
        keywords: ['steak', 'beef', 'wagyu', 'ribeye', 'sirloin', 'tenderloin', 'filet'],
        urls: [
            'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600',
            'https://images.unsplash.com/photo-1558030006-450675393462?w=600',
            'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=600',
        ],
    },
    {
        keywords: ['fish', 'salmon', 'tuna', 'cod', 'seafood', 'shrimp', 'prawn', 'lobster', 'crab', 'sushi', 'sashimi'],
        urls: [
            'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600',
            'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600',
            'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=600',
            'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600',
        ],
    },
    {
        keywords: ['cake', 'dessert', 'pastry', 'brownie', 'cupcake', 'cheesecake', 'mousse', 'tiramisu'],
        urls: [
            'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
            'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600',
            'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600',
        ],
    },
    {
        keywords: ['cookie', 'biscuit', 'macaron', 'donut', 'doughnut', 'croissant', 'waffle', 'pancake'],
        urls: [
            'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600',
            'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600',
            'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
        ],
    },
    {
        keywords: ['smoothie', 'shake', 'juice', 'drink', 'cocktail', 'lemonade'],
        urls: [
            'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600',
            'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=600',
            'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600',
        ],
    },
    {
        keywords: ['taco', 'burrito', 'quesadilla', 'enchilada', 'nachos', 'mexican'],
        urls: [
            'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600',
            'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600',
            'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=600',
        ],
    },
    {
        keywords: ['curry', 'masala', 'tikka', 'tandoori', 'indian', 'dal', 'korma', 'vindaloo'],
        urls: [
            'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600',
            'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
            'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600',
        ],
    },
    {
        keywords: ['noodle', 'ramen', 'udon', 'lo mein', 'pad thai', 'stir fry', 'wok', 'asian'],
        urls: [
            'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600',
            'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600',
            'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600',
        ],
    },
    {
        keywords: ['bread', 'toast', 'sourdough', 'baguette', 'focaccia', 'roll'],
        urls: [
            'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',
            'https://images.unsplash.com/photo-1549931319-a545753467c8?w=600',
            'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600',
        ],
    },
    {
        keywords: ['egg', 'omelette', 'scrambled', 'poached', 'frittata', 'breakfast'],
        urls: [
            'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600',
            'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600',
            'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600',
        ],
    },
    {
        keywords: ['vegetable', 'veggie', 'roasted', 'grilled', 'steamed', 'vegan', 'plant-based'],
        urls: [
            'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600',
            'https://images.unsplash.com/photo-1540914124281-342587941389?w=600',
            'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600',
        ],
    },
    {
        keywords: ['wrap', 'spring roll', 'dumpling', 'gyoza', 'empanada', 'samosa', 'dim sum'],
        urls: [
            'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600',
            'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600',
            'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600',
        ],
    },
];

// Fallback images for when no keyword matches
const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600',
];

/**
 * Get a relevant food image URL based on a recipe title.
 * Matches keywords in the title to curated Unsplash photos.
 */
export const getFoodImage = (title: string): string => {
    const lowerTitle = title.toLowerCase();

    for (const entry of FOOD_IMAGE_MAP) {
        for (const keyword of entry.keywords) {
            if (lowerTitle.includes(keyword)) {
                // Pick a random URL from this category
                return entry.urls[Math.floor(Math.random() * entry.urls.length)];
            }
        }
    }

    // No match — return a random fallback
    return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
};
