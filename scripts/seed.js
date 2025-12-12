import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars manually since we don't have dotenv packages installed and it's a one-off script
const SUPABASE_URL = 'https://yczlggjrtvnimignprjd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljemxnZ2pydHZuaW1pZ25wcmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MDY4NzYsImV4cCI6MjA4MTA4Mjg3Nn0.-30ZU8a25gBiGCe2VFqA-ENbYqfLxt0o94a0jgqE2fM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seed() {
  console.log('Starting migration...');

  // Read Recipes
  const recipesPath = path.join(__dirname, 'data', 'recipes.json');
  const recipesData = JSON.parse(fs.readFileSync(recipesPath, 'utf-8'));

  // Read Snacks
  const snacksPath = path.join(__dirname, 'data', 'snacks.json');
  const snacksData = JSON.parse(fs.readFileSync(snacksPath, 'utf-8'));

  // Transform Recipes
  const formattedRecipes = recipesData.map(r => ({
    old_id: r.id,
    name: r.name,
    type: r.type || 'breakfast', // Default to breakfast if missing, based on file analysis specific to 'recipes.json' usually being breakfast? Or check file content. The file command earlier showed "type": "breakfast" in recipes.json.
    image: r.image,
    ingredients: r.ingredients,
    steps: r.steps,
    macros: r.macros, // Might be undefined in some
    tags: r.tags // Might be undefined
  }));

  // Transform Snacks
  const formattedSnacks = snacksData.map(s => ({
    old_id: s.id,
    name: s.name,
    type: 'snack', // Explicitly set type to snack
    image: s.image,
    ingredients: s.ingredients,
    steps: s.steps,
    macros: s.macros,
    tags: s.tags
  }));

  const allData = [...formattedRecipes, ...formattedSnacks];

  console.log(`Prepared ${allData.length} records to insert.`);
  
  const { data, error } = await supabase
    .from('recipes')
    .insert(allData)
    .select();

  if (error) {
    console.error('Error inserting data:', error);
  } else {
    console.log('Success! Data inserted.');
  }
}

seed();
