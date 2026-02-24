/**
 * Video thumbnail generation utilities
 */

/**
 * Generate a thumbnail from a video file at specified timestamp
 * @param file - The video file
 * @param seekTo - Timestamp in seconds to capture thumbnail (default: 1 second)
 * @param format - Output format ('jpeg' or 'webp')
 * @param quality - Image quality (0-1)
 * @returns Data URL of the thumbnail
 */
export async function generateVideoThumbnail(
  file: File,
  seekTo: number = 1.0,
  format: 'jpeg' | 'webp' = 'jpeg',
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Seek to specified timestamp
      video.currentTime = Math.min(seekTo, video.duration);
    };

    video.onseeked = () => {
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL(
        format === 'webp' ? 'image/webp' : 'image/jpeg',
        quality
      );

      // Cleanup
      URL.revokeObjectURL(objectUrl);
      video.remove();

      resolve(dataUrl);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
      reject(new Error('Failed to load video'));
    };

    video.src = objectUrl;
  });
}

/**
 * Generate a thumbnail as a Blob instead of data URL
 */
export async function generateVideoThumbnailBlob(
  file: File,
  seekTo: number = 1.0,
  format: 'jpeg' | 'webp' = 'jpeg',
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = Math.min(seekTo, video.duration);
    };

    video.onseeked = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          video.remove();

          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          resolve(blob);
        },
        format === 'webp' ? 'image/webp' : 'image/jpeg',
        quality
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
      reject(new Error('Failed to load video'));
    };

    video.src = objectUrl;
  });
}

/**
 * Generate multiple thumbnails from a video at different timestamps
 * Useful for creating a thumbnail strip or preview gallery
 */
export async function generateMultipleThumbnails(
  file: File,
  count: number = 3,
  format: 'jpeg' | 'webp' = 'jpeg',
  quality: number = 0.7
): Promise<string[]> {
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;

  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const thumbnails: string[] = [];

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const duration = video.duration;
      const interval = duration / (count + 1);

      try {
        for (let i = 1; i <= count; i++) {
          const timestamp = interval * i;
          await seekToTimestamp(video, timestamp);

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL(
            format === 'webp' ? 'image/webp' : 'image/jpeg',
            quality
          );
          thumbnails.push(dataUrl);
        }

        URL.revokeObjectURL(objectUrl);
        video.remove();
        resolve(thumbnails);
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        video.remove();
        reject(error);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
      reject(new Error('Failed to load video'));
    };

    video.src = objectUrl;
  });
}

/**
 * Helper function to seek video to a specific timestamp
 */
function seekToTimestamp(video: HTMLVideoElement, timestamp: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const seekHandler = () => {
      video.removeEventListener('seeked', seekHandler);
      resolve();
    };

    const errorHandler = () => {
      video.removeEventListener('error', errorHandler);
      reject(new Error('Failed to seek video'));
    };

    video.addEventListener('seeked', seekHandler);
    video.addEventListener('error', errorHandler);
    video.currentTime = timestamp;
  });
}

/**
 * Get video metadata (duration, dimensions, etc.)
 */
export async function getVideoMetadata(
  file: File
): Promise<{
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      const metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight,
      };

      URL.revokeObjectURL(objectUrl);
      video.remove();
      resolve(metadata);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
      reject(new Error('Failed to load video metadata'));
    };

    video.src = objectUrl;
  });
}

/**
 * Check if a video file is valid and can be played
 */
export async function isValidVideoFile(file: File): Promise<boolean> {
  try {
    await getVideoMetadata(file);
    return true;
  } catch {
    return false;
  }
}
