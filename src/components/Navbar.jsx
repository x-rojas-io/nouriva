import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

import Logo from './Logo';

function Navbar() {
  const { user, profile, isAdmin, isPremium, signOut } = useAuth();
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
          {!isPremium && (
            <Link to="/app/subscribe" className="text-nouriva-gold hover:text-yellow-600 font-bold">Join Club</Link>
          )}
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
            <div className="relative group">
              <button className="flex items-center gap-2 text-gray-700 hover:text-nouriva-green font-bold focus:outline-none">
                <span>Hi {profile?.full_name?.split(' ')[0] || 'Member'}!</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu - Show on hover for simplicity or click if preferred, using group-hover for CSS-only dropdown is easier but let's stick to standard practice or simple hover */}
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                  </div>
                  {/* Future Profile Link */}
                  {/* <Link to="/app/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Your Profile</Link> */}

                  <button
                    onClick={signOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
                  >
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-lg border-t md:hidden flex flex-col p-4 space-y-4">
          <Link to="/app/home" className="text-gray-600 hover:text-nouriva-green font-medium text-lg" onClick={() => setIsOpen(false)}>Recipes</Link>
          <Link to="/app/snack" className="text-gray-600 hover:text-nouriva-green font-medium text-lg" onClick={() => setIsOpen(false)}>Snacks</Link>
          {!isPremium && (
            <Link to="/app/subscribe" className="text-nouriva-gold hover:text-yellow-600 font-medium text-lg" onClick={() => setIsOpen(false)}>Join Club</Link>
          )}
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
            <div className="space-y-4">
              <div className="px-2">
                <p className="text-sm text-gray-500">Hi <span className="font-bold text-gray-800">{profile?.full_name || user.email}</span></p>
              </div>
              <button onClick={() => { signOut(); setIsOpen(false); }} className="text-left w-full px-2 text-red-500 font-medium">
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;