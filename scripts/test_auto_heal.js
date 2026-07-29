import 'dotenv/config';
import { supabase } from '../src/lib/supabase.js';
import { generateFullRecipe } from '../src/lib/gemini.js';

async function testAutoHeal() {
    console.log("=== Starting Gemini Auto-Healing End-to-End Test ===");

    try {
        // 1. Manually set the active model in Supabase to a deprecated model name
        console.log("\n1. Simulating deprecation: Setting active model in Supabase to 'gemini-2.5-flash'...");
        const { error: updateErr } = await supabase
            .from('system_settings')
            .update({ value: 'gemini-2.5-flash' })
            .eq('key', 'gemini_model');

        if (updateErr) {
            throw new Error(`Failed to set deprecated model in Supabase: ${updateErr.message}`);
        }
        console.log("Successfully set model to 'gemini-2.5-flash' in DB.");

        // Clear in-memory cache if any, but since we are running a fresh Node process, it starts empty.

        // 2. Run the recipe generator
        console.log("\n2. Requesting recipe generation. This should fail on the deprecated model, trigger auto-healing, and heal itself...");
        const start = Date.now();
        const recipe = await generateFullRecipe("Quick Keto Salad", "Use spinach and bacon");
        const duration = Date.now() - start;

        console.log("\n3. Recipe Generation Completed!");
        console.log("Generated Recipe Name:", recipe.name);
        console.log("Time Taken (including auto-healing):", duration, "ms");

        // 4. Verify that the model was updated back to a working model in Supabase
        console.log("\n4. Verifying database state...");
        const { data: dbData, error: fetchErr } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'gemini_model')
            .single();

        if (fetchErr) {
            throw new Error(`Failed to fetch final model from Supabase: ${fetchErr.message}`);
        }

        console.log("Final active model in database:", dbData.value);
        
        if (dbData.value !== 'gemini-2.5-flash') {
            console.log("\n=== TEST PASSED: Auto-healing successfully updated the deprecated model to: " + dbData.value + " ===");
        } else {
            console.error("\n=== TEST FAILED: Model in database was not updated! ===");
            process.exit(1);
        }

    } catch (err) {
        console.error("\n=== TEST EXCEPTION ===");
        console.error(err);
        process.exit(1);
    }
}

testAutoHeal();
