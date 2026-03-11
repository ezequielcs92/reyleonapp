-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    stage_name TEXT,
    photo_url TEXT,
    bio TEXT,
    role_in_show TEXT,
    roles TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User links table
CREATE TABLE user_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('instagram', 'tiktok', 'twitter', 'youtube', 'website', 'other')),
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User work table
CREATE TABLE user_work (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    year INTEGER NOT NULL,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_photo_url TEXT,
    image_url TEXT,
    description TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post likes table
CREATE TABLE post_likes (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- Polls table
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    creator_name TEXT NOT NULL,
    question TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('single', 'multi')),
    is_anonymous BOOLEAN DEFAULT FALSE,
    show_results TEXT NOT NULL CHECK (show_results IN ('always', 'after_vote', 'after_close')),
    closes_at TIMESTAMPTZ,
    pinned BOOLEAN DEFAULT FALSE,
    total_votes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll options table
CREATE TABLE poll_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    votes_count INTEGER DEFAULT 0,
    position INTEGER NOT NULL
);

-- Poll votes table
CREATE TABLE poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(poll_id, option_id, user_id)
);

-- Businesses table
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    owner_name TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    short_desc TEXT NOT NULL,
    long_desc TEXT,
    image_url TEXT,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden_by_admin', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins table
CREATE TABLE admins (
    uid UUID PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Config table
CREATE TABLE config (
    key TEXT PRIMARY KEY,
    group_code TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config
INSERT INTO config (key, group_code) VALUES ('app', 'SIMBA');

-- Indexes for performance
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_polls_creator_id ON polls(creator_id);
CREATE INDEX idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_user_links_user_id ON user_links(user_id);
CREATE INDEX idx_user_work_user_id ON user_work(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = uid);

-- User links policies
CREATE POLICY "Anyone can view user links" ON user_links FOR SELECT USING (true);
CREATE POLICY "Users can manage own links" ON user_links FOR ALL USING (auth.uid() = user_id);

-- User work policies
CREATE POLICY "Anyone can view user work" ON user_work FOR SELECT USING (true);
CREATE POLICY "Users can manage own work" ON user_work FOR ALL USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Post likes policies
CREATE POLICY "Anyone can view likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON post_likes FOR ALL USING (auth.uid() = user_id);

-- Polls policies
CREATE POLICY "Anyone can view polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Users can create polls" ON polls FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own polls" ON polls FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own polls" ON polls FOR DELETE USING (auth.uid() = creator_id);

-- Poll options policies
CREATE POLICY "Anyone can view poll options" ON poll_options FOR SELECT USING (true);
CREATE POLICY "Poll creators can manage options" ON poll_options FOR ALL USING (
    EXISTS (SELECT 1 FROM polls WHERE polls.id = poll_id AND polls.creator_id = auth.uid())
);

-- Poll votes policies
CREATE POLICY "Users can view votes based on poll settings" ON poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Businesses policies
CREATE POLICY "Anyone can view active businesses" ON businesses FOR SELECT USING (status = 'active' OR owner_id = auth.uid());
CREATE POLICY "Users can create businesses" ON businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own businesses" ON businesses FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own businesses" ON businesses FOR DELETE USING (auth.uid() = owner_id);

-- Admins policies
CREATE POLICY "Anyone can check admin status" ON admins FOR SELECT USING (true);

-- Config policies
CREATE POLICY "Anyone can read config" ON config FOR SELECT USING (true);

-- Functions to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_config_updated_at BEFORE UPDATE ON config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are public" ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar" ON storage.objects
FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);
