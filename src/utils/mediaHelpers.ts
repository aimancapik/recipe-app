/**
 * Media Helper Utilities
 * Provides robust detection and handling of media types (images, videos)
 */

/**
 * Checks if a URL points to a video based on file extension and known video services
 * @param url - The URL to check
 * @returns true if the URL is likely a video
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;

  const lowerUrl = url.toLowerCase();

  // Check for video file extensions
  const videoExtensions = /\.(mp4|webm|ogg|mov|m4v|avi|wmv|flv|mkv)(\?|$)/i;
  if (videoExtensions.test(lowerUrl)) return true;

  // Check for video service URLs
  const videoServices = [
    'youtube.com',
    'youtu.be',
    'vimeo.com',
    'dailymotion.com',
    'twitch.tv',
    'facebook.com/watch',
    'instagram.com/p',
    'tiktok.com'
  ];

  return videoServices.some(service => lowerUrl.includes(service));
}

/**
 * Normalizes a video URL, converting YouTube shorts to standard watch URLs
 * to ensure better compatibility with video players like ReactPlayer.
 * @param url - The original URL
 * @returns The normalized URL
 */
export function getNormalizedVideoUrl(url: string): string {
  if (!url) return '';
  
  // Convert YouTube shorts to regular watch URLs
  const shortsMatch = url.match(/(?:youtube\.com\/shorts\/)([^&?/]+)/);
  if (shortsMatch) {
    return `https://www.youtube.com/watch?v=${shortsMatch[1]}`;
  }
  
  // Encode spaces in URLs (fixes issues with Supabase storage URLs in ReactPlayer)
  return url.replace(/ /g, '%20');
}

/**
 * Checks if a URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

/**
 * Extracts the thumbnail image URL from a YouTube URL
 */
export function getYouTubeThumbnail(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?/]+)/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  return null;
}

/**
 * Checks if a File object is a video based on MIME type
 * @param file - The File object to check
 * @returns true if the file is a video
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Determines the media type of a URL or File
 * @param media - URL string or File object
 * @returns 'video' or 'image'
 */
export function getMediaType(media: string | File): 'image' | 'video' {
  if (typeof media === 'string') {
    return isVideoUrl(media) ? 'video' : 'image';
  }
  return isVideoFile(media) ? 'video' : 'image';
}

/**
 * Validates if a URL is a valid media URL (not empty, not placeholder)
 * @param url - The URL to validate
 * @returns true if the URL is valid
 */
export function isValidMediaUrl(url: string): boolean {
  if (!url) return false;

  const invalidPatterns = [
    'placeholder',
    'data:image/gif;base64,R0lGODlhAQAB', // 1x1 transparent GIF
    'about:blank'
  ];

  return !invalidPatterns.some(pattern => url.includes(pattern));
}

/**
 * Gets the file extension from a URL or filename
 * @param url - The URL or filename
 * @returns The file extension (without dot) or empty string
 */
export function getFileExtension(url: string): string {
  const match = url.match(/\.([a-z0-9]+)(\?|$)/i);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Checks if a file size exceeds a given limit
 * @param file - The File object
 * @param limitMB - Size limit in megabytes
 * @returns true if file exceeds limit
 */
export function exceedsSizeLimit(file: File, limitMB: number): boolean {
  const limitBytes = limitMB * 1024 * 1024;
  return file.size > limitBytes;
}

/**
 * Formats file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}
