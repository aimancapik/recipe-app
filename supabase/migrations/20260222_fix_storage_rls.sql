-- Migration: Setup Storage Bucket and RLS Policies
-- Run this in your Supabase SQL Editor

-- 1. Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Clear existing policies for this bucket to avoid conflicts (optional but safer)
-- DELETE FROM storage.policies WHERE bucket_id = 'recipe-images';

-- 3. Allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'recipe-images' );

-- 4. Allow authenticated users to upload images
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'recipe-images' );

-- 5. Allow authenticated users to update/delete their own images
-- Note: This is a simplified policy for easy development.
-- In production, you might want to restrict this further.
CREATE POLICY "Authenticated Manage"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'recipe-images' )
WITH CHECK ( bucket_id = 'recipe-images' );
