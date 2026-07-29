-- Add created_by column to recipes referencing profiles
alter table public.recipes add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- Add preferences column to profiles
alter table public.profiles add column if not exists preferences jsonb default '{"favorite_ingredients": []}'::jsonb;
