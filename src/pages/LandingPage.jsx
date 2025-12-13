import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
    return (
        <div className="min-h-screen bg-nouriva-cream font-sans">
            {/* Hero Section */}
            <header className="px-6 py-12 md:py-20 text-center max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-bold text-nouriva-green mb-6 tracking-tight">
                    Eat Better, <br /> Live Vibrantly.
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                    Nouriva is your exclusive healthy eating club. Get curated daily meal plans and wholesome snack recipes designed to nourish your body and simplify your life.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/app/home" className="bg-nouriva-green text-white px-8 py-3 rounded-full font-semibold hover:bg-emerald-800 transition shadow-lg hover:shadow-xl">
                        Explore the Menu
                    </Link>
                    <Link to="/about" className="bg-white text-nouriva-green border-2 border-nouriva-green px-8 py-3 rounded-full font-semibold hover:bg-emerald-50 transition">
                        Our Philosophy
                    </Link>
                </div>
            </header>

            {/* Feature Grid */}
            <section className="px-6 py-16 bg-white">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-nouriva-cream rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            🥗
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Curated Daily Plans</h3>
                        <p className="text-gray-600">No more decision fatigue. We provide a balanced breakfast, lunch, and dinner every single day.</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-nouriva-cream rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            🥑
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Wholesome Ingredients</h3>
                        <p className="text-gray-600">Focus on protein, healthy fats, and fiber. Real food that fuels you, not processed fillers.</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-nouriva-cream rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            ✨
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Simple & Aesthetic</h3>
                        <p className="text-gray-600">A beautiful, calm ad-free interface that makes planning your meals a moment of zen.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-6 py-20 bg-nouriva-green text-white text-center">
                <h2 className="text-3xl font-bold mb-6">Ready to join the club?</h2>
                <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                    Get unlimited access to our full library of recipes and daily plans.
                </p>
                <button className="bg-nouriva-gold text-white px-10 py-4 rounded-full font-bold hover:bg-yellow-600 transition shadow-lg transform hover:-translate-y-1">
                    Get Started for Free
                </button>
            </section>
        </div>
    );
}

export default LandingPage;
