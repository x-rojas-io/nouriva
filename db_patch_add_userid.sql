-- PATCH: Add user_id to recipes to allow personalized saving
-- Run this in your Supabase SQL Editor

ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Policy to allow users to see their own recipes or public ones
DROP POLICY IF EXISTS "Public recipes are viewable by everyone" ON public.recipes;

CREATE POLICY "Users can see own recipes and public ones" 
ON public.recipes 
FOR SELECT 
USING (
    auth.uid() = user_id 
    OR 
    user_id IS NULL -- System recipes
);

-- Policy to allow users to insert their own recipes
CREATE POLICY "Users can create their own recipes" 
ON public.recipes 
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id
);

-- Policy to allow users to update their own recipes
CREATE POLICY "Users can update their own recipes" 
ON public.recipes 
FOR UPDATE 
USING (
    auth.uid() = user_id
);
