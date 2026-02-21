-- Migration: Add images column to recipes table
-- Run this in your Supabase SQL Editor

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- Refresh the PostgREST schema cache (optional, usually automatic)
NOTIFY pgrst, 'reload schema';
