/**
 * Accessibility utilities and helpers
 */

/**
 * Common ARIA labels for recipe app actions
 */
export const ARIA_LABELS = {
  // Navigation
  HOME: 'Navigate to home',
  EXPLORE: 'Navigate to explore recipes',
  SAVED: 'Navigate to saved recipes',
  PROFILE: 'Navigate to profile',
  BACK: 'Go back',

  // Actions
  FAVORITE: 'Add to favorites',
  UNFAVORITE: 'Remove from favorites',
  SHARE: 'Share recipe',
  ADD_TO_GROCERY: 'Add ingredients to grocery list',
  START_COOKING: 'Start cooking mode',
  RATE_RECIPE: 'Rate this recipe',
  FOLLOW: 'Follow chef',
  UNFOLLOW: 'Unfollow chef',

  // Media
  PLAY_VIDEO: 'Play video',
  PAUSE_VIDEO: 'Pause video',
  NEXT_IMAGE: 'Next image',
  PREVIOUS_IMAGE: 'Previous image',
  CLOSE_GALLERY: 'Close gallery',

  // Forms
  SEARCH: 'Search recipes',
  FILTER: 'Filter recipes',
  SUBMIT: 'Submit form',
  CANCEL: 'Cancel',

  // Cooking
  START_TIMER: 'Start timer',
  NEXT_STEP: 'Next cooking step',
  PREVIOUS_STEP: 'Previous cooking step',
  VIEW_INGREDIENTS: 'View ingredients',

  // Menu
  OPEN_MENU: 'Open menu',
  CLOSE_MENU: 'Close menu',
  MORE_OPTIONS: 'More options',
} as const;

/**
 * Get ARIA label for a favorite button based on state
 */
export function getFavoriteAriaLabel(isFavorite: boolean): string {
  return isFavorite ? ARIA_LABELS.UNFAVORITE : ARIA_LABELS.FAVORITE;
}

/**
 * Get ARIA label for a follow button based on state
 */
export function getFollowAriaLabel(isFollowing: boolean): string {
  return isFollowing ? ARIA_LABELS.UNFOLLOW : ARIA_LABELS.FOLLOW;
}

/**
 * Trap focus within a modal or dialog
 * @param element - The container element to trap focus within
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announce a message to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Handle keyboard navigation for a list
 * @param currentIndex - Current focused index
 * @param totalItems - Total number of items
 * @param key - Keyboard key pressed
 * @returns New index to focus, or null if no change
 */
export function handleListNavigation(
  currentIndex: number,
  totalItems: number,
  key: string
): number | null {
  switch (key) {
    case 'ArrowDown':
    case 'Down':
      return currentIndex < totalItems - 1 ? currentIndex + 1 : currentIndex;
    case 'ArrowUp':
    case 'Up':
      return currentIndex > 0 ? currentIndex - 1 : currentIndex;
    case 'Home':
      return 0;
    case 'End':
      return totalItems - 1;
    default:
      return null;
  }
}

/**
 * Format time for screen readers (e.g., "30m" -> "30 minutes")
 */
export function formatTimeForScreenReader(time: string): string {
  const match = time.match(/(\d+)([mh])/);
  if (!match) return time;

  const [, value, unit] = match;
  const unitName = unit === 'h' ? 'hour' : 'minute';
  const plural = parseInt(value) !== 1 ? 's' : '';

  return `${value} ${unitName}${plural}`;
}

/**
 * Format rating for screen readers (e.g., "4.5" -> "Rated 4.5 out of 5 stars")
 */
export function formatRatingForScreenReader(rating: number): string {
  return `Rated ${rating} out of 5 stars`;
}

/**
 * Get skip link text for screen readers
 */
export function getSkipLinkText(target: string): string {
  return `Skip to ${target}`;
}

/**
 * Ensure contrast ratio meets WCAG AA standards (4.5:1 for normal text)
 * @param foreground - Foreground color in hex
 * @param background - Background color in hex
 * @returns Whether contrast ratio is sufficient
 */
export function hasGoodContrast(foreground: string, background: string): boolean {
  const getRGB = (hex: string) => {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  };

  const getLuminance = (rgb: { r: number; g: number; b: number }) => {
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const fg = getRGB(foreground);
  const bg = getRGB(background);

  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);

  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return ratio >= 4.5; // WCAG AA standard for normal text
}
