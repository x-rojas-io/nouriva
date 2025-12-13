-- Create recipes table if it doesn't exist (idempotent check)
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    old_id TEXT, -- To keep track of JSON ids
    type TEXT,
    name TEXT,
    image TEXT,
    ingredients JSONB,
    steps JSONB,
    macros JSONB,
    tags JSONB[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add is_premium column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'is_premium') THEN
        ALTER TABLE recipes ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to all recipes (initially)
-- You might want to restrict 'is_premium' rows later, but for now we make everything visible or handle it in app logic
CREATE POLICY "Public recipes are viewable by everyone" ON recipes
    FOR SELECT USING (true);


-- STORAGE BUCKET SETUP

-- Create a new private bucket called 'images'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public access to view images
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- Policy: Allow authenticated users (like our seeder if using service role, or authenticated users) to upload?
-- For the migration script, we usually use the SERVICE_ROLE_KEY which bypasses RLS, so explicit upload policy might not be strictly needed for the script if using Service Key.
-- But if using Anon key with specific permissions, we need policies.
-- Let's assume the migration script might use a powerful key or we allow inserts for now.
-- Ideally, only admins should upload. Let's start with public read.
