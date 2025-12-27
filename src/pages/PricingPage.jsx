import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/ToastContext';

function PricingPage() {
    const { user, isPremium } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    const handleJoinClub = async () => {
        if (!user) {
            toast.error("Please login or sign up first!");
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ subscription_status: 'premium' })
                .eq('id', user.id);

            if (error) throw error;

            toast.success("Welcome to the Nouriva Club! 🎉");

            // Force reload to update AuthContext permissions immediately
            window.location.href = '/app/home';

        } catch (error) {
            console.error(error);
            toast.error("Could not join club. Please try again.");
            setLoading(false);
        }
    };

    if (isPremium) {
        return (
            <div className="min-h-screen bg-nouriva-cream flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center">
                    <h1 className="text-3xl font-bold text-emerald-800 mb-4">You're already in! 🎉</h1>
                    <p className="text-gray-600 mb-8">
                        You are a valued member of the Nouriva Club. Enjoy your exclusive access.
                    </p>
                    <Link
                        to="/app/home"
                        className="block w-full py-3 px-6 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                    >
                        Go to Recipes
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-nouriva-cream py-12 px-4">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl font-bold text-emerald-800 mb-4">
                    Unlock the Full Nouriva Experience
                </h1>
                <p className="text-xl text-gray-600 mb-12">
                    Join the <strong>Nouriva Club</strong> for free. No fees, just healthy living.
                </p>

                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto items-center">
                    {/* Guest Tier */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 opacity-75 hover:opacity-100 transition">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Guest</h3>
                        <div className="text-3xl font-bold text-gray-400 mb-6">Free</div>
                        <ul className="text-left space-y-3 mb-8 text-gray-500 text-sm">
                            <li>✓ Browse basic recipes</li>
                            <li>✓ View nutritional info</li>
                            <li className="line-through opacity-50">✕ Premium Keto Recipes</li>
                            <li className="line-through opacity-50">✕ Weekly Meal Plans</li>
                            <li className="line-through opacity-50">✕ Newsletter Insights</li>
                        </ul>
                        <Link
                            to="/app/home"
                            className="block w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition"
                        >
                            Continue as Guest
                        </Link>
                    </div>

                    {/* Club Tier */}
                    <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white p-8 rounded-2xl shadow-xl transform md:scale-110 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-nouriva-gold text-emerald-900 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                            Recommended
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Nouriva Club</h3>
                        <div className="text-4xl font-bold text-nouriva-gold mb-6">
                            $0<span className="text-lg text-emerald-300 font-normal">/forever</span>
                        </div>
                        <ul className="text-left space-y-3 mb-8 text-emerald-100 text-lg">
                            <li>✓ <strong>Unlock ALL Recipes</strong> (Strict Keto)</li>
                            <li>✓ <strong>Daily Meal Plans</strong></li>
                            <li>✓ <strong>Exclusive Weekly Newsletter</strong></li>
                            <li>✓ No Ads, Pure Focus</li>
                        </ul>
                        <button
                            onClick={handleJoinClub}
                            disabled={loading}
                            className="w-full py-4 px-6 rounded-lg bg-nouriva-gold text-emerald-900 font-bold text-lg hover:bg-yellow-500 transition shadow-lg flex justify-center items-center"
                        >
                            {loading ? (
                                <span className="animate-pulse">Unlocking...</span>
                            ) : (
                                "Join the Club (Free)"
                            )}
                        </button>
                        <p className="text-xs text-emerald-400 mt-4">
                            By joining, you agree to receive our weekly curated newsletter.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PricingPage;
