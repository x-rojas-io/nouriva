import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import RecipeCardSkeleton from "../components/RecipeCardSkeleton";

function HomePage() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <h1 className="text-3xl font-bold text-center text-emerald-700 mb-8">
        Nouriva Club
      </h1>

      {menu.map((day, index) => (
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
                  className="bg-white rounded-xl shadow overflow-hidden"
                >
                  <p className="bg-gray-100 text-xs uppercase font-semibold text-gray-700 px-3 py-2">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </p>

                  <Link to={`/meal/${meal.id}`}>
                    <img
                      src={meal.image}
                      alt={meal.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-extrabold text-gray-900 mb-1">
                        {meal.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
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
      ))}
    </div>
  );
}

export default HomePage;