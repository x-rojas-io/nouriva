import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("Missing VITE_GEMINI_API_KEY");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// SAFETY: Fallback list - Prioritize Gemini 3
const FALLBACK_MODELS = ["gemini-3-flash-preview", "gemini-2.0-flash-exp", "gemini-1.5-flash"];

/**
 * Helper to try generation across multiple models to ensure high availability.
 * @param {string} promptText 
 * @param {object} config 
 * @returns {Promise<any>}
 */
async function generateSafe(promptText, config = {}) {
    let lastError = null;

    for (const modelName of FALLBACK_MODELS) {
        try {
            console.log(`Attempting generation with model: ${modelName}`);
            // New SDK signature
            const response = await ai.models.generateContent({
                model: modelName,
                contents: promptText,
                config: config
            });

            if (!response) throw new Error("Empty response");

            // Normalize response to match expected "text()" usage or extracting data
            // The new SDK returns a response object with .text property usually
            return response;
        } catch (error) {
            console.warn(`Model ${modelName} failed:`, error.message);
            lastError = error;
            // Continue to next model...
        }
    }

    throw lastError || new Error("All models failed to generate content.");
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

/**
 * Generates a full recipe (ingredients, steps, type) from a description.
 */
export async function generateFullRecipe(title, description = '') {
    try {
        const prompt = `
            You are a strict keto/low-carb nutrition expert and chef (Nouriva Vision).
            Create a detailed, healthy, low-carb recipe based on this request:
            Title: "${title}"
            User Instructions/Notes: "${description}"

            Requirements:
            1.  **NO SUGAR, NO GRAINS, LOW CARB**. Focus on healthy fats (Avocado, Olive Oil), lean proteins, and low-carb vegetables.
            2.  Ingredients must be realistic quantities.
            3.  Structured JSON output ONLY.
            4.  Include a "visual_prompt" field: A short, vivid description of the final dish for food photography (max 20 words).
            5.  **Output Description**: Generate a short, appetizing summary (max 2 sentences) for the final recipe.
            6.  **Name**: Generate a creative, appetizing name for the recipe.

            Output Format (JSON):
            {
                "name": "Creative Recipe Name",
                "type": "breakfast|lunch|dinner|snack",
                "is_premium": true,
                "description": "Short appetizing summary (max 2 sentences)",
                "visual_prompt": "A plate of...",
                "steps": ["Step 1...", "Step 2..."],
                "ingredients": {
                    "Ingredient Name": { "quantity": "Number", "unit": "g/oz/cup/pcs" }
                }
            }
        `;

        const result = await generateSafe(prompt, { responseMimeType: "application/json" });
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
            const title = (data.name || "food").replace(/[^\w\s]/gi, ''); // Clean title
            const shortPrompt = (data.visual_prompt || "").substring(0, 150).trim();

            const finalPrompt = `professional food photography of ${title}, ${shortPrompt}, cinematic lighting`;
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

        const result = await generateSafe(prompt, { responseMimeType: "application/json" });
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
        const result = await generateSafe(prompt, { responseMimeType: "application/json" });
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
