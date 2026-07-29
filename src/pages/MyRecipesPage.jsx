import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/AuthContext';
import RecipeCardSkeleton from '../components/RecipeCardSkeleton';

export default function MyRecipesPage() {
    const { user } = useAuth();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMyRecipes() {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('recipes')
                    .select('*')
                    .eq('created_by', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setRecipes(data || []);
            } catch (err) {
                console.error("Error fetching user recipes:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchMyRecipes();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-lime-50 p-8">
                <h1 className="text-3xl font-bold text-center text-emerald-700 mb-8">
                    My Custom Recipes
                </h1>
                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    <RecipeCardSkeleton />
                    <RecipeCardSkeleton />
                    <RecipeCardSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-lime-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-emerald-700">
                        My Custom Recipes
                    </h1>
                    <Link 
                        to="/app/home" 
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full shadow transition"
                    >
                        + Create Recipe
                    </Link>
                </div>

                {recipes.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-xl mx-auto">
                        <div className="text-6xl mb-4">🍳</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No custom recipes yet</h3>
                        <p className="text-gray-500 mb-6">
                            Craving something special? Use our AI Chef on the homepage to generate and save your custom meal plans instantly.
                        </p>
                        <Link 
                            to="/app/home" 
                            className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold rounded-full shadow-lg transition"
                        >
                            Open AI Chef 🪄
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6">
                        {recipes.map(recipe => (
                            <div 
                                key={recipe.id} 
                                className="bg-white rounded-xl shadow overflow-hidden transform hover:scale-[1.02] transition duration-200"
                            >
                                <p className="bg-gray-100 text-xs uppercase font-semibold text-gray-700 px-3 py-2 flex justify-between">
                                    <span>{recipe.type}</span>
                                    <span className="text-[10px] text-emerald-600 font-bold">
                                        ✨ CUSTOM
                                    </span>
                                </p>
                                <Link to={`/app/meal/${recipe.id}`}>
                                    {recipe.image ? (
                                        <img src={recipe.image} alt={recipe.name} className="w-full h-48 object-cover" />
                                    ) : (
                                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                                    )}
                                    <div className="p-4">
                                        <h3 className="text-lg font-extrabold text-gray-900 mb-1">{recipe.name}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-2">{recipe.description}</p>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
