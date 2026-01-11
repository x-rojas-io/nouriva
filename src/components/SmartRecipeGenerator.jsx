import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { optimizeImage } from '../lib/imageUtils';
import { generateFullRecipe } from '../lib/gemini';
import { useToast } from '../lib/ToastContext';

export default function SmartRecipeGenerator({ onRecipeCreated }) {
    const navigate = useNavigate();
    const { toast } = useToast();

    // Modal State
    const [isOpen, setIsOpen] = useState(false);

    // Process State
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedRecipe, setGeneratedRecipe] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => {
        setIsOpen(false);
        setPrompt('');
        setGeneratedRecipe(null);
        setIsGenerating(false);
    };

    const handleGenerate = async () => {
        console.log("Handle generate triggered");
        if (!prompt.trim()) {
            console.log("Prompt empty");
            return toast.error("Please tell the chef what you're in the mood for!");
        }

        console.log("Setting generating state");
        setIsGenerating(true);
        setGeneratedRecipe(null);

        try {
            console.log("Calling Gemini API with prompt:", prompt);
            // 1. Generate Recipe JSON + Image URL
            const recipeData = await generateFullRecipe(
                "User Custom Request",
                prompt + " (Make it a full lunch/dinner meal)"
            );
            console.log("Gemini API returned:", recipeData);

            setGeneratedRecipe(recipeData);

        } catch (error) {
            console.error("Gemini Generation Error:", error);
            toast.error("Failed to generate recipe. Please try again.");
        } finally {
            console.log("Finished generation, resetting state");
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        console.log("Handle Save triggered");
        if (!generatedRecipe) return;
        setIsSaving(true);

        let toastId = null;

        try {
            if (toast && typeof toast.loading === 'function') {
                toastId = toast.loading("Starting save process...");
            } else {
                console.warn("Toast system unavailable");
            }

            let finalImageUrl = generatedRecipe.image || "";
            console.log("Initial Image URL:", finalImageUrl);

            // 1. Process Image if it exists
            if (generatedRecipe.image && generatedRecipe.image.startsWith('http')) {
                try {
                    if (toastId) toast.loading("Processing image...", { id: toastId });

                    // Attempt to fetch/optimize/upload, but allow failing back to original URL
                    // Use a simple timeout race to prevent hanging
                    const processImagePromise = async () => {
                        const controller = new AbortController();
                        const id = setTimeout(() => controller.abort(), 8000); // 8s timeout
                        const res = await fetch(generatedRecipe.image, { signal: controller.signal });
                        clearTimeout(id);
                        if (!res.ok) throw new Error("Fetch failed");
                        const blob = await res.blob();
                        const optimized = await optimizeImage(blob);

                        const fileName = `gen_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
                        const { error: upErr } = await supabase.storage.from('images').upload(fileName, optimized);
                        if (upErr) throw upErr;

                        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
                        return data.publicUrl;
                    };

                    finalImageUrl = await processImagePromise();
                    console.log("Image processed & uploaded:", finalImageUrl);

                } catch (imgErr) {
                    console.warn("Image processing failed (using original):", imgErr);
                    // Non-blocking: just continue with original URL
                    if (toastId) toast.loading("Using original image link...", { id: toastId });
                }
            }

            // 2. Prepare DB Payload
            if (toastId) toast.loading("Saving to database...", { id: toastId });

            const payload = {
                name: (generatedRecipe.name || "Custom Creation").trim(),
                description: generatedRecipe.description || "",
                type: generatedRecipe.type || 'lunch',
                image: finalImageUrl,
                is_premium: false,
                steps: generatedRecipe.steps || [],
                ingredients: generatedRecipe.ingredients || {}
            };

            // 3. Insert into DB
            const { data, error } = await supabase
                .from('recipes')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

            console.log("Recipe saved successfully:", data);

            if (toastId) toast.dismiss(toastId);
            if (toast && typeof toast.success === 'function') toast.success("Recipe saved!");

            handleClose();
            if (onRecipeCreated) onRecipeCreated(data);
            navigate(`/app/meal/${data.id}`);

        } catch (err) {
            console.error("Save Critical Error:", err);
            if (toastId) toast.dismiss(toastId);
            if (toast && typeof toast.error === 'function') {
                toast.error("Failed to save: " + (err.message || "Unknown error"));
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) {
        return (
            <div className="mb-8 p-6 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl shadow-lg text-white text-center transform hover:scale-[1.01] transition-all cursor-pointer" onClick={handleOpen}>
                <div className="text-4xl mb-2">✨</div>
                <h2 className="text-2xl font-bold mb-1">Create Your Dream Meal</h2>
                <p className="text-emerald-50 opacity-90">
                    Tell our AI Chef what you're craving, and we'll generate a full recipe instantly.
                </p>
                <button className="mt-4 px-6 py-2 bg-white text-emerald-700 font-bold rounded-full shadow hover:bg-emerald-50 transition">
                    Start Cooking
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        ✨ AI Chef
                    </h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {!generatedRecipe && !isGenerating && (
                        <div className="space-y-4">
                            <label className="block text-lg font-medium text-gray-700">What are you in the mood for?</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="I want a spicy beef steak with asparagus..."
                                className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-lg"
                                autoFocus
                            />
                            <div className="text-sm text-gray-500">
                                💡 Tip: Be specific! Mention ingredients you love or want to avoid.
                            </div>
                            <button
                                onClick={handleGenerate}
                                className="w-full py-4 bg-emerald-600 text-white text-xl font-bold rounded-xl hover:bg-emerald-700 transition shadow-lg flex justify-center items-center gap-2"
                            >
                                Generate Recipe 🪄
                            </button>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="text-center py-12 space-y-4">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-600 mx-auto"></div>
                            <h3 className="text-xl font-bold text-emerald-800">Creating your masterpiece...</h3>
                            <p className="text-gray-500">Generating ingredients, steps, and a beautiful image.</p>
                        </div>
                    )}

                    {generatedRecipe && !isGenerating && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Preview Header */}
                            <div className="relative h-48 w-full rounded-xl overflow-hidden bg-gray-200 shadow-inner">
                                {generatedRecipe.image ? (
                                    <img
                                        src={generatedRecipe.image}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            // Fallback to a reliable placeholder if AI image fails
                                            e.target.src = "https://placehold.co/800x600/e2e8f0/475569?text=Delicious+Meal";
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                                        Generating image...
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                    <h2 className="text-2xl font-bold text-white shadow-sm">{generatedRecipe.name || "Custom Recipe"}</h2>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="prose prose-sm max-w-none text-gray-600">
                                <p className="italic bg-amber-50 p-3 rounded-lg border border-amber-100">
                                    "{generatedRecipe.description}"
                                </p>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-2">Ingredients</h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {Object.entries(generatedRecipe.ingredients || {}).map(([name, details]) => (
                                                <li key={name}>
                                                    <span className="font-semibold">{details.quantity} {details.unit}</span> {name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-2">Steps</h4>
                                        <ol className="list-decimal pl-5 space-y-1">
                                            {(generatedRecipe.steps || []).slice(0, 3).map((step, i) => (
                                                <li key={i}>{step.substring(0, 60)}...</li>
                                            ))}
                                            {(generatedRecipe.steps || []).length > 3 && (
                                                <li className="list-none text-gray-400 text-xs italic">+ {(generatedRecipe.steps.length - 3)} more steps</li>
                                            )}
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {generatedRecipe && !isGenerating && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                        <button
                            onClick={() => setGeneratedRecipe(null)}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow hover:bg-emerald-700 transition flex items-center gap-2"
                        >
                            {isSaving ? 'Saving...' : 'Save & View Recipe'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
