/**
 * Simple food image generator/selector
 * In a real app, this might call an Unsplash API or a DALL-E endpoint.
 * For now, it returns curated Unsplash images based on keywords.
 */

const FOOD_QUERY_MAP: Record<string, string> = {
    'ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    'nasi': 'https://images.unsplash.com/photo-1601315379734-22551068827a?w=800',
    'pasta': 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=800',
    'salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    'chicken': 'https://images.unsplash.com/photo-1532550907401-aefe7d0e9fe9?w=800',
    'steak': 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?w=800',
    'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    'dessert': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800',
    'soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800';

export const getFoodImage = (query: string): string => {
    const q = query.toLowerCase();

    // Check if any key exists in the query
    for (const [key, url] of Object.entries(FOOD_QUERY_MAP)) {
        if (q.includes(key)) return url;
    }

    // Default to a professional food shot
    return DEFAULT_IMAGE;
};
