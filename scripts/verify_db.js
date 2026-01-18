
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestRecipes() {
    console.log("Checking latest recipes...");

    // Check recipes table
    const { data: recipes, error } = await supabase
        .from('recipes')
        .select('id, name, created_at, is_premium')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching recipes:", error);
        return;
    }

    console.log("--- Latest 5 Recipes ---");
    recipes.forEach(r => {
        console.log(`[${r.created_at}] ID: ${r.id} | Name: ${r.name} | Premium: ${r.is_premium}`);
    });
    console.log("------------------------");
}

checkLatestRecipes();
