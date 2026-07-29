import { GoogleGenAI } from "@google/genai";
import { supabase } from "./supabase.js";

const API_KEY = typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env.VITE_GEMINI_API_KEY 
    : process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("Missing VITE_GEMINI_API_KEY");
}

const ai = new GoogleGenAI({ apiKey: API_KEY, apiVersion: 'v1' });

// SAFETY: Fallback list - Prioritize Gemini 3.5/3.6 (Stable) -> 3.1
const FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.1-flash-lite"];

let activeModelCache = null;

/**
 * Fetches the active model from the Supabase settings table, with local fallbacks.
 */
async function getActiveModel() {
    if (activeModelCache) return activeModelCache;

    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'gemini_model')
            .maybeSingle();

        if (!error && data && data.value) {
            activeModelCache = data.value;
            console.log(`Resolved active Gemini model from Supabase: ${activeModelCache}`);
            return activeModelCache;
        }
    } catch (e) {
        console.error("Failed to fetch active model from Supabase:", e);
    }

    const envModel = typeof import.meta !== 'undefined' && import.meta.env
        ? import.meta.env.VITE_PRIMARY_GEMINI_MODEL
        : process.env.VITE_PRIMARY_GEMINI_MODEL;

    return envModel || FALLBACK_MODELS[0];
}

/**
 * Distinguishes true model deprecation/deactivation errors from transient network issues.
 */
function isDeprecationError(error) {
    if (!error) return false;
    const msg = (error.message || String(error)).toLowerCase();
    const status = error.status || error.code;

    // HTTP 404 is the standard NOT_FOUND for a deleted/deprecated model
    if (status === 404 || status === 'NOT_FOUND') return true;

    // Common error phrases for deactivated/deprecated models
    if (msg.includes('no longer available') || 
        msg.includes('model not found') || 
        msg.includes('not available to new users') || 
        msg.includes('does not exist')) {
        return true;
    }

    return false;
}

/**
 * Discovers and tests active Flash models on the current API key, saving the best one to Supabase.
 */
async function autoHealModel(failedModel) {
    console.log(`Auto-healing triggered! Model '${failedModel}' is deprecated/unavailable.`);
    try {
        const response = await ai.models.list();
        const modelsList = response && Array.isArray(response.pageInternal)
            ? response.pageInternal
            : (response && Array.isArray(response.models) ? response.models : (Array.isArray(response) ? response : []));

        // Filter and sort for active text generation Flash models
        const activeFlashModels = modelsList
            .filter(m => {
                const name = m.name || '';
                const supportsTextGen = m.supportedActions?.includes('generateContent');
                const isFlash = name.includes('flash') && !name.includes('image') && !name.includes('embedding');
                return supportsTextGen && isFlash;
            })
            .map(m => m.name.replace('models/', ''))
            .sort((a, b) => b.localeCompare(a)); // Sort descending to prioritize newer versions

        if (activeFlashModels.length === 0) {
            throw new Error("No active Flash models found on this account.");
        }

        console.log("Discovered active Flash models to test:", activeFlashModels);

        // Find the first working model by running a simple validation call
        let workingModel = null;
        for (const modelName of activeFlashModels) {
            try {
                console.log(`Testing discovered model: ${modelName}`);
                await ai.models.generateContent({
                    model: modelName,
                    contents: 'ping',
                });
                workingModel = modelName;
                break;
            } catch (err) {
                console.warn(`Discovered model ${modelName} validation failed:`, err.message);
            }
        }

        if (!workingModel) {
            throw new Error("All discovered models failed validation checks.");
        }

        console.log(`Successfully verified new working model: '${workingModel}'. Saving to Supabase...`);

        const { error } = await supabase
            .from('system_settings')
            .update({ value: workingModel })
            .eq('key', 'gemini_model');

        if (error) {
            console.error("Failed to save auto-healed model to Supabase:", error);
        }

        activeModelCache = workingModel;
        return workingModel;
    } catch (err) {
        console.error("Auto-healing failed:", err);
        throw err;
    }
}

/**
 * Helper to execute prompts with dynamic fallback and auto-healing.
 */
async function generateSafe(promptText, config = {}) {
    let modelName = await getActiveModel();
    
    try {
        console.log(`Attempting generation with model: ${modelName}`);
        const response = await ai.models.generateContent({
            model: modelName,
            contents: promptText,
            config: config
        });

        if (!response) throw new Error("Empty response");
        return response;
    } catch (error) {
        console.error(`Generation failed with model ${modelName}:`, error.message);

        if (isDeprecationError(error)) {
            try {
                const newModelName = await autoHealModel(modelName);
                console.log(`Retrying generation with auto-healed model: ${newModelName}`);
                const retryResponse = await ai.models.generateContent({
                    model: newModelName,
                    contents: promptText,
                    config: config
                });

                if (!retryResponse) throw new Error("Empty response on retry");
                return retryResponse;
            } catch (healErr) {
                console.error("Auto-healing/retry failed:", healErr);
                throw error; // Return original deprecation error if healing fails
            }
        } else {
            // Bubble up transient network/quota errors immediately
            throw error;
        }
    }
}


/**
 * Generates an image-like description -> Pollinations URL
 */
export async function generateRecipeImage(recipeName, ingredients) {
    try {
        const prompt = `Describe a delicious, high-quality, professional food photography shot of ${recipeName} made with ${ingredients.slice(0, 3).join(', ')}. Details only, visual style, no filler text. Max 30 words.`;

        const result = await generateSafe(prompt);
        // SDK V2: result.text directly available or result.response.text()
        // SDK V1 uses result.response.text(). 
        // Let's assume new SDK returns { text: "..." } or similar based on snippet.
        // The snippet shows `response.text`.
        const visualDescription = result.text;

        console.log("Gemini Prompt:", visualDescription);

        const encodedPrompt = encodeURIComponent(visualDescription + " realistic, 4k, food photography, cinematic lighting");
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true`;
    } catch (error) {
        console.error("Error generating image with Gemini:", error);
        throw error;
    }
}

export async function generateFullRecipe(title, description = '') {
    try {
        const prompt = `
            You are a strict keto/low-carb nutrition expert and chef (Nouriva Vision).
            Create a detailed, healthy, low-carb recipe based on this request:
            Title: "${title}"
            User Instructions/Notes: "${description}"

            Requirements:
            1.  **SAFETY & VALIDITY CHECK**: You must check if the requested Title or User Instructions:
                - Contains profanity, offensive, or inappropriate content.
                - Requests non-food, non-edible, or hazardous items (e.g. plastic, poop, metal, poison, trash, electronics, paper, etc.).
                - Is completely incoherent gibberish, letters spam, or nonsensical.
                If any of these safety issues are detected, set "is_valid_food_request" to false, populate "validation_error" with a friendly message explaining why it was rejected (e.g., "The chef can only prepare safe, edible recipes! Please check your ingredients."), and set the other recipe fields to null or empty.
                Otherwise, set "is_valid_food_request" to true, and "validation_error" to null, and populate the rest of the recipe fields.
            2.  **NO SUGAR, NO GRAINS, LOW CARB**. Focus on healthy fats (Avocado, Olive Oil), lean proteins, and low-carb vegetables.
            3.  Ingredients must be realistic quantities.
            4.  Structured JSON output ONLY.
            5.  Include a "visual_prompt" field: A short, vivid description of the final dish for food photography (max 20 words).
            6.  **Output Description**: Generate a short, appetizing summary (max 2 sentences) for the final recipe.
            7.  **Name**: Generate a creative, appetizing name for the recipe.

            Output Format (JSON):
            {
                "is_valid_food_request": true|false,
                "validation_error": "Reason for failure, or null",
                "name": "Creative Recipe Name",
                "type": "breakfast|lunch|dinner|snack",
                "is_premium": true,
                "description": "Short appetizing summary",
                "visual_prompt": "A plate of...",
                "steps": ["Step 1...", "Step 2..."],
                "ingredients": {
                    "Ingredient Name": { "quantity": "Number", "unit": "g/oz/cup/pcs" }
                }
            }
        `;

        const result = await generateSafe(prompt, { response_mime_type: "application/json" });
        const text = result.text;

        // Robust JSON extraction
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");

        const data = JSON.parse(jsonMatch[0]);

        // Auto-generate Image URL
        let imageUrl = '';
        if (data.visual_prompt || data.name) {
            // Optimized for speed to avoid 524 Timeouts
            // Use title as primary anchor, plus a short visual description
            const title = (data.name || "food").replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim(); // Clean title
            const shortPrompt = (data.visual_prompt || "").substring(0, 100).trim();

            const finalPrompt = `professional food photography of ${title}, realistic, 4k, cinematic lighting`;
            const encodedPrompt = encodeURIComponent(finalPrompt);
            imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true`;
        }

        return { ...data, image: imageUrl };

    } catch (error) {
        console.error("Gemini Recipe Gen Error:", error);
        throw error;
    }
}

/**
 * Uses Gemini to interpret a search query.
 */
export async function understandRecipeQuery(userQuery) {
    try {
        const prompt = `
            You are a search parser for a recipe app. 
            User Query: "${userQuery}"
            
            Return ONLY a valid JSON object (no markdown, no backticks) with these fields:
            {
                "text_search": "keywords found in query (e.g. beef, keto)",
                "type": "breakfast|lunch|dinner|snack|any",
                "exclude_ingredients": ["list", "of", "ingredients", "to", "exclude"],
                "include_ingredients": ["list", "of", "ingredients", "to", "must", "have"]
            }
            If the user doesn't specify a type, use "any".
         `;

        const result = await generateSafe(prompt, { response_mime_type: "application/json" });
        const text = result.text;

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { text_search: userQuery, type: 'any' };

    } catch (error) {
        console.error("Gemini Search Error:", error);
        return { text_search: userQuery, type: 'any', exclude_ingredients: [], include_ingredients: [] };
    }
}

export async function generateNewsletterContent(recipes) {
    const recipeNames = recipes.map(r => r.name).join(", ");
    const prompt = `
    You are the editor of the "Nouriva Club" newsletter. 
    Write a short, engaging email intro for this week's meal plan.
    Featured recipes: ${recipeNames}.
    Tone: Warm, encouraging, focused on "Vibrant Living" and "Keto/Low-Carb".
    
    Output Format (JSON):
    {
      "subject": "A catchy, short subject line (max 6 words)",
      "intro": "A 100-150 word intro paragraph."
    }
    `;

    try {
        const result = await generateSafe(prompt, { response_mime_type: "application/json" });
        const text = result.text;

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text); // Fallback to raw text if regex fails but maybe simple JSON
    } catch (error) {
        console.error("Gemini Newsletter Error:", error);
        return {
            subject: "Your Weekly Nouriva Menu 🥑",
            intro: "Here are your delicious, health-focused meals for the week. Enjoy the energy boost!"
        };
    }
}
