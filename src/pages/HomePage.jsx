import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { useToast } from "../lib/ToastContext";
import SmartSearchBar from "../components/SmartSearchBar";
import SmartRecipeGenerator from "../components/SmartRecipeGenerator";
import RecipeCardSkeleton from "../components/RecipeCardSkeleton";

function HomePage() {
  const { user, profile, isPremium, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [newFav, setNewFav] = useState("");

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

      // Filter out premium recipes if the user is not signed in (guest)
      const filteredData = user ? data : data.filter(r => !r.is_premium);

      // Calculate Recommendations based on User Preferences
      const favs = profile?.preferences?.favorite_ingredients || [];
      if (user && favs.length > 0) {
        const scored = filteredData.map(recipe => {
          const ingredientsStr = Object.keys(recipe.ingredients || {}).join(' ').toLowerCase();
          let score = 0;
          favs.forEach(fav => {
            if (ingredientsStr.includes(fav.toLowerCase())) {
              score += 1;
            }
          });
          return { recipe, score };
        });

        // Filter for score > 0, sort by score descending, and slice top 3
        const recs = scored
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(item => item.recipe)
          .slice(0, 3);

        setRecommendations(recs);
      } else {
        setRecommendations([]);
      }

      // Group into days (Breakfast + Lunch + Dinner)
      const breakfasts = filteredData.filter(r => r.type === 'breakfast');
      const lunches = filteredData.filter(r => r.type === 'lunch');
      const dinners = filteredData.filter(r => r.type === 'dinner');

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
  }, [user, profile]);

  const handleSearch = async (query) => {
    const cleaned = query.trim();
    setSearchQuery(cleaned);

    // If query is empty or less than 5 characters, immediately reset to default view
    if (cleaned.length < 5) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      // Direct, fast database search on recipes table
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .or(`name.ilike.%${cleaned}%,description.ilike.%${cleaned}%,type.ilike.%${cleaned}%`);

      if (error) throw error;
      const results = data || [];
      const filteredResults = user ? results : results.filter(r => !r.is_premium);

      // Sort by preference match score descending
      const favs = profile?.preferences?.favorite_ingredients || [];
      if (user && favs.length > 0) {
        filteredResults.sort((a, b) => {
          const scoreA = favs.reduce((acc, fav) => {
            const ingStr = Object.keys(a.ingredients || {}).join(' ').toLowerCase();
            return acc + (ingStr.includes(fav.toLowerCase()) ? 1 : 0);
          }, 0);
          const scoreB = favs.reduce((acc, fav) => {
            const ingStr = Object.keys(b.ingredients || {}).join(' ').toLowerCase();
            return acc + (ingStr.includes(fav.toLowerCase()) ? 1 : 0);
          }, 0);
          return scoreB - scoreA;
        });
      }

      setSearchResults(filteredResults);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const addFavoriteIngredient = async (e) => {
    e.preventDefault();
    const ingredient = newFav.trim().toLowerCase();
    if (!ingredient) return;

    const currentFavs = profile?.preferences?.favorite_ingredients || [];
    if (currentFavs.includes(ingredient)) {
      toast.error(`"${ingredient}" is already in your preferences!`);
      setNewFav('');
      return;
    }

    const updatedFavs = [...currentFavs, ingredient];
    const updatedPreferences = {
      ...profile?.preferences,
      favorite_ingredients: updatedFavs
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: updatedPreferences })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(`"${ingredient}" added to preferences!`);
      refreshProfile();
    } catch (err) {
      console.error("Failed to add preference:", err);
      toast.error("Failed to update preferences");
    } finally {
      setNewFav('');
    }
  };

  const removeFavoriteIngredient = async (ingredient) => {
    const currentFavs = profile?.preferences?.favorite_ingredients || [];
    const updatedFavs = currentFavs.filter(fav => fav !== ingredient);
    const updatedPreferences = {
      ...profile?.preferences,
      favorite_ingredients: updatedFavs
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: updatedPreferences })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(`Removed "${ingredient}" from preferences`);
      refreshProfile();
    } catch (err) {
      console.error("Failed to remove preference:", err);
      toast.error("Failed to update preferences");
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
          <div className="h-6 w-16 bg-gray-200 rounded mb-4 animate-pulse" />
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
                : (
                  <Link to="/app/subscribe" className="underline font-bold hover:text-emerald-900">
                    Join the Club for full access to all recipes!
                  </Link>
                )}
            </p>
            {isPremium && (
              <div className="mt-2 text-xs text-emerald-600 bg-white/50 px-2 py-1 rounded inline-block">
                All locked recipes are now open for you. Enjoy! 🥑
              </div>
            )}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 mb-8">
        {/* Left Column: AI Chef & search */}
        <div className="md:col-span-2 space-y-6">
          <SmartRecipeGenerator />
          <SmartSearchBar onSearch={handleSearch} loading={isSearching} />
        </div>

        {/* Right Column: User preferences widget */}
        {user && (
          <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-emerald-800 text-lg flex items-center gap-2 mb-2">
                🥑 Preferred Ingredients
              </h3>
              <p className="text-gray-500 text-xs mb-4">
                Tell us what ingredients you love. We'll recommend and sort recipes matching them first!
              </p>
              
              {/* Preferred Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(profile?.preferences?.favorite_ingredients || []).map((fav, idx) => (
                  <span 
                    key={idx} 
                    className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition cursor-pointer" 
                    onClick={() => removeFavoriteIngredient(fav)}
                    title="Click to remove"
                  >
                    {fav} <span className="text-[9px]">✕</span>
                  </span>
                ))}
                {(profile?.preferences?.favorite_ingredients || []).length === 0 && (
                  <span className="text-gray-400 text-xs italic">No favorites added yet.</span>
                )}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={addFavoriteIngredient} className="flex gap-2 mt-4">
              <input
                type="text"
                value={newFav}
                onChange={e => setNewFav(e.target.value)}
                placeholder="e.g. bacon"
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-gray-800"
              />
              <button 
                type="submit" 
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition shadow"
              >
                Add
              </button>
            </form>
          </div>
        )}
      </div>

      {searchQuery && searchQuery.length >= 5 ? (
        // --- SEARCH RESULTS VIEW ---
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-700 mb-6">
            Results for "{searchQuery}" {!isSearching && <span className="text-sm font-normal text-gray-500">({searchResults?.length || 0} found)</span>}
          </h2>

          {isSearching ? (
            <div className="grid md:grid-cols-3 gap-6">
              <RecipeCardSkeleton />
              <RecipeCardSkeleton />
              <RecipeCardSkeleton />
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {searchResults.map(meal => (
                <div key={meal.id} className="bg-white rounded-xl shadow overflow-hidden transform hover:scale-105 transition duration-200">
                  <p className="bg-gray-100 text-xs uppercase font-semibold text-gray-700 px-3 py-2 flex justify-between">
                    <span>{meal.type}</span>
                    {meal.is_premium && (
                      <span className="bg-nouriva-gold text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide shadow-sm">
                        👑 CLUB EXCLUSIVE
                      </span>
                    )}
                  </p>
                  <Link to={`/app/meal/${meal.id}`}>
                    {meal.image ? (
                      <img src={meal.image} alt={meal.name} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-extrabold text-gray-900 mb-1">{meal.name}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2">{meal.description}</p>
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Custom Recommendations Sub-section */}
          {recommendations.length > 0 && (
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl border border-emerald-100">
              <h2 className="text-2xl font-bold text-emerald-800 mb-6 flex items-center gap-2">
                ✨ Tailored for Your Taste
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {recommendations.map(meal => (
                  <div key={meal.id} className="bg-white rounded-xl shadow border border-emerald-100/50 overflow-hidden transform hover:scale-[1.02] transition duration-200">
                    <p className="bg-emerald-50 text-xs uppercase font-semibold text-emerald-700 px-3 py-2 flex justify-between">
                      <span>{meal.type}</span>
                      <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        PREFERENCE MATCH
                      </span>
                    </p>
                    <Link to={`/app/meal/${meal.id}`}>
                      {meal.image ? (
                        <img src={meal.image} alt={meal.name} className="w-full h-48 object-cover" />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                      )}
                      <div className="p-4">
                        <h3 className="text-lg font-extrabold text-gray-900 mb-1">{meal.name}</h3>
                        <p className="text-gray-500 text-sm line-clamp-2">{meal.description}</p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7-Day Menu View */}
          <div>
            {menu.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
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
                          className="bg-white rounded-xl shadow overflow-hidden transform hover:scale-[1.02] transition duration-200"
                        >
                          <p className="bg-gray-100 text-xs uppercase font-semibold text-gray-700 px-3 py-2 flex justify-between">
                            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                            {meal.is_premium && (
                              <span className="bg-nouriva-gold text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide shadow-sm">
                                👑 CLUB EXCLUSIVE
                              </span>
                            )}
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
                              <p className="text-gray-500 text-sm line-clamp-2 mb-3">{meal.description}</p>
                              <div className="flex items-center text-xs text-gray-400">
                                <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M6 2a2 2 0 00-2 2v2h12V4a2 2 0 00-2-2H6zM4 8v8a2 2 0 002 2h8a2 2 0 002-2V8H4z" />
                                </svg>
                                1 adult serving.
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
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;