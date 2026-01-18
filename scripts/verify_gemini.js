
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Missing VITE_GEMINI_API_KEY in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function testGemini() {
    console.log("Testing Gemini 3 Flash Preview...");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Say 'Hello from Gemini 3' if you can hear me.",
        });

        console.log("Response:", response.text);
        console.log("SUCCESS: Gemini 3 integration passed.");
    } catch (error) {
        console.error("FAILURE: Gemini 3 integration failed.");
        console.error(error);
    }
}

testGemini();
