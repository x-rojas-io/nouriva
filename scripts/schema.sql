-- Create the recipes table
create table public.recipes (
  id uuid default gen_random_uuid() primary key,
  old_id text, -- references original JSON id
  name text not null,
  type text not null, -- 'breakfast', 'snack'
  image text,
  ingredients jsonb,
  steps text[],
  macros jsonb,
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.recipes enable row level security;

-- Create a policy that allows read access to everyone
create policy "Enable read access for all users"
on public.recipes
for select
to anon
using (true);

-- Create a policy that allows insert/update/delete for authenticated service roles (if needed) or just skip for now as we might use the service key or just insert via dashboard if this blocks.
-- Actually for the seed script with the anon key, we need a policy allowing insert, OR we suggest the user uses the service_role key for the seed script, OR we adding a temporary insert policy for anon (dangerous).
-- improved plan: Use the service key for seeding? The user only gave Anon key.
-- If I only have Anon key, I must allow INSERT for anon temporarily or permanently.
-- Let's add a policy allowing insert for Anon for migration purposes, and warn the user to delete it later.
create policy "Enable insert for everyone (TEMPORARY)"
on public.recipes
for insert
to anon
with check (true);
