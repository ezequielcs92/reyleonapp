-- Consolidated additive Supabase setup for the current app.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.users (
    uid uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL DEFAULT '',
    full_name text NOT NULL DEFAULT '',
    stage_name text,
    photo_url text,
    bio text,
    role_in_show text,
    roles text[] NOT NULL DEFAULT '{}'::text[],
    skills text[] NOT NULL DEFAULT '{}'::text[],
    birthdate date,
    character_role text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stage_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_in_show text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS roles text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birthdate date;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS character_role text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.user_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('instagram', 'tiktok', 'twitter', 'youtube', 'website', 'other')),
    label text NOT NULL,
    url text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_links ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.user_links ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.user_links ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.user_links ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE public.user_links ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE public.user_links ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.user_work (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    title text NOT NULL,
    year integer NOT NULL,
    company text NOT NULL,
    role text NOT NULL,
    link text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_work ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.user_work ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.user_work ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.user_work ADD COLUMN IF NOT EXISTS year integer;
ALTER TABLE public.user_work ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE public.user_work ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE public.user_work ADD COLUMN IF NOT EXISTS link text;
ALTER TABLE public.user_work ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    author_name text NOT NULL,
    author_photo_url text,
    image_url text,
    description text NOT NULL,
    likes_count integer NOT NULL DEFAULT 0,
    pinned boolean NOT NULL DEFAULT false,
    hidden_by_admin boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_id uuid;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_photo_url text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hidden_by_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.post_likes (
    post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.post_likes ADD COLUMN IF NOT EXISTS post_id uuid;
ALTER TABLE public.post_likes ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.post_likes ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.polls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    creator_name text NOT NULL,
    question text NOT NULL,
    type text NOT NULL DEFAULT 'single' CHECK (type IN ('single', 'multi')),
    is_anonymous boolean NOT NULL DEFAULT false,
    show_results text NOT NULL DEFAULT 'always' CHECK (show_results IN ('always', 'after_vote', 'after_close')),
    closes_at timestamptz,
    pinned boolean NOT NULL DEFAULT false,
    hidden_by_admin boolean NOT NULL DEFAULT false,
    total_votes integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS creator_id uuid;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS creator_name text;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS question text;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'single';
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS show_results text NOT NULL DEFAULT 'always';
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS closes_at timestamptz;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS hidden_by_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS total_votes integer NOT NULL DEFAULT 0;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.poll_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    text text NOT NULL,
    votes_count integer NOT NULL DEFAULT 0,
    position integer NOT NULL DEFAULT 0
);

ALTER TABLE public.poll_options ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.poll_options ADD COLUMN IF NOT EXISTS poll_id uuid;
ALTER TABLE public.poll_options ADD COLUMN IF NOT EXISTS text text;
ALTER TABLE public.poll_options ADD COLUMN IF NOT EXISTS votes_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.poll_options ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.poll_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.poll_votes ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.poll_votes ADD COLUMN IF NOT EXISTS poll_id uuid;
ALTER TABLE public.poll_votes ADD COLUMN IF NOT EXISTS option_id uuid;
ALTER TABLE public.poll_votes ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.poll_votes ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.business_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    icon text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.business_categories ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.business_categories ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.business_categories ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT '';
ALTER TABLE public.business_categories ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.businesses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES public.users(uid) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(uid) ON DELETE CASCADE,
    owner_name text,
    name text NOT NULL,
    category text,
    category_id uuid REFERENCES public.business_categories(id) ON DELETE SET NULL,
    tags text[] NOT NULL DEFAULT '{}'::text[],
    short_desc text,
    long_desc text,
    description text,
    image_url text,
    logo_url text,
    location text,
    contact_phone text,
    contact_email text,
    instagram_url text,
    website_url text,
    is_active boolean NOT NULL DEFAULT true,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_name text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS short_desc text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS long_desc text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

UPDATE public.businesses
SET owner_id = user_id
WHERE owner_id IS NULL AND user_id IS NOT NULL;

UPDATE public.businesses
SET user_id = owner_id
WHERE user_id IS NULL AND owner_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    uid uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    super_admin boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS uid uuid;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS super_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.admins ALTER COLUMN super_admin SET DEFAULT false;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.config (
    key text PRIMARY KEY,
    group_code text,
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.config ADD COLUMN IF NOT EXISTS key text;
ALTER TABLE public.config ADD COLUMN IF NOT EXISTS group_code text;
ALTER TABLE public.config ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.calendar_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    event_date timestamptz NOT NULL,
    type text NOT NULL,
    created_by uuid REFERENCES public.users(uid) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS event_date timestamptz;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.post_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name text NOT NULL,
    user_photo_url text,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS post_id uuid;
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS user_photo_url text;
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('post_pinned', 'poll_pinned', 'event_created', 'birthday')),
    title text NOT NULL,
    message text NOT NULL,
    link text,
    read boolean NOT NULL DEFAULT false,
    dedupe_key text UNIQUE,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read boolean NOT NULL DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS dedupe_key text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.admin_feed_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    target_type text NOT NULL CHECK (target_type IN ('post', 'poll')),
    target_id uuid NOT NULL,
    action text NOT NULL CHECK (action IN ('pin', 'unpin', 'hide', 'restore', 'delete')),
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_feed_actions ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.admin_feed_actions ADD COLUMN IF NOT EXISTS admin_id uuid;
ALTER TABLE public.admin_feed_actions ADD COLUMN IF NOT EXISTS target_type text;
ALTER TABLE public.admin_feed_actions ADD COLUMN IF NOT EXISTS target_id uuid;
ALTER TABLE public.admin_feed_actions ADD COLUMN IF NOT EXISTS action text;
ALTER TABLE public.admin_feed_actions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.info_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    url text NOT NULL,
    description text,
    order_index integer NOT NULL DEFAULT 0,
    created_by uuid REFERENCES public.users(uid) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.info_links ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.info_links ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.info_links ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE public.info_links ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.info_links ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;
ALTER TABLE public.info_links ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.info_links ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.info_links ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_categories_name ON public.business_categories(name);
CREATE INDEX IF NOT EXISTS idx_user_links_user_id ON public.user_links(user_id);
CREATE INDEX IF NOT EXISTS idx_user_work_user_id ON public.user_work(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pinned_created ON public.posts(pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_polls_creator_id ON public.polls(creator_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON public.polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_polls_pinned_created ON public.polls(pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_options_poll_position ON public.poll_options(poll_id, position);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON public.poll_votes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_votes_unique_vote ON public.poll_votes(poll_id, option_id, user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON public.businesses(category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON public.businesses(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_uid ON public.admins(uid);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_date ON public.calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON public.post_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_admin_feed_actions_created_at ON public.admin_feed_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_feed_actions_target ON public.admin_feed_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_info_links_order ON public.info_links(order_index, created_at DESC);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_feed_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.info_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users public read" ON public.users;
DROP POLICY IF EXISTS "Users insert own row" ON public.users;
DROP POLICY IF EXISTS "Users update own row" ON public.users;

CREATE POLICY "Users public read"
ON public.users
FOR SELECT
USING (true);

CREATE POLICY "Users insert own row"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = uid);

CREATE POLICY "Users update own row"
ON public.users
FOR UPDATE
USING (auth.uid() = uid)
WITH CHECK (auth.uid() = uid);

DROP POLICY IF EXISTS "User links public read" ON public.user_links;
DROP POLICY IF EXISTS "User links insert own" ON public.user_links;
DROP POLICY IF EXISTS "User links update own" ON public.user_links;
DROP POLICY IF EXISTS "User links delete own" ON public.user_links;

CREATE POLICY "User links public read"
ON public.user_links
FOR SELECT
USING (true);

CREATE POLICY "User links insert own"
ON public.user_links
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User links update own"
ON public.user_links
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User links delete own"
ON public.user_links
FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User work public read" ON public.user_work;
DROP POLICY IF EXISTS "User work insert own" ON public.user_work;
DROP POLICY IF EXISTS "User work update own" ON public.user_work;
DROP POLICY IF EXISTS "User work delete own" ON public.user_work;

CREATE POLICY "User work public read"
ON public.user_work
FOR SELECT
USING (true);

CREATE POLICY "User work insert own"
ON public.user_work
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User work update own"
ON public.user_work
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User work delete own"
ON public.user_work
FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Posts public read" ON public.posts;
DROP POLICY IF EXISTS "Posts insert own" ON public.posts;
DROP POLICY IF EXISTS "Posts update own" ON public.posts;
DROP POLICY IF EXISTS "Posts delete own" ON public.posts;

CREATE POLICY "Posts public read"
ON public.posts
FOR SELECT
USING (true);

CREATE POLICY "Posts insert own"
ON public.posts
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Posts update own"
ON public.posts
FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Posts delete own"
ON public.posts
FOR DELETE
USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Post likes public read" ON public.post_likes;
DROP POLICY IF EXISTS "Post likes insert own" ON public.post_likes;
DROP POLICY IF EXISTS "Post likes delete own" ON public.post_likes;

CREATE POLICY "Post likes public read"
ON public.post_likes
FOR SELECT
USING (true);

CREATE POLICY "Post likes insert own"
ON public.post_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Post likes delete own"
ON public.post_likes
FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Polls public read" ON public.polls;
DROP POLICY IF EXISTS "Polls insert own" ON public.polls;
DROP POLICY IF EXISTS "Polls update own" ON public.polls;
DROP POLICY IF EXISTS "Polls delete own" ON public.polls;

CREATE POLICY "Polls public read"
ON public.polls
FOR SELECT
USING (true);

CREATE POLICY "Polls insert own"
ON public.polls
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Polls update own"
ON public.polls
FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Polls delete own"
ON public.polls
FOR DELETE
USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Poll options public read" ON public.poll_options;
DROP POLICY IF EXISTS "Poll options insert by creator" ON public.poll_options;
DROP POLICY IF EXISTS "Poll options update by creator" ON public.poll_options;
DROP POLICY IF EXISTS "Poll options delete by creator" ON public.poll_options;

CREATE POLICY "Poll options public read"
ON public.poll_options
FOR SELECT
USING (true);

CREATE POLICY "Poll options insert by creator"
ON public.poll_options
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.polls
        WHERE public.polls.id = poll_id
          AND public.polls.creator_id = auth.uid()
    )
);

CREATE POLICY "Poll options update by creator"
ON public.poll_options
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.polls
        WHERE public.polls.id = poll_id
          AND public.polls.creator_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.polls
        WHERE public.polls.id = poll_id
          AND public.polls.creator_id = auth.uid()
    )
);

CREATE POLICY "Poll options delete by creator"
ON public.poll_options
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM public.polls
        WHERE public.polls.id = poll_id
          AND public.polls.creator_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Poll votes public read" ON public.poll_votes;
DROP POLICY IF EXISTS "Poll votes insert own" ON public.poll_votes;
DROP POLICY IF EXISTS "Poll votes delete own" ON public.poll_votes;

CREATE POLICY "Poll votes public read"
ON public.poll_votes
FOR SELECT
USING (true);

CREATE POLICY "Poll votes insert own"
ON public.poll_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Poll votes delete own"
ON public.poll_votes
FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Business categories public read" ON public.business_categories;

CREATE POLICY "Business categories public read"
ON public.business_categories
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Businesses public read" ON public.businesses;
DROP POLICY IF EXISTS "Businesses authenticated insert" ON public.businesses;
DROP POLICY IF EXISTS "Businesses owner or admin update" ON public.businesses;
DROP POLICY IF EXISTS "Businesses owner or admin delete" ON public.businesses;

CREATE POLICY "Businesses public read"
ON public.businesses
FOR SELECT
USING (true);

CREATE POLICY "Businesses authenticated insert"
ON public.businesses
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated'
    AND (owner_id IS NULL OR owner_id = auth.uid())
    AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY "Businesses owner or admin update"
ON public.businesses
FOR UPDATE
USING (
    auth.uid() = owner_id
    OR auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid())
)
WITH CHECK (
    auth.uid() = owner_id
    OR auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid())
);

CREATE POLICY "Businesses owner or admin delete"
ON public.businesses
FOR DELETE
USING (
    auth.uid() = owner_id
    OR auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid())
);

DROP POLICY IF EXISTS "Admins public read" ON public.admins;

CREATE POLICY "Admins public read"
ON public.admins
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Config public read" ON public.config;

CREATE POLICY "Config public read"
ON public.config
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Calendar events public read" ON public.calendar_events;
DROP POLICY IF EXISTS "Calendar events admin insert" ON public.calendar_events;
DROP POLICY IF EXISTS "Calendar events admin update" ON public.calendar_events;
DROP POLICY IF EXISTS "Calendar events admin delete" ON public.calendar_events;

CREATE POLICY "Calendar events public read"
ON public.calendar_events
FOR SELECT
USING (true);

CREATE POLICY "Calendar events admin insert"
ON public.calendar_events
FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()));

CREATE POLICY "Calendar events admin update"
ON public.calendar_events
FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()));

CREATE POLICY "Calendar events admin delete"
ON public.calendar_events
FOR DELETE
USING (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()));

DROP POLICY IF EXISTS "Post comments public read" ON public.post_comments;
DROP POLICY IF EXISTS "Post comments authenticated insert" ON public.post_comments;
DROP POLICY IF EXISTS "Post comments owner update" ON public.post_comments;
DROP POLICY IF EXISTS "Post comments owner delete" ON public.post_comments;

CREATE POLICY "Post comments public read"
ON public.post_comments
FOR SELECT
USING (true);

CREATE POLICY "Post comments authenticated insert"
ON public.post_comments
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Post comments owner update"
ON public.post_comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Post comments owner delete"
ON public.post_comments
FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Notifications own read" ON public.notifications;
DROP POLICY IF EXISTS "Notifications own update" ON public.notifications;

CREATE POLICY "Notifications own read"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Notifications own update"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin feed actions read" ON public.admin_feed_actions;
DROP POLICY IF EXISTS "Admin feed actions insert" ON public.admin_feed_actions;

CREATE POLICY "Admin feed actions read"
ON public.admin_feed_actions
FOR SELECT
USING (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()));

CREATE POLICY "Admin feed actions insert"
ON public.admin_feed_actions
FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()));

DROP POLICY IF EXISTS "Info links public read" ON public.info_links;
DROP POLICY IF EXISTS "Info links admin insert" ON public.info_links;
DROP POLICY IF EXISTS "Info links admin update" ON public.info_links;
DROP POLICY IF EXISTS "Info links admin delete" ON public.info_links;

CREATE POLICY "Info links public read"
ON public.info_links
FOR SELECT
USING (true);

CREATE POLICY "Info links admin insert"
ON public.info_links
FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()));

CREATE POLICY "Info links admin update"
ON public.info_links
FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()));

CREATE POLICY "Info links admin delete"
ON public.info_links
FOR DELETE
USING (EXISTS (SELECT 1 FROM public.admins WHERE uid = auth.uid()));

INSERT INTO public.config (key, group_code)
VALUES ('app', 'SIMBA')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.business_categories (name, icon)
VALUES
    (U&'Gastronom\00EDa / Bodegones', 'bodegon'),
    (U&'Comida / Pasteler\00EDa', 'food'),
    (U&'Ropa / Indumentaria', 'clothes'),
    (U&'Moda y Accesorios', 'accessories'),
    (U&'Clases Particulares', 'classes'),
    ('Servicios Profesionales', 'services'),
    (U&'Arte y Dise\00F1o', 'art'),
    (U&'Est\00E9tica y Peluquer\00EDa', 'beauty'),
    ('Salud y Bienestar', 'wellness'),
    ('Eventos y Catering', 'events'),
    (U&'Fotograf\00EDa y Audiovisual', 'photo'),
    (U&'Tecnolog\00EDa y Web', 'tech'),
    (U&'M\00FAsica y Sonido', 'music'),
    ('Entrenamiento y Deportes', 'sports'),
    (U&'Cosm\00E9tica y Maquillaje', 'makeup'),
    (U&'Hogar y Decoraci\00F3n', 'home'),
    (U&'Artesan\00EDas y Manualidades', 'crafts'),
    ('Mascotas y Veterinaria', 'pets'),
    ('Terapias Alternativas', 'therapy'),
    (U&'Asesor\00EDas y Tr\00E1mites', 'advice'),
    ('Marketing y Manejo de Redes', 'marketing'),
    (U&'Transporte y Env\00EDos', 'transport'),
    ('Tatuajes y Piercings', 'tattoo'),
    ('Otros Emprendimientos', 'other'),
    (U&'Gastronom\00EDa / Delivery', 'delivery'),
    ('Eventos y Entretenimiento', 'entertainment'),
    (U&'Fotograf\00EDa y Video', 'video'),
    ('Mascotas y Cuidado', 'petcare'),
    ('Marketing y Redes', 'social')
ON CONFLICT (name) DO NOTHING;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_config_updated_at ON public.config;
CREATE TRIGGER update_config_updated_at
BEFORE UPDATE ON public.config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_info_links_updated_at ON public.info_links;
CREATE TRIGGER update_info_links_updated_at
BEFORE UPDATE ON public.info_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are public" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Post images are public" ON storage.objects;

CREATE POLICY "Avatar images are public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Post images are public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-images');

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) AND EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'posts'
    ) THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
        EXCEPTION
            WHEN duplicate_object THEN NULL;
            WHEN undefined_object THEN NULL;
        END;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) AND EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'polls'
    ) THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
        EXCEPTION
            WHEN duplicate_object THEN NULL;
            WHEN undefined_object THEN NULL;
        END;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) AND EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'poll_options'
    ) THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_options;
        EXCEPTION
            WHEN duplicate_object THEN NULL;
            WHEN undefined_object THEN NULL;
        END;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) AND EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'post_likes'
    ) THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
        EXCEPTION
            WHEN duplicate_object THEN NULL;
            WHEN undefined_object THEN NULL;
        END;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) AND EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'poll_votes'
    ) THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
        EXCEPTION
            WHEN duplicate_object THEN NULL;
            WHEN undefined_object THEN NULL;
        END;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) AND EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'notifications'
    ) THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
        EXCEPTION
            WHEN duplicate_object THEN NULL;
            WHEN undefined_object THEN NULL;
        END;
    END IF;
END $$;