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
            <div className="min-h-screen bg-nouriva-cream p-8">
                <div className="max-w-6xl mx-auto text-center mb-8">
                    <h1 className="text-3xl font-black text-nouriva-green uppercase tracking-tight">
                        My Custom Recipes
                    </h1>
                </div>
                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    <RecipeCardSkeleton />
                    <RecipeCardSkeleton />
                    <RecipeCardSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-nouriva-cream text-nouriva-charcoal p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                    <h1 className="text-3xl font-black text-nouriva-green uppercase tracking-tight">
                        My Custom Recipes
                    </h1>
                    <Link 
                        to="/app/home" 
                        className="px-5 py-2.5 bg-nouriva-green hover:bg-emerald-800 text-white font-bold rounded-full shadow transition"
                    >
                        + Create Recipe
                    </Link>
                </div>

                {recipes.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8 max-w-xl mx-auto">
                        <div className="text-6xl mb-4">🍳</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No custom recipes yet</h3>
                        <p className="text-gray-500 mb-6 text-sm">
                            Craving something special? Use our AI Chef on the homepage to generate and save your custom meal plans instantly.
                        </p>
                        <Link 
                            to="/app/home" 
                            className="inline-block px-6 py-3 bg-nouriva-green hover:bg-emerald-800 text-white font-bold rounded-full shadow transition"
                        >
                            Open AI Chef 🪄
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6">
                        {recipes.map(recipe => (
                            <div 
                                key={recipe.id} 
                                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-nouriva-green/20 hover:shadow-lg transition duration-300 flex flex-col justify-between"
                            >
                                <div>
                                    <p className="bg-nouriva-cream text-xs uppercase font-bold text-gray-500 px-4 py-3 flex justify-between border-b border-gray-50">
                                        <span>{recipe.type}</span>
                                        <span className="text-nouriva-green font-extrabold">
                                            ✨ CUSTOM
                                        </span>
                                    </p>
                                    <Link to={`/app/meal/${recipe.id}`}>
                                        {recipe.image ? (
                                            <img src={recipe.image} alt={recipe.name} className="w-full h-56 object-cover" />
                                        ) : (
                                            <div className="w-full h-56 bg-gray-50 flex items-center justify-center text-gray-400">No Image</div>
                                        )}
                                        <div className="p-6">
                                            <h3 className="text-lg font-bold text-nouriva-charcoal hover:text-nouriva-green transition-colors mb-2">{recipe.name}</h3>
                                            <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{recipe.description}</p>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
