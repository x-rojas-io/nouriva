import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Use environment variables for secrets in production
const SUPABASE_URL = 'https://yczlggjrtvnimignprjd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'PLACEHOLDER_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seed() {
  console.log('Starting migration...');

  // Read Migrated Data (Result of migrate_images.js)
  const migratedDataPath = path.join(__dirname, 'data', 'migrated_data.json');

  if (!fs.existsSync(migratedDataPath)) {
    console.error('Error: migrated_data.json not found. Run "node scripts/migrate_images.js" first.');
    return;
  }

  const allData = JSON.parse(fs.readFileSync(migratedDataPath, 'utf-8'));

  console.log(`Prepared ${allData.length} records to insert.`);

  // Clean up format if needed, but migrate_images.js should have formatted it.
  // We can do a final sanity check map if we want to ensure keys match schema perfectly.
  const recordsToInsert = allData.map(item => ({
    old_id: item.id,
    type: item.type || (item.tags.includes('snack') ? 'snack' : 'breakfast'), // Fallback if type missing
    name: item.name,
    image: item.image,
    ingredients: item.ingredients,
    steps: item.steps,
    macros: item.macros,
    tags: item.tags,
    is_premium: false // Explicitly set false
  }));

  const { data, error } = await supabase
    .from('recipes')
    .insert(recordsToInsert)
    .select();

  if (error) {
    console.error('Error inserting data:', error);
  } else {
    console.log('Success! Data inserted.');
  }
}

seed();
