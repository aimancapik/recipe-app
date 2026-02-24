import { Recipe } from '@/types';

/**
 * Share a recipe using the Web Share API (if available) or fallback to copy link
 */
export async function shareRecipe(recipe: Recipe): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'none' }> {
  const shareData = {
    title: recipe.title,
    text: `Check out this delicious recipe: ${recipe.title}${recipe.description ? ` - ${recipe.description}` : ''}`,
    url: getRecipeUrl(recipe.id),
  };

  // Try native Web Share API first (mobile devices)
  if (navigator.share && canShareNatively(shareData)) {
    try {
      await navigator.share(shareData);
      return { success: true, method: 'native' };
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name === 'AbortError') {
        return { success: false, method: 'none' };
      }
      console.error('Error sharing:', error);
    }
  }

  // Fallback to copying link to clipboard
  try {
    await copyToClipboard(shareData.url);
    return { success: true, method: 'clipboard' };
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return { success: false, method: 'none' };
  }
}

/**
 * Copy recipe link to clipboard
 */
export async function copyRecipeLink(recipeId: string): Promise<boolean> {
  const url = getRecipeUrl(recipeId);
  return copyToClipboard(url);
}

/**
 * Generate shareable recipe URL
 */
export function getRecipeUrl(recipeId: string): string {
  // In production, this would be your actual domain
  // For now, use the current origin
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/recipe/${recipeId}`;
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    textArea.remove();

    return successful;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Check if native sharing is supported
 */
function canShareNatively(data: ShareData): boolean {
  if (!navigator.share) return false;

  try {
    // Check if the data can be shared (some browsers have restrictions)
    return navigator.canShare ? navigator.canShare(data) : true;
  } catch {
    return false;
  }
}

/**
 * Share to specific social media platform
 */
export function shareToSocialMedia(recipe: Recipe, platform: 'facebook' | 'twitter' | 'whatsapp'): void {
  const url = getRecipeUrl(recipe.id);
  const text = `Check out this recipe: ${recipe.title}`;

  let shareUrl = '';

  switch (platform) {
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      break;
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      break;
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
      break;
  }

  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
}

/**
 * Generate a shareable recipe card image URL (placeholder for future implementation)
 * This would ideally use a service to generate a pretty image with recipe details
 */
export function generateRecipeCardImage(recipe: Recipe): string {
  // For now, just return the recipe image
  // In the future, this could call a serverless function to generate
  // a styled card with recipe title, image, rating, etc.
  return recipe.image || '';
}
