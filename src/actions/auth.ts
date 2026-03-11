'use server';

import { createClient } from "@/lib/supabase-server";

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
    } catch (error: any) {
        console.error('Registration Error:', error);
        return { error: error.message || 'Error al registrar usuario.' };
    }
}
