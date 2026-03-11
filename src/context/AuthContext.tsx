'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false,
    isSuperAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadUserData(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadUserData(session.user.id);
            } else {
                setProfile(null);
                setIsAdmin(false);
                setIsSuperAdmin(false);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadUserData = async (userId: string) => {
        // Load user profile
        const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('uid', userId)
            .single();

        // Auto-create profile for Google/OAuth users on first sign-in
        if (!profileData) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
                await supabase.from('users').insert({
                    uid: user.id,
                    email: user.email,
                    full_name: fullName,
                    roles: [],
                    skills: [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
                const { data: newProfile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('uid', userId)
                    .single();
                setProfile(newProfile as UserProfile | null);
            }
        } else {
            setProfile(profileData as UserProfile | null);
        }

        // Check if admin / super admin
        const { data: adminData } = await supabase
            .from('admins')
            .select('uid, super_admin')
            .eq('uid', userId)
            .single();

        setIsAdmin(!!adminData);
        setIsSuperAdmin(!!adminData?.super_admin);
        setLoading(false);

        // Subscribe to profile changes
        const profileChannel = supabase
            .channel(`profile:${userId}`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'users', filter: `uid=eq.${userId}` },
                (payload) => {
                    setProfile(payload.new as UserProfile);
                }
            )
            .subscribe();

        // Subscribe to admin changes
        const adminChannel = supabase
            .channel(`admin:${userId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'admins', filter: `uid=eq.${userId}` },
                (payload) => {
                    const isActive = payload.eventType !== 'DELETE';
                    setIsAdmin(isActive);
                    setIsSuperAdmin(isActive && !!(payload.new as any)?.super_admin);
                }
            )
            .subscribe();

        return () => {
            profileChannel.unsubscribe();
            adminChannel.unsubscribe();
        };
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, isAdmin, isSuperAdmin }}>
            {loading ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
}
