import React from 'react';
import { Link } from 'react-router-dom';

function PricingPage() {
    // TODO: Replace with your actual Stripe Payment Link
    // Example: https://buy.stripe.com/test_...
    const STRIPE_LINK = "https://buy.stripe.com/test_placeholder";

    return (
        <div className="min-h-screen bg-nouriva-cream py-12 px-4">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl font-bold text-nouriva-green mb-4">
                    Join the Club
                </h1>
                <p className="text-xl text-gray-600 mb-12">
                    Unlock premium recipes, daily meal plans, and exclusive features.
                </p>

                <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                    {/* Free Tier */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Basic</h3>
                        <div className="text-4xl font-bold text-gray-400 mb-6">$0</div>
                        <ul className="text-left space-y-3 mb-8 text-gray-600">
                            <li>✓ Access to Free Recipes</li>
                            <li>✓ Basic Nutritional Info</li>
                            <li>✓ Community Access</li>
                        </ul>
                        <Link
                            to="/app/home"
                            className="block w-full py-3 px-6 rounded-lg border border-nouriva-green text-nouriva-green font-bold hover:bg-green-50 transition"
                        >
                            Continue Free
                        </Link>
                    </div>

                    {/* Premium Tier */}
                    <div className="bg-emerald-900 text-white p-8 rounded-2xl shadow-xl transform scale-105 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-nouriva-gold text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                            Most Popular
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Premium Member</h3>
                        <div className="text-4xl font-bold text-nouriva-gold mb-6">
                            $9.99<span className="text-lg text-emerald-300 font-normal">/mo</span>
                        </div>
                        <ul className="text-left space-y-3 mb-8 text-emerald-100">
                            <li>✓ <strong>All Premium Recipes</strong> (Locked)</li>
                            <li>✓ <strong>Full Daily Meal Plans</strong></li>
                            <li>✓ <strong>Exclusive Snacks</strong></li>
                            <li>✓ Ad-Free Experience</li>
                        </ul>
                        <a
                            href={STRIPE_LINK}
                            target="_blank"
                            rel="noreferrer"
                            className="block w-full py-3 px-6 rounded-lg bg-nouriva-gold text-white font-bold hover:bg-yellow-600 transition shadow-lg"
                        >
                            Subscribe Now
                        </a>
                        <p className="text-xs text-emerald-400 mt-4">
                            7-day money-back guarantee. Cancel anytime.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PricingPage;
