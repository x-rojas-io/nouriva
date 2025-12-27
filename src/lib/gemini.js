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

            Output Format (JSON):
            {
                "type": "breakfast|lunch|dinner|snack",
                "is_premium": true,
                "description": "Short appetizing summary (max 2 sentences)",
                "visual_prompt": "A plate of...",
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
        const data = JSON.parse(jsonStr);

        // Auto-generate Image URL using the visual prompt
        let imageUrl = '';
        if (data.visual_prompt) {
            const encodedPrompt = encodeURIComponent(data.visual_prompt + " realistic, 4k, food photography, cinematic lighting, healthy keto");
            imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true`;
        }

        return { ...data, image: imageUrl };

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

export async function generateNewsletterContent(recipes) {
    const recipeNames = recipes.map(r => r.name).join(", ");

    const prompt = `
    You are the editor of the "Nouriva Club" newsletter. 
    Write a short, engaging email intro for this week's meal plan.
    
    The featured recipes are: ${recipeNames}.
    
    Tone: Warm, encouraging, focused on "Vibrant Living" and "Keto/Low-Carb" health benefits.
    Style: Minimalist but inspiring. "Nouriva Vision".
    
    Output Format (JSON):
    {
      "subject": "A catchy, short subject line (max 6 words)",
      "intro": "A 100-150 word intro paragraph connecting these meals to a theme (e.g., energy, focus, comfort)."
    }
  `;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean JSON markdown
        const jsonString = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Gemini Newsletter Error:", error);
        return {
            subject: "Your Weekly Nouriva Menu 🥑",
            intro: "Here are your delicious, health-focused meals for the week. Enjoy the energy boost!"
        };
    }
}
