-- Add character_role column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS character_role TEXT;

-- Update RLS if necessary (usually public.users is already readable)
COMMENT ON COLUMN public.users.character_role IS 'El papel o personaje que interpreta el integrante en la obra (ej: Simba, Nala).';
