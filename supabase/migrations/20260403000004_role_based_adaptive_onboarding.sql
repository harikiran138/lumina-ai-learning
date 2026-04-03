CREATE TABLE IF NOT EXISTS onboarding_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    role TEXT NOT NULL,
    flow_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress',
    question_count INT NOT NULL DEFAULT 4,
    current_index INT NOT NULL DEFAULT 0,
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    result JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_status
    ON onboarding_sessions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_institution
    ON onboarding_sessions(institution_id);

CREATE TABLE IF NOT EXISTS onboarding_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress',
    latest_session_id UUID REFERENCES onboarding_sessions(id) ON DELETE SET NULL,
    scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    level TEXT,
    learning_style_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
    knowledge_graph_seed JSONB NOT NULL DEFAULT '{}'::jsonb,
    assessment_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_trace JSONB NOT NULL DEFAULT '{}'::jsonb,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_institution_role
    ON onboarding_profiles(institution_id, role);
