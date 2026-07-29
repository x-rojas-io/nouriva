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

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [showVerify, setShowVerify] = useState(false);

    const handleJoinClub = async (e) => {
        e.preventDefault();

        // Validate inputs
        if (!fullName.trim()) return toast.error("Please enter your name to join.");

        // If already authenticated (e.g. redirected from Login), immediate upgrade
        if (user) {
            await updateProfile(user.id, user.email);
            return;
        }

        // Guest Flow: Step 1 - Send OTP
        if (!email.trim()) return toast.error("Please enter your email.");

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim()
            });

            if (error) throw error;

            toast.success("Code sent! Check your inbox.");
            setShowVerify(true);
        } catch (error) {
            console.error(error);
            toast.error("Error sending code: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: otp,
                type: 'email'
            });

            if (error) throw error;
            if (!data.user) throw new Error("Verification failed");

            // Success! Now update profile
            await updateProfile(data.user.id, email);

        } catch (err) {
            console.error(err);
            toast.error("Invalid code: " + err.message);
            setLoading(false);
        }
    };

    const updateProfile = async (userId, userEmail) => {
        setLoading(true);
        console.log("PricingPage: Starting profile update for", userId);

        try {
            // 1. Check if profile exists
            const { data: existingProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
                console.error("PricingPage: Profile check failed", fetchError);
                // Continue to try insert anyway, or throw? Let's try insert.
            }

            let opError;

            if (existingProfile) {
                console.log("PricingPage: Profile exists, updating...");
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        subscription_status: 'premium',
                        full_name: fullName.trim(),
                    })
                    .eq('id', userId);
                opError = error;
            } else {
                console.log("PricingPage: Profile missing, inserting...");
                const { error } = await supabase
                    .from('profiles')
                    .insert({
                        id: userId,
                        email: userEmail || user?.email, // Ensure email is included
                        subscription_status: 'premium',
                        full_name: fullName.trim(),
                    });
                opError = error;
            }

            if (opError) {
                console.error("PricingPage: Write operation failed", opError);
                alert("Database Error: " + opError.message + " (" + opError.code + ")");
                throw opError;
            }

            console.log("PricingPage: Success!");
            toast.success("Welcome to the Nouriva Club! 🎉");

            // Force reload to ensure AuthContext picks up everything cleanly
            window.location.href = '/app/home';
        } catch (err) {
            console.error("PricingPage: Catch block", err);
            toast.error("Profile update failed: " + err.message);
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
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-lg text-center border border-gray-100">
                    <h1 className="text-3xl font-bold text-nouriva-green mb-4">You're already in! 🎉</h1>
                    <p className="text-gray-600 mb-8">
                        You are a valued member of the Nouriva Club. Enjoy your exclusive access.
                    </p>
                    <div className="space-y-4">
                        <Link
                            to="/app/home"
                            className="block w-full py-3 px-6 rounded-xl bg-nouriva-green text-white font-bold hover:bg-nouriva-green/90 transition"
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

                        {!showVerify ? (
                            <form onSubmit={handleJoinClub} className="space-y-4 animate-fadeIn">
                                <div>
                                    <label className="block text-xs font-bold text-nouriva-cream/80 uppercase mb-1">Your Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        placeholder="Jane Doe"
                                        className="w-full p-3 rounded-xl bg-nouriva-green border border-nouriva-green/50 text-white placeholder-nouriva-cream/50 focus:outline-none focus:ring-2 focus:ring-nouriva-gold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-nouriva-cream/80 uppercase mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={user ? user.email : email}
                                        onChange={e => !user && setEmail(e.target.value)}
                                        disabled={!!user}
                                        placeholder="you@example.com"
                                        className={`w-full p-3 rounded-xl bg-nouriva-green border ${user ? 'border-nouriva-green/30 text-nouriva-cream/80' : 'border-nouriva-green/50 text-white'} placeholder-nouriva-cream/50 focus:outline-none focus:ring-2 focus:ring-nouriva-gold`}
                                    />
                                </div>

                                <ul className="space-y-2 mb-6 text-nouriva-cream/90 text-sm">
                                    <li>✓ <strong>Unlock ALL Recipes</strong></li>
                                    <li>✓ <strong>Weekly Newsletter</strong></li>
                                </ul>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 px-6 rounded-xl bg-nouriva-gold text-white font-bold text-lg hover:bg-yellow-600 transition shadow-lg flex justify-center items-center"
                                >
                                    {loading ? (
                                        <span className="animate-pulse">Processing...</span>
                                    ) : (
                                        user ? "Complete Membership" : "Join Newsletter & Unlock"
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fadeIn">
                                <div className="p-4 bg-nouriva-green/50 rounded-xl border border-nouriva-green/30 text-center mb-4">
                                    <p className="text-sm text-nouriva-cream/80 mb-1">Enter the code sent to</p>
                                    <p className="font-bold text-white">{email}</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-nouriva-cream/80 uppercase mb-1">Verification Code</label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        placeholder="123456"
                                        className="w-full p-3 rounded-xl bg-nouriva-green border border-nouriva-green/50 text-white placeholder-nouriva-cream/50 focus:outline-none focus:ring-2 focus:ring-nouriva-gold text-center tracking-widest text-xl font-mono"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 px-6 rounded-xl bg-nouriva-gold text-white font-bold text-lg hover:bg-yellow-500 transition shadow-lg flex justify-center items-center"
                                >
                                    {loading ? "Verifying..." : "Verify & Join Club"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowVerify(false)}
                                    className="w-full text-center text-sm text-emerald-400 hover:text-emerald-300 underline"
                                >
                                    Use a different email
                                </button>
                            </form>
                        )}

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
