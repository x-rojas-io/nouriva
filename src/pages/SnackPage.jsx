import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import RecipeCardSkeleton from "../components/RecipeCardSkeleton";

function SnackPage() {
  const { isPremium, loading: authLoading } = useAuth();
  const [snacks, setSnacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSnacks() {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('type', 'snack');

      if (error) {
        console.error("Error loading snacks:", error);
      } else {
        setSnacks(data);
      }
      setLoading(false);
    }
    fetchSnacks();
  }, []);

  if (loading || authLoading) return (
    <div className="min-h-screen bg-nouriva-cream px-4 py-8">
      <h1 className="text-3xl font-black text-center text-nouriva-green uppercase tracking-tight mb-8">
        Healthy Snacks
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <RecipeCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );

  // 🔒 Club Exclusive Logic
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-nouriva-cream px-4 py-12 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white p-8 rounded-3xl shadow-xl text-center border-t-4 border-nouriva-gold">
          <div className="text-6xl mb-6">🥑</div>
          <h2 className="text-3xl font-bold text-nouriva-green mb-4">Club Exclusive Snacks</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Our curated list of healthy, keto-friendly snacks is exclusively available to <strong>Nouriva Club</strong> members.
          </p>

          <div className="bg-emerald-50/20 p-4 rounded-xl mb-8 text-sm text-nouriva-green font-medium">
            Join 1,000+ members enjoying guilt-free snacking.
          </div>

          <Link
            to="/app/subscribe"
            className="block w-full py-4 px-6 rounded-xl bg-nouriva-gold text-white font-bold hover:bg-yellow-600 transition shadow-lg text-xl"
          >
            Unlock Snacks (Free)
          </Link>
          <p className="mt-4 text-xs text-gray-400">Join the newsletter to get instant access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nouriva-cream px-4 py-8 text-nouriva-charcoal">
      <h1 className="text-3xl font-black text-center text-nouriva-green uppercase tracking-tight mb-8">
        Healthy Snacks
        <span className="ml-3 bg-nouriva-gold text-white text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide shadow-sm align-middle">
          👑 CLUB EXCLUSIVE
        </span>
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {snacks.map((snack) => (
          <div
            key={snack.id}
            className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-nouriva-green/20 hover:shadow-lg transition duration-300 cursor-pointer"
            onClick={() => navigate(`/app/meal/${snack.id}`)}
          >
            {snack.image && (
              <img
                src={snack.image}
                alt={snack.name}
                className="w-full h-56 object-cover"
              />
            )}
            <div className="p-6">
              <h2 className="text-xl font-bold text-nouriva-charcoal hover:text-nouriva-green transition-colors mb-2">
                {snack.name}
              </h2>
              <p className="text-sm text-gray-500">
                {Object.keys(snack.ingredients).length} ingredients
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SnackPage;