-- Arreglar recursividad infinita en la tabla de administradores
-- Este script elimina políticas viejas y establece una simple

-- 1. Eliminar políticas que podrían estar causando el bucle
DROP POLICY IF EXISTS "Admins are viewable by everyone" ON public.admins;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admins;
DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;

-- 2. Crear una política ultra-simple de lectura (sin consultas anidadas)
CREATE POLICY "Admins are viewable by everyone" 
ON public.admins 
FOR SELECT 
USING (true);

-- 3. Asegurar que el RLS esté activo
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 4. Opcional: Agregar política para inserción (solo para estar seguros)
-- Aunque el admin se agrega manualmente por SQL usualmente.
DROP POLICY IF EXISTS "Only super admins can manage admins" ON public.admins;
-- Por ahora no agregamos políticas de escritura complejas para evitar nuevos bucles.
