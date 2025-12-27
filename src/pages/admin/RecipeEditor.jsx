import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

import { optimizeImage } from '../../lib/imageUtils';
import { useToast } from '../../lib/ToastContext';
import { generateFullRecipe } from '../../lib/gemini'; // Import generator

function RecipeEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [magicFilling, setMagicFilling] = useState(false); // New loading state

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'breakfast',
        image: '', // This will hold the FINAL URL (Supabase or otherwise)
        steps: [''],
        ingredients: {},
        is_premium: false
    });

    // Image Workflow State
    const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'upload'
    const [imagePrompt, setImagePrompt] = useState(''); // Manual prompt
    const [imageFile, setImageFile] = useState(null); // File to upload on save
    const [previewUrl, setPreviewUrl] = useState(''); // Valid URL to show the user now

    // Helper state for ingredients list
    const [ingredientList, setIngredientList] = useState([
        { name: '', quantity: '', unit: '' }
    ]);

    useEffect(() => {
        if (isEditMode) {
            loadRecipe();
        }
    }, [id]);

    async function loadRecipe() {
        const { data, error } = await supabase.from('recipes').select('*').eq('id', id).single();
        if (error) {
            console.error(error);
            toast.error('Could not load recipe');
            navigate('/admin/recipes');
        } else {
            setFormData({ ...data, steps: data.steps || [''] });
            setPreviewUrl(data.image || ''); // Show existing image
            // Convert Ingredients
            if (data.ingredients) {
                const list = Object.entries(data.ingredients).map(([name, val]) => ({
                    name, quantity: val.quantity, unit: val.unit
                }));
                if (list.length === 0) list.push({ name: '', quantity: '', unit: '' });
                setIngredientList(list);
            }
        }
        setLoading(false);
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // --- AI Magic Fill Handler ---
    const handleMagicFill = async () => {
        if (!formData.name) return toast.error("Please enter a Recipe Name first!");

        setMagicFilling(true);
        try {
            // Use Name + Description as the Prompt Context
            const recipeData = await generateFullRecipe(formData.name, formData.description || "Strict Keto");

            // Populate Form
            setFormData(prev => ({
                ...prev,
                type: recipeData.type || 'dinner',
                is_premium: recipeData.is_premium || false,
                description: recipeData.description || '',
                steps: recipeData.steps || []
            }));

            // Handle Generated Image
            if (recipeData.image) {
                setPreviewUrl(recipeData.image);
                // Convert URL to Blob for upload
                try {
                    const res = await fetch(recipeData.image);
                    const blob = await res.blob();
                    setImageFile(blob);
                } catch (imgErr) {
                    console.error("Failed to fetch generated image blob:", imgErr);
                }
            }

            // Populate Ingredients
            if (recipeData.ingredients) {
                const list = Object.entries(recipeData.ingredients).map(([name, val]) => ({
                    name, quantity: val.quantity, unit: val.unit
                }));
                setIngredientList(list);
            }

            toast.success("Recipe and image generated! ✨");
        } catch (err) {
            console.error(err);
            toast.error("Magic Fill failed. Check API configuration.");
        } finally {
            setMagicFilling(false);
        }
    };

    // --- Image Workflow Handlers ---

    // 1. Generate (Preview Only)
    const handleGeneratePreview = async () => {
        if (!imagePrompt) return toast.error("Please enter a prompt!");
        setGenerating(true);
        try {
            // Using Pollinations for volatile preview
            const encodedPrompt = encodeURIComponent(imagePrompt + " realistic, 4k, food photography, cinematic lighting");
            const tempUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true`;

            // Fetch it to a blob immediately so we can treat it like an upload
            const res = await fetch(tempUrl);
            const blob = await res.blob();

            setPreviewUrl(URL.createObjectURL(blob)); // Show it
            setImageFile(blob); // Queue it for upload
        } catch (err) {
            console.error(err);
            toast.error("Generation failed");
        } finally {
            setGenerating(false);
        }
    };

    // 2. Upload (Preview Only)
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
            setImageFile(file);
        }
    };

    // --- Step/Ingredient Handlers (Same as before) ---
    const handleStepChange = (index, value) => {
        const newSteps = [...formData.steps];
        newSteps[index] = value;
        setFormData(prev => ({ ...prev, steps: newSteps }));
    };
    const addStep = () => setFormData(prev => ({ ...prev, steps: [...prev.steps, ''] }));
    const removeStep = (index) => {
        const newSteps = formData.steps.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, steps: newSteps }));
    };
    const handleIngredientChange = (index, field, value) => {
        const newList = [...ingredientList];
        newList[index][field] = value;
        setIngredientList(newList);
    };
    const addIngredient = () => setIngredientList(prev => [...prev, { name: '', quantity: '', unit: '' }]);
    const removeIngredient = (index) => setIngredientList(prev => prev.filter((_, i) => i !== index));

    // --- SAVE (Atomic: Optimize -> Upload -> Save DB) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // 0. Validation: Check for duplicates (Create mode only)
            if (!isEditMode) {
                const { data: existing } = await supabase
                    .from('recipes')
                    .select('id')
                    .ilike('name', formData.name.trim())
                    .single();

                if (existing) {
                    throw new Error(`A recipe named "${formData.name}" already exists!`);
                }
            }

            let finalImageUrl = formData.image;

            // 1. Handle Image Persistence (If new image)
            if (imageFile) {
                // Optimize
                const optimizedBlob = await optimizeImage(imageFile);

                // Upload
                const fileName = `recipe_${Date.now()}.jpg`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(fileName, optimizedBlob, { contentType: 'image/jpeg', upsert: true });

                if (uploadError) {
                    throw uploadError;
                }

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(fileName);

                finalImageUrl = publicUrl;
            }

            // 2. Prepare Payload
            const ingredientsObj = {};
            ingredientList.forEach(ing => {
                if (ing.name.trim()) {
                    ingredientsObj[ing.name] = { quantity: ing.quantity, unit: ing.unit };
                }
            });

            const payload = {
                name: formData.name.trim(), // Normalize name
                description: formData.description,
                type: formData.type,
                image: finalImageUrl,
                is_premium: formData.is_premium,
                steps: formData.steps.filter(s => s.trim() !== ''),
                ingredients: ingredientsObj
            };

            // 3. Save to DB
            let error, data;
            if (isEditMode) {
                const res = await supabase.from('recipes').update(payload).eq('id', id).select();
                error = res.error; data = res.data;
            } else {
                const res = await supabase.from('recipes').insert([payload]).select();
                error = res.error; data = res.data;
            }

            if (!error && (!data || data.length === 0)) {
                throw new Error("Database rejected save (RLS).");
            }
            if (error) throw error;

            toast.success('Recipe saved successfully!');
            navigate('/admin/recipes');

        } catch (err) {
            console.error("Save Error:", err);
            toast.error("Error saving: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-emerald-800 mb-8">{isEditMode ? 'Edit Recipe' : 'New Recipe'}</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-6">

                {/* Basics */}
                {/* Basics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Column 1: Inputs for Creator */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Recipe Name *</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                required
                                placeholder="e.g. Keto Avocado Burger"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Description / AI Prompt</label>
                            <textarea
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                className="w-full border border-gray-300 p-2 rounded h-32 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                placeholder="Enter instructions (e.g. 'Spicy, no onions') OR a final summary. The AI will use this to generate the recipe."
                            />
                        </div>

                        {/* Magic Button - Prominent */}
                        <button
                            type="button"
                            onClick={handleMagicFill}
                            disabled={magicFilling}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3 rounded-lg font-bold hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2"
                        >
                            {magicFilling ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Create Magic...
                                </>
                            ) : (
                                <>✨ Magic Fill (Generate Everything)</>
                            )}
                        </button>
                    </div>

                    {/* Column 2: Meta, Options & Preview */}
                    <div className="space-y-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Meal Type</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded bg-white">
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="snack">Snack</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input type="checkbox" name="is_premium" id="is_premium" checked={formData.is_premium} onChange={handleChange} className="h-5 w-5 text-nouriva-green accent-emerald-600 focus:ring-emerald-500" />
                            <label htmlFor="is_premium" className="font-bold text-gray-700 cursor-pointer select-none">Premium (Subscribers Only)</label>
                        </div>

                        {/* Image Preview Card */}
                        <div className="mt-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Image Preview</label>
                            <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center border border-gray-300 shadow-inner relative group">
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all"></div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <div className="text-4xl mb-2">🖼️</div>
                                        <span className="text-gray-400 text-sm">Image will appear here</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 text-right">
                                <label className="text-xs text-blue-600 cursor-pointer hover:underline">
                                    Upload manually?
                                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <hr />

                {/* Ingredients (Simplified View for brevity in this replace) */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Ingredients</h3>
                    {ingredientList.map((ing, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                            <input placeholder="Qty" value={ing.quantity} onChange={(e) => handleIngredientChange(i, 'quantity', e.target.value)} className="w-20 border p-2 rounded" />
                            <input placeholder="Unit" value={ing.unit} onChange={(e) => handleIngredientChange(i, 'unit', e.target.value)} className="w-24 border p-2 rounded" />
                            <input placeholder="Name" value={ing.name} onChange={(e) => handleIngredientChange(i, 'name', e.target.value)} className="flex-1 border p-2 rounded" />
                            <button type="button" onClick={() => removeIngredient(i)} className="text-red-500 font-bold px-2">X</button>
                        </div>
                    ))}
                    <button type="button" onClick={addIngredient} className="text-sm text-nouriva-green font-bold">+ Add Ingredient</button>
                </div>

                <hr />

                {/* Steps */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Instructions</h3>
                    {formData.steps.map((step, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                            <span className="mt-2 text-gray-400 font-bold">{i + 1}.</span>
                            <textarea value={step} onChange={(e) => handleStepChange(i, e.target.value)} className="flex-1 border p-2 rounded h-20" />
                            <button type="button" onClick={() => removeStep(i)} className="text-red-500 font-bold px-2 h-10">X</button>
                        </div>
                    ))}
                    <button type="button" onClick={addStep} className="text-sm text-nouriva-green font-bold">+ Add Step</button>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={() => navigate('/admin/recipes')} className="text-gray-600 px-4 py-2 hover:underline">Cancel</button>
                    <button type="submit" disabled={saving} className="bg-nouriva-green text-white px-8 py-3 rounded font-bold hover:bg-emerald-800 transition">
                        {saving ? 'Saving & Uploading...' : 'Save Recipe'}
                    </button>
                </div>
            </form >
        </div >
    );
}

export default RecipeEditor;
