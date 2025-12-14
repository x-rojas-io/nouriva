import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

import Logo from './Logo';

function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

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
        {/* Mobile Toggle */}
        <button
          className="md:hidden text-gray-600 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <Link to="/login" className="px-4 py-2 rounded-full border border-nouriva-green text-nouriva-green font-bold hover:bg-green-50 transition">
              Sign In
            </Link>
          ) : (
            <button onClick={signOut} className="text-sm text-gray-500 hover:text-red-500">
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-lg border-t md:hidden flex flex-col p-4 space-y-4">
          <Link to="/app/home" className="text-gray-600 hover:text-nouriva-green font-medium text-lg" onClick={() => setIsOpen(false)}>Recipes</Link>
          <Link to="/app/snack" className="text-gray-600 hover:text-nouriva-green font-medium text-lg" onClick={() => setIsOpen(false)}>Snacks</Link>
          {isAdmin && (
            <Link to="/admin/dashboard" className="text-nouriva-gold hover:text-yellow-600 font-bold flex items-center gap-1 text-lg" onClick={() => setIsOpen(false)}>
              <span>⚡</span> Admin Panel
            </Link>
          )}
          <hr />
          {!user ? (
            <Link to="/login" className="text-center w-full px-4 py-2 rounded-full bg-nouriva-green text-white font-bold" onClick={() => setIsOpen(false)}>
              Sign In
            </Link>
          ) : (
            <button onClick={() => { signOut(); setIsOpen(false); }} className="text-left text-red-500 font-medium">
              Sign Out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;