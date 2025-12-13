import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import PremiumLock from "../components/PremiumLock";

function MealsPage() {
  const { mealId } = useParams();
  const navigate = useNavigate();
  const { isPremium, loading: authLoading } = useAuth();

  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeal() {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', mealId)
        .single();

      if (error) {
        console.error("Error loading meal:", error);
      } else {
        setMeal(data);
      }
      setLoading(false);
    }

    if (mealId) {
      fetchMeal();
    }
  }, [mealId]);

  if (loading || authLoading) return (
    <div className="min-h-screen bg-lime-50 text-gray-800 p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 w-20 bg-gray-300 rounded"></div>
        <div className="h-8 w-1/3 bg-gray-300 rounded mx-auto"></div>
        <div className="w-16"></div>
      </div>

      {/* Main Content Skeleton */}
      <div className="md:flex md:gap-6 bg-white border-l-4 border-gray-300 p-6 rounded shadow">
        {/* Image Skeleton */}
        <div className="w-full md:w-72 h-60 bg-gray-300 rounded mb-4 md:mb-0"></div>

        {/* Text Details Skeleton */}
        <div className="flex-1 space-y-4">
          <div className="h-6 w-1/4 bg-gray-300 rounded"></div> {/* "Ingredients" title */}
          <div className="space-y-2">
            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
          </div>

          <div className="h-6 w-1/4 bg-gray-300 rounded mt-6"></div> {/* "Steps" title */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!meal) return (
    <div className="text-center mt-10 text-red-600">
      Meal not found.
    </div>
  );

  const isLocked = meal.is_premium && !isPremium;

  return (
    <div className="min-h-screen bg-lime-50 text-gray-800 p-8">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-emerald-600 font-medium hover:underline"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-center text-emerald-700 flex-grow">
          {meal.name}
          {meal.is_premium && <span className="ml-2 text-xs bg-nouriva-gold text-white px-2 py-1 rounded-full align-middle">PRO</span>}
        </h1>
        <div className="w-16" />
      </div>

      {isLocked ? (
        <PremiumLock title={meal.name} />
      ) : (
        <div className="md:flex md:gap-6 bg-white border-l-4 border-emerald-500 p-6 rounded shadow">
          {meal.image && (
            <img
              src={meal.image}
              alt={meal.name}
              className="w-full md:w-72 h-60 object-cover rounded mb-4 md:mb-0"
            />
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-amber-600 mb-2">
              Ingredients
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-700 mb-4">
              {Object.entries(meal.ingredients).map(([name, info], i) => (
                <li key={i}>
                  {info.quantity} {info.unit} {name}
                </li>
              ))}
            </ul>

            <h2 className="text-lg font-semibold text-amber-600 mb-2">
              Steps
            </h2>
            <div className="space-y-2">
              {meal.steps.map((step, index) => (
                <p key={index}>{step}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MealsPage;