-- Add description column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS description TEXT;
