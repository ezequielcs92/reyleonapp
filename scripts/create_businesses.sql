-- Borramos completamente cualquier rastro anterior de la tabla de negocios
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.business_categories CASCADE;

-- 1. Crear Tabla de Categorias
CREATE TABLE public.business_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear Tabla de Negocios vinculada a la tabla public.users (donde estan los perfiles)
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    category_id UUID REFERENCES public.business_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    logo_url TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    instagram_url TEXT,
    website_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertar todas las categorías
INSERT INTO public.business_categories (name, icon) VALUES
('Gastronomía / Bodegones', '🍝'),
('Comida / Pastelería', '🍕'),
('Ropa / Indumentaria', '👗'),
('Moda y Accesorios', '💍'),
('Clases Particulares', '🎭'),
('Servicios Profesionales', '💼'),
('Arte y Diseño', '🎨'),
('Estética y Peluquería', '💇‍♀️'),
('Salud y Bienestar', '💆‍♀️'),
('Eventos y Catering', '🎉'),
('Fotografía y Audiovisual', '📸'),
('Tecnología y Web', '💻'),
('Música y Sonido', '🎵'),
('Entrenamiento y Deportes', '🏋️‍♀️'),
('Cosmética y Maquillaje', '💄'),
('Hogar y Decoración', '🏠'),
('Artesanías y Manualidades', '🧶'),
('Mascotas y Veterinaria', '🐾'),
('Terapias Alternativas', '🧘‍♀️'),
('Asesorías y Trámites', '📝'),
('Marketing y Manejo de Redes', '📱'),
('Transporte y Envíos', '🚚'),
('Tatuajes y Piercings', '🖋️'),
('Otros Emprendimientos', '✨')
ON CONFLICT (name) DO NOTHING;

-- Configuracion de Seguridad (RLS)
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Politicas
CREATE POLICY "Cualquiera puede ver las categorias" ON public.business_categories FOR SELECT USING (true);
CREATE POLICY "Cualquiera puede ver los negocios" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados pueden crear negocios" ON public.businesses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios pueden editar sus negocios" ON public.businesses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden eliminar sus negocios" ON public.businesses FOR DELETE USING (auth.uid() = user_id);
