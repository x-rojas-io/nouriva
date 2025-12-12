import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function SnackDetails() {
  const { snackId } = useParams();
  const navigate = useNavigate();
  const [snack, setSnack] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSnack() {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', snackId)
        .single();

      if (error) {
        console.error("Error loading snack:", error);
      } else {
        setSnack(data);
      }
      setLoading(false);
    }

    if (snackId) {
      fetchSnack();
    }
  }, [snackId]);

  if (loading) return (
    <div className="text-center mt-10 text-lg text-amber-700">
      Loading snack details...
    </div>
  );

  if (!snack) return (
    <div className="text-center mt-10 text-red-600">
      Snack not found.
    </div>
  );

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
          {snack.name}
        </h1>
        <div className="w-16" /> {/* Spacer */}
      </div>

      <div className="md:flex md:gap-6 bg-white border-l-4 border-emerald-500 p-6 rounded shadow">
        {snack.image && (
          <img
            src={snack.image}
            alt={snack.name}
            className="w-full md:w-72 h-60 object-cover rounded mb-4 md:mb-0"
          />
        )}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-amber-600 mb-2">
            Ingredients
          </h2>
          <ul className="list-disc pl-5 text-sm text-gray-700 mb-4">
            {Object.entries(snack.ingredients).map(([name, info], i) => (
              <li key={i}>
                {info.quantity} {info.unit} {name}
              </li>
            ))}
          </ul>

          <h2 className="text-lg font-semibold text-amber-600 mb-2">
            Steps
          </h2>
          <div className="space-y-2">
            {snack.steps.map((step, index) => (
              <p key={index}>{step}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SnackDetails;