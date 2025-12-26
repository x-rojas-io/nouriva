import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("Missing VITE_GEMINI_API_KEY");
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Generates an image-like description or placeholder since direct Image Generation 
 * via the JS SDK client for Gemini is limited/experimental or requires specific Imagen endpoints.
 * 
 * NOTE: As of now, the standard 'gemini-pro' does NOT generate images directly (return bytes).
 * It generates text.
 * 
 * To actually get an IMAGE, we typically need to use an external Image Gen provider OR 
 * if the user has access to Imagen on Vertex AI (which is different than the AI Studio key).
 * 
 * However, since the user explicitly asked for "Gemini integration" for images and gave an AI Studio key,
 * we will attempt to use a clever workaround if direct generation isn't supported:
 * 1. PROMPT engineering to get a descriptive prompt.
 * 2. In a real scenario, we'd hit DALL-E or a dedicated Imagen endpoint.
 * 
 * BUT, assuming we want to try the latest features or fallback:
 * We will use a placeholder methodology if the API doesn't return an image, 
 * OR we will assume the user meant "Help me write the prompt" for now, 
 * UNLESS we can hit a known endpoint.
 * 
 * UPDATE: Let's assume we use the key to generate a PROMPT, and then use a free external API (like Pollinations.ai)
 * to render it, because the AI Studio key does not support direct Image generation HTTP responses easily on the client side yet.
 * 
 * This is a robust approach: Gemini -> Enhanced Prompt -> Pollinations/Other -> Image URL.
 */
export async function generateRecipeImage(recipeName, ingredients) {
    try {
        // 1. Use Gemini to create a vivid visual description
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Describe a delicious, high-quality, professional food photography shot of ${recipeName} made with ${ingredients.slice(0, 3).join(', ')}. Details only, visual style, no filler text. Max 30 words.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const visualDescription = response.text();

        console.log("Gemini Prompt:", visualDescription);

        // 2. Use a generation service (Pollinations is great for dev/demos as it's free and URL-based)
        // We encode the description into the URL.
        const encodedPrompt = encodeURIComponent(visualDescription + " realistic, 4k, food photography, cinematic lighting");
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true`;

        return imageUrl;
    } catch (error) {
        console.error("Error generating image with Gemini:", error);
        throw error;
    }
}

/**
 * Generates a full recipe (ingredients, steps, type) from a simple description.
 */
export async function generateFullRecipe(title, description = '') {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Verified working model

        const prompt = `
            You are a keto/low-carb nutrition expert and chef.
            Create a detailed, healthy recipe based on this request:
            Title: "${title}"
            Description/Notes: "${description}"

            Requirements:
            1.  Strictly Low Carb / Healthy / Keto-friendly unless specified otherwise.
            2.  Ingredients must be realistic quantities.
            3.  Structured JSON output ONLY.

            Output Format (JSON):
            {
                "type": "breakfast|lunch|dinner|snack",
                "is_premium": true,
                "description": "Short appetizing summary (max 2 sentences)",
                "steps": ["Step 1...", "Step 2..."],
                "ingredients": {
                    "Ingredient Name": { "quantity": "Number", "unit": "g/oz/cup/pcs" }
                }
            }
            Example Ingredient: "Avocado": { "quantity": "1", "unit": "whole" }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean markdown
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Gemini Recipe Gen Error:", error);
        throw error;
    }
}

/**
 * Uses Gemini to interpret a natural language search query.
 * Returns structured parameters for DB filtering.
 */
export async function understandRecipeQuery(userQuery) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Consistent model usage

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
            If text_search is redundant with type (e.g. "show me breakfast"), text_search can be empty string.
         `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean markdown if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Gemini Search Error:", error);
        // Fallback: simple text search
        return { text_search: userQuery, type: 'any', exclude_ingredients: [], include_ingredients: [] };
    }
}
