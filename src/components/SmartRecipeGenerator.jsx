import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { optimizeImage } from '../lib/imageUtils';
import { generateFullRecipe } from '../lib/gemini.js';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/ToastContext';

export default function SmartRecipeGenerator({ onRecipeCreated }) {
    const { user } = useAuth() || {};
    const navigate = useNavigate();
    const toast = useToast();

    // Modal State
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isCheckingQuota, setIsCheckingQuota] = useState(false);

    const handleOpen = async () => {
        if (!user) {
            toast.error("Please sign in or create an account to use the AI Chef! 🪄");
            navigate('/login');
            return;
        }
        setErrorMsg('');
        setIsOpen(true);
        setIsCheckingQuota(true);

        try {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const { count, error } = await supabase
                .from('recipes')
                .select('id', { count: 'exact', head: true })
                .eq('created_by', user.id)
                .gte('created_at', startOfToday.toISOString());

            if (error) throw error;

            if (count && count >= 1) {
                setErrorMsg("You have reached your daily limit of 1 AI Chef recipe per day. Please check back tomorrow! 🍳");
            }
        } catch (err) {
            console.error("Failed to run chef daily quota check:", err);
        } finally {
            setIsCheckingQuota(false);
        }
    };

    const handleClose = () => {
        if (isGenerating) return; // Prevent closing while generating
        setIsOpen(false);
        setPrompt('');
        setErrorMsg('');
        setIsGenerating(false);
    };

    const handleGenerate = async () => {
        setErrorMsg('');
        const cleanedPrompt = prompt.trim();
        if (!cleanedPrompt) {
            setErrorMsg("Please tell the chef what you're in the mood for!");
            return;
        }

        // Check quota again on submit to ensure no bypass
        try {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const { count, error } = await supabase
                .from('recipes')
                .select('id', { count: 'exact', head: true })
                .eq('created_by', user.id)
                .gte('created_at', startOfToday.toISOString());
            if (error) throw error;
            if (count && count >= 1) {
                setErrorMsg("You have reached your daily limit of 1 AI Chef recipe per day. Please check back tomorrow! 🍳");
                return;
            }
        } catch (quotaErr) {
            console.error("Quota validation failed:", quotaErr);
        }

        // 1. Client-Side Pre-Screening (Fail Fast)
        const lowerPrompt = cleanedPrompt.toLowerCase();
        if (lowerPrompt.length < 5) {
            setErrorMsg("Please enter a longer description of what you're craving!");
            return;
        }

        if (!/[a-z]/i.test(lowerPrompt)) {
            setErrorMsg("Please enter a valid recipe request using letters.");
            return;
        }

        const localBlacklist = ['poop', 'shit', 'crap', 'fucking', 'fuck', 'bitch', 'asshole', 'dick', 'piss', 'poison', 'cyanide', 'bleach', 'battery', 'metal', 'plastic', 'glass', 'stone', 'rock'];
        const hasBlockedWord = localBlacklist.some(word => lowerPrompt.includes(word));
        if (hasBlockedWord) {
            setErrorMsg("The chef can only prepare safe, edible recipes! Please check your request.");
            return;
        }

        setIsGenerating(true);
        let toastId = null;

        try {
            toastId = toast.loading("AI Chef is creating your recipe...");

            // 2. Generate Recipe JSON + Image URL via Gemini
            const recipeData = await generateFullRecipe(
                "User Custom Request",
                cleanedPrompt + " (Make it a full lunch/dinner meal)"
            );

            // 3. Post-Generation Semantic Safety Check
            if (recipeData.is_valid_food_request === false) {
                throw new Error(recipeData.validation_error || "The chef can only prepare safe, edible recipes! Please check your request.");
            }

            toast.loading("Processing and optimizing food photo...", { id: toastId });

            let finalImageUrl = recipeData.image || "";

            // 4. Download and optimize image if available
            if (recipeData.image && recipeData.image.startsWith('http')) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
                    const res = await fetch(recipeData.image, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    
                    if (res.ok) {
                        const blob = await res.blob();
                        const optimized = await optimizeImage(blob);

                        const fileName = `gen_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
                        const { error: upErr } = await supabase.storage.from('images').upload(fileName, optimized);
                        if (upErr) throw upErr;

                        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
                        finalImageUrl = data.publicUrl;
                    }
                } catch (imgErr) {
                    console.warn("Image optimization failed, falling back to original URL:", imgErr);
                }
            }

            toast.loading("Saving recipe to public cookbook...", { id: toastId });

            // 5. Prepare payload (All AI Chef recipes are premium)
            const payload = {
                name: (recipeData.name || "Custom Creation").trim(),
                description: recipeData.description || "",
                type: recipeData.type || 'lunch',
                image: finalImageUrl,
                is_premium: true, // All AI Chef recipes are premium by default
                steps: recipeData.steps || [],
                ingredients: recipeData.ingredients || {},
                created_by: user.id, // Reference to creator profile
            };

            // 6. Save to Database
            const { data, error } = await supabase
                .from('recipes')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

            toast.dismiss(toastId);
            toast.success("Recipe successfully created and saved! 🎉");

            // Close modal & navigate straight to new recipe details page
            handleClose();
            if (onRecipeCreated) onRecipeCreated(data);
            navigate(`/app/meal/${data.id}`);

        } catch (error) {
            console.error("AI Chef Error:", error);
            if (toastId) toast.dismiss(toastId);
            
            // Format and display a user-friendly error message
            let rawMsg = error.message || String(error);
            if (rawMsg.trim().startsWith('{') && rawMsg.trim().endsWith('}')) {
                try {
                    const parsed = JSON.parse(rawMsg);
                    if (parsed.error && parsed.error.message) {
                        rawMsg = parsed.error.message;
                    }
                } catch (e) {
                    // Ignore JSON parsing failure
                }
            }
            
            const lowerMsg = rawMsg.toLowerCase();
            let friendlyMsg = rawMsg;
            
            if (lowerMsg.includes('503') || lowerMsg.includes('unavailable') || lowerMsg.includes('high demand') || lowerMsg.includes('overloaded')) {
                friendlyMsg = "The AI Chef is currently busy preparing many meals (temporary high demand). Please wait a moment and click Generate Recipe again! 🍳";
            } else if (lowerMsg.includes('429') || lowerMsg.includes('rate limit') || lowerMsg.includes('quota')) {
                friendlyMsg = "You've exceeded the speed limit! Please wait a minute before asking the AI Chef for another recipe. ⏱️";
            } else if (lowerMsg.includes('row-level security') || lowerMsg.includes('rls') || lowerMsg.includes('new row violates')) {
                friendlyMsg = "Database permission connection issue. Please verify your internet connection or try again.";
            }
            
            setErrorMsg(friendlyMsg);
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) {
        return (
            <div 
                className="mb-8 p-6 bg-gradient-to-r from-nouriva-green to-teal-700 rounded-3xl shadow-lg text-white text-center transform hover:scale-[1.01] transition-all cursor-pointer" 
                onClick={handleOpen}
            >
                <div className="text-4xl mb-2">✨</div>
                <h2 className="text-2xl font-bold mb-1">Create Your Dream Meal</h2>
                <p className="text-nouriva-cream/90 opacity-95">
                    Tell our AI Chef what you're craving, and we'll generate a full recipe instantly.
                </p>
                <button className="mt-4 px-6 py-2 bg-white text-nouriva-green font-bold rounded-full shadow hover:bg-nouriva-cream transition">
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
                    <button 
                        onClick={handleClose} 
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        disabled={isGenerating}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto text-gray-800">
                    {isCheckingQuota ? (
                        <div className="text-center py-12 space-y-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600 mx-auto"></div>
                            <h3 className="text-lg font-medium text-emerald-800">Checking daily chef quota...</h3>
                        </div>
                    ) : isGenerating ? (
                        <div className="text-center py-12 space-y-4">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-600 mx-auto"></div>
                            <h3 className="text-xl font-bold text-emerald-800">Creating your masterpiece...</h3>
                            <p className="text-gray-500">Generating details, optimizing the photo, and publishing to your cookbook.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {errorMsg && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex gap-3 items-start animate-fadeIn">
                                    <span className="text-xl">⚠️</span>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-red-900">
                                            {errorMsg.includes("daily limit") ? "Chef Quota Alert" : "Safety & Validation Alert"}
                                        </h4>
                                        <p className="mt-1 text-red-700 leading-relaxed">{errorMsg}</p>
                                    </div>
                                </div>
                            )}

                            {!errorMsg.includes("daily limit") && (
                                <>
                                    <label className="block text-lg font-medium text-gray-700">What are you in the mood for?</label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => {
                                            setPrompt(e.target.value);
                                            if (errorMsg) setErrorMsg('');
                                        }}
                                        placeholder="I want a spicy beef steak with asparagus..."
                                        className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-nouriva-green focus:border-transparent resize-none text-lg text-gray-800 bg-transparent"
                                        autoFocus
                                    />
                                    <div className="text-sm text-gray-500">
                                        💡 Tip: Be specific! Mention ingredients you love or want to avoid.
                                    </div>
                                    <button
                                        onClick={handleGenerate}
                                        className="w-full py-4 bg-nouriva-green text-white text-xl font-bold rounded-xl hover:bg-nouriva-green/90 transition shadow-lg flex justify-center items-center gap-2"
                                    >
                                        Generate Recipe 🪄
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
