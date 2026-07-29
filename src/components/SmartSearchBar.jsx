import React, { useState, useEffect, useRef } from 'react';

function SmartSearchBar({ onSearch, loading }) {
    const [query, setQuery] = useState('');
    const debounceTimerRef = useRef(null);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            onSearch(val);
        }, 250);
    };

    const handleClear = () => {
        setQuery('');
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        onSearch('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        onSearch(query);
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-10">
            <div className="relative flex items-center border-b border-gray-200 focus-within:border-nouriva-green transition-all duration-300 py-2">
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    placeholder="Search recipes or snacks..."
                    className="w-full bg-transparent focus:outline-none text-xl text-nouriva-charcoal placeholder-gray-400 pr-16"
                />
                <div className="absolute right-0 flex items-center gap-2">
                    {query && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            title="Clear search"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    <button
                        type="submit"
                        className="text-gray-400 hover:text-nouriva-green transition p-1"
                    >
                        {loading ? (
                            <svg className="animate-spin h-6 w-6 text-nouriva-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            </div>
        </form>
    );
}

export default SmartSearchBar;
