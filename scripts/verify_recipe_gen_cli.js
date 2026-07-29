
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Missing VITE_GEMINI_API_KEY");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.1-flash-lite"];

async function generateSafe(promptText, config = {}) {
    let lastError = null;
    for (const modelName of FALLBACK_MODELS) {
        try {
            console.log(`Attempting generation with model: ${modelName}`);
            const response = await ai.models.generateContent({
                model: modelName,
                contents: promptText,
                config: config
            });
            return response;
        } catch (error) {
            console.warn(`Model ${modelName} failed:`, error.message);
            lastError = error;
        }
    }
    throw lastError || new Error("All models failed.");
}

async function generateFullRecipe(title, description = '') {
    try {
        const prompt = `
            You are a strict keto/low-carb nutrition expert and chef (Nouriva Vision).
            Create a detailed, healthy, low-carb recipe based on this request:
            Title: "${title}"
            User Instructions/Notes: "${description}"

            Requirements:
            1.  **NO SUGAR, NO GRAINS, LOW CARB**.
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
                "description": "Short appetizing summary",
                "visual_prompt": "A plate of...",
                "steps": [],
                "ingredients": {}
            }
        `;

        console.log("Generating recipe...");
        const result = await generateSafe(prompt, { response_mime_type: "application/json" });
        const text = result.text;

        console.log("Raw Response Length:", text.length);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");
        const data = JSON.parse(jsonMatch[0]);

        console.log("JSON Parsed Successfully.");
        console.log("Name:", data.name);
        console.log("Visual Prompt:", data.visual_prompt);

        let imageUrl = '';
        if (data.visual_prompt || data.name) {
            const title = (data.name || "food").replace(/[^\w\s]/gi, '');
            const shortPrompt = (data.visual_prompt || "").substring(0, 150).trim();
            const finalPrompt = `professional food photography of ${title}, ${shortPrompt}, cinematic lighting`;
            const encodedPrompt = encodeURIComponent(finalPrompt);
            imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true`;
            console.log("Generated Image URL:", imageUrl);
        }

        if (imageUrl.length > 2000) {
            console.warn("WARNING: Image URL is very long (" + imageUrl.length + " chars)");
        }

        return { ...data, image: imageUrl };

    } catch (error) {
        console.error("Gemini Recipe Gen Error:", error);
        throw error;
    }
}

generateFullRecipe("Spicy Keto Tacos", "Make it spicy with avocado")
    .then(() => console.log("VERIFICATION SUCCESS: Recipe generated."))
    .catch((e) => {
        console.error("VERIFICATION FAILED");
        process.exit(1);
    });
