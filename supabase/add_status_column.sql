-- Migration: Add status column to recipes table
-- Run this in your Supabase SQL Editor

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published' 
CHECK (status IN ('published', 'draft'));

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes(status);
