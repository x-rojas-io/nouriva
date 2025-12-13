import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

import Logo from './Logo';

function Navbar() {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center">
          <Logo className="h-10 w-auto" />
        </Link>
        <div className="hidden md:flex gap-4 items-center">
          <Link to="/app/home" className="text-gray-600 hover:text-nouriva-green font-medium">Recipes</Link>
          <Link to="/app/snack" className="text-gray-600 hover:text-nouriva-green font-medium">Snacks</Link>
          {isAdmin && (
            <Link to="/admin/dashboard" className="text-nouriva-gold hover:text-yellow-600 font-bold flex items-center gap-1">
              <span>⚡</span> Admin
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {!user ? (
          <Link to="/login" className="px-4 py-2 rounded-full border border-nouriva-green text-nouriva-green font-bold hover:bg-green-50 transition">
            Sign In
          </Link>
        ) : (
          <div className="flex items-center gap-4">
            {/* Mobile Menu Placeholder or User Avatar */}
            <button onClick={signOut} className="text-sm text-gray-500 hover:text-red-500">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;