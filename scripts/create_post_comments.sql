-- Scripts para crear la tabla de comentarios de publicaciones
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase.

-- 1. Crear la tabla
CREATE TABLE public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_photo_url TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar la Seguridad por Nivel de Fila (RLS)
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS

-- Política de lectura: todos pueden leer los comentarios
CREATE POLICY "Cualquiera puede leer comentarios"
ON public.post_comments
FOR SELECT
USING (true);

-- Política de inserción: los usuarios autenticados pueden crear comentarios
CREATE POLICY "Usuarios autenticados pueden comentar"
ON public.post_comments
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Política de actualización: los usuarios solo pueden editar sus propios comentarios
CREATE POLICY "Usuarios pueden editar sus propios comentarios"
ON public.post_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Política de eliminación: los usuarios pueden eliminar sus propios comentarios
CREATE POLICY "Usuarios pueden eliminar sus propios comentarios"
ON public.post_comments
FOR DELETE
USING (auth.uid() = user_id);
