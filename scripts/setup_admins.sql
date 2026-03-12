-- Create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policies for admins
CREATE POLICY "Admins are viewable by everyone" ON public.admins
    FOR SELECT USING (true);

-- Only super admins can manage the admins table (optional, but good for security)
-- For now, let's keep it simple so you can add yourself.

-- Add the current user as super admin if you know your UID, or we can use a subquery for the email
-- Replace 'reyleonapp@pruebasweb.shop' with your actual email if different.
INSERT INTO public.admins (uid, super_admin)
SELECT id, true FROM auth.users 
WHERE email = 'reyleonapp@pruebasweb.shop'
ON CONFLICT (uid) DO UPDATE SET super_admin = true;
