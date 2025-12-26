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
            const recipeData = await generateFullRecipe(formData.name, imagePrompt || "Healthy keto style");

            // Populate Form
            setFormData(prev => ({
                ...prev,
                type: recipeData.type || 'dinner',
                is_premium: recipeData.is_premium || false,
                description: recipeData.description || '',
                steps: recipeData.steps || []
            }));

            // Populate Ingredients
            if (recipeData.ingredients) {
                const list = Object.entries(recipeData.ingredients).map(([name, val]) => ({
                    name, quantity: val.quantity, unit: val.unit
                }));
                setIngredientList(list);
            }

            toast.success("Recipe magically generated! ✨");
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1: Name & Description */}
                    <div>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Recipe Name</label>
                            <div className="flex gap-2">
                                <input name="name" value={formData.name} onChange={handleChange} className="flex-1 border p-2 rounded" required placeholder="e.g. Keto Avocado Burger" />
                                <button
                                    type="button"
                                    onClick={handleMagicFill}
                                    disabled={magicFilling}
                                    className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-2 rounded font-bold hover:from-purple-600 hover:to-indigo-700 shadow flex items-center gap-1 text-sm whitespace-nowrap"
                                >
                                    {magicFilling ? 'Thinking...' : '🪄 Magic Fill (Text Only)'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                className="w-full border p-2 rounded h-24 text-sm"
                                placeholder="A short, appetizing summary of the dish..."
                            />
                        </div>
                    </div>

                    {/* Column 2: Type */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="w-full border p-2 rounded">
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack">Snack</option>
                        </select>
                    </div>
                </div>

                {/* New Image Workflow */}
                <div className="border rounded p-4 bg-gray-50">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Recipe Image</label>

                    {/* Tabs */}
                    <div className="flex gap-4 border-b mb-4">
                        <button
                            type="button"
                            onClick={() => setActiveTab('generate')}
                            className={`pb-2 px-1 text-sm font-bold border-b-2 transition ${activeTab === 'generate' ? 'border-nouriva-green text-nouriva-green' : 'border-transparent text-gray-500'}`}
                        >
                            ✨ Generate (AI)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('upload')}
                            className={`pb-2 px-1 text-sm font-bold border-b-2 transition ${activeTab === 'upload' ? 'border-nouriva-green text-nouriva-green' : 'border-transparent text-gray-500'}`}
                        >
                            📁 Upload File
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-3">
                            {activeTab === 'generate' ? (
                                <div>
                                    <textarea
                                        placeholder="Describe the image (e.g. 'A stack of fluffy pancakes with berries, professional food photography')..."
                                        value={imagePrompt}
                                        onChange={(e) => setImagePrompt(e.target.value)}
                                        className="w-full border p-2 rounded h-24 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGeneratePreview}
                                        disabled={generating}
                                        className="mt-2 bg-purple-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-purple-700 w-full md:w-auto"
                                    >
                                        {generating ? 'Generating...' : '🖼️ Generate Image Only'}
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 border-2 border-dashed rounded text-center">
                                    <input type="file" accept="image/*" onChange={handleFileUpload} />
                                </div>
                            )}
                            <p className="text-xs text-gray-500 italic">
                                Note: Image will be optimized and saved to database only when you click "Save Recipe".
                            </p>
                        </div>

                        {/* Preview Area */}
                        <div className="w-full md:w-48 h-48 bg-gray-200 rounded overflow-hidden flex items-center justify-center border">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-400 text-sm">No Preview</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Premium */}
                <div className="flex items-center space-x-2">
                    <input type="checkbox" name="is_premium" id="is_premium" checked={formData.is_premium} onChange={handleChange} className="h-5 w-5 text-nouriva-green" />
                    <label htmlFor="is_premium" className="font-bold text-gray-700">Premium (Subscribers Only)</label>
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
