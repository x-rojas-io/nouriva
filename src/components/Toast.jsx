import React, { useEffect } from 'react';

/**
 * Toast Component
 * @param {string} message - The message to display
 * @param {string} type - 'success' | 'error' | 'info'
 * @param {function} onClose - Handler to close the toast
 */
function Toast({ id, message, type = 'info', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, 5000); // Auto close after 5s

        return () => clearTimeout(timer);
    }, [id, onClose]);

    const bgColors = {
        success: 'bg-emerald-100 border-emerald-500 text-emerald-800',
        error: 'bg-red-100 border-red-500 text-red-800',
        info: 'bg-blue-100 border-blue-500 text-blue-800'
    };

    const icons = {
        success: '✅',
        error: '⚠️',
        info: 'ℹ️'
    };

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded shadow-lg border-l-4 min-w-[300px] animate-in slide-in-from-right fade-in duration-300 ${bgColors[type]}`}>
            <span className="text-xl">{icons[type]}</span>
            <p className="flex-1 font-medium text-sm">{message}</p>
            <button onClick={() => onClose(id)} className="text-gray-400 hover:text-gray-600 font-bold">
                ×
            </button>
        </div>
    );
}

export default Toast;
