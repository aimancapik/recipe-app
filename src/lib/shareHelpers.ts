import { Recipe } from '@/types';
import { isVideoUrl } from '@/utils/mediaHelpers';
import { generateVideoThumbnailFromUrl } from '@/lib/videoThumbnail';

/**
 * Share a recipe using the Web Share API (if available) or fallback to copy link
 */
export async function shareRecipe(recipe: Recipe): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'none' }> {
  const url = getRecipeUrl(recipe.id);
  const shareData: ShareData = {
    title: recipe.title,
    text: `Check out this delicious recipe: ${recipe.title}${recipe.description ? ` - ${recipe.description}` : ''}`,
    url: url,
  };

  // Try to include image/thumbnail if available
  let imageFile: File | null = null;
  const coverUrl = recipe.image;

  if (coverUrl) {
    try {
      if (isVideoUrl(coverUrl)) {
        // Handle Video Thumbnail
        const youtubeId = getYouTubeId(coverUrl);
        const thumbnailUrl = youtubeId
          ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
          : await generateVideoThumbnailFromUrl(coverUrl).catch(() => null);

        if (thumbnailUrl) {
          imageFile = await fetchUrlAsFile(thumbnailUrl, 'recipe-thumbnail.jpg');
        }
      } else {
        // Handle direct image
        imageFile = await fetchUrlAsFile(coverUrl, 'recipe-image.jpg');
      }
    } catch (err) {
      console.warn('Failed to prepare share image:', err);
    }
  }

  // Add files to shareData if supported
  if (imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
    shareData.files = [imageFile];
  }

  // Try native Web Share API first
  if (navigator.share && canShareNatively(shareData)) {
    try {
      await navigator.share(shareData);
      return { success: true, method: 'native' };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return { success: false, method: 'none' };
      }
      console.error('Error sharing:', error);
    }
  }

  // Fallback to clipboard
  try {
    const success = await copyToClipboard(url);
    return { success, method: success ? 'clipboard' : 'none' };
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return { success: false, method: 'none' };
  }
}

/**
 * Fetch a URL and convert it to a File object
 */
async function fetchUrlAsFile(url: string, fileName: string): Promise<File | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const extension = blob.type.split('/')[1] || 'jpg';
    const finalFileName = fileName.endsWith(`.${extension}`) ? fileName : `${fileName.split('.')[0]}.${extension}`;
    return new File([blob], finalFileName, { type: blob.type });
  } catch (err) {
    console.error('fetchUrlAsFile failed:', err);
    return null;
  }
}

/**
 * Extract YouTube ID from URL
 */
function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
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
