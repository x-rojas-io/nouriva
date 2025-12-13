import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

function ProtectedRoute({ requireAdmin = false }) {
    const { user, isAdmin, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    // 1. Must be logged in
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 2. If Admin required, must be Admin
    if (requireAdmin && !isAdmin) {
        return <Navigate to="/app/home" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
