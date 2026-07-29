-- Add constraints to recipes table to ensure data structure safety
alter table public.recipes add constraint check_recipe_name_not_empty check (length(trim(name)) > 0);
alter table public.recipes add constraint check_recipe_steps_not_empty check (cardinality(steps) > 0);
alter table public.recipes add constraint check_recipe_ingredients_not_empty check (ingredients is not null and ingredients != '{}'::jsonb);
