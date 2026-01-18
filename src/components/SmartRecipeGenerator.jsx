import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { optimizeImage } from '../lib/imageUtils';
import { generateFullRecipe } from '../lib/gemini';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/ToastContext';

export default function SmartRecipeGenerator({ onRecipeCreated }) {
    const { user } = useAuth() || {};
    const navigate = useNavigate();
    const toast = useToast();

    // Modal State
    const [isOpen, setIsOpen] = useState(false);

    // Process State
    // Process State
    const [prompt, setPrompt] = useState('');
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestOtp, setGuestOtp] = useState('');
    const [showGuestEmailInput, setShowGuestEmailInput] = useState(false);
    const [showGuestOtpInput, setShowGuestOtpInput] = useState(false);
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

    // Restore pending recipe if user just logged in
    useEffect(() => {
        if (user && !generatedRecipe) {
            const pending = localStorage.getItem('pending_recipe');
            if (pending) {
                try {
                    const parsed = JSON.parse(pending);
                    // Valid for 1 hour to prevent stale restoration
                    if (Date.now() - parsed.timestamp < 3600000) {
                        setGeneratedRecipe(parsed.recipe);
                        setIsOpen(true);
                        toast.success("Welcome back! Restored your pending recipe. Click 'Save' to finish! 💾");
                        localStorage.removeItem('pending_recipe');
                    } else {
                        localStorage.removeItem('pending_recipe');
                    }
                } catch (e) {
                    localStorage.removeItem('pending_recipe');
                }
            }
        }
    }, [user]);

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
            toast.error("Generation Failed: " + (error.message || error));
        } finally {
            console.log("Finished generation, resetting state");
            setIsGenerating(false);
        }
    };

    const performSave = async (currentUser) => {
        setIsSaving(true);
        let toastId = null;

        try {
            if (toast && typeof toast.loading === 'function') {
                toastId = toast.loading("Starting save process...");
            }

            let finalImageUrl = generatedRecipe.image || "";

            // 1. Process Image if it exists
            if (generatedRecipe.image && generatedRecipe.image.startsWith('http')) {
                try {
                    if (toastId) toast.loading("Processing image...", { id: toastId });

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

                } catch (imgErr) {
                    console.warn("Image processing failed (using original):", imgErr);
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
                is_premium: true,
                steps: generatedRecipe.steps || [],
                ingredients: generatedRecipe.ingredients || {},
                // user_id removed as per requirement: recipes go into common pool
            };

            // 3. Insert into DB
            const { data, error } = await supabase
                .from('recipes')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

            if (toastId) toast.dismiss(toastId);
            toast.success("Recipe saved! 🎉");

            handleClose();
            if (onRecipeCreated) onRecipeCreated(data);
            navigate(`/app/meal/${data.id}`);

        } catch (err) {
            console.error("Save Critical Error:", err);
            if (toastId) toast.dismiss(toastId);
            toast.error("Failed to save: " + (err.message || "Unknown error"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleVerifyAndSave = async () => {
        if (!guestOtp) return toast.error("Please enter the code.");
        setIsSaving(true);

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: guestEmail.trim(),
                token: guestOtp,
                type: 'email'
            });

            if (error) throw error;
            const newUser = data.user;

            if (!newUser) throw new Error("Verification failed (no user returned)");

            // CRITICA: Check/Create Profile with Name!
            // 1. Check if profile exists
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', newUser.id)
                .single();

            if (!existingProfile) {
                // INSERT NEW with Name
                console.log("Creating new guest profile...");
                await supabase.from('profiles').insert({
                    id: newUser.id,
                    email: newUser.email,
                    full_name: guestName.trim() || 'Guest Chef',
                    subscription_status: 'premium'  // Enforce membership
                });
            } else {
                console.log("Guest profile exists, proceeding...");
            }

            await performSave(newUser);

        } catch (e) {
            console.error(e);
            toast.error("Verification failed: " + e.message);
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        console.log("handleSave triggered. User:", !!user, "ShowGuestInput:", showGuestEmailInput);
        if (!generatedRecipe) {
            console.warn("No generated recipe, ignoring save.");
            return;
        }

        // If logged in, just save
        if (user) {
            await performSave(user);
            return;
        }

        // Guest Flow Init
        if (!showGuestEmailInput) {
            setShowGuestEmailInput(true);
            return;
        }

        // Validation
        if (!guestName.trim()) {
            return toast.error("Please enter your name so we can save this for you!");
        }
        if (!guestEmail.trim() || !guestEmail.includes('@')) {
            return toast.error("Please enter a valid email address.");
        }

        // Send OTP
        let tid = null;
        try {
            console.log("Sending OTP to:", guestEmail);
            tid = toast.loading("Sending login code...");

            const response = await supabase.auth.signInWithOtp({
                email: guestEmail.trim(),
                options: { data: { full_name: guestName.trim() } } // Metadata backup
            });

            console.log("Supabase OTP Response Full:", response);

            if (!response) throw new Error("No response from Supabase Auth service.");

            const { data, error } = response;
            if (error) throw error;

            // Store pending details just in case
            localStorage.setItem('pending_recipe', JSON.stringify({
                recipe: generatedRecipe,
                timestamp: Date.now()
            }));

            if (tid) toast.dismiss(tid);
            toast.success("Code sent! Check your email.");
            setShowGuestOtpInput(true);
        } catch (e) {
            console.error("Login failed:", e);
            if (tid) toast.dismiss(tid);
            toast.error("Login failed: " + (e.message || "Unknown error"));
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
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-end gap-3 rounded-b-2xl items-center">

                        {/* Guest Name & Email Input */}
                        {showGuestEmailInput && !showGuestOtpInput && !user && (
                            <div className="w-full md:w-auto flex-1 animate-fadeIn flex flex-col md:flex-row gap-3">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Your Name"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    className="w-full md:w-40 px-4 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                                <input
                                    type="email"
                                    placeholder="Enter email to join..."
                                    value={guestEmail}
                                    onChange={(e) => setGuestEmail(e.target.value)}
                                    className="w-full md:w-60 px-4 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        )}

                        {/* Guest OTP Input */}
                        {showGuestOtpInput && !user && (
                            <div className="w-full md:w-auto flex-1 animate-fadeIn flex gap-2">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Enter 6-digit code"
                                    value={guestOtp}
                                    onChange={(e) => setGuestOtp(e.target.value)}
                                    className="w-28 px-2 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center font-mono tracking-widest uppercase"
                                />
                                <button
                                    onClick={() => { setShowGuestOtpInput(false); setShowGuestEmailInput(true); }}
                                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                                >
                                    Back
                                </button>
                            </div>
                        )}

                        <div className="flex gap-3 w-full md:w-auto justify-end">
                            <button
                                onClick={() => setGeneratedRecipe(null)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                            >
                                Discard
                            </button>

                            {/* Main Action Button */}
                            {showGuestOtpInput ? (
                                <button
                                    onClick={handleVerifyAndSave}
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-nouriva-gold text-emerald-900 font-bold rounded-lg shadow hover:bg-yellow-500 transition flex items-center gap-2"
                                >
                                    {isSaving ? 'Verifying...' : 'Verify & Save 🎁'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className={`px-6 py-2 ${showGuestEmailInput ? 'bg-nouriva-gold text-emerald-900' : 'bg-emerald-600 text-white'} font-bold rounded-lg shadow hover:opacity-90 transition flex items-center gap-2`}
                                >
                                    {isSaving ? 'Processing...' : (user ? 'Save & View Recipe' : (showGuestEmailInput ? 'Send Code' : 'Save Recipe'))}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
