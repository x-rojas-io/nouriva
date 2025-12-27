import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

function Dashboard() {
    const [stats, setStats] = useState({
        totalRecipes: 0,
        totalSnacks: 0,
        totalUsers: 0,
        activeSubscribers: 0
    });
    const [recentRecipes, setRecentRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // 1. Get Counts
            const { count: recipeCount } = await supabase.from('recipes').select('*', { count: 'exact', head: true });

            const { count: snackCount } = await supabase
                .from('recipes')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'snack');

            // Note: Reading profiles might fallback to 0 if RLS blocks listing all users
            const { count: userCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .neq('role', 'admin'); // Exclude admins

            const { count: subCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('subscription_status', 'premium')
                .neq('role', 'admin'); // Exclude admins

            setStats({
                totalRecipes: recipeCount || 0,
                totalSnacks: snackCount || 0,
                totalUsers: userCount || 0,
                activeSubscribers: subCount || 0
            });

            // 2. Get Recent Activity (Newest Recipes)
            const { data: recent } = await supabase
                .from('recipes')
                .select('id, name, created_at, type')
                .order('created_at', { ascending: false })
                .limit(5);

            if (recent) setRecentRecipes(recent);

        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Link to="/admin/recipes" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Recipes</h3>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">{loading ? '-' : stats.totalRecipes}</p>
                </Link>

                <Link to="/admin/recipes" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Snacks</h3>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">{loading ? '-' : stats.totalSnacks}</p>
                </Link>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 opacity-75 cursor-default">
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Users</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{loading ? '-' : stats.totalUsers}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 opacity-75 cursor-default">
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Active Subscribers</h3>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{loading ? '-' : stats.activeSubscribers}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
                    </div>
                    <div>
                        {loading ? (
                            <div className="p-6 text-gray-400">Loading activity...</div>
                        ) : recentRecipes.length === 0 ? (
                            <div className="p-6 text-gray-400 italic">No recent activity.</div>
                        ) : (
                            <ul>
                                {recentRecipes.map(recipe => (
                                    <li key={recipe.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                                        <Link to={`/admin/recipes/edit/${recipe.id}`} className="block p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-800">{recipe.name || 'Untitled Recipe'}</p>
                                                <p className="text-xs text-gray-500">
                                                    Added {new Date(recipe.created_at).toLocaleDateString()} &middot; <span className="capitalize">{recipe.type}</span>
                                                </p>
                                            </div>
                                            <span className="text-emerald-600 text-sm font-bold">Edit &rarr;</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50 text-center border-t">
                        <Link to="/admin/recipes" className="text-sm text-emerald-600 font-bold hover:underline">View All Recipes</Link>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white rounded-lg shadow-md p-6 h-fit">
                    <h3 className="font-bold text-xl mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link to="/admin/recipes/new" className="block w-full bg-white text-emerald-800 px-4 py-3 rounded font-bold shadow hover:bg-gray-100 text-center transition">
                            + New Recipe
                        </Link>
                        <Link to="/admin/media" className="block w-full bg-emerald-800/50 text-white border border-emerald-500 px-4 py-3 rounded font-bold hover:bg-emerald-700 text-center transition">
                            Media Library
                        </Link>
                        {/* 
                        <Link to="/admin/users" className="block w-full bg-emerald-800/50 text-white border border-emerald-500 px-4 py-3 rounded font-bold hover:bg-emerald-700 text-center transition">
                             Manage Users
                        </Link> 
                        */}
                    </div>
                    <div className="mt-8 pt-6 border-t border-emerald-600/50 text-sm text-emerald-200">
                        <p>Tip: Use "Magic Fill" in the editor to instantly create strict Keto recipes with AI.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
