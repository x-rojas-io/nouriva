import React from 'react';
import { Link } from 'react-router-dom';

function PremiumLock({ title }) {
    return (
        <div className="bg-nouriva-cream border border-nouriva-gold rounded-xl p-8 text-center max-w-2xl mx-auto shadow-lg mt-8">
            <div className="text-4xl mb-4">👑</div>
            <h2 className="text-2xl font-bold text-emerald-900 mb-2">
                Unlock "{title}"
            </h2>
            <p className="text-gray-600 mb-6">
                This premium recipe is exclusively for Nouriva Club members.
                Subscribe to get full access to our daily meal plans and snack library.
            </p>

            <div className="space-y-3">
                <Link
                    to="/app/subscribe"
                    className="block w-full sm:w-auto mx-auto bg-nouriva-gold text-white font-bold py-3 px-8 rounded-full shadow hover:bg-yellow-600 transition transform hover:-translate-y-1"
                >
                    Subscribe Now
                </Link>
                <p className="text-xs text-gray-500">
                    Already a member? <Link to="/login" className="underline">Refresh your session</Link>
                </p>
            </div>
        </div>
    );
}

export default PremiumLock;
