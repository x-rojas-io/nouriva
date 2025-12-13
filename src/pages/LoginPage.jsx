import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

function LoginPage() {
    const auth = useAuth() || {};
    const { user, isAdmin, signIn } = auth;

    useEffect(() => {
        // Debug: Check if signIn exists
        if (!signIn) {
            console.error("DEBUG: signIn IS MISSING from useAuth!", Object.keys(auth));
            // alert("DEBUG: signIn MISSING! Keys: " + Object.keys(auth).join(', '));
        }
    }, [signIn, auth]);

    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showVerify, setShowVerify] = useState(false);
    const [otp, setOtp] = useState('');

    useEffect(() => {
        if (user) {
            // Role-based Redirect
            if (isAdmin) {
                navigate('/admin/dashboard');
            } else {
                navigate('/app/home');
            }
        }
    }, [user, isAdmin, navigate]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
            alert(error.message);
        } else {
            setMessage('Check your email for the code!');
            setShowVerify(true);
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email'
        });

        if (error) {
            alert(error.message);
            setLoading(false);
        } else {
            // Success! AuthContext will pick up the session change.
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            console.log("Attempting Google Login. signIn fn:", signIn);
            let error;
            if (typeof signIn === 'function') {
                const res = await signIn();
                error = res.error;
            } else {
                // Fallback if context is broken
                alert("Context broken, using direct supabase fallback");
                const res = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin
                    }
                });
                error = res.error;
            }

            if (error) alert("Google Login Error: " + error.message);
        } catch (err) {
            alert("Unexpected Error: " + err.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-nouriva-cream px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                {/* ... header ... */}
                <h1 className="text-3xl font-bold text-nouriva-green mb-4">Welcome Back</h1>
                <p className="text-gray-600 mb-8">Sign in to access your daily meal plans.</p>

                {!showVerify && (
                    <>
                        {/* ... Google & Divider ... */}
                        {/* Google Login */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-50 transition flex justify-center items-center gap-2 mb-4 disabled:opacity-50"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                            {loading ? 'Connecting...' : 'Sign in with Google'}
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                            </div>
                        </div>

                        {/* Send OTP Form */}
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-nouriva-green outline-none"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-nouriva-green text-white font-bold py-3 px-6 rounded-lg hover:bg-emerald-800 transition disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send Login Code'}
                            </button>
                        </form>
                    </>
                )}

                {/* Verify OTP Form */}
                {showVerify && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fadeIn">
                        <div className="text-sm text-gray-500 mb-4">
                            Sent to <span className="font-bold">{email}</span>.
                            <button type="button" onClick={() => setShowVerify(false)} className="ml-2 text-nouriva-green underline">Change?</button>
                        </div>
                        <input
                            type="text"
                            placeholder="Enter Verification Code"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-nouriva-green outline-none text-center text-2xl tracking-widest"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-nouriva-green text-white font-bold py-3 px-6 rounded-lg hover:bg-emerald-800 transition disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </form>
                )}

                {message && !showVerify && (
                    <div className="mt-4 p-3 bg-green-50 text-green-700 rounded text-sm">
                        {message}
                    </div>
                )}

                <p className="mt-6 text-xs text-gray-500">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
