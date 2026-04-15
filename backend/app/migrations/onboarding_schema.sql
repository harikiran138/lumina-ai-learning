-- ═══════════════════════════════════════════════════════════════════════════
-- ONBOARDING SYSTEM - DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Main onboarding progress tracking table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    current_step INT NOT NULL DEFAULT 1,
    total_steps INT NOT NULL,
    completed_steps JSONB DEFAULT '[]'::jsonb,  -- Array of completed step numbers
    step_data JSONB DEFAULT '{}'::jsonb,         -- {step_1: {...}, step_2: {...}}
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',  -- in_progress, completed, skipped
    started_at TIMESTAMP NOT NULL DEFAULT now(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_user_role UNIQUE(user_id, role),
    CONSTRAINT valid_step_number CHECK (current_step >= 1 AND current_step <= 20),
    CONSTRAINT valid_status CHECK (status IN ('in_progress', 'completed', 'skipped', 'paused'))
);

CREATE INDEX idx_onboarding_user_id ON onboarding_progress(user_id);
CREATE INDEX idx_onboarding_user_role ON onboarding_progress(user_id, role);
CREATE INDEX idx_onboarding_status ON onboarding_progress(status);
CREATE INDEX idx_onboarding_created_at ON onboarding_progress(created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Role-specific profile tables (extend as needed)
-- ─────────────────────────────────────────────────────────────────────────────

-- Peer Tutor Profiles
CREATE TABLE IF NOT EXISTS peer_tutor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subjects JSONB DEFAULT '[]'::jsonb,
    expertise_levels JSONB DEFAULT '{}'::jsonb,
    availability JSONB DEFAULT '{}'::jsonb,
    rate_per_hour FLOAT,
    currency VARCHAR(3),
    tutoring_style VARCHAR(50),
    verification_status VARCHAR(20) DEFAULT 'pending',  -- pending, verified, suspended
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    
    CONSTRAINT unique_peer_tutor UNIQUE(user_id)
);

CREATE INDEX idx_peer_tutor_user_id ON peer_tutor_profiles(user_id);
CREATE INDEX idx_peer_tutor_verification_status ON peer_tutor_profiles(verification_status);

-- Mentor Profiles
CREATE TABLE IF NOT EXISTS mentor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expertise_areas JSONB DEFAULT '[]'::jsonb,
    availability_hours_per_month INT,
    rate_per_session FLOAT,
    currency VARCHAR(3),
    mentee_background JSONB DEFAULT '[]'::jsonb,
    mentee_goals JSONB DEFAULT '[]'::jsonb,
    max_mentees INT DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    
    CONSTRAINT unique_mentor UNIQUE(user_id)
);

CREATE INDEX idx_mentor_user_id ON mentor_profiles(user_id);

-- Counselor Profiles
CREATE TABLE IF NOT EXISTS counselor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    specialization VARCHAR(100),
    assigned_institution UUID,
    assigned_department VARCHAR(100),
    certification_document_url VARCHAR(500),
    years_of_experience INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    
    CONSTRAINT unique_counselor UNIQUE(user_id)
);

CREATE INDEX idx_counselor_user_id ON counselor_profiles(user_id);
CREATE INDEX idx_counselor_license ON counselor_profiles(license_number);

-- Content Creator Profiles
CREATE TABLE IF NOT EXISTS content_creator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_types JSONB DEFAULT '[]'::jsonb,
    subject_domains JSONB DEFAULT '[]'::jsonb,
    experience_level VARCHAR(50),
    portfolio_samples JSONB DEFAULT '[]'::jsonb,
    approval_status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    
    CONSTRAINT unique_content_creator UNIQUE(user_id)
);

CREATE INDEX idx_content_creator_user_id ON content_creator_profiles(user_id);
CREATE INDEX idx_content_creator_approval_status ON content_creator_profiles(approval_status);

-- Researcher Profiles
CREATE TABLE IF NOT EXISTS researcher_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_name VARCHAR(255),
    research_department VARCHAR(100),
    research_purpose TEXT,
    publication_links JSONB DEFAULT '[]'::jsonb,
    irb_approval_document_url VARCHAR(500),
    data_access_agreement_signed BOOLEAN DEFAULT FALSE,
    approved_data_categories JSONB DEFAULT '[]'::jsonb,
    compliance_status VARCHAR(20) DEFAULT 'pending',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    
    CONSTRAINT unique_researcher UNIQUE(user_id)
);

CREATE INDEX idx_researcher_user_id ON researcher_profiles(user_id);
CREATE INDEX idx_researcher_compliance_status ON researcher_profiles(compliance_status);

-- Admin Profiles
CREATE TABLE IF NOT EXISTS admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_role VARCHAR(50),  -- college_admin, super_admin, system_admin, institution_admin, hod
    institution_id UUID,
    system_region VARCHAR(100),
    department_name VARCHAR(100),
    permission_groups JSONB DEFAULT '[]'::jsonb,
    api_key_id VARCHAR(100),
    two_factor_enabled BOOLEAN DEFAULT TRUE,
    audit_logging_enabled BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    
    CONSTRAINT unique_admin UNIQUE(user_id)
);

CREATE INDEX idx_admin_user_id ON admin_profiles(user_id);
CREATE INDEX idx_admin_role ON admin_profiles(admin_role);

-- Alumni Profiles
CREATE TABLE IF NOT EXISTS alumni_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    graduation_year INT NOT NULL,
    degree_obtained VARCHAR(100),
    branch VARCHAR(100),
    college VARCHAR(255),
    current_location VARCHAR(500),
    employment_status VARCHAR(50),
    current_job_title VARCHAR(100),
    current_employer VARCHAR(255),
    industry VARCHAR(50),
    highest_qualification VARCHAR(100),
    linkedin_url VARCHAR(500),
    want_to_mentor BOOLEAN DEFAULT FALSE,
    guest_lectures BOOLEAN DEFAULT FALSE,
    review_projects BOOLEAN DEFAULT FALSE,
    contribute_content BOOLEAN DEFAULT FALSE,
    alumni_events BOOLEAN DEFAULT FALSE,
    contribution_topics JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    
    CONSTRAINT unique_alumni UNIQUE(user_id)
);

CREATE INDEX idx_alumni_user_id ON alumni_profiles(user_id);
CREATE INDEX idx_alumni_graduation_year ON alumni_profiles(graduation_year);
CREATE INDEX idx_alumni_industry ON alumni_profiles(industry);

-- HOD (Head of Department) Profiles
CREATE TABLE IF NOT EXISTS hod_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    designation VARCHAR(100),
    years_in_hod_role VARCHAR(50),
    subjects JSONB DEFAULT '[]'::jsonb,
    faculty JSONB DEFAULT '[]'::jsonb,
    batches_sections JSONB DEFAULT '[]'::jsonb,
    current_semester VARCHAR(10),
    auto_approve_content BOOLEAN DEFAULT FALSE,
    require_hod_curriculum_approval BOOLEAN DEFAULT FALSE,
    notification_preferences JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    
    CONSTRAINT unique_hod UNIQUE(user_id)
);

CREATE INDEX idx_hod_user_id ON hod_profiles(user_id);
CREATE INDEX idx_hod_employee_id ON hod_profiles(employee_id);
CREATE INDEX idx_hod_department ON hod_profiles(department);
CREATE INDEX idx_hod_institution ON hod_profiles(institution);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Onboarding audit log (track all changes)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS onboarding_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    event_type VARCHAR(50),  -- step_submitted, completed, skipped, error
    step_number INT,
    event_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_onboarding_audit_user_id ON onboarding_audit(user_id);
CREATE INDEX idx_onboarding_audit_created_at ON onboarding_audit(created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SYSTEM INTEGRATION TABLES (NEW - CRITICAL PRODUCTION FIXES)
-- ─────────────────────────────────────────────────────────────────────────────

-- Analytics: Track all onboarding events
CREATE TABLE IF NOT EXISTS onboarding_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(100) NOT NULL,  -- onboarding_step_submitted, onboarding_completed, onboarding_validation_failed
    role VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,  -- user_id, step, errors, etc.
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_onboarding_events_event_name ON onboarding_events(event_name);
CREATE INDEX idx_onboarding_events_role ON onboarding_events(role);
CREATE INDEX idx_onboarding_events_created_at ON onboarding_events(created_at);

-- RBAC: User to Role assignment
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_user_role_assignment UNIQUE(user_id, role_name)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_name ON user_roles(role_name);

-- Permissions: Available permissions for each role
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_role_permission UNIQUE(role_name, permission_name)
);

CREATE INDEX idx_role_permissions_role_name ON role_permissions(role_name);
CREATE INDEX idx_role_permissions_permission_name ON role_permissions(permission_name);

-- Permissions: User-specific permissions (synced from roles)
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL,
    role_name VARCHAR(50),
    granted_at TIMESTAMP NOT NULL,
    assigned_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_user_permission UNIQUE(user_id, permission_name)
);

CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_name ON user_permissions(permission_name);

-- Verification Requests: Track roles requiring verification
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    verification_type VARCHAR(50) NOT NULL,
        -- mastery_proof, license_verification, portfolio_review, irb_approval
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
        -- pending, approved, rejected, review_required
    submission_data JSONB DEFAULT '{}'::jsonb,
    reviewer_id UUID REFERENCES users(id),
    review_notes TEXT,
    reviewed_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_user_verification UNIQUE(user_id, role),
    CONSTRAINT valid_verification_status CHECK (status IN ('pending', 'approved', 'rejected', 'review_required'))
);

CREATE INDEX idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_verification_requests_role ON verification_requests(role);
CREATE INDEX idx_verification_requests_created_at ON verification_requests(created_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEWS FOR ANALYTICS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW onboarding_completion_stats AS
SELECT 
    role,
    COUNT(*) as total_users,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_users,
    ROUND(100.0 * COUNT(CASE WHEN status = 'completed' THEN 1 END) / 
        COUNT(*), 2) as completion_rate,
    ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600), 2) as avg_hours_to_complete
FROM onboarding_progress
GROUP BY role;

CREATE OR REPLACE VIEW onboarding_bottlenecks AS
SELECT 
    role,
    current_step,
    COUNT(*) as users_stuck_at_step
FROM onboarding_progress
WHERE status = 'in_progress'
GROUP BY role, current_step
ORDER BY role, current_step;

-- ═══════════════════════════════════════════════════════════════════════════
-- INITIAL DATA
-- ═══════════════════════════════════════════════════════════════════════════

-- Optional: Add administrative functions for onboarding management
CREATE OR REPLACE FUNCTION mark_onboarding_complete(p_user_id UUID, p_role VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE onboarding_progress
    SET status = 'completed',
        completed_at = now(),
        updated_at = now()
    WHERE user_id = p_user_id AND role = p_role;
    
    -- Also update user record
    UPDATE users
    SET onboarding_completed = TRUE,
        updated_at = now()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reset_onboarding(p_user_id UUID, p_role VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE onboarding_progress
    SET status = 'in_progress',
        current_step = 1,
        completed_steps = '[]'::jsonb,
        step_data = '{}'::jsonb,
        completed_at = NULL,
        updated_at = now()
    WHERE user_id = p_user_id AND role = p_role;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- PERMISSIONS (RLS) - if using Supabase
-- ═══════════════════════════════════════════════════════════════════════════

-- Example RLS policies for onboarding tables
-- Users can only see their own onboarding progress
-- ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own onboarding" ON onboarding_progress
--     FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can modify own onboarding" ON onboarding_progress
--     FOR UPDATE USING (auth.uid() = user_id);
