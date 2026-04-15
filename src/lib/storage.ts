import { supabase } from '@/lib/supabase';
import { autoCompressIfNeeded, formatBytes } from '@/utils/imageOptimization';

const BUCKET = 'recipe-images';

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB (Supabase free tier limit)

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

/**
 * Upload a file (image or video) to Supabase Storage.
 * Returns the public URL on success.
 *
 * Usage:
 *   const url = await uploadImage(file, 'covers');
 *   const url = await uploadImage(file, 'steps');
 *   const url = await uploadImage(file, 'avatars', (progress) => console.log(progress));
 */
export async function uploadImage(
    file: File,
    folder: string = 'general',
    onProgress?: (progress: UploadProgress) => void
): Promise<string> {
    // Validate file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
        throw new Error(`File type ${file.type} not supported. Please upload an image or video file.`);
    }

    // Validate file size
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / 1024 / 1024);
        const fileSizeMB = Math.round(file.size / 1024 / 1024);
        throw new Error(`File too large (${fileSizeMB}MB). Max size for ${isVideo ? 'videos' : 'images'} is ${maxSizeMB}MB.`);
    }

    // Create a unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const path = `${folder}/${timestamp}-${random}.${ext}`;

    // Simulate progress for user feedback (Supabase SDK doesn't provide native progress)
    let progressInterval: NodeJS.Timeout | null = null;
    if (onProgress) {
        let simulatedProgress = 0;
        progressInterval = setInterval(() => {
            simulatedProgress = Math.min(simulatedProgress + 10, 90);
            onProgress({
                loaded: (file.size * simulatedProgress) / 100,
                total: file.size,
                percentage: simulatedProgress,
            });
        }, 200);
    }

    try {
        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) throw error;

        // Complete progress
        if (onProgress) {
            onProgress({
                loaded: file.size,
                total: file.size,
                percentage: 100,
            });
        }

        const { data } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(path);

        return data.publicUrl;
    } finally {
        if (progressInterval) {
            clearInterval(progressInterval);
        }
    }
}

/**
 * Delete an image from Supabase Storage by its public URL.
 */
export async function deleteImage(publicUrl: string): Promise<void> {
    // Extract the path from the URL
    const marker = `/object/public/${BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;

    const path = publicUrl.substring(idx + marker.length);
    const { error } = await supabase.storage
        .from(BUCKET)
        .remove([path]);

    if (error) throw error;
}

/**
 * Upload an image with automatic optimization (compression, resizing, format conversion).
 * Automatically compresses images over 2MB before upload.
 * Returns the public URL and compression info.
 */
export async function uploadOptimizedImage(
    file: File,
    folder: string = 'general',
    onProgress?: (progress: UploadProgress & { message?: string }) => void
): Promise<{ url: string; wasCompressed: boolean; originalSize: number; finalSize: number }> {
    // Validate file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    if (!isImage) {
        throw new Error(`File type ${file.type} not supported. Please upload an image file.`);
    }

    // Auto-compress if needed (>2MB threshold)
    if (onProgress) {
        onProgress({
            loaded: 0,
            total: file.size,
            percentage: 0,
            message: 'Optimizing image...'
        });
    }

    const { file: optimizedFile, wasCompressed, originalSize, newSize } = await autoCompressIfNeeded(file, 2);

    if (wasCompressed && onProgress) {
        const savings = formatBytes(originalSize - newSize);
        onProgress({
            loaded: 0,
            total: newSize,
            percentage: 10,
            message: `Compressed! Saved ${savings}`
        });
    }

    // Convert Blob to File if needed
    const fileToUpload = optimizedFile instanceof Blob && !(optimizedFile instanceof File)
        ? new File([optimizedFile], file.name, { type: 'image/webp' })
        : optimizedFile as File;

    // Upload the optimized image
    const url = await uploadImage(fileToUpload, folder, onProgress);

    return {
        url,
        wasCompressed,
        originalSize,
        finalSize: newSize
    };
}
