/**
 * Image optimization utilities for resizing, compression, and format conversion
 */

export interface ImageSize {
  width: number;
  height: number;
  quality: number;
  suffix: string; // e.g., 'thumb', 'medium', 'large'
}

// Predefined image sizes for responsive images
export const IMAGE_SIZES: Record<string, ImageSize> = {
  thumbnail: { width: 200, height: 200, quality: 0.7, suffix: 'thumb' },
  small: { width: 400, height: 400, quality: 0.8, suffix: 'small' },
  medium: { width: 800, height: 800, quality: 0.85, suffix: 'medium' },
  large: { width: 1280, height: 1280, quality: 0.9, suffix: 'large' },
};

/**
 * Compress and resize an image to specified dimensions
 */
export async function optimizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.85,
  outputFormat: 'webp' | 'jpeg' = 'webp'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        if (width > height) {
          width = maxWidth;
          height = width / aspectRatio;
        } else {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          resolve(blob);
        },
        outputFormat === 'webp' ? 'image/webp' : 'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

/**
 * Generate multiple optimized versions of an image (thumbnail, small, medium, large)
 * Returns a map of size name to Blob
 */
export async function generateImageVariants(
  file: File,
  sizes: ImageSize[] = Object.values(IMAGE_SIZES)
): Promise<Map<string, Blob>> {
  const variants = new Map<string, Blob>();

  for (const size of sizes) {
    try {
      const optimized = await optimizeImage(
        file,
        size.width,
        size.height,
        size.quality,
        'webp'
      );
      variants.set(size.suffix, optimized);
    } catch (error) {
      console.error(`Failed to generate ${size.suffix} variant:`, error);
      // Continue with other sizes even if one fails
    }
  }

  return variants;
}

/**
 * Check if browser supports WebP format
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webpData = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    const img = new Image();
    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    img.src = webpData;
  });
}

/**
 * Convert image to WebP with JPEG fallback for unsupported browsers
 */
export async function convertToOptimalFormat(
  file: File,
  maxWidth: number = 1280,
  maxHeight: number = 1280,
  quality: number = 0.85
): Promise<{ blob: Blob; format: 'webp' | 'jpeg' }> {
  const webpSupported = await supportsWebP();
  const format = webpSupported ? 'webp' : 'jpeg';
  const blob = await optimizeImage(file, maxWidth, maxHeight, quality, format);

  return { blob, format };
}

/**
 * Calculate the estimated file size reduction
 */
export function getCompressionRatio(originalSize: number, compressedSize: number): number {
  return ((originalSize - compressedSize) / originalSize) * 100;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Create a blur placeholder from an image (tiny low-quality version for progressive loading)
 */
export async function createBlurPlaceholder(file: File): Promise<string> {
  const blob = await optimizeImage(file, 40, 40, 0.3, 'jpeg');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Validate if file is a valid image
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(file.type) && file.size > 0;
}

/**
 * Auto-compress image if it exceeds threshold
 */
export async function autoCompressIfNeeded(
  file: File,
  thresholdMB: number = 2
): Promise<{ file: File | Blob; wasCompressed: boolean; originalSize: number; newSize: number }> {
  const thresholdBytes = thresholdMB * 1024 * 1024;

  if (file.size <= thresholdBytes) {
    return {
      file,
      wasCompressed: false,
      originalSize: file.size,
      newSize: file.size,
    };
  }

  // Compress the image
  const { blob, format } = await convertToOptimalFormat(file, 1280, 1280, 0.85);

  return {
    file: blob,
    wasCompressed: true,
    originalSize: file.size,
    newSize: blob.size,
  };
}
