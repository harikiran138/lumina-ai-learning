-- ============================================================================
-- Migration 012: Onboarding Role-Specific Profile Tables
-- Purpose: Create tables for storing validated profile data for each role
-- ============================================================================

-- 1. PEER_TUTOR_PROFILES
CREATE TABLE IF NOT EXISTS public.peer_tutor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identity
    tutor_bio TEXT,
    personal_motivation TEXT,
    
    -- Expertise
    tutor_subjects TEXT[] NOT NULL, -- Subjects they're qualified to tutor
    expertise_levels JSONB DEFAULT '{}', -- { "Math": 0.85, "Physics": 0.92, ...}
    
    -- Availability
    available_days TEXT[] DEFAULT ARRAY[]::TEXT[],
    available_time_slots JSONB DEFAULT '{}', -- { "Monday": [{"start": "14:00", "end": "16:00"}, ...], ...}
    max_students_per_session INT DEFAULT 1,
    max_sessions_per_week INT DEFAULT 10,
    session_mode TEXT[] DEFAULT ARRAY[]::TEXT[], -- video_call, chat, in_person
    
    -- Tutoring style
    tutoring_approach TEXT[] DEFAULT ARRAY[]::TEXT[], -- doubt_solving, concept_explanation, etc.
    communication_style TEXT, -- socratic, direct, adaptive
    preferred_batch_size TEXT, -- 1on1_only, small_group, any
    
    -- Rates
    hourly_rate_currency TEXT DEFAULT 'USD',
    hourly_rate DECIMAL(10, 2),
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending'::TEXT CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
    verification_status TEXT DEFAULT 'pending'::TEXT CHECK (verification_status IN ('pending', 'verified', 'failed')),
    mastery_verified BOOLEAN DEFAULT FALSE,
    mastery_verified_at TIMESTAMPTZ,
    
    -- Ratings & Reviews
    total_sessions INT DEFAULT 0,
    average_rating DECIMAL(2, 1) DEFAULT 0.0,
    total_reviews INT DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_peer_tutor_profiles_user_id ON public.peer_tutor_profiles(user_id);
CREATE INDEX idx_peer_tutor_profiles_status ON public.peer_tutor_profiles(status);

-- 2. MENTOR_PROFILES
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Professional identity
    current_job_title TEXT NOT NULL,
    current_employer TEXT NOT NULL,
    industry TEXT NOT NULL,
    years_experience TEXT NOT NULL,
    linkedin_url TEXT,
    personal_website TEXT,
    
    -- Expertise
    skill_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    career_tracks TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- Software Engineering, Data Science, etc.
    mentorship_topics TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    worked_in_industries TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    
    -- Mentorship setup
    session_type TEXT NOT NULL, -- one_on_one, group, both
    session_mode TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- video, chat, in_person
    session_duration_minutes INT NOT NULL,
    sessions_per_month INT NOT NULL,
    compensation_model TEXT NOT NULL, -- volunteer, paid, hybrid
    price_per_session DECIMAL(10, 2),
    price_currency TEXT DEFAULT 'USD',
    
    -- Availability
    available_days TEXT[] DEFAULT ARRAY[]::TEXT[],
    available_time_slots JSONB DEFAULT '{}',
    timezone TEXT,
    advance_notice_hours INT DEFAULT 24,
    
    -- Bio
    short_bio TEXT NOT NULL,
    why_i_mentor TEXT,
    languages TEXT[] DEFAULT ARRAY[]::TEXT[],
    preferred_student_types TEXT[] DEFAULT ARRAY[]::TEXT[], -- undergraduate, postgraduate, career_switcher, any
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active'::TEXT CHECK (status IN ('active', 'inactive', 'deleted')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mentor_profiles_user_id ON public.mentor_profiles(user_id);
CREATE INDEX idx_mentor_profiles_status ON public.mentor_profiles(status);

-- 3. COUNSELOR_PROFILES
CREATE TABLE IF NOT EXISTS public.counselor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Professional identity
    designation TEXT NOT NULL,
    mobile TEXT NOT NULL,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    department TEXT,
    languages TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    
    -- Credentials (CRITICAL)
    highest_qualification TEXT NOT NULL,
    professional_license_number TEXT NOT NULL,
    licensing_body TEXT NOT NULL,
    license_expiry_date DATE NOT NULL,
    license_certificate_url TEXT,
    license_verified BOOLEAN DEFAULT FALSE,
    license_verified_at TIMESTAMPTZ,
    years_counseling_experience INT,
    
    -- Specialization
    primary_specialization TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    age_groups TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    intervention_approach TEXT[] DEFAULT ARRAY[]::TEXT[],
    available_for_crisis_intervention BOOLEAN NOT NULL,
    
    -- Availability & sessions
    available_days TEXT[] DEFAULT ARRAY[]::TEXT[],
    available_time_slots JSONB DEFAULT '{}',
    session_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- individual, group, crisis_walkin
    session_duration_minutes INT NOT NULL,
    max_sessions_per_day INT NOT NULL,
    emergency_walkin_available BOOLEAN NOT NULL,
    session_mode TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    
    -- Compliance
    confidentiality_agreement_signed BOOLEAN NOT NULL DEFAULT FALSE,
    confidentiality_signed_at TIMESTAMPTZ,
    data_protection_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Status
    verification_status TEXT NOT NULL DEFAULT 'pending'::TEXT CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_counselor_profiles_user_id ON public.counselor_profiles(user_id);
CREATE INDEX idx_counselor_profiles_verification_status ON public.counselor_profiles(verification_status);

-- 4. CONTENT_CREATOR_PROFILES
CREATE TABLE IF NOT EXISTS public.content_creator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identity
    display_name TEXT NOT NULL,
    creator_bio TEXT NOT NULL,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    linkedin_url TEXT,
    portfolio_url TEXT,
    
    -- Content expertise
    subjects_domains TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    academic_levels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- school, undergraduate, postgraduate, etc.
    content_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- video_lectures, notes, slides, etc.
    creation_languages TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    creation_tools TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Portfolio & quality
    sample_content_count INT DEFAULT 0,
    quality_score DECIMAL(3, 2) DEFAULT 0.0, -- 0.0 to 1.0
    quality_verified_at TIMESTAMPTZ,
    
    -- Publishing
    publishing_model TEXT NOT NULL, -- free, paid, institutional_only
    price_per_item DECIMAL(10, 2),
    price_currency TEXT DEFAULT 'USD',
    attribution_preference TEXT NOT NULL, -- full_name, display_name, anonymous
    allow_ai_training BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Status
    approval_status TEXT NOT NULL DEFAULT 'pending'::TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended')),
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_creator_profiles_user_id ON public.content_creator_profiles(user_id);
CREATE INDEX idx_content_creator_profiles_approval_status ON public.content_creator_profiles(approval_status);

-- 5. RESEARCHER_PROFILES
CREATE TABLE IF NOT EXISTS public.researcher_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identity
    institutional_email TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    department_faculty TEXT NOT NULL,
    designation TEXT NOT NULL,
    research_profile_url TEXT,
    orcid_id TEXT,
    
    -- Research details
    research_title TEXT NOT NULL,
    research_area TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    research_objective TEXT NOT NULL,
    duration_months INT NOT NULL,
    approved_data_categories TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    
    -- Ethics & compliance
    irb_approval_status TEXT NOT NULL DEFAULT 'pending'::TEXT CHECK (irb_approval_status IN ('pending', 'approved', 'not_required', 'rejected')),
    irb_approval_number TEXT,
    irb_approval_document_url TEXT,
    irb_verified BOOLEAN DEFAULT FALSE,
    
    -- For student researchers
    supervisor_name TEXT,
    supervisor_email TEXT,
    supervisor_verified BOOLEAN DEFAULT FALSE,
    
    -- Data access agreements
    anonymization_agreement_signed BOOLEAN NOT NULL DEFAULT FALSE,
    non_commercial_agreement_signed BOOLEAN NOT NULL DEFAULT FALSE,
    data_security_agreement_signed BOOLEAN NOT NULL DEFAULT FALSE,
    publication_ethics_agreement_signed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Data access setup
    preferred_data_format TEXT NOT NULL, -- csv, json, sql_export
    access_method TEXT NOT NULL, -- dashboard, api, scheduled_exports
    ip_whitelist TEXT, -- Comma-separated IPs for API access
    
    -- Status
    compliance_status TEXT NOT NULL DEFAULT 'pending'::TEXT CHECK (compliance_status IN ('pending', 'approved', 'rejected', 'expired')),
    access_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_researcher_profiles_user_id ON public.researcher_profiles(user_id);
CREATE INDEX idx_researcher_profiles_compliance_status ON public.researcher_profiles(compliance_status);

-- 6. ALUMNI_PROFILES
CREATE TABLE IF NOT EXISTS public.alumni_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Alumni identity
    graduation_year INT NOT NULL,
    degree_obtained TEXT NOT NULL,
    branch_department TEXT NOT NULL,
    college_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    current_location TEXT,
    
    -- Current status
    employment_status TEXT NOT NULL, -- employed, self_employed, pursuing_education, between_roles
    current_job_title TEXT,
    current_employer TEXT,
    industry TEXT,
    highest_qualification TEXT,
    linkedin_url TEXT,
    
    -- Contribution preferences
    wants_to_mentor BOOLEAN DEFAULT FALSE,
    available_for_guest_lectures BOOLEAN DEFAULT FALSE,
    willing_to_review_projects BOOLEAN DEFAULT FALSE,
    wants_to_contribute_content BOOLEAN DEFAULT FALSE,
    wants_alumni_events BOOLEAN DEFAULT FALSE,
    contribution_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Mentorship setup (if opted in)
    mentorship_available_days TEXT[] DEFAULT ARRAY[]::TEXT[],
    mentorship_available_time_slots JSONB DEFAULT '{}',
    mentorship_sessions_per_month INT,
    mentorship_session_mode TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alumni_profiles_user_id ON public.alumni_profiles(user_id);

-- 7. ADMIN_PROFILES
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identity
    admin_type TEXT NOT NULL CHECK (admin_type IN ('institution_admin', 'super_admin', 'department_admin')),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    
    -- 2FA setup
    totp_enabled BOOLEAN DEFAULT FALSE,
    
    -- Permissions
    feature_toggles JSONB DEFAULT '{}', -- Which features are enabled
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_profiles_user_id ON public.admin_profiles(user_id);
CREATE INDEX idx_admin_profiles_institution_id ON public.admin_profiles(institution_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.peer_tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- All profile tables: users see own, admins see all institutional
CREATE POLICY "Users can view own peer_tutor_profiles"
    ON public.peer_tutor_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own mentor_profiles"
    ON public.mentor_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own counselor_profiles"
    ON public.counselor_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own content_creator_profiles"
    ON public.content_creator_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own researcher_profiles"
    ON public.researcher_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own alumni_profiles"
    ON public.alumni_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own admin_profiles"
    ON public.admin_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.peer_tutor_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.mentor_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.counselor_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.content_creator_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.researcher_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.alumni_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.admin_profiles TO authenticated;

GRANT ALL ON public.peer_tutor_profiles TO service_role;
GRANT ALL ON public.mentor_profiles TO service_role;
GRANT ALL ON public.counselor_profiles TO service_role;
GRANT ALL ON public.content_creator_profiles TO service_role;
GRANT ALL ON public.researcher_profiles TO service_role;
GRANT ALL ON public.alumni_profiles TO service_role;
GRANT ALL ON public.admin_profiles TO service_role;
