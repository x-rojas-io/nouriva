# Building an AI-Powered Recipe Generator: A Technical Guide

This guide breaks down the "Magic Fill" feature in Nouriva, demonstrating how to combine **Large Language Models (LLMs)** and **Generative AI** to automate content creation.

## 🏗️ The Architecture

The feature creates a full structured recipe (Ingredients, Steps, Nutrition) + a professional food image from just a **Title** and **Description**.

**The Pipeline:**
1.  **User Input** $\rightarrow$ React Frontend.
2.  **Logic Layer** $\rightarrow$ Calls Gemini 1.5 Flash (LLM).
3.  **Visual Layer** $\rightarrow$ Calls Pollinations.ai (Image Gen).
4.  **Storage** $\rightarrow$ Supabase (Database + Buckets).

---

## 🚀 Step 1: The "Brain" (LLM Integration)

We use Google's **Gemini 1.5 Flash** because it is fast, cheap, and excellent at following JSON schemas.

**File:** `src/lib/gemini.js`

### The Prompt Engineering
The key to getting usable data is **Structure Enforcement**. We don't ask for "a recipe"; we ask for a specific **JSON schema**.

```javascript
// src/lib/gemini.js

export async function generateFullRecipe(title, description) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

    // The Prompt acts as a "System Instruction"
    const prompt = `
        You are a strict keto nutrition expert.
        Create a detailed recipe for: "${title}" (${description}).

        CRITICAL: Output JSON ONLY. No markdown.
        Format:
        {
            "type": "breakfast|lunch|dinner",
            "is_premium": true,
            "description": "Appetizing summary...",
            "visual_prompt": "A vivid, detailed description of the dish for a photographer...",
            "ingredients": { "Avocado": { "quantity": "1", "unit": "whole" } },
            "steps": ["Step 1...", "Step 2..."]
        }
    `;

    const result = await model.generateContent(prompt);
    const json = JSON.parse(result.response.text());
    return json;
}
```

### Key Takeaway for Developers:
*   **"visual_prompt" Field:** Notice we ask the LLM to write a *prompt* for another AI (`visual_prompt`). An LLM knows what a good image prompt looks like better than the user does.

---

## 🎨 Step 2: The Visuals (Image Generation)

Most LLMs (like Gemini Flash) return text, not images. We use a **Chained Approach**:
1.  **Gemini** generates the `visual_prompt` (Text).
2.  **Application** passes that text to an Image Generator.

We used **Pollinations.ai** for this demo because it is URL-based and doesn't require a complex backend SDK.

```javascript
// src/lib/gemini.js (continued)

// 1. Get the description from Gemini
const visualDescription = json.visual_prompt; 
// e.g., "Golden crispy meatballs with bubbling cheese on a white ceramic plate..."

// 2. Enhance it with "Magic Words"
const magicWords = "realistic, 4k, food photography, cinematic lighting, michelin star";
const finalPrompt = encodeURIComponent(`${visualDescription} ${magicWords}`);

// 3. Generate Image URL
const imageUrl = `https://image.pollinations.ai/prompt/${finalPrompt}?nologo=true`;

// Result: A real URL we can display immediately!
return { ...json, image: imageUrl };
```

---

## 🖥️ Step 3: Frontend Integration (React)

The UI needs to handle the "Magic" state (loading) and populate the form.

**File:** `src/pages/admin/RecipeEditor.jsx`

```javascript
const handleMagicFill = async () => {
    setMagicFilling(true); // Show Spinner

    // 1. Call our Logic Layer
    const data = await generateFullRecipe(formData.name, formData.description);

    // 2. Auto-Populate Form States
    setFormData({
        type: data.type,
        steps: data.steps,
        description: data.description,
        is_premium: data.is_premium
    });

    // 3. Handle the Image (Convert to File for Upload)
    if (data.image) {
        setPreviewUrl(data.image);
        
        // Fetch the blob so we can upload it to our own storage later
        const res = await fetch(data.image);
        const blob = await res.blob();
        setImageFile(blob); 
    }

    setMagicFilling(false); // Stop Spinner
};
```

**Why fetch the blob?**
The URL from the generator might expire or be slow. We fetch it immediately to turn it into a "File" object, exactly as if the user had uploaded it from their computer.

---

## 💾 Step 4: Persistence (Supabase)

When the user clicks "Save", we treat the generated content like normal user input.

1.  **Image Upload:** The `imageFile` (blob) is uploaded to Supabase Storage (`buckets/images`).
2.  **Database Insert:** The JSON data (ingredients, steps) + the new permanent Storage URL are saved to the `recipes` table.

---

## Summary of Tools

| Component | Tool used | Why? |
| :--- | :--- | :--- |
| **LLM** | **Gemini 1.5 Flash** | Fast, cheap, excellent JSON compliance. |
| **Image Gen** | **Pollinations.ai** | Free, URL-based, easy to integrate for prototypes. |
| **Frontend** | **React + Vite** | Fast updates, responsive UI. |
| **Backend** | **Supabase** | Handles Auth, Database, and Storage in one place. |

## How to Replicate
1.  Get a **Gemini API Key** (Google AI Studio).
2.  Create a helper function that prompts Gemini for **JSON**.
3.  Ask Gemini to include a `visual_prompt` field in that JSON.
4.  Pass that `visual_prompt` to any Image API (DALL-E, Midjourney, Pollinations).
5.  Render the result!
