import { supabase } from '@/lib/supabase';




const BUCKET = 'recipe-images';

/**
 * Upload a file to Supabase Storage.
 * Returns the public URL on success.
 *
 * Usage:
 *   const url = await uploadImage(file, 'covers');
 *   const url = await uploadImage(file, 'steps');
 *   const url = await uploadImage(file, 'avatars');
 */
export async function uploadImage(
    file: File,
    folder: string = 'general'
): Promise<string> {
    // Create a unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const path = `${folder}/${timestamp}-${random}.${ext}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) throw error;

    const { data } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

    return data.publicUrl;
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
