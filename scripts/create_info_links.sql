CREATE TABLE IF NOT EXISTS public.info_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.users(uid) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_info_links_order ON public.info_links(order_index, created_at DESC);

ALTER TABLE public.info_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Info links public read" ON public.info_links;
DROP POLICY IF EXISTS "Admins can insert info links" ON public.info_links;
DROP POLICY IF EXISTS "Admins can update info links" ON public.info_links;
DROP POLICY IF EXISTS "Admins can delete info links" ON public.info_links;

CREATE POLICY "Info links public read"
ON public.info_links
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert info links"
ON public.info_links
FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()));

CREATE POLICY "Admins can update info links"
ON public.info_links
FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()));

CREATE POLICY "Admins can delete info links"
ON public.info_links
FOR DELETE
USING (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()));
