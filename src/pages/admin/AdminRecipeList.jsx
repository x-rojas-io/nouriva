import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

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

    if (loading) return <div className="p-8">Loading recipes...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Manage Recipes</h1>
                <Link
                    to="/admin/recipes/new"
                    className="bg-nouriva-green text-white px-4 py-2 rounded shadow hover:bg-emerald-800 transition"
                >
                    + New Recipe
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 border-b font-semibold text-gray-600">ID</th>
                            <th className="p-4 border-b font-semibold text-gray-600">Image</th>
                            <th className="p-4 border-b font-semibold text-gray-600">Name</th>
                            <th className="p-4 border-b font-semibold text-gray-600">Type</th>
                            <th className="p-4 border-b font-semibold text-gray-600">Premium</th>
                            <th className="p-4 border-b font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recipes.map(recipe => (
                            <tr key={recipe.id} className="hover:bg-gray-50">
                                <td className="p-4 border-b text-gray-500">#{recipe.id}</td>
                                <td className="p-4 border-b">
                                    {recipe.image ? (
                                        <img src={recipe.image} alt={recipe.name} className="w-12 h-12 object-cover rounded" />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">No Img</div>
                                    )}
                                </td>
                                <td className="p-4 border-b font-medium text-gray-800">{recipe.name}</td>
                                <td className="p-4 border-b capitalize text-gray-600">{recipe.type}</td>
                                <td className="p-4 border-b">
                                    {recipe.is_premium ? (
                                        <span className="bg-nouriva-gold text-white text-xs px-2 py-1 rounded-full">Pro</span>
                                    ) : (
                                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">Free</span>
                                    )}
                                </td>
                                <td className="p-4 border-b text-right space-x-2">
                                    <Link to={`/admin/recipes/edit/${recipe.id}`} className="text-emerald-600 hover:underline">Edit</Link>
                                    <button onClick={() => deleteRecipe(recipe.id)} className="text-red-600 hover:underline">Delete</button>
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
