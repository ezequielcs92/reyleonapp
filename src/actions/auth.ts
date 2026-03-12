'use server';

import { createClient } from "@/lib/supabase-server";
import { headers } from "next/headers";

function errorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) return error.message;
    return fallback;
}

export async function registerUser(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    if (!email || !password || !fullName) {
        return { error: 'Todos los campos son obligatorios.' };
    }

    try {
        const supabase = await createClient();

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });

        if (authError) {
            return { error: authError.message };
        }

        if (!authData.user) {
            return { error: 'Error al crear usuario.' };
        }

        // 2. Create User Profile
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                uid: authData.user.id,
                email: authData.user.email,
                full_name: fullName,
                roles: [],
                skills: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

        if (profileError) {
            return { error: profileError.message };
        }

        return { success: true };
    } catch (error: unknown) {
        console.error('Registration Error:', error);
        return { error: errorMessage(error, 'Error al registrar usuario.') };
    }
}

export async function loginUser(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email y contraseña son obligatorios.' };
    }

    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return { success: true };
    } catch (error: unknown) {
        return { error: errorMessage(error, 'Error al iniciar sesión.') };
    }
}

export async function signInWithGoogle() {
    try {
        const supabase = await createClient();
        const headersList = await headers();

        // Determinar la URL base correctamente, incluso en Vercel
        const host = headersList.get('host');
        const protocol = headersList.get('x-forwarded-proto') ?? (host?.includes('localhost') ? 'http' : 'https');
        let baseUrl = headersList.get('origin');

        if (!baseUrl) {
            baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${baseUrl}/auth/callback?next=/feed`,
            },
        });

        if (error) return { error: error.message };
        return { url: data.url };
    } catch (error: unknown) {
        return { error: errorMessage(error, 'Error al iniciar sesión con Google.') };
    }
}

export async function logoutUser() {
    try {
        const supabase = await createClient();
        await supabase.auth.signOut();
        return { success: true };
    } catch (e: unknown) {
        return { error: errorMessage(e, 'Error al cerrar sesión') };
    }
}
