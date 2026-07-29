import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API KEY found in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1' });

async function listModels() {
    try {
        console.log("Fetching models...");
        const response = await ai.models.list();
        console.log("Available Models (first 5):");
        // The new SDK response structure might vary, let's log keys/data
        if (Array.isArray(response)) {
            response.slice(0, 5).forEach(m => console.log(m.name || m));
        } else if (response.models) {
            response.models.slice(0, 5).forEach(m => console.log(m.name || m));
        } else {
            console.log("Response structure:", JSON.stringify(response, null, 2));
        }

        console.log("\nAttempting generation with gemini-3.5-flash...");
        try {
            const genRes = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: 'Hello',
            });
            console.log("Success (3.5-flash):", genRes.text ? genRes.text.substring(0, 20) : "OK");
        } catch (genErr) {
            console.error("Failed (3.5-flash):", genErr.message);
        }

        console.log("\nAttempting generation with gemini-3.5-flash-lite...");
        try {
            const genRes = await ai.models.generateContent({
                model: 'gemini-3.5-flash-lite',
                contents: 'Hello',
            });
            console.log("Success (3.5-flash-lite):", genRes.text ? genRes.text.substring(0, 20) : "OK");
        } catch (genErr) {
            console.error("Failed (3.5-flash-lite):", genErr.message);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
