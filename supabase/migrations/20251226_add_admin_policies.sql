-- Add INSERT, UPDATE, DELETE policies for recipes table
-- Currently only SELECT is allowed (by 20251213_init_schema.sql)

-- Helper to check if user is admin or hardcoded email
-- 1. INSERT Policy
DROP POLICY IF EXISTS "Admins can insert recipes" ON recipes;
CREATE POLICY "Admins can insert recipes" ON recipes
FOR INSERT
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  auth.jwt() ->> 'email' = 'nestor.rojas@live.com'
);

-- 2. UPDATE Policy
DROP POLICY IF EXISTS "Admins can update recipes" ON recipes;
CREATE POLICY "Admins can update recipes" ON recipes
FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  auth.jwt() ->> 'email' = 'nestor.rojas@live.com'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  auth.jwt() ->> 'email' = 'nestor.rojas@live.com'
);

-- 3. DELETE Policy
DROP POLICY IF EXISTS "Admins can delete recipes" ON recipes;
CREATE POLICY "Admins can delete recipes" ON recipes
FOR DELETE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  auth.jwt() ->> 'email' = 'nestor.rojas@live.com'
);

