-- Community Management
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject_tag TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Posts System
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Reference to auth.users if using Supabase Auth
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    subject_tag TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comments System (Nested)
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    parent_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Engagement (Likes/Upvotes)
CREATE TABLE IF NOT EXISTS community_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Community Membership
CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(community_id, user_id)
);

-- Seed Initial Communities
INSERT INTO communities (name, subject_tag, description) VALUES
('Physics', 'physics', 'Explore the laws of the universe.'),
('Mathematics', 'mathematics', 'The language of logic and patterns.'),
('Chemistry', 'chemistry', 'Matter, reactions, and the building blocks of life.'),
('General Discussion', 'general', 'Anything and everything for Lumina students.')
ON CONFLICT (subject_tag) DO NOTHING;

-- Policies for RBAC (Requires Supabase Auth context usually)
-- These are stubs for implementation in the DB
-- ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
-- Student: View all, Create own, Edit own
-- Teacher/Admin: View all, Delete any (Moderate)
