-- SOLUCIÓN AGRESIVA PARA RECURSIÓN RLS EN TABLA ADMINS
-- Ejecutar esto en el SQL Editor de Supabase

DO $$ 
DECLARE 
    pol record;
BEGIN
    -- 1. Eliminar TODAS las políticas existentes en la tabla admins de forma dinámica
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'admins' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admins', pol.policyname);
    END LOOP;
END $$;

-- 2. Desactivar RLS momentáneamente para limpiar
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- 3. Asegurarse de que el usuario sea Admin
-- Usamos el UID detectado en los logs: d7499959-3a96-4331-adc7-cde0ca458d21
-- Y el mail proporcionado: reyleonapp@pruebasweb.shop
INSERT INTO public.admins (uid, super_admin)
SELECT uid, true 
FROM public.users 
WHERE email = 'reyleonapp@pruebasweb.shop'
ON CONFLICT (uid) DO UPDATE SET super_admin = true;

-- 4. Reactivar RLS con una política ultra básica
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 5. Crear la política de lectura más simple posible (LECTURA PÚBLICA)
-- Esto evita que cualquier role (anon, authenticated) entre en bucle al consultar.
CREATE POLICY "Public Read for Admins" 
ON public.admins 
FOR SELECT 
TO public 
USING (true);

-- 6. Política para que los usuarios autenticados puedan ver si son admins (opcional pero seguro)
-- No usamos subconsultas aquí para evitar recursión.
-- CREATE POLICY "Authenticated users can see admins" ON public.admins FOR SELECT TO authenticated USING (true);
