-- 1. Clean up valid email duplicates if any (keeping the latest one or the one matching auth?)
-- Since user said they deleted all except admin, we just proceed with constraint.

-- 2. Add Unique Constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_key;
ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- 3. Set Admin Role for Nestor
UPDATE profiles 
SET role = 'admin', subscription_status = 'active'
WHERE email = 'nestor.rojas@live.com';

-- 4. Set Standard Role for everyone else
UPDATE profiles 
SET role = 'standard' 
WHERE email != 'nestor.rojas@live.com';

-- 5. Ensure Trigger handles Conflict and Defaults correctly
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
  ON CONFLICT (id) DO NOTHING; -- If ID exists, do nothing
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger Definition (Safe Re-create)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
