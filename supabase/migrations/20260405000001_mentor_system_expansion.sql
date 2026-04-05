-- Version: 1.0.0
-- Description: Mentor System Expansion including matches, sessions, and portfolio tracking.
-- Author: Antigravity AI

-- 1. Mentor Matches
CREATE TABLE IF NOT EXISTS mentor_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    match_source TEXT NOT NULL CHECK (match_source IN ('ml_only', 'system_generated')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mentor_id, student_id)
);

-- 2. Mentor Sessions
CREATE TABLE IF NOT EXISTS mentor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mentee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notes_json JSONB DEFAULT '{}',
    next_steps TEXT,
    session_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Portfolio Items (Student-owned, Mentor-viewable)
CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_url TEXT,
    category TEXT, -- e.g., 'project', 'certification', 'skill'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE mentor_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Mentor Matches: Mentors and students can view their own matches
CREATE POLICY "Users can view their own mentor matches" ON mentor_matches
    FOR SELECT USING (auth.uid() = mentor_id OR auth.uid() = student_id);

-- Mentor Sessions: Mentors and mentees can view/manage their sessions
CREATE POLICY "Mentors can manage their sessions" ON mentor_sessions
    FOR ALL USING (auth.uid() = mentor_id);

CREATE POLICY "Students can view their mentor sessions" ON mentor_sessions
    FOR SELECT USING (auth.uid() = mentee_id);

-- Portfolio Items: Students manage, Mentors view linked student items
CREATE POLICY "Students can manage their own portfolio" ON portfolio_items
    FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Mentors can view their mentees' portfolio" ON portfolio_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mentor_matches
            WHERE mentor_matches.mentor_id = auth.uid()
              AND mentor_matches.student_id = portfolio_items.student_id
              AND mentor_matches.status = 'active'
        )
    );

-- 6. Indexes
CREATE INDEX idx_mentor_matches_mentor ON mentor_matches(mentor_id);
CREATE INDEX idx_mentor_matches_student ON mentor_matches(student_id);
CREATE INDEX idx_mentor_sessions_mentor ON mentor_sessions(mentor_id);
CREATE INDEX idx_mentor_sessions_mentee ON mentor_sessions(mentee_id);
CREATE INDEX idx_portfolio_items_student ON portfolio_items(student_id);

-- 7. Comments
COMMENT ON TABLE mentor_matches IS 'ML-assigned mentorship pairings between industry mentors and students.';
COMMENT ON TABLE mentor_sessions IS 'Detailed records of mentorship interactions with AI-ready notes.';
COMMENT ON TABLE portfolio_items IS 'Student career and technical highlights, the only academic-adjacent data mentors can view.';
