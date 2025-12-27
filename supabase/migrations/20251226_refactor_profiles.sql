-- Refactor profiles for Newsletter-based access
-- 1. Remove unused Stripe field
ALTER TABLE profiles DROP COLUMN IF EXISTS stripe_customer_id;

-- 2. Add Name field for personalized newsletter
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
