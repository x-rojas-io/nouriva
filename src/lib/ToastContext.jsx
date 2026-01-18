import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext();

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', opts = {}) => {
        const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2);
        setToasts(prev => [...prev, { id, message, type, ...opts }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Helpers
    const toast = {
        success: (msg, opts) => addToast(msg, 'success', opts),
        error: (msg, opts) => addToast(msg, 'error', opts),
        info: (msg, opts) => addToast(msg, 'info', opts),
        loading: (msg, opts) => {
            // For loading, we want to return the ID so it can be dismissed
            const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2);
            setToasts(prev => [...prev, { id, message: msg, type: 'info', isLoading: true, ...opts }]);
            return id;
        },
        dismiss: (id) => {
            if (id) {
                setToasts(prev => prev.filter(t => t.id !== id));
            } else {
                setToasts([]); // Dismiss all
            }
        }
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className="pointer-events-auto">
                        <Toast {...t} onClose={removeToast} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
