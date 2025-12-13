import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

function AdminLayout() {
    const { signOut } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname.includes(path);

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-emerald-900 text-white flex flex-col">
                <div className="p-6 border-b border-emerald-800">
                    <h1 className="text-2xl font-bold tracking-wider text-nouriva-gold">NOURIVA</h1>
                    <p className="text-xs text-emerald-300 mt-1 uppercase tracking-widest">Admin Panel</p>
                </div>

                <nav className="flex-grow p-4 space-y-2">
                    <Link
                        to="/admin/dashboard"
                        className={`block px-4 py-3 rounded transition ${isActive('dashboard') ? 'bg-emerald-800 text-white' : 'text-emerald-100 hover:bg-emerald-800'}`}
                    >
                        📊 Dashboard
                    </Link>
                    <Link
                        to="/admin/recipes"
                        className={`block px-4 py-3 rounded transition ${isActive('recipes') ? 'bg-emerald-800 text-white' : 'text-emerald-100 hover:bg-emerald-800'}`}
                    >
                        🥗 Recipes
                    </Link>
                    <Link
                        to="/admin/media"
                        className={`block px-4 py-3 rounded transition ${isActive('media') ? 'bg-emerald-800 text-white' : 'text-emerald-100 hover:bg-emerald-800'}`}
                    >
                        🖼️ Media Library
                    </Link>
                </nav>

                <div className="p-4 border-t border-emerald-800">
                    <button
                        onClick={signOut}
                        className="w-full bg-red-800 bg-opacity-50 text-red-200 px-4 py-2 rounded hover:bg-red-700 hover:text-white transition text-sm"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}

export default AdminLayout;
