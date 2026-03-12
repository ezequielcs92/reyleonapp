ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS hidden_by_admin BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.polls
ADD COLUMN IF NOT EXISTS hidden_by_admin BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.admin_feed_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'poll')),
    target_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('pin', 'unpin', 'hide', 'restore', 'delete')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_feed_actions_created_at
ON public.admin_feed_actions(created_at DESC);

ALTER TABLE public.admin_feed_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read feed actions" ON public.admin_feed_actions;
DROP POLICY IF EXISTS "Admins can insert feed actions" ON public.admin_feed_actions;

CREATE POLICY "Admins can read feed actions"
ON public.admin_feed_actions
FOR SELECT
USING (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()));

CREATE POLICY "Admins can insert feed actions"
ON public.admin_feed_actions
FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()));
