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
            <aside className="w-16 md:w-64 bg-emerald-900 text-white flex flex-col transition-all duration-300">
                <div className="p-4 md:p-6 border-b border-emerald-800 flex justify-center md:block">
                    <h1 className="hidden md:block text-2xl font-bold tracking-wider text-nouriva-gold">NOURIVA</h1>
                    <span className="md:hidden text-xl">🥕</span>
                    <p className="hidden md:block text-xs text-emerald-300 mt-1 uppercase tracking-widest">Admin Panel</p>
                </div>

                <nav className="flex-grow p-2 md:p-4 space-y-2">
                    <Link
                        to="/admin/dashboard"
                        className={`block p-3 md:px-4 md:py-3 rounded transition flex items-center justify-center md:justify-start gap-3 ${isActive('dashboard') ? 'bg-emerald-800 text-white' : 'text-emerald-100 hover:bg-emerald-800'}`}
                        title="Dashboard"
                    >
                        <span className="text-xl">📊</span>
                        <span className="hidden md:inline">Dashboard</span>
                    </Link>
                    <Link
                        to="/admin/recipes"
                        className={`block p-3 md:px-4 md:py-3 rounded transition flex items-center justify-center md:justify-start gap-3 ${isActive('recipes') ? 'bg-emerald-800 text-white' : 'text-emerald-100 hover:bg-emerald-800'}`}
                        title="Recipes"
                    >
                        <span className="text-xl">🥗</span>
                        <span className="hidden md:inline">Recipes</span>
                    </Link>
                    <Link
                        to="/admin/media"
                        className={`block p-3 md:px-4 md:py-3 rounded transition flex items-center justify-center md:justify-start gap-3 ${isActive('media') ? 'bg-emerald-800 text-white' : 'text-emerald-100 hover:bg-emerald-800'}`}
                        title="Media Library"
                    >
                        <span className="text-xl">🖼️</span>
                        <span className="hidden md:inline">Media Library</span>
                    </Link>
                </nav>

                <div className="p-2 md:p-4 border-t border-emerald-800">
                    <button
                        onClick={signOut}
                        className="w-full bg-red-800 bg-opacity-50 text-red-200 p-2 md:px-4 md:py-2 rounded hover:bg-red-700 hover:text-white transition text-sm flex items-center justify-center md:justify-center gap-2"
                        title="Sign Out"
                    >
                        <span className="text-lg">🚪</span>
                        <span className="hidden md:inline">Sign Out</span>
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
