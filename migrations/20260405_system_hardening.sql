-- Lumina System Hardening Migration
-- Date: 2026-04-05

-- 1. FSRS Spaced Repetition Persistence
CREATE TABLE IF NOT EXISTS public.fsrs_cards (
    card_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    concept_id TEXT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    source TEXT DEFAULT 'auto_generated',
    stability FLOAT DEFAULT 1.0,
    difficulty FLOAT DEFAULT 0.3,
    interval INTEGER DEFAULT 0,
    retrievability FLOAT DEFAULT 1.0,
    last_reviewed_at TIMESTAMPTZ,
    next_review_date TIMESTAMPTZ DEFAULT NOW(),
    review_count INTEGER DEFAULT 0,
    last_grade INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Wellbeing & Emotional Monitoring
CREATE TABLE IF NOT EXISTS public.emotion_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mood TEXT NOT NULL CHECK (mood IN ('great', 'okay', 'struggling')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wellbeing_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    signals TEXT[] DEFAULT '{}',
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    triggered_by TEXT, -- User ID or 'system'
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ignored')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

-- 3. Personalized Learning Style Weights
-- RL-based weights for student preference categories
CREATE TABLE IF NOT EXISTS public.student_style_weights (
    student_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    visual FLOAT DEFAULT 0.2,
    auditory FLOAT DEFAULT 0.2,
    kinesthetic FLOAT DEFAULT 0.2,
    read_write FLOAT DEFAULT 0.2,
    social FLOAT DEFAULT 0.2,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Intervention Tracking
CREATE TABLE IF NOT EXISTS public.intervention_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    intervention_type TEXT NOT NULL,
    trigger_reason TEXT,
    payload JSONB DEFAULT '{}', -- Details of the intervention (e.g., specific remediation content)
    outcome_score FLOAT, -- Success metric (e.g., gain in readiness)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Persistent Notification History
-- Moved from just Redis to Postgres for audit compliance
CREATE TABLE IF NOT EXISTS public.persistent_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_fsrs_due ON public.fsrs_cards(student_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_emotion_student ON public.emotion_logs(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.wellbeing_alerts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_notif_unread ON public.persistent_notifications(user_id) WHERE is_read = FALSE;

-- Ensure audit triggers for updated_at (assuming audit function exists)
-- DO $$
-- BEGIN
--     PERFORM public.manage_updated_at('fsrs_cards');
--     PERFORM public.manage_updated_at('student_style_weights');
-- END $$;
