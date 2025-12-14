import React, { useState } from 'react';

function SmartSearchBar({ onSearch, loading }) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-8">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask for something... (e.g. 'Healthy breakfast with avocado')"
                    className="w-full px-6 py-4 rounded-full border-2 border-emerald-100 focus:border-nouriva-green focus:outline-none shadow-sm text-lg pr-12"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-2 top-2 p-2 bg-nouriva-green text-white rounded-full hover:bg-emerald-800 transition disabled:opacity-50"
                >
                    {loading ? (
                        <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    )}
                </button>
            </div>
            {query && (
                <button
                    type="button"
                    onClick={() => { setQuery(''); onSearch(''); }}
                    className="absolute -right-24 top-4 text-gray-400 hover:text-gray-600 text-sm hidden md:block"
                >
                    Clear Search
                </button>
            )}
        </form>
    );
}

export default SmartSearchBar;
