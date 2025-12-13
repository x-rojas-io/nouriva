import React from 'react';

const Logo = ({ className = "h-8 w-auto" }) => {
    return (
        <svg
            className={className}
            viewBox="0 0 200 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Nouriva Logo"
        >
            <path
                d="M25 10C15 10 10 20 10 25C10 30 15 40 25 40C35 40 40 30 40 25C40 20 35 10 25 10Z"
                fill="#10B981"
                className="text-emerald-500"
            />
            <path
                d="M25 15C18 15 15 22 15 25C15 28 18 35 25 35C32 35 35 28 35 25C35 22 32 15 25 15Z"
                fill="white"
            />
            <path
                d="M25 20L30 30H20L25 20Z"
                fill="#F59E0B"
                className="text-amber-500"
            />

            <text x="55" y="32" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#10B981" letterSpacing="1">
                NOURIVA
            </text>
        </svg>
    );
};

export default Logo;
