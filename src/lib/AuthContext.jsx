import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userRole, setUserRole] = useState('guest'); // 'guest', 'standard', 'premium', 'admin'

    useEffect(() => {
        // 1. Get initial session
        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id, session.user);
                } else {
                    setLoading(false);
                }
            } catch (e) {
                console.error("AuthContext: getSession CRASH", e);
                setLoading(false);
            }
        };

        getSession();

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchProfile(session.user.id, session.user);
            } else {
                setProfile(null);
                setLoading(false);
                setUserRole('guest');
                setIsAdmin(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId, currentUser) => {
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timed out (5s)')), 5000)
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
            setUserRole(role);
            setIsAdmin(role === 'admin');
        } catch (err) {
            console.error("AuthContext: fetchProfile CRASH", err);
            setUserRole('standard');
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        profile,
        userRole, // 'standard', 'premium', 'admin'
        isAdmin: userRole === 'admin',
        isPremium: userRole === 'premium' || userRole === 'admin', // Admins get premium features
        loading,
        signIn: () => supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        }),
        signOut: () => {
            setUserRole('guest');
            supabase.auth.signOut();
        },
    };

    if (loading) {
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
