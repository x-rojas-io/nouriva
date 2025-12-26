import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

function ProtectedRoute({ requireAdmin = false }) {
    const { user, isAdmin, loading, profileLoading } = useAuth();

    // 1. Wait for session to be determined (fast)
    if (loading) return <div>Loading...</div>;

    // 2. Must be logged in
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. If Admin required, must wait for profile to load (slow path)
    if (requireAdmin) {
        if (profileLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nouriva-green"></div>
                </div>
            );
        }
        if (!isAdmin) {
            return <Navigate to="/app/home" replace />;
        }
    }

    return <Outlet />;
}

export default ProtectedRoute;
