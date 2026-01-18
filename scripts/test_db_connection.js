
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log("Testing Supabase Connection...");
    const start = Date.now();
    try {
        // Simple query
        const { data, error } = await supabase.from('profiles').select('count').limit(1);

        const duration = Date.now() - start;
        console.log(`Query took ${duration}ms`);

        if (error) {
            console.error("Query Error:", error);
        } else {
            console.log("Query Success:", data);
        }
    } catch (e) {
        console.error("Connection Failed:", e);
    }
}

testConnection();
