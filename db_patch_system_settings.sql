-- Create system_settings table if it doesn't exist
create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.system_settings enable row level security;

-- Allow select access (read) to everyone (including anonymous guests)
create policy "Allow select access to everyone"
on public.system_settings
for select
to anon
using (true);

-- Allow update access to everyone (including anonymous guests) but ONLY for the 'gemini_model' key
create policy "Allow update access to everyone for gemini_model"
on public.system_settings
for update
to anon
using (key = 'gemini_model')
with check (key = 'gemini_model');

-- Seed the initial model name
insert into public.system_settings (key, value)
values ('gemini_model', '"gemini-3.5-flash"')
on conflict (key) do nothing;
