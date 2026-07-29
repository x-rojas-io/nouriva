-- Create policy to allow authenticated users to insert new recipes
create policy "Authenticated users can insert recipes"
on public.recipes
for insert
to authenticated
with check (true);
