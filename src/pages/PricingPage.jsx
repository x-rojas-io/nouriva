import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/ToastContext';

function PricingPage() {
    const { user, profile, isPremium } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');

    // Pre-fill name if available
    useEffect(() => {
        if (profile?.full_name) {
            setFullName(profile.full_name);
        }
    }, [profile]);

    const handleJoinClub = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error("Please login or sign up first!");
            navigate('/login');
            return;
        }

        if (!fullName.trim()) {
            toast.error("Please enter your name to join.");
            return;
        }

        setLoading(true);
        try {
            // Update Profile with Name and Premium Status
            const { error } = await supabase
                .from('profiles')
                .update({
                    subscription_status: 'premium',
                    full_name: fullName.trim()
                })
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

    const handleLeaveClub = async () => {
        if (!confirm("Are you sure you want to leave the club? You will lose access to premium recipes.")) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ subscription_status: 'free' })
                .eq('id', user.id);

            if (error) throw error;

            toast.success("You have left the club.");
            window.location.href = '/app/home';
        } catch (error) {
            console.error(error);
            toast.error("Error leaving club");
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
                    <div className="space-y-4">
                        <Link
                            to="/app/home"
                            className="block w-full py-3 px-6 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                        >
                            Go to Recipes
                        </Link>
                        <button
                            onClick={handleLeaveClub}
                            disabled={loading}
                            className="block w-full py-3 px-6 rounded-lg border border-red-200 text-red-500 font-medium hover:bg-red-50 transition text-sm"
                        >
                            {loading ? "Leaving..." : "Leave Club"}
                        </button>
                    </div>
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
                    Join the <strong>Nouriva Club</strong> by subscribing to our newsletter.
                </p>

                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto items-center">
                    {/* Guest Tier */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 opacity-75 hover:opacity-100 transition">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Guest</h3>
                        <div className="text-2xl font-bold text-gray-400 mb-6">Browsing</div>
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

                    {/* Club Tier - Form */}
                    <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white p-8 rounded-2xl shadow-xl transform md:scale-110 relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 bg-nouriva-gold text-emerald-900 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                            Recommended
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Nouriva Club</h3>
                        <p className="text-emerald-100/80 mb-6 text-sm">
                            Get full access in exchange for joining our weekly newsletter.
                        </p>

                        <form onSubmit={handleJoinClub} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-emerald-200 uppercase mb-1">Your Name</label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Jane Doe"
                                    className="w-full p-3 rounded bg-emerald-800 border border-emerald-700 text-white placeholder-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-nouriva-gold"
                                />
                            </div>

                            {user?.email && (
                                <div>
                                    <label className="block text-xs font-bold text-emerald-200 uppercase mb-1">Email</label>
                                    <input
                                        type="email"
                                        disabled
                                        value={user.email}
                                        className="w-full p-3 rounded bg-emerald-800/50 border border-emerald-700/50 text-emerald-300 cursor-not-allowed"
                                    />
                                </div>
                            )}

                            <ul className="space-y-2 mb-6 text-emerald-100 text-sm">
                                <li>✓ <strong>Unlock ALL Recipes</strong></li>
                                <li>✓ <strong>Weekly Newsletter</strong></li>
                            </ul>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-6 rounded-lg bg-nouriva-gold text-emerald-900 font-bold text-lg hover:bg-yellow-500 transition shadow-lg flex justify-center items-center"
                            >
                                {loading ? (
                                    <span className="animate-pulse">Joining...</span>
                                ) : (
                                    "Join Newsletter & Unlock"
                                )}
                            </button>
                        </form>

                        <p className="text-xs text-emerald-400 mt-4 text-center">
                            We respect your inbox. No spam, ever.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PricingPage;
