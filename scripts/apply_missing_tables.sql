-- Targeted SQL to apply missing tables to the public schema.
-- Source: database_schema.sql

CREATE TABLE IF NOT EXISTS public.stakeholders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    name text NOT NULL,
    organization text,
    category text NOT NULL,
    contact_no text,
    email text,
    access_token uuid DEFAULT gen_random_uuid(),
    feedback_enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.stakeholder_feedback (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    stakeholder_id uuid,
    program_id uuid NOT NULL,
    expectations text,
    vision_alignment_rating integer,
    feedback_json jsonb,
    submitted_at timestamp with time zone DEFAULT now(),
    rep_stakeholder_id uuid,
    peo_relevance_score numeric,
    curriculum_relevance_score numeric,
    improvement_suggestions text,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.peos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    peo_code text NOT NULL,
    statement text NOT NULL,
    approved_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.peo_drafts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    generated_peos jsonb,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.representative_stakeholders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    member_name text NOT NULL,
    member_id text,
    organization text,
    email text,
    mobile_number text,
    specialisation text,
    category text,
    linkedin_id text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_approved boolean NOT NULL DEFAULT false,
    login_password_hash text,
    last_login_at timestamp with time zone,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.pac_members (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    member_name text NOT NULL,
    member_id text,
    organization text,
    email text,
    mobile_number text,
    specialisation text,
    category text,
    tenure_start_date date,
    tenure_end_date date,
    linkedin_id text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    communicate text,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.bos_members (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    member_name text NOT NULL,
    member_id text,
    organization text,
    email text,
    mobile_number text,
    specialisation text,
    category text,
    tenure_start_date date,
    tenure_end_date date,
    linkedin_id text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    communicate text,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.program_coordinators (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    institution_id uuid NOT NULL,
    program_id uuid NOT NULL UNIQUE,
    name text NOT NULL,
    designation text NOT NULL,
    email_official text NOT NULL,
    email_personal text,
    mobile_official text NOT NULL,
    mobile_personal text,
    linkedin_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.program_peos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    peo_statement text NOT NULL,
    peo_number integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.program_outcomes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    po_code character varying NOT NULL,
    po_title text NOT NULL,
    po_description text NOT NULL,
    tier character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.program_psos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    pso_statement text NOT NULL,
    pso_number integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    institution_id uuid,
    action text NOT NULL,
    ip_address text,
    user_agent text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.program_visions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    vision_text text NOT NULL,
    vision_score integer,
    vision_analysis jsonb,
    source text NOT NULL DEFAULT 'ai'::text,
    is_selected boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.program_missions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    vision_id uuid NOT NULL,
    mission_text text NOT NULL,
    mission_score integer,
    mission_analysis jsonb,
    source text NOT NULL DEFAULT 'ai'::text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.curriculum_versions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    version text NOT NULL,
    year integer NOT NULL,
    status text NOT NULL DEFAULT 'draft'::text,
    regulation_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.curriculums (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    regulation_year integer NOT NULL,
    version text NOT NULL,
    total_credits integer,
    approval_status text NOT NULL DEFAULT 'draft'::text,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.curriculum_course_outcomes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    course_code text NOT NULL,
    course_title text,
    co_number integer NOT NULL,
    co_code text NOT NULL,
    statement text NOT NULL,
    rbt_level text,
    po_mapping integer[] DEFAULT '{}'::integer[],
    pso_mapping integer[] DEFAULT '{}'::integer[],
    strength text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    curriculum_id uuid,
    approval_status text NOT NULL DEFAULT 'draft'::text,
    approved_by uuid,
    approved_at timestamp with time zone,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.co_po_mapping (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    curriculum_id uuid,
    course_id uuid,
    co_id uuid,
    course_code text NOT NULL,
    co_code text NOT NULL,
    po_id integer NOT NULL,
    strength integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.co_pso_mapping (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    curriculum_id uuid,
    course_id uuid,
    co_id uuid,
    course_code text NOT NULL,
    co_code text NOT NULL,
    pso_id integer NOT NULL,
    strength integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);
