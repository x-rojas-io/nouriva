import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1' });

async function testJson() {
    console.log("Testing JSON generation...");

    // Test 1: camelCase (Current)
    console.log("\n--- Test 1: responseMimeType ---");
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Return JSON: {"hello": "world"}',
            config: {
                responseMimeType: "application/json"
            }
        });
        console.log("Success 1:", res.text);
    } catch (e) {
        console.error("Failed 1:", e.message);
    }

    // Test 2: snake_case
    console.log("\n--- Test 2: response_mime_type ---");
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Return JSON: {"hello": "world"}',
            config: {
                response_mime_type: "application/json"
            }
        });
        console.log("Success 2:", res.text);
    } catch (e) {
        console.error("Failed 2:", e.message);
    }
}

testJson();
