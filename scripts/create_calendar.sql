-- Tabla para eventos del calendario
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT NOT NULL, -- 'ensayo', 'fecha_importante', 'evento'
    created_by UUID REFERENCES public.users(uid) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Politicas
CREATE POLICY "Cualquiera puede ver eventos" ON public.calendar_events FOR SELECT USING (true);
CREATE POLICY "Solo admins pueden crear eventos" ON public.calendar_events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid())
);
CREATE POLICY "Solo admins pueden actualizar eventos" ON public.calendar_events FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid())
);
CREATE POLICY "Solo admins pueden eliminar eventos" ON public.calendar_events FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid())
);
