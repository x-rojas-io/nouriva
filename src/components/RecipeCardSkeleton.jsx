import React from 'react';

function RecipeCardSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow overflow-hidden animate-pulse">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-gray-200" />

            <div className="p-4 space-y-3">
                {/* Title placeholder */}
                <div className="h-6 bg-gray-200 rounded w-3/4" />

                {/* Subtitle/Icon placeholder */}
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 rounded-full" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
            </div>
        </div>
    );
}

export default RecipeCardSkeleton;
