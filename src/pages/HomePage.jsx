import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { understandRecipeQuery } from "../lib/gemini";
import SmartSearchBar from "../components/SmartSearchBar";
import RecipeCardSkeleton from "../components/RecipeCardSkeleton";

function HomePage() {
  const { user, profile, isPremium } = useAuth();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function fetchMenu() {
      const { data, error } = await supabase
        .from('recipes')
        .select('*');

      if (error) {
        console.error("Error loading menu:", error);
        setLoading(false);
        return;
      }

      // Group into days (Breakfast + Lunch + Dinner)
      const breakfasts = data.filter(r => r.type === 'breakfast');
      const lunches = data.filter(r => r.type === 'lunch');
      const dinners = data.filter(r => r.type === 'dinner');

      const maxDays = Math.min(breakfasts.length, lunches.length, dinners.length);
      const newMenu = [];

      for (let i = 0; i < maxDays; i++) {
        newMenu.push({
          breakfast: breakfasts[i],
          lunch: lunches[i],
          dinner: dinners[i]
        });
      }

      setMenu(newMenu);
      setLoading(false);
    }

    fetchMenu();
  }, []);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      // 1. Understand Intent
      const params = await understandRecipeQuery(query);
      console.log("Search Params:", params);

      // 2. Fetch Candidates (Broad search first, filter later for complex JSON)
      let dbQuery = supabase.from('recipes').select('*');

      // Strict Type Filter
      if (params.type && params.type !== 'any') {
        dbQuery = dbQuery.eq('type', params.type);
      }

      // Text Search (Name)
      if (params.text_search) {
        dbQuery = dbQuery.ilike('name', `%${params.text_search}%`);
      }

      const { data, error } = await dbQuery;

      if (error) throw error;

      // 3. Client-Side Filtering (Exclusions/Inclusions match)
      let finalResults = data || [];

      // Exclusions (e.g. "no eggs")
      if (params.exclude_ingredients && params.exclude_ingredients.length > 0) {
        finalResults = finalResults.filter(recipe => {
          const recipeIngredients = JSON.stringify(recipe.ingredients || {}).toLowerCase();
          // Check if ANY excluded ingredient is present
          const hasExcluded = params.exclude_ingredients.some(ex => recipeIngredients.includes(ex.toLowerCase()));
          return !hasExcluded;
        });
      }

      // Inclusions (e.g. "with avocado") - Only if not already covered by text search
      if (params.include_ingredients && params.include_ingredients.length > 0) {
        finalResults = finalResults.filter(recipe => {
          const recipeIngredients = JSON.stringify(recipe.ingredients || {}).toLowerCase();
          // Check if ALL included ingredients are present
          return params.include_ingredients.every(inc => recipeIngredients.includes(inc.toLowerCase()));
        });
      }

      setSearchResults(finalResults);

    } catch (err) {
      console.error("Search failed:", err);
      alert("Search failed. See console.");
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-lime-50 text-gray-800 p-8">
      <h1 className="text-3xl font-bold text-center text-emerald-700 mb-8">
        Nouriva Club
      </h1>
      {/* Skeleton for 2 days */}
      {[1, 2].map((day) => (
        <div key={day} className="mb-12">
          <div className="h-6 w-16 bg-gray-200 rounded mb-4 animate-pulse" /> {/* Day Title Skeleton */}
          <div className="grid md:grid-cols-3 gap-6">
            <RecipeCardSkeleton />
            <RecipeCardSkeleton />
            <RecipeCardSkeleton />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-lime-50 text-gray-800 p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-emerald-700">
          Nouriva Club
        </h1>
        {user && (
          <div className="mt-4 bg-emerald-100 border border-emerald-300 rounded-lg p-4 inline-block max-w-2xl mx-auto">
            <h2 className="text-emerald-800 font-bold">Welcome back!</h2>
            <p className="text-emerald-700 text-sm">
              {isPremium
                ? '✨ Premium Member Access Unlocked'
                : 'Upgrade to Premium for full access to all recipes.'}
            </p>
            {isPremium && (
              <div className="mt-2 text-xs text-emerald-600 bg-white/50 px-2 py-1 rounded inline-block">
                Full Premium Dashboard Coming Soon...
              </div>
            )}
          </div>
        )}
      </div>

      <SmartSearchBar onSearch={handleSearch} loading={isSearching} />

      {searchQuery ? (
        // --- SEARCH RESULTS VIEW ---
        <div>
          <h2 className="text-2xl font-bold text-gray-700 mb-6">
            Results for "{searchQuery}" <span className="text-sm font-normal text-gray-500">({searchResults?.length || 0} found)</span>
          </h2>

          {searchResults && searchResults.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {searchResults.map(meal => (
                <div key={meal.id} className="bg-white rounded-xl shadow overflow-hidden transform hover:scale-105 transition duration-200">
                  <p className="bg-gray-100 text-xs uppercase font-semibold text-gray-700 px-3 py-2 flex justify-between">
                    <span>{meal.type}</span>
                    {meal.is_premium && <span className="text-nouriva-gold">👑 PRO</span>}
                  </p>
                  <Link to={`/app/meal/${meal.id}`}>
                    {meal.image ? (
                      <img src={meal.image} alt={meal.name} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-extrabold text-gray-900 mb-1">{meal.name}</h3>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              No recipes found matching your criteria. Try a different search!
            </div>
          )}
        </div>
      ) : (
        // --- DEFAULT MENU VIEW ---
        <>
          {menu.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🥗</div>
              <h3 className="text-xl font-bold text-gray-600">No Weekly Menu Available Yet</h3>
              <p className="text-gray-500">Check back later or browse individual snacks.</p>
              {user ? (
                <div className="mt-4 text-sm text-gray-400">Admin: Go to Admin Panel to add Breakfast, Lunch, and Dinner recipes to populate this.</div>
              ) : null}
            </div>
          ) : (
            menu.map((day, index) => (
              <div key={index} className="mb-12">
                <h2 className="text-xl font-semibold text-amber-600 mb-4">
                  Day {index + 1}
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {["breakfast", "lunch", "dinner"].map((type) => {
                    const meal = day[type];
                    return (
                      <div
                        key={meal.id}
                        className="bg-white rounded-xl shadow overflow-hidden transform hover:scale-105 transition duration-200"
                      >
                        <p className="bg-gray-100 text-xs uppercase font-semibold text-gray-700 px-3 py-2 flex justify-between">
                          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                          {meal.is_premium && <span className="text-nouriva-gold">👑 PRO</span>}
                        </p>

                        <Link to={`/app/meal/${meal.id}`}>
                          {meal.image ? (
                            <img
                              src={meal.image}
                              alt={meal.name}
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                          )}
                          <div className="p-4">
                            <h3 className="text-lg font-extrabold text-gray-900 mb-1">
                              {meal.name}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6 2a2 2 0 00-2 2v2h12V4a2 2 0 00-2-2H6zM4 8v8a2 2 0 002 2h8a2 2 0 002-2V8H4z" />
                              </svg>
                              All recipes are designed for 1 adult serving.
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

export default HomePage;