-- Insertar nuevas categorías adicionales, ignorando las que ya existan por su nombre
INSERT INTO public.business_categories (name, icon) VALUES
('Gastronomía / Delivery', '🍔'),
('Eventos y Entretenimiento', '🎉'),
('Fotografía y Video', '📸'),
('Tecnología y Web', '💻'),
('Música y Sonido', '🎵'),
('Entrenamiento y Deportes', '🏋️‍♀️'),
('Cosmética y Maquillaje', '💄'),
('Hogar y Decoración', '🏠'),
('Artesanías y Manualidades', '🧶'),
('Mascotas y Cuidado', '🐾'),
('Terapias Alternativas', '🧘‍♀️'),
('Asesorías y Trámites', '📝'),
('Marketing y Redes', '📱'),
('Transporte y Envíos', '🚚'),
('Tatuajes y Piercings', '🖋️')
ON CONFLICT (name) DO NOTHING;
