-- ============================================================================
-- Migration 011: Onboarding Core Schema
-- Purpose: Create core onboarding tracking tables
-- ============================================================================

-- 1. ONBOARDING_PROGRESS - Main tracking table for step-by-step progress
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- student, teacher, parent, peer_tutor, etc.
    
    -- Progress tracking
    current_step INT NOT NULL DEFAULT 1,
    completed_steps INT[] DEFAULT ARRAY[]::INT[], -- Array of completed step numbers
    total_steps INT NOT NULL, -- Total steps for this role
    
    -- Step data storage (JSONB for flexibility across roles)
    step_data JSONB DEFAULT '{}', -- Stores all step data: {"step_1": {...}, "step_2": {...}, ...}
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'in_progress'::TEXT CHECK (status IN ('in_progress', 'completed', 'skipped', 'paused')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    browser_info TEXT, -- Track browser/device completing onboarding
    ip_address INET, -- Track IP for security
    completion_time_seconds INT, -- Total time to complete
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, role) -- One onboarding flow per user per role
);

CREATE INDEX idx_onboarding_progress_user_id ON public.onboarding_progress(user_id);
CREATE INDEX idx_onboarding_progress_role ON public.onboarding_progress(role);
CREATE INDEX idx_onboarding_progress_status ON public.onboarding_progress(status);
CREATE INDEX idx_onboarding_progress_completed_at ON public.onboarding_progress(completed_at);

-- 2. ONBOARDING_EVENTS - Track every action during onboarding
CREATE TABLE IF NOT EXISTS public.onboarding_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    step INT NOT NULL,
    
    -- Event details
    event_type TEXT NOT NULL, -- step_started, step_completed, validation_error, gate_check, etc.
    event_data JSONB DEFAULT '{}', -- Event-specific data
    error_message TEXT, -- If validation_error, what was the error?
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_onboarding_events_user_id ON public.onboarding_events(user_id);
CREATE INDEX idx_onboarding_events_role ON public.onboarding_events(role);
CREATE INDEX idx_onboarding_events_event_type ON public.onboarding_events(event_type);
CREATE INDEX idx_onboarding_events_created_at ON public.onboarding_events(created_at);

-- 3. ONBOARDING_AUDIT - Immutable audit log for compliance
CREATE TABLE IF NOT EXISTS public.onboarding_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    
    -- What changed
    action TEXT NOT NULL, -- created, updated, completed, verified, rejected
    step INT,
    change_details JSONB DEFAULT '{}', -- What fields were changed
    
    -- Who changed it (if admin action)
    modified_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_onboarding_audit_user_id ON public.onboarding_audit(user_id);
CREATE INDEX idx_onboarding_audit_action ON public.onboarding_audit(action);
CREATE INDEX idx_onboarding_audit_created_at ON public.onboarding_audit(created_at);

-- 4. VERIFICATION_REQUESTS - Track verification workflows for gated roles
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    
    -- Verification details
    verification_type TEXT NOT NULL, -- mastery, license, irb, quality_score, portfolio, etc.
    status TEXT NOT NULL DEFAULT 'pending'::TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    
    -- What's being verified
    submission_data JSONB NOT NULL, -- The data submitted for verification
    verification_notes TEXT, -- Admin notes during review
    
    -- Review tracking
    reviewed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    
    -- Expiry
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX idx_verification_requests_role ON public.verification_requests(role);
CREATE INDEX idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX idx_verification_requests_verification_type ON public.verification_requests(verification_type);

-- 5. VERIFICATION_DOCUMENTS - Store uploaded documents for verification
CREATE TABLE IF NOT EXISTS public.verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_request_id UUID REFERENCES public.verification_requests(id) ON DELETE CASCADE,
    
    -- Document details
    document_type TEXT NOT NULL, -- license, irb, portfolio, certificate, etc.
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Storage path (S3, disk, etc.)
    file_size INT, -- Bytes
    mime_type TEXT,
    
    -- Verification status
    is_verified BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_documents_user_id ON public.verification_documents(user_id);
CREATE INDEX idx_verification_documents_verification_request_id ON public.verification_documents(verification_request_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- ONBOARDING_PROGRESS: Users can only see their own progress
CREATE POLICY "Users can view own onboarding_progress"
    ON public.onboarding_progress
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding_progress"
    ON public.onboarding_progress
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding_progress"
    ON public.onboarding_progress
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all progress for monitoring
CREATE POLICY "Admins can view all onboarding_progress"
    ON public.onboarding_progress
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'super_admin')
            AND ur.is_active = TRUE
        )
    );

-- ONBOARDING_EVENTS: Users can view own, admins can view all
CREATE POLICY "Users can view own onboarding_events"
    ON public.onboarding_events
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all onboarding_events"
    ON public.onboarding_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'super_admin')
            AND ur.is_active = TRUE
        )
    );

-- ONBOARDING_AUDIT: Immutable by users, visible to admins and the user
CREATE POLICY "Users can view own onboarding_audit"
    ON public.onboarding_audit
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all onboarding_audit"
    ON public.onboarding_audit
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'super_admin')
            AND ur.is_active = TRUE
        )
    );

-- System can insert into audit table
CREATE POLICY "System can insert onboarding_audit"
    ON public.onboarding_audit
    FOR INSERT
    WITH CHECK (TRUE);

-- VERIFICATION_REQUESTS: Users see own, admins see all
CREATE POLICY "Users can view own verification_requests"
    ON public.verification_requests
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verification_requests"
    ON public.verification_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'super_admin')
            AND ur.is_active = TRUE
        )
    );

-- VERIFICATION_DOCUMENTS: Users see own, admins see all
CREATE POLICY "Users can view own verification_documents"
    ON public.verification_documents
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can update verification_documents"
    ON public.verification_documents
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'super_admin')
            AND ur.is_active = TRUE
        )
    );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.onboarding_progress TO authenticated;
GRANT SELECT, INSERT ON public.onboarding_events TO authenticated;
GRANT SELECT ON public.onboarding_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.verification_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.verification_documents TO authenticated;

GRANT ALL ON public.onboarding_progress TO service_role;
GRANT ALL ON public.onboarding_events TO service_role;
GRANT ALL ON public.onboarding_audit TO service_role;
GRANT ALL ON public.verification_requests TO service_role;
GRANT ALL ON public.verification_documents TO service_role;
