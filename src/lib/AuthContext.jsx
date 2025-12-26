import React, { createContext, useContext, useEffect, useState } from 'react';
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

    useEffect(() => {
        // 1. Get initial session
        const initAuth = async () => {
            try {
                setSessionLoading(true);
                const { data: { session }, error } = await supabase.auth.getSession();

                setUser(session?.user ?? null);

                if (session?.user) {
                    // Start profile fetch in background, don't block sessionLoading
                    setProfileLoading(true);
                    fetchProfile(session.user.id, session.user);
                }
            } catch (e) {
                console.error("AuthContext: getSession CRASH", e);
            } finally {
                // UNBLOCK APP RENDER IMMEDIATELY
                setSessionLoading(false);
            }
        };

        initAuth();

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const previousUser = user;
            const currentUser = session?.user ?? null;

            setUser(currentUser);

            // Only fetch profile if user has changed or signed in
            if (currentUser && currentUser.id !== previousUser?.id) {
                console.log("AuthContext: User changed/session refreshed:", currentUser.id);
                setProfileLoading(true);
                await fetchProfile(currentUser.id, currentUser);
            } else if (!currentUser) {
                console.log("AuthContext: No session found (Guest mode)");
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
            // 15s timeout to prevent infinite loading state
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timed out (15s)')), 15000)
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
                console.error('Error fetching profile:', error);
                if (isHardcodedAdmin) role = 'admin';
            } else {
                setProfile(data);
                if (data.role === 'admin' || isHardcodedAdmin) {
                    role = 'admin';
                } else if (data.subscription_status === 'active') {
                    role = 'premium';
                }
            }
            console.log("AuthContext: Role determined:", role);
            setUserRole(role);
            setIsAdmin(role === 'admin');
        } catch (err) {
            console.error("AuthContext: fetchProfile CRASH", err);
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
