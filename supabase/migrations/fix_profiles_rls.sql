-- Ensure PROFILES table exists (it should, but safety first)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user',
  subscription_status TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow new users (service role/trigger) to insert
-- (Usually handled by handle_new_user trigger, but good to have policy if needed for valid users?)
-- Generally profiles are created by Trigger.
