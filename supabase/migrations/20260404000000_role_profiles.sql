-- Version: 1.3.0
-- Description: Production Grade Role-Specific Tables for Onboarding Data Persistence.
-- Authors: Antigravity AI

-- 1. Teacher Profiles
CREATE TABLE IF NOT EXISTS teacher_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    qualification TEXT,
    contact_phone TEXT,
    subjects TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    teaching_mode TEXT CHECK (teaching_mode IN ('online', 'offline', 'both')),
    hourly_rate NUMERIC(10, 2) DEFAULT 0.0,
    availability TEXT,
    portfolio_links TEXT[] DEFAULT '{}',
    teaching_focus TEXT,
    response_time TEXT,
    learner_levels TEXT[] DEFAULT '{}',
    is_activated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Faculty Profiles
CREATE TABLE IF NOT EXISTS faculty_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    employee_id TEXT,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    department TEXT,
    designation TEXT,
    subjects TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    verification_docs TEXT[] DEFAULT '{}',
    office_hours TEXT,
    teaching_modes TEXT[] DEFAULT '{}',
    faculty_notes TEXT,
    grading_scale TEXT,
    analytics_focus TEXT[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Parent Profiles
CREATE TABLE IF NOT EXISTS parent_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    relation TEXT,
    contact_phone TEXT,
    parent_email TEXT,
    monitoring_goals TEXT[] DEFAULT '{}',
    check_in_frequency TEXT,
    alert_preferences TEXT[] DEFAULT '{}',
    support_notes TEXT,
    preferred_language TEXT DEFAULT 'English',
    communication_mode TEXT,
    dashboard_intent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Parent-Student Mapping (For relationship persistence)
CREATE TABLE IF NOT EXISTS parent_student_map (
    parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    relationship_type TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (parent_id, student_id)
);

-- 5. Mentor Profiles
CREATE TABLE IF NOT EXISTS mentor_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    industry TEXT,
    experience_years INTEGER DEFAULT 0,
    linkedin_url TEXT,
    expertise_areas TEXT[] DEFAULT '{}',
    mentorship_type TEXT,
    availability_slots TEXT[] DEFAULT '{}',
    mentorship_goals TEXT,
    target_learner_levels TEXT[] DEFAULT '{}',
    support_formats TEXT[] DEFAULT '{}',
    response_window TEXT,
    portfolio_review_support BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Peer Tutor Profiles
CREATE TABLE IF NOT EXISTS peer_tutor_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    student_id_code TEXT,
    cgpa NUMERIC(3, 2),
    availability TEXT,
    strong_subjects TEXT[] DEFAULT '{}',
    preferred_levels TEXT[] DEFAULT '{}',
    tutoring_modes TEXT[] DEFAULT '{}',
    escalation_preference TEXT,
    tutoring_statement TEXT,
    weekly_capacity INTEGER DEFAULT 0,
    collaboration_tools TEXT[] DEFAULT '{}',
    support_boundaries TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Researcher Profiles
CREATE TABLE IF NOT EXISTS researcher_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    organization TEXT,
    research_areas TEXT[] DEFAULT '{}',
    data_access_level TEXT,
    publications TEXT[] DEFAULT '{}',
    ethics_approval BOOLEAN DEFAULT FALSE,
    methodology TEXT,
    collaboration_intent TEXT,
    reporting_cadence TEXT,
    privacy_mode TEXT,
    export_formats TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable RLS
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE researcher_profiles ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies

-- Public View (Adjust as needed for privacy)
CREATE POLICY "Public profiles are viewable by authenticated users" ON teacher_profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Owner Management
CREATE POLICY "Users can manage their own teacher profile" ON teacher_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own faculty profile" ON faculty_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own parent profile" ON parent_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Parents can manage their student links" ON parent_student_map
    FOR ALL USING (auth.uid() = parent_id);

CREATE POLICY "Users can manage their own mentor profile" ON mentor_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own peer tutor profile" ON peer_tutor_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own researcher profile" ON researcher_profiles
    FOR ALL USING (auth.uid() = user_id);

-- 10. Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id ON teacher_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_profiles_user_id ON faculty_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_parent_profiles_user_id ON parent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_user_id ON mentor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_tutor_profiles_user_id ON peer_tutor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_researcher_profiles_user_id ON researcher_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_map_parent ON parent_student_map(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_map_student ON parent_student_map(student_id);

-- 11. Comments for Postgres Pro Documentation
COMMENT ON TABLE teacher_profiles IS 'Detailed profile tracking for Teacher role in Lumina LMS.';
COMMENT ON TABLE faculty_profiles IS 'Institutional faculty member profiles with verification status.';
COMMENT ON TABLE parent_profiles IS 'Parent accounts tracking monitoring goals and alert preferences.';
COMMENT ON TABLE mentor_profiles IS 'Industry mentor profiles for career and technical guidance.';
COMMENT ON TABLE peer_tutor_profiles IS 'Advanced student profiles serving as peer mentors.';
COMMENT ON TABLE researcher_profiles IS 'Academic researcher profiles with data access governance.';
