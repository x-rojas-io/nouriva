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
  
  // Data State
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [newFav, setNewFav] = useState("");

  // Revamped UI States
  const [activeDay, setActiveDay] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    <div className="min-h-screen bg-nouriva-cream text-nouriva-charcoal p-8 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nouriva-green"></div>
      <p className="text-gray-500 mt-4 tracking-wider uppercase text-sm">Curating Your Selection...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-nouriva-cream text-nouriva-charcoal p-8">
      {/* Brand Header */}
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-nouriva-green tracking-tight uppercase">
          Nouriva Club
        </h1>
        <p className="text-gray-400 text-xs mt-2 tracking-widest uppercase font-medium">
          Curated Culinary Selections
        </p>
        
        {user && (
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-4 bg-white px-6 py-3 rounded-full border border-gray-100 shadow-sm text-sm">
            <span className="font-semibold text-nouriva-charcoal">
              Welcome, {profile?.full_name || user.email}!
            </span>
            <span className="text-gray-200">|</span>
            <span className="text-nouriva-gold font-bold flex items-center gap-1">
              {isPremium ? '✨ CLUB MEMBER' : 'STANDARD MEMBER'}
            </span>
            <span className="text-gray-200">|</span>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="text-nouriva-green font-bold hover:text-nouriva-gold flex items-center gap-1 transition-colors"
            >
              🥑 Customize Taste
            </button>
          </div>
        )}
      </div>

      {/* Main Single Column Feed */}
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Interactive Chef Widget & Search */}
        <div className="space-y-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <SmartRecipeGenerator />
          <SmartSearchBar onSearch={handleSearch} loading={isSearching} />
        </div>

        {searchQuery && searchQuery.length >= 5 ? (
          // --- SEARCH RESULTS VIEW ---
          <div>
            <h2 className="text-2xl font-bold text-nouriva-green tracking-wide uppercase mb-6">
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
                  <div key={meal.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-nouriva-green/20 hover:shadow-lg transition duration-300">
                    <p className="bg-nouriva-cream text-xs uppercase font-bold text-gray-500 px-4 py-3 flex justify-between border-b border-gray-50">
                      <span>{meal.type}</span>
                      {meal.is_premium && (
                        <span className="text-nouriva-gold font-extrabold tracking-wide">
                          👑 CLUB
                        </span>
                      )}
                    </p>
                    <Link to={`/app/meal/${meal.id}`}>
                      {meal.image ? (
                        <img src={meal.image} alt={meal.name} className="w-full h-56 object-cover" />
                      ) : (
                        <div className="w-full h-56 bg-gray-50 flex items-center justify-center text-gray-400">No Image</div>
                      )}
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-nouriva-charcoal hover:text-nouriva-green transition-colors mb-2">{meal.name}</h3>
                        <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{meal.description}</p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
                No recipes found matching your criteria. Try another keyword!
              </div>
            )}
          </div>
        ) : (
          // --- DEFAULT MENU VIEW ---
          <div className="space-y-12">
            {/* Custom Recommendations Sub-section */}
            {recommendations.length > 0 && (
              <div className="p-8 bg-gradient-to-br from-emerald-50/30 to-teal-50/10 rounded-3xl border border-emerald-100/50">
                <h2 className="text-lg font-bold text-nouriva-green tracking-wider uppercase mb-6 flex items-center gap-2">
                  ✨ Tailored for Your Taste
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {recommendations.map(meal => (
                    <div key={meal.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-nouriva-green/20 hover:shadow-lg transition duration-300">
                      <p className="bg-nouriva-cream text-xs uppercase font-bold text-nouriva-gold px-4 py-3 flex justify-between border-b border-gray-50">
                        <span>{meal.type}</span>
                        <span className="font-extrabold tracking-wide">RECOMMENDED</span>
                      </p>
                      <Link to={`/app/meal/${meal.id}`}>
                        {meal.image ? (
                          <img src={meal.image} alt={meal.name} className="w-full h-56 object-cover" />
                        ) : (
                          <div className="w-full h-56 bg-gray-50 flex items-center justify-center text-gray-400">No Image</div>
                        )}
                        <div className="p-6">
                          <h3 className="text-lg font-bold text-nouriva-charcoal hover:text-nouriva-green transition-colors mb-2">{meal.name}</h3>
                          <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{meal.description}</p>
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
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                  <div className="text-6xl mb-4">🥗</div>
                  <h3 className="text-xl font-bold text-gray-600">No Weekly Menu Available Yet</h3>
                  <p className="text-gray-500">Check back later or browse individual snacks.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Day Navigation Tabs */}
                  <div className="flex flex-col items-center border-b border-gray-100 pb-6">
                    <h2 className="text-lg font-bold text-nouriva-green tracking-wider uppercase mb-4">
                      Weekly Meal Plan
                    </h2>
                    <div className="flex flex-wrap justify-center gap-2">
                      {menu.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveDay(idx)}
                          className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 ${
                            activeDay === idx
                              ? 'bg-nouriva-green text-white shadow-md'
                              : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                          }`}
                        >
                          Day {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Day Cards */}
                  {menu[activeDay] && (
                    <div className="grid md:grid-cols-3 gap-8">
                      {["breakfast", "lunch", "dinner"].map((type) => {
                        const meal = menu[activeDay][type];
                        if (!meal) return null;
                        return (
                          <div
                            key={meal.id}
                            className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-nouriva-green/20 hover:shadow-lg transition duration-300 flex flex-col justify-between"
                          >
                            <div>
                              <p className="bg-nouriva-cream text-xs uppercase font-bold text-gray-500 px-4 py-3 flex justify-between border-b border-gray-50">
                                <span>{type}</span>
                                {meal.is_premium && (
                                  <span className="text-nouriva-gold font-extrabold tracking-wide">
                                    👑 CLUB
                                  </span>
                                )}
                              </p>

                              <Link to={`/app/meal/${meal.id}`}>
                                {meal.image ? (
                                  <img
                                    src={meal.image}
                                    alt={meal.name}
                                    className="w-full h-56 object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-56 bg-gray-50 flex items-center justify-center text-gray-400">No Image</div>
                                )}
                                <div className="p-6">
                                  <h3 className="text-lg font-bold text-nouriva-charcoal hover:text-nouriva-green transition-colors mb-2">
                                    {meal.name}
                                  </h3>
                                  <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-3">{meal.description}</p>
                                </div>
                              </Link>
                            </div>
                            <div className="px-6 pb-6 pt-2 flex items-center text-xs text-gray-400 border-t border-gray-50 mt-2">
                              <svg className="w-4 h-4 mr-1.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              1 serving
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Preferences Drawer */}
      {user && isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop overlay */}
            <div 
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            />
            
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md transform transition-all duration-300 ease-in-out shadow-2xl">
                <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl border-l border-gray-100">
                  <div className="px-6 flex items-center justify-between border-b border-gray-100 pb-4">
                    <h2 className="text-lg font-bold text-nouriva-green uppercase tracking-wide flex items-center gap-2">
                      🥑 Customize Taste
                    </h2>
                    <button 
                      onClick={() => setIsDrawerOpen(false)} 
                      className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <span className="sr-only">Close panel</span>
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="relative mt-6 flex-1 px-6 space-y-6">
                    <div>
                      <p className="text-gray-500 text-sm leading-relaxed mb-4">
                        Add ingredients you love (e.g. avocado, chicken, bacon). We'll automatically curate and prioritize recommendations matching your taste.
                      </p>
                      
                      {/* Preferred Tags */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {(profile?.preferences?.favorite_ingredients || []).map((fav, idx) => (
                          <span 
                            key={idx} 
                            className="bg-emerald-50 text-nouriva-green border border-emerald-100 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-red-50 hover:text-red-700 hover:border-red-100 transition cursor-pointer" 
                            onClick={() => removeFavoriteIngredient(fav)}
                            title="Click to remove"
                          >
                            {fav} <span className="text-[10px]">✕</span>
                          </span>
                        ))}
                        {(profile?.preferences?.favorite_ingredients || []).length === 0 && (
                          <span className="text-gray-400 text-xs italic">No favorite ingredients added yet.</span>
                        )}
                      </div>
                    </div>

                    {/* Input Form */}
                    <form onSubmit={addFavoriteIngredient} className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">Add Favorite Ingredient</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFav}
                          onChange={e => setNewFav(e.target.value)}
                          placeholder="e.g. avocado"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-nouriva-green text-gray-800 bg-transparent"
                        />
                        <button 
                          type="submit" 
                          className="px-4 py-2 bg-nouriva-green hover:bg-emerald-800 text-white rounded-lg text-sm font-bold transition shadow"
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;