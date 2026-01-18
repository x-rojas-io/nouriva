-- 1. Grant Permissions (Fixes 42501 'Grant' issues)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.profiles TO anon, authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;

-- 2. Ensure Schema Exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'standard';

-- 3. Backfill Missing Profiles (Fixes 'User exists but Profile missing' issue)
-- This is critical for users who signed up before the trigger existed or when it was broken.
INSERT INTO public.profiles (id, email, role, subscription_status)
SELECT id, email, 'standard', 'free'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. Reset & Fix RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow INSERT (Fallback)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow UPDATE
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow SELECT
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 5. Helper Function & Trigger for FUTURE users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, subscription_status)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'standard', 
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
