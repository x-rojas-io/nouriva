import React from 'react';

const Logo = ({ className = "h-8 w-auto" }) => {
    return (
        <svg
            className={className}
            viewBox="0 0 220 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Nouriva Logo"
        >
            {/* Abstract Organic Leaf + Bowl Icon */}
            <g transform="translate(5, 0)">
                {/* Main Leaf Body in Forest Green */}
                <path 
                    d="M20 12C12 16 8 24 10 32C12 40 20 42 28 38C34 34 38 26 36 18C34 10 26 8 20 12Z" 
                    fill="#062e33" 
                />
                {/* Inner Curved Leaf/Ribbon Accent in Champagne Gold */}
                <path 
                    d="M26 15C32 20 32 28 27 34C22 30 20 22 26 15Z" 
                    fill="#c29f63" 
                />
                {/* Micro leaf dot/bud accent */}
                <circle cx="34" cy="14" r="3.5" fill="#c29f63" />
            </g>
            
            {/* Brand Text styled in Outfit font with premium split colors */}
            <text 
                x="55" 
                y="33" 
                fontFamily="Outfit, sans-serif" 
                fontSize="23" 
                fontWeight="900" 
                letterSpacing="2.5"
            >
                <tspan fill="#062e33">NOURI</tspan>
                <tspan fill="#c29f63">VA</tspan>
            </text>
        </svg>
    );
};

export default Logo;
