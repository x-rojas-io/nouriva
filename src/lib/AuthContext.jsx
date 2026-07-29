import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [sessionLoading, setSessionLoading] = useState(true); // Blocks app render
    const [profileLoading, setProfileLoading] = useState(false); // Blocks protected/admin features

    const [isAdmin, setIsAdmin] = useState(false);
    const [userRole, setUserRole] = useState('guest'); // 'guest', 'standard', 'premium', 'admin'

    // Fix: Use ref to track user ID across stale closures in event listeners
    const lastUserIdRef = useRef(null);

    useEffect(() => {
        // 1. Get initial session
        const initAuth = async () => {
            try {
                setSessionLoading(true);
                
                // Add a 4-second timeout fail-safe to prevent getSession from hanging forever
                const getSessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Session retrieval timed out (4s)')), 4000)
                );

                const result = await Promise.race([getSessionPromise, timeoutPromise]);
                const session = result?.data?.session ?? null;

                setUser(session?.user ?? null);

                if (session?.user) {
                    // Start profile fetch in background, don't block sessionLoading
                    setProfileLoading(true);
                    fetchProfile(session.user.id, session.user);
                }
            } catch (e) {
                console.error("AuthContext: initAuth fail-safe triggered:", e.message || e);
            } finally {
                // UNBLOCK APP RENDER IMMEDIATELY
                setSessionLoading(false);
            }
        };

        initAuth();

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            const previousUserId = lastUserIdRef.current; // Use Ref for truth

            setUser(currentUser);

            // Only fetch profile if user has changed or signed in
            if (currentUser && currentUser.id !== previousUserId) {
                console.log("AuthContext: User changed/session refreshed:", currentUser.id);
                lastUserIdRef.current = currentUser.id; // Update Ref

                setProfileLoading(true);
                await fetchProfile(currentUser.id, currentUser);
            } else if (!currentUser) {
                console.log("AuthContext: No session found (Guest mode)");
                lastUserIdRef.current = null; // Reset Ref
                setProfile(null);
                setUserRole('guest');
                setIsAdmin(false);
                setProfileLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId, currentUser) => {
        try {
            // 30s timeout - increased to prevent premature failures on slow connections
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timed out (30s)')), 30000)
            );

            const dbPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            const { data, error } = await Promise.race([dbPromise, timeoutPromise]);

            let role = 'standard';
            const isHardcodedAdmin = currentUser?.email === 'nestor.rojas@live.com';

            if (error) {
                console.warn('AuthContext: Profile fetch issue (using standard role):', error.message);
                if (isHardcodedAdmin) role = 'admin';
            } else {
                setProfile(data);
                if (data.role === 'admin' || isHardcodedAdmin) {
                    role = 'admin';
                } else if (data.subscription_status === 'active' || data.subscription_status === 'premium') {
                    role = 'premium';
                }
            }

            console.log("AuthContext: Role determined:", role);
            setUserRole(role);
            setIsAdmin(role === 'admin');

            // --- STRICT MEMBERSHIP GUARD ---
            // If user exists (signed in) but is NOT premium/admin, they are not a "Member".
            // Force redirect to Pricing Page to complete signup.
            const isPremiumOrAdmin = role === 'admin' || role === 'premium';
            if (!isPremiumOrAdmin && !window.location.pathname.includes('/app/subscribe')) {
                console.log("AuthContext: User is not premium. Redirecting to Join Club...");
                window.location.href = '/app/subscribe';
            }

        } catch (err) {
            console.warn("AuthContext: Profile fetch validation failed (non-fatal):", err.message);
            // Fallback for crash
            setUserRole('standard');
        } finally {
            setProfileLoading(false);
        }
    };

    const value = {
        user,
        profile,
        userRole, // 'standard', 'premium', 'admin'
        isAdmin: userRole === 'admin',
        isPremium: userRole === 'premium' || userRole === 'admin', // Admins get premium features
        loading: sessionLoading, // Map legacy 'loading' to sessionLoading for backward compat
        sessionLoading,
        profileLoading,
        signIn: () => supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        }),
        signOut: () => {
            setUserRole('guest');
            setIsAdmin(false);
            setProfile(null);
            supabase.auth.signOut();
        },
        // DEV ONLY: Bypass Auth
        devLogin: () => {
            if (import.meta.env.DEV) {
                console.log("AuthContext: DEV LOGIN BYPASS");
                const devUser = { id: 'dev-admin', email: 'dev@admin.com' };
                setUser(devUser);
                setProfile({ id: 'dev-admin', role: 'admin', subscription_status: 'active' });
                setUserRole('admin');
                setIsAdmin(true);
            }
        }
    };

    if (sessionLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-lime-50 text-emerald-800">
                <div className="animate-pulse font-bold text-xl">Loading Nouriva...</div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
