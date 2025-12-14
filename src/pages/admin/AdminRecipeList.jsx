import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ImageBackupButton from '../../components/ImageBackupButton';

function AdminRecipeList() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecipes();
    }, []);

    async function fetchRecipes() {
        const { data, error } = await supabase
            .from('recipes')
            .select('*')
            .order('id', { ascending: false });

        if (error) console.error(error);
        else setRecipes(data);
        setLoading(false);
    }

    async function deleteRecipe(id) {
        if (!window.confirm("Are you sure you want to delete this recipe?")) return;

        const { error } = await supabase.from('recipes').delete().eq('id', id);
        if (error) {
            alert("Error deleting recipe");
        } else {
            setRecipes(recipes.filter(r => r.id !== id));
        }
    }

    function handleBackupComplete(id, newUrl) {
        setRecipes(prev => prev.map(r => r.id === id ? { ...r, image: newUrl } : r));
    }

    if (loading) return <div className="p-8">Loading recipes...</div>;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-emerald-800">Manage Recipes</h1>
                <Link
                    to="/admin/recipes/new"
                    className="bg-nouriva-green text-white px-4 py-2 rounded-full shadow hover:bg-emerald-800 transition font-bold text-sm md:text-base"
                >
                    + New Recipe
                </Link>
            </div>

            {/* Mobile: Stacked Cards */}
            <div className="md:hidden space-y-4">
                {recipes.length === 0 && <div className="text-center text-gray-500 py-8">No recipes found.</div>}
                {recipes.map(recipe => (
                    <div key={recipe.id} className="bg-white rounded-lg shadow p-4 flex gap-4 items-center">
                        {recipe.image ? (
                            <img src={recipe.image} alt={recipe.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                        ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">No Img</div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-gray-800 truncate">{recipe.name}</h3>
                                {recipe.is_premium && <span className="bg-nouriva-gold text-white text-[10px] px-2 py-0.5 rounded-full ml-2">PRO</span>}
                            </div>
                            <p className="text-sm text-gray-500 capitalize">{recipe.type}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-sm font-medium items-center">
                                <Link to={`/admin/recipes/edit/${recipe.id}`} className="text-emerald-600">Edit</Link>
                                <button onClick={() => deleteRecipe(recipe.id)} className="text-red-500">Delete</button>
                                <ImageBackupButton recipe={recipe} onBackupComplete={handleBackupComplete} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-lime-50 border-b border-lime-100">
                        <tr>
                            <th className="p-4 font-bold text-emerald-700">ID</th>
                            <th className="p-4 font-bold text-emerald-700">Image</th>
                            <th className="p-4 font-bold text-emerald-700">Name</th>
                            <th className="p-4 font-bold text-emerald-700">Type</th>
                            <th className="p-4 font-bold text-emerald-700">Premium</th>
                            <th className="p-4 font-bold text-emerald-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recipes.map(recipe => (
                            <tr key={recipe.id} className="hover:bg-gray-50 border-b last:border-0">
                                <td className="p-4 text-gray-500">#{recipe.id}</td>
                                <td className="p-4">
                                    {recipe.image ? (
                                        <img src={recipe.image} alt={recipe.name} className="w-12 h-12 object-cover rounded" />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">No Img</div>
                                    )}
                                </td>
                                <td className="p-4 font-bold text-gray-800">{recipe.name}</td>
                                <td className="p-4 capitalize text-gray-600">{recipe.type}</td>
                                <td className="p-4">
                                    {recipe.is_premium ? (
                                        <span className="bg-nouriva-gold text-white text-xs px-2 py-1 rounded-full font-bold">PRO</span>
                                    ) : (
                                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">Free</span>
                                    )}
                                </td>
                                <td className="p-4 text-right space-x-2 font-medium flex justify-end items-center gap-2">
                                    <ImageBackupButton recipe={recipe} onBackupComplete={handleBackupComplete} />
                                    <Link to={`/admin/recipes/edit/${recipe.id}`} className="text-emerald-600 hover:text-emerald-800">Edit</Link>
                                    <button onClick={() => deleteRecipe(recipe.id)} className="text-red-500 hover:text-red-700">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {recipes.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No recipes found. Create one!</div>
                )}
            </div>
        </div>
    );
}

export default AdminRecipeList;
