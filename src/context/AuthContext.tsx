'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';

function mapProfile(data: unknown): UserProfile | null {
    if (!data) return null;
    const d = data as Record<string, unknown>;
    return {
        uid: d.uid as string,
        email: d.email as string,
        fullName: (d.full_name || d.fullName) as string,
        stageName: (d.stage_name || d.stageName) as string | undefined,
        photoUrl: (d.photo_url || d.photoUrl) as string | undefined,
        bio: d.bio as string | undefined,
        roleInShow: (d.role_in_show || d.roleInShow) as string | undefined,
        roles: (d.roles || []) as string[],
        skills: (d.skills || []) as string[],
        birthdate: (d.birthdate || d.birth_date || undefined) as string | undefined,
        createdAt: (d.created_at || d.createdAt) as string,
        updatedAt: (d.updated_at || d.updatedAt) as string,
    };
}

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

    const loadUserData = async (userId: string) => {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        // Load user profile
        const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('uid', userId)
            .single();

        // Auto-create profile for Google/OAuth users on first sign-in
        if (!profileData) {
            if (authUser) {
                const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || '';
                const avatarUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null;
                await supabase.from('users').upsert({
                    uid: authUser.id,
                    email: authUser.email ?? '',
                    full_name: fullName,
                    photo_url: avatarUrl,
                    roles: [],
                    skills: [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'uid' });
                const { data: newProfile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('uid', userId)
                    .single();
                setProfile(mapProfile(newProfile));
            } else {
                setProfile(null);
            }
        } else {
            setProfile(mapProfile(profileData));
        }

        // Check if admin / super admin
        console.log('Checking admin status for UID:', userId);
        const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('uid, super_admin')
            .eq('uid', userId)
            .single();

        if (adminError && adminError.code !== 'PGRST116') {
            console.error('Admin check error:', adminError);
        }

        console.log('Admin data response:', adminData);
        setIsAdmin(!!adminData);
        setIsSuperAdmin(!!adminData?.super_admin);
        setLoading(false);

        // Subscribe to profile changes
        const profileChannel = supabase
            .channel(`profile:${userId}`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'users', filter: `uid=eq.${userId}` },
                (payload) => {
                    setProfile(mapProfile(payload.new));
                }
            )
            .subscribe();

        // Subscribe to admin changes
        const adminChannel = supabase
            .channel(`admin:${userId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'admins', filter: `uid=eq.${userId}` },
                (payload: { eventType: string; new: Record<string, unknown> }) => {
                    const isActive = payload.eventType !== 'DELETE';
                    setIsAdmin(isActive);
                    setIsSuperAdmin(isActive && !!(payload.new?.super_admin));
                }
            )
            .subscribe();

        return () => {
            profileChannel.unsubscribe();
            adminChannel.unsubscribe();
        };
    };

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
