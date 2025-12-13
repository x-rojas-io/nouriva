import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { generateRecipeImage } from '../../lib/gemini';

function RecipeEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'breakfast', // breakfast, lunch, dinner, snack
        image: '',
        steps: [''],
        ingredients: {}, // Stored as JSONB in Supabase. Structure: { "Egg": {quantity: 2, unit: "pcs"}, ... }
        is_premium: false
    });

    // Helper state for ingredients list (array for better UI handling)
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
            alert('Could not load recipe');
            navigate('/admin/recipes');
        } else {
            setFormData({
                ...data,
                // Ensure array valid
                steps: data.steps || ['']
            });

            // Convert Ingredients JSON object back to Array for the form
            if (data.ingredients) {
                const list = Object.entries(data.ingredients).map(([name, val]) => ({
                    name,
                    quantity: val.quantity,
                    unit: val.unit
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

    // AI Handler
    const handleAIGenerate = async () => {
        if (!formData.name) {
            alert("Please enter a recipe name first!");
            return;
        }
        setGenerating(true);
        try {
            // Extract ingredient names
            const ingredientNames = ingredientList.map(i => i.name).filter(Boolean);
            const imageUrl = await generateRecipeImage(formData.name, ingredientNames);

            setFormData(prev => ({
                ...prev,
                image: imageUrl
            }));
        } catch (err) {
            alert("Failed to generate image. Check console.");
        } finally {
            setGenerating(false);
        }
    };

    // --- Step Handlers ---
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

    // --- Ingredient Handlers ---
    const handleIngredientChange = (index, field, value) => {
        const newList = [...ingredientList];
        newList[index][field] = value;
        setIngredientList(newList);
    };
    const addIngredient = () => setIngredientList(prev => [...prev, { name: '', quantity: '', unit: '' }]);
    const removeIngredient = (index) => setIngredientList(prev => prev.filter((_, i) => i !== index));

    // --- Save ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        // Convert Ingredient Array -> Object
        const ingredientsObj = {};
        ingredientList.forEach(ing => {
            if (ing.name.trim()) {
                ingredientsObj[ing.name] = {
                    quantity: ing.quantity,
                    unit: ing.unit
                };
            }
        });

        const payload = {
            name: formData.name,
            type: formData.type,
            image: formData.image,
            is_premium: formData.is_premium,
            steps: formData.steps.filter(s => s.trim() !== ''),
            ingredients: ingredientsObj
        };

        let error;
        let data;

        if (isEditMode) {
            const res = await supabase
                .from('recipes')
                .update(payload)
                .eq('id', id)
                .select(); // Request return data to confirm write
            error = res.error;
            data = res.data;
        } else {
            const res = await supabase
                .from('recipes')
                .insert([payload])
                .select(); // Request return data to confirm write
            error = res.error;
            data = res.data;
        }

        // Manual check for silent RLS failures
        if (!error && (!data || data.length === 0)) {
            error = { message: "Database rejected the save (likely permission/RLS issue). No data returned." };
        }

        setSaving(false);
        if (error) {
            console.error(error);
            alert("Error saving: " + error.message);
        } else {
            navigate('/admin/recipes');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">{isEditMode ? 'Edit Recipe' : 'New Recipe'}</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-6">

                {/* Basics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Recipe Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                        >
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack">Snack</option>
                        </select>
                    </div>
                </div>

                {/* Image (Multi-modal) */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Image URL</label>
                    <div className="flex gap-2">
                        <input
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                            placeholder="https://..."
                        />
                        <button
                            type="button"
                            onClick={handleAIGenerate}
                            disabled={generating}
                            className={`text-white px-4 rounded whitespace-nowrap transition flex items-center gap-2 ${generating ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}
                        >
                            {generating ? (
                                <>
                                    <span className="animate-spin">✨</span> Generating...
                                </>
                            ) : (
                                <>✨ AI Generate</>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Powered by Google Gemini. It will generate a prompt and create an image.
                    </p>
                    {formData.image && <img src={formData.image} alt="Preview" className="mt-2 h-64 w-full object-cover rounded shadow" />}
                </div>

                {/* Premium Toggle */}
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        name="is_premium"
                        id="is_premium"
                        checked={formData.is_premium}
                        onChange={handleChange}
                        className="h-5 w-5 text-nouriva-green"
                    />
                    <label htmlFor="is_premium" className="font-bold text-gray-700">Premium (Subscribers Only)</label>
                </div>

                <hr />

                {/* Ingredients */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Ingredients</h3>
                    {ingredientList.map((ing, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                            <input
                                placeholder="Qty (e.g 2)"
                                value={ing.quantity}
                                onChange={(e) => handleIngredientChange(i, 'quantity', e.target.value)}
                                className="w-20 border p-2 rounded"
                            />
                            <input
                                placeholder="Unit (e.g pcs)"
                                value={ing.unit}
                                onChange={(e) => handleIngredientChange(i, 'unit', e.target.value)}
                                className="w-24 border p-2 rounded"
                            />
                            <input
                                placeholder="Name (e.g Eggs)"
                                value={ing.name}
                                onChange={(e) => handleIngredientChange(i, 'name', e.target.value)}
                                className="flex-1 border p-2 rounded"
                            />
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
                            <textarea
                                value={step}
                                onChange={(e) => handleStepChange(i, e.target.value)}
                                className="flex-1 border p-2 rounded h-20"
                            />
                            <button type="button" onClick={() => removeStep(i)} className="text-red-500 font-bold px-2 h-10">X</button>
                        </div>
                    ))}
                    <button type="button" onClick={addStep} className="text-sm text-nouriva-green font-bold">+ Add Step</button>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={() => navigate('/admin/recipes')} className="text-gray-600 px-4 py-2 hover:underline">Cancel</button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-nouriva-green text-white px-8 py-3 rounded font-bold hover:bg-emerald-800 transition"
                    >
                        {saving ? 'Saving...' : 'Save Recipe'}
                    </button>
                </div>

            </form>
        </div>
    );
}

export default RecipeEditor;
