-- Complete Database Schema

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying,
    role character varying,
    email character varying,
    encrypted_password character varying,
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying,
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying,
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying,
    email_change character varying,
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text UNIQUE DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone DEFAULT LEAST(email_confirmed_at, phone_confirmed_at),
    email_change_token_current character varying DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean NOT NULL DEFAULT false,
    deleted_at timestamp with time zone,
    is_anonymous boolean NOT NULL DEFAULT false,
    PRIMARY KEY (id)
);

-- Comment: Auth: Stores user login data within a secure schema.

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass),
    token character varying UNIQUE,
    user_id character varying,
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying,
    session_id uuid,
    PRIMARY KEY (id)
);

-- Comment: Auth: Store of tokens used to refresh JWT tokens once they expire.

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    PRIMARY KEY (id)
);

-- Comment: Auth: Manages users across multiple sites.

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying NOT NULL DEFAULT ''::character varying,
    PRIMARY KEY (id)
);

-- Comment: Auth: Audit trail for user actions.

CREATE TABLE auth.schema_migrations (
    version character varying NOT NULL,
    PRIMARY KEY (version)
);

-- Comment: Auth: Manages updates to the auth system.

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text DEFAULT lower((identity_data ->> 'email'::text)),
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    PRIMARY KEY (id)
);

-- Comment: Auth: Stores identities associated to a user.

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal USER-DEFINED,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    PRIMARY KEY (id)
);

-- Comment: Auth: Stores session data associated to a user.

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type USER-DEFINED NOT NULL,
    status USER-DEFINED NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone UNIQUE,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb,
    PRIMARY KEY (id)
);

-- Comment: auth: stores metadata about factors

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb,
    PRIMARY KEY (id)
);

-- Comment: auth: stores metadata about challenge requests made

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL,
    PRIMARY KEY (id)
);

-- Comment: auth: stores authenticator method reference claims for multi factor authentication

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    PRIMARY KEY (id)
);

-- Comment: Auth: Manages SSO identity provider information; see saml_providers for SAML.

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    PRIMARY KEY (id)
);

-- Comment: Auth: Manages SSO email address domain mapping to an SSO Identity Provider.

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL UNIQUE,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    PRIMARY KEY (id)
);

-- Comment: Auth: Manages SAML Identity Provider connections.

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    PRIMARY KEY (id)
);

-- Comment: Auth: Contains SAML Relay State information for each Service Provider initiated login.

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method USER-DEFINED,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean NOT NULL DEFAULT false,
    PRIMARY KEY (id)
);

-- Comment: Stores metadata for all OAuth/SSO login flows

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type USER-DEFINED NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type USER-DEFINED NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    client_type USER-DEFINED NOT NULL DEFAULT 'confidential'::auth.oauth_client_type,
    token_endpoint_auth_method text NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL UNIQUE,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method USER-DEFINED,
    response_type USER-DEFINED NOT NULL DEFAULT 'code'::auth.oauth_response_type,
    status USER-DEFINED NOT NULL DEFAULT 'pending'::auth.oauth_authorization_status,
    authorization_code text UNIQUE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone NOT NULL DEFAULT (now() + '00:03:00'::interval),
    approved_at timestamp with time zone,
    nonce text,
    PRIMARY KEY (id)
);

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone NOT NULL DEFAULT now(),
    revoked_at timestamp with time zone,
    PRIMARY KEY (id)
);

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL,
    PRIMARY KEY (id)
);

-- Comment: Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.

CREATE TABLE auth.custom_oauth_providers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    provider_type text NOT NULL,
    identifier text NOT NULL UNIQUE,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids ARRAY NOT NULL DEFAULT '{}'::text[],
    scopes ARRAY NOT NULL DEFAULT '{}'::text[],
    pkce_enabled boolean NOT NULL DEFAULT true,
    attribute_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
    authorization_params jsonb NOT NULL DEFAULT '{}'::jsonb,
    enabled boolean NOT NULL DEFAULT true,
    email_optional boolean NOT NULL DEFAULT false,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean NOT NULL DEFAULT false,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.institutions (
    id uuid NOT NULL,
    institution_name text NOT NULL,
    email text NOT NULL UNIQUE,
    onboarding_status text DEFAULT 'PENDING'::text,
    code text,
    logo_url text,
    academic_year text,
    login_policy text DEFAULT 'email_only'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    password_hash text,
    refresh_token_hash text,
    failed_attempts integer DEFAULT 0,
    locked_until timestamp without time zone,
    PRIMARY KEY (id)
);

CREATE TABLE public.institution_details (
    institution_id uuid NOT NULL,
    type text NOT NULL,
    status text NOT NULL DEFAULT 'Autonomous'::text,
    established_year integer NOT NULL,
    affiliation text,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    country text DEFAULT 'India'::text,
    updated_at timestamp with time zone DEFAULT now(),
    vision text,
    mission text,
    PRIMARY KEY (institution_id)
);

CREATE TABLE public.programs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    institution_id uuid NOT NULL,
    program_name text NOT NULL,
    program_code text NOT NULL UNIQUE,
    degree text NOT NULL,
    duration integer NOT NULL,
    level text NOT NULL,
    intake integer NOT NULL,
    academic_year text NOT NULL,
    program_chair text,
    nba_coordinator text,
    vision text,
    mission text,
    stakeholder_feedback_enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    peo_brainstorming_start_date date,
    peo_brainstorming_end_date date,
    peo_feedback_start_date date,
    peo_feedback_end_date date,
    peo_consolidation_start_date date,
    peo_consolidation_end_date date,
    peo_draft_version integer DEFAULT 0,
    lead_society text,
    password_hash text,
    status text DEFAULT 'active'::text,
    vmpeo_feedback_start_at timestamp with time zone,
    vmpeo_feedback_end_at timestamp with time zone,
    vmpeo_feedback_cycle text NOT NULL DEFAULT 'brainstorming'::text,
    peo_po_matrix jsonb,
    consistency_matrix jsonb,
    curriculum_feedback_start_at timestamp with time zone,
    curriculum_feedback_end_at timestamp with time zone,
    curriculum_feedback_status text DEFAULT 'pending'::text,
    program_vision text,
    program_mission text,
    vision_score integer,
    vision_analysis jsonb,
    mission_score integer,
    mission_analysis jsonb,
    generated_by_ai boolean NOT NULL DEFAULT false,
    vision_inputs_used jsonb,
    mission_inputs_used jsonb,
    vision_options jsonb,
    mission_options jsonb,
    vision_priorities ARRAY,
    mission_priorities ARRAY,
    department_id uuid,
    duration_years integer DEFAULT 4,
    PRIMARY KEY (id)
);

CREATE TABLE public.stakeholders (
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

CREATE TABLE public.stakeholder_feedback (
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

CREATE TABLE public.peos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    peo_code text NOT NULL,
    statement text NOT NULL,
    approved_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.peo_drafts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    generated_peos jsonb,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.representative_stakeholders (
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

CREATE TABLE public.pac_members (
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

CREATE TABLE public.bos_members (
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

CREATE TABLE public.program_coordinators (
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

CREATE TABLE public.program_peos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    peo_statement text NOT NULL,
    peo_number integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE public.program_outcomes (
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

CREATE TABLE public.program_psos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    pso_statement text NOT NULL,
    pso_number integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE public.audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    institution_id uuid,
    action text NOT NULL,
    ip_address text,
    user_agent text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.program_visions (
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

CREATE TABLE public.program_missions (
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

CREATE TABLE public.program_vmpeo_feedback_submissions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    stakeholder_ref_id uuid NOT NULL,
    stakeholder_member_id text NOT NULL,
    stakeholder_name text NOT NULL,
    stakeholder_category text,
    institution_name text NOT NULL,
    feedback_cycle text NOT NULL,
    submitted_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.program_vmpeo_feedback_entries (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    submission_id uuid NOT NULL,
    program_id uuid NOT NULL,
    category text NOT NULL,
    peo_id uuid,
    peo_number integer,
    peo_statement text,
    rating smallint NOT NULL,
    comment text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.jwt_blocklist (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    token text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE public.curriculum_versions (
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

CREATE TABLE public.curriculum_category_credits (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    category_code text NOT NULL,
    design_percent numeric DEFAULT 0,
    credit numeric DEFAULT 0,
    courses_t integer DEFAULT 0,
    courses_p integer DEFAULT 0,
    courses_tu integer DEFAULT 0,
    courses_ll integer DEFAULT 0,
    hours_ci integer DEFAULT 0,
    hours_t integer DEFAULT 0,
    hours_li integer DEFAULT 0,
    hours_twd integer DEFAULT 0,
    hours_total integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.curriculum_electives_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL UNIQUE,
    conventional_elective text DEFAULT 'None'::text,
    trans_disciplinary_elective text DEFAULT 'None'::text,
    total_credits integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.curriculum_semester_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    semester text NOT NULL,
    no_of_credits integer DEFAULT 0,
    courses_bs integer DEFAULT 0,
    courses_es integer DEFAULT 0,
    courses_hss integer DEFAULT 0,
    courses_pc integer DEFAULT 0,
    courses_oe integer DEFAULT 0,
    courses_mc integer DEFAULT 0,
    courses_ae integer DEFAULT 0,
    courses_se integer DEFAULT 0,
    courses_int integer DEFAULT 0,
    courses_pro integer DEFAULT 0,
    courses_others integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.curriculum_generated_courses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    version_id uuid,
    semester integer NOT NULL,
    category_code text NOT NULL,
    course_code text NOT NULL,
    course_title text NOT NULL,
    credits integer NOT NULL,
    t_hours integer DEFAULT 0,
    tu_hours integer DEFAULT 0,
    ll_hours integer DEFAULT 0,
    tw_hours integer DEFAULT 0,
    total_hours integer DEFAULT 0,
    curriculum_mode text DEFAULT 'AICTE_MODEL'::text,
    generated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    curriculum_id uuid,
    updated_at timestamp with time zone DEFAULT now(),
    approval_status text NOT NULL DEFAULT 'draft'::text,
    approved_by uuid,
    approved_at timestamp with time zone,
    PRIMARY KEY (id)
);

CREATE TABLE public.curriculum_course_outcomes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    course_code text NOT NULL,
    course_title text,
    co_number integer NOT NULL,
    co_code text NOT NULL,
    statement text NOT NULL,
    rbt_level text,
    po_mapping ARRAY DEFAULT '{}'::integer[],
    pso_mapping ARRAY DEFAULT '{}'::integer[],
    strength text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    curriculum_id uuid,
    approval_status text NOT NULL DEFAULT 'draft'::text,
    approved_by uuid,
    approved_at timestamp with time zone,
    PRIMARY KEY (id)
);

CREATE TABLE public.curriculums (
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

CREATE TABLE public.co_po_mapping (
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

CREATE TABLE public.co_pso_mapping (
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

CREATE TABLE public.co_attainment (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    curriculum_id uuid,
    course_id uuid,
    co_id uuid,
    course_code text NOT NULL,
    co_code text NOT NULL,
    internal_score numeric NOT NULL,
    external_score numeric NOT NULL,
    calculated_attainment numeric NOT NULL,
    academic_year text NOT NULL,
    approval_status text NOT NULL DEFAULT 'draft'::text,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.po_attainment (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    curriculum_id uuid,
    po_id integer NOT NULL,
    attainment_value numeric NOT NULL,
    academic_year text NOT NULL,
    approval_status text NOT NULL DEFAULT 'draft'::text,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.continuous_improvement (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    curriculum_id uuid,
    po_id integer NOT NULL,
    issue_identified text NOT NULL,
    action_taken text NOT NULL,
    next_cycle_plan text,
    academic_year text NOT NULL,
    approval_status text NOT NULL DEFAULT 'draft'::text,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.course_syllabus (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    curriculum_id uuid,
    course_id uuid,
    course_code text NOT NULL,
    course_title text NOT NULL,
    credits integer,
    hours integer,
    prerequisites ARRAY DEFAULT '{}'::text[],
    course_description text,
    course_outcomes jsonb DEFAULT '[]'::jsonb,
    unit_wise_syllabus jsonb DEFAULT '[]'::jsonb,
    textbooks ARRAY DEFAULT '{}'::text[],
    reference_books ARRAY DEFAULT '{}'::text[],
    evaluation_scheme jsonb DEFAULT '{}'::jsonb,
    generated_by text DEFAULT 'ai'::text,
    approval_status text NOT NULL DEFAULT 'draft'::text,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.academic_council (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    institution_id uuid NOT NULL,
    member_name text NOT NULL,
    member_id text,
    organization text,
    email text,
    mobile_number text,
    specialisation text,
    category text,
    communicate text,
    tenure_start_date date,
    tenure_end_date date,
    linkedin_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.obe_framework (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    institution_id uuid NOT NULL,
    program_id uuid,
    member_name text DEFAULT 'N/A'::text,
    designation text DEFAULT 'N/A'::text,
    email_official text,
    email_personal text,
    mobile_official text,
    mobile_personal text,
    linkedin_id text,
    pdf_url text,
    pdf_name text,
    title text,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.program_vmp_versions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    version_number integer NOT NULL DEFAULT 1,
    is_final boolean DEFAULT false,
    vision_text text,
    mission_text text,
    peos jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.dashboard_preferences (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    program_id uuid NOT NULL,
    enabled_modules jsonb DEFAULT '[]'::jsonb,
    layout_order jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.curriculum_structure (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    structure_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.courses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid,
    course_code text NOT NULL UNIQUE,
    course_name text NOT NULL,
    description text,
    subject text,
    grade_level text,
    difficulty_level text,
    modules jsonb DEFAULT '[]'::jsonb,
    is_published boolean DEFAULT false,
    thumbnail_url text,
    image_url text,
    estimated_duration text,
    metadata jsonb DEFAULT '{}'::jsonb,
    credits integer DEFAULT 3,
    teacher_limit integer,
    semester integer,
    type text,
    college_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    semester_id uuid,
    category text,
    knowledge_graph jsonb DEFAULT '{}'::jsonb,
    name text,
    department_id uuid,
    teacher_id uuid,
    PRIMARY KEY (id)
);

CREATE TABLE public.course_outcomes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL,
    outcome_code text NOT NULL,
    outcome_description text NOT NULL,
    rbt_level integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.curriculum_feedback (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    stakeholder_email text,
    feedback_text text,
    rating integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    stakeholder_id uuid,
    comments text,
    submitted_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.consistency_matrix (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    matrix_type text,
    matrix_data jsonb DEFAULT '{}'::jsonb,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.program_dissemination (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    channel text NOT NULL,
    is_disseminated boolean DEFAULT false,
    disseminated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    is_completed boolean DEFAULT true,
    PRIMARY KEY (id)
);

CREATE TABLE public.curriculum_data (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    version_tag text,
    payload jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.curriculum_obe_mappings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    curriculum_id uuid,
    course_code text NOT NULL,
    is_obe_core boolean DEFAULT false,
    category_override text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.program_step_completions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    step_key text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.faculty_applications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    salutation text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    dob date NOT NULL,
    gender text NOT NULL,
    email text NOT NULL,
    contact text NOT NULL,
    alt_contact text,
    country text NOT NULL,
    state text NOT NULL,
    city text NOT NULL,
    domain text NOT NULL,
    domain_other text,
    qualification text NOT NULL,
    phd_details jsonb,
    pg_details jsonb,
    ug_details jsonb,
    position text NOT NULL,
    expected_ctc text,
    notice_period text,
    pref_location text,
    experience_entries jsonb,
    total_teaching_years integer,
    total_experience_years integer,
    total_papers integer,
    scopus_indexed integer,
    sci_indexed integer,
    patents text,
    grants text,
    research_area text,
    scholar_link text,
    current_org text,
    linkedin text,
    resume_file_name text,
    status text NOT NULL DEFAULT 'Pending'::text,
    PRIMARY KEY (id)
);

CREATE TABLE public.careers_openings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    department text NOT NULL,
    type text NOT NULL,
    tag text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.institution_stats (
    id text NOT NULL,
    label text NOT NULL,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE auth.webauthn_credentials (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text NOT NULL DEFAULT ''::text,
    aaguid uuid,
    sign_count bigint NOT NULL DEFAULT 0,
    transports jsonb NOT NULL DEFAULT '[]'::jsonb,
    backup_eligible boolean NOT NULL DEFAULT false,
    backed_up boolean NOT NULL DEFAULT false,
    friendly_name text NOT NULL DEFAULT ''::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    last_used_at timestamp with time zone,
    PRIMARY KEY (id)
);

CREATE TABLE auth.webauthn_challenges (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE public.employees (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    employee_id text NOT NULL UNIQUE,
    full_name text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'faculty'::text,
    onboarding_status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.teacher_profiles (
    employee_id text NOT NULL,
    username text UNIQUE,
    program text,
    dob date,
    doj date,
    gender text,
    qualification text,
    experience_years text,
    bio text,
    phone text,
    email text,
    address text,
    skills text,
    designation text,
    subjects ARRAY,
    is_profile_complete boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (employee_id)
);

CREATE TABLE public.admins (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    employee_id text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.ai_cache (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    key_hash text NOT NULL UNIQUE,
    response jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE public.progress (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    progress integer DEFAULT 0,
    mastery double precision DEFAULT 0,
    streak integer DEFAULT 0,
    completed_lessons jsonb DEFAULT '[]'::jsonb,
    last_accessed timestamp with time zone,
    hours_spent double precision DEFAULT 0,
    enrolled_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.learner_profiles (
    user_id uuid NOT NULL,
    role text,
    grade_level text,
    goals jsonb DEFAULT '[]'::jsonb,
    preferences jsonb DEFAULT '{}'::jsonb,
    mastery_state jsonb DEFAULT '{}'::jsonb,
    weak_topics jsonb DEFAULT '[]'::jsonb,
    misconception_clusters jsonb DEFAULT '[]'::jsonb,
    behavior_signals jsonb DEFAULT '{}'::jsonb,
    engagement_summary jsonb DEFAULT '{}'::jsonb,
    performance_summary jsonb DEFAULT '{}'::jsonb,
    risk_summary jsonb DEFAULT '{}'::jsonb,
    tutor_summary jsonb DEFAULT '{}'::jsonb,
    assignment_summary jsonb DEFAULT '{}'::jsonb,
    assessment_summary jsonb DEFAULT '{}'::jsonb,
    learning_style text,
    strengths jsonb DEFAULT '[]'::jsonb,
    weaknesses jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id)
);

CREATE TABLE public.behavior_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    course_id uuid,
    event_type text NOT NULL,
    event_data jsonb,
    session_duration_seconds integer,
    resource_id text,
    timestamp timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.agent_memory (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    agent_type text DEFAULT 'tutor'::text,
    memory_key text NOT NULL,
    memory_value jsonb NOT NULL,
    confidence numeric DEFAULT 0.5,
    last_updated timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.tutor_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    course_id uuid,
    conversation_id uuid,
    topic text,
    duration_seconds integer,
    message_count integer DEFAULT 0,
    student_satisfaction integer,
    ai_confidence numeric,
    is_completed boolean DEFAULT false,
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.analytics_events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    course_id uuid,
    event_type text NOT NULL,
    event_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.question_bank (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    course_id uuid,
    question_text text NOT NULL,
    question_type text DEFAULT 'mcq'::text,
    difficulty text DEFAULT 'beginner'::text,
    answer_options jsonb,
    correct_answer jsonb NOT NULL,
    explanation text,
    point_value integer DEFAULT 1,
    is_ai_generated boolean DEFAULT false,
    usage_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.submissions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    assignment_id text NOT NULL,
    student_id text NOT NULL,
    file_path text,
    status text DEFAULT 'pending'::text,
    score double precision,
    feedback text,
    ocr_text text,
    submitted_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    name text NOT NULL,
    role text NOT NULL DEFAULT 'student'::text,
    password_hash text NOT NULL,
    phone text DEFAULT 'N/A'::text,
    avatar text,
    status text DEFAULT 'active'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    department_id uuid,
    college_id uuid,
    dept_id uuid,
    batch_id uuid,
    section text,
    student_roll text,
    employee_id text,
    full_name text,
    profile_photo_url text,
    onboarding_step integer DEFAULT 0,
    last_login_at timestamp with time zone,
    must_change_password boolean DEFAULT false,
    PRIMARY KEY (id)
);

CREATE TABLE public.invite_tokens (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.enrollment_codes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    batch_id uuid,
    code text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    section text,
    created_by uuid REFERENCES public.users(id),
    PRIMARY KEY (id)
);

CREATE TABLE public.enrollments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid,
    course_id uuid,
    enrolled_at timestamp with time zone DEFAULT now(),
    progress jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'active'::text,
    PRIMARY KEY (id)
);

CREATE TABLE public.learning_events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    event_type text NOT NULL,
    source text,
    course_id uuid,
    topic_id text,
    session_id text,
    payload jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.assessment_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    course_id uuid,
    topic_id text,
    status text DEFAULT 'started'::text,
    questions jsonb DEFAULT '[]'::jsonb,
    answers jsonb DEFAULT '{}'::jsonb,
    mastery_before jsonb DEFAULT '{}'::jsonb,
    mastery_after jsonb DEFAULT '{}'::jsonb,
    report jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    PRIMARY KEY (id)
);

CREATE TABLE public.semesters (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL,
    semester_number integer NOT NULL,
    title text,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.student_enrollments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    program_id uuid NOT NULL,
    current_semester_id uuid,
    year_of_study integer DEFAULT 1,
    status text DEFAULT 'active'::text,
    enrolled_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    class_id uuid,
    PRIMARY KEY (id)
);

CREATE TABLE public.teacher_courses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    teacher_id uuid,
    course_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.student_credits (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid,
    semester_id uuid,
    earned_credits integer DEFAULT 0,
    total_credits integer DEFAULT 0,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.course_concepts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    course_id uuid,
    concept_name text NOT NULL,
    description text,
    dependencies jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.community_channels (
    id text NOT NULL,
    name text NOT NULL,
    unread integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id)
);

CREATE TABLE public.community_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    channel_id text NOT NULL,
    student_id uuid NOT NULL,
    student_name text NOT NULL,
    avatar text,
    content text NOT NULL,
    timestamp timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id)
);

CREATE TABLE public.classes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    program_id uuid,
    semester_id uuid,
    section_name text NOT NULL,
    class_name text,
    academic_year text NOT NULL,
    batch_name text NOT NULL,
    batch text,
    section text,
    student_limit integer,
    teacher_limit integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    department_id uuid,
    batch_year text,
    batch_id uuid,
    PRIMARY KEY (id)
);

CREATE TABLE public.teacher_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    teacher_id uuid,
    course_id uuid,
    class_id uuid,
    status text DEFAULT 'PENDING_HOD'::text,
    message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    department_id uuid,
    hod_status text DEFAULT 'PENDING'::text,
    admin_status text DEFAULT 'PENDING'::text,
    hod_reviewed_at timestamp with time zone,
    admin_reviewed_at timestamp with time zone,
    verified_by uuid,
    verified_at timestamp with time zone,
    PRIMARY KEY (id)
);

CREATE TABLE public.teacher_assignments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    teacher_id uuid,
    course_id uuid,
    class_id uuid,
    batch_id uuid,
    section text,
    academic_year text,
    is_co_teacher boolean DEFAULT false,
    is_primary boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.departments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    institution_id uuid,
    department_name text NOT NULL,
    description text,
    hod_id uuid,
    code text,
    abbreviation text,
    intake_strength integer,
    established_year integer,
    teacher_limit integer,
    class_limit integer,
    course_limit integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.batches (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    college_id uuid,
    dept_id uuid,
    year integer NOT NULL,
    label text NOT NULL,
    sections text[] DEFAULT '{}'::text[],
    current_semester integer DEFAULT 1,
    is_lateral boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (college_id) REFERENCES public.institutions(id),
    FOREIGN KEY (dept_id) REFERENCES public.departments(id)
);

CREATE TABLE public.content_uploads (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    teacher_id uuid NOT NULL,
    original_filename text NOT NULL,
    storage_url text NOT NULL,
    file_type text,
    file_size_bytes integer,
    processing_status text DEFAULT 'queued'::text,
    scaffold_json jsonb,
    scaffold_approved_at timestamp with time zone,
    course_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.ai_answer_queue (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    course_id uuid,
    student_question text,
    ai_generated_answer text,
    teacher_edited_answer text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    verified_at timestamp with time zone,
    priority_score integer DEFAULT 0,
    PRIMARY KEY (id)
);

CREATE TABLE public.physical_submissions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    assignment_id text,
    student_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    submission_images jsonb DEFAULT '[]'::jsonb,
    ocr_extracted_text jsonb,
    ai_assessment jsonb,
    total_ai_marks numeric,
    assessment_status text DEFAULT 'uploaded'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    institution_id uuid,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE public.student_subjects (
    student_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    PRIMARY KEY (student_id, subject_id)
);

CREATE TABLE public.concept_edges (
    from_concept uuid NOT NULL,
    to_concept uuid NOT NULL,
    relation_type text NOT NULL,
    PRIMARY KEY (from_concept, to_concept, relation_type)
);

CREATE TABLE public.student_progress (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid,
    concept_id uuid,
    mastery double precision DEFAULT 0.0,
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Foreign Keys

ALTER TABLE auth.users ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.users ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.users ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.users ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.users ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.users ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.users ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.users ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.refresh_tokens ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id);
ALTER TABLE auth.identities ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.sessions ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.sessions ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id);
ALTER TABLE auth.sessions ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id);
ALTER TABLE auth.sessions ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id);
ALTER TABLE auth.mfa_factors ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.mfa_factors ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id);
ALTER TABLE auth.mfa_challenges ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id);
ALTER TABLE auth.mfa_amr_claims ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id);
ALTER TABLE auth.sso_providers ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id);
ALTER TABLE auth.sso_providers ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id);
ALTER TABLE auth.sso_providers ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id);
ALTER TABLE auth.sso_domains ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id);
ALTER TABLE auth.saml_providers ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id);
ALTER TABLE auth.saml_relay_states ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id);
ALTER TABLE auth.saml_relay_states ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id);
ALTER TABLE auth.flow_state ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id);
ALTER TABLE auth.one_time_tokens ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.oauth_clients ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id);
ALTER TABLE auth.oauth_clients ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id);
ALTER TABLE auth.oauth_clients ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id);
ALTER TABLE auth.oauth_authorizations ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id);
ALTER TABLE auth.oauth_authorizations ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.oauth_consents ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id);
ALTER TABLE auth.oauth_consents ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.institutions ADD CONSTRAINT curriculums_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.institutions(id);
ALTER TABLE public.institutions ADD CONSTRAINT curriculum_generated_courses_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.institutions(id);
ALTER TABLE public.institutions ADD CONSTRAINT curriculum_course_outcomes_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.institutions(id);
ALTER TABLE public.institutions ADD CONSTRAINT po_attainment_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.institutions(id);
ALTER TABLE public.institutions ADD CONSTRAINT continuous_improvement_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.institutions(id);
ALTER TABLE public.institutions ADD CONSTRAINT course_syllabus_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.institutions(id);
ALTER TABLE public.institutions ADD CONSTRAINT institution_details_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.institutions ADD CONSTRAINT user_roles_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.institutions ADD CONSTRAINT obe_framework_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.institutions ADD CONSTRAINT academic_council_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.institutions ADD CONSTRAINT co_attainment_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.institutions(id);
ALTER TABLE public.institutions ADD CONSTRAINT departments_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.institutions ADD CONSTRAINT programs_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.institutions ADD CONSTRAINT program_coordinators_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.institutions ADD CONSTRAINT audit_logs_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.institution_details ADD CONSTRAINT institution_details_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.programs ADD CONSTRAINT programs_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.programs ADD CONSTRAINT obe_framework_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT curriculum_semester_categories_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT curriculum_electives_settings_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT curriculum_category_credits_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT curriculum_versions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT curriculum_feedback_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT dashboard_preferences_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT co_pso_mapping_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT program_vmpeo_feedback_entries_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT program_vmp_versions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT program_vmpeo_feedback_submissions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT peo_drafts_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT peos_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT stakeholder_feedback_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT stakeholders_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT courses_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT programs_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);
ALTER TABLE public.programs ADD CONSTRAINT classes_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT student_enrollments_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT semesters_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT program_step_completions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT curriculum_obe_mappings_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT curriculum_data_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT program_dissemination_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT consistency_matrix_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT course_syllabus_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT curriculum_structure_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT continuous_improvement_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT po_attainment_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT co_po_mapping_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT program_missions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT program_visions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT curriculums_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT co_attainment_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT curriculum_course_outcomes_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT program_psos_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT program_outcomes_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT program_peos_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT program_coordinators_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.programs ADD CONSTRAINT curriculum_generated_courses_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.stakeholders ADD CONSTRAINT stakeholder_feedback_stakeholder_id_fkey FOREIGN KEY (stakeholder_id) REFERENCES public.stakeholders(id);
ALTER TABLE public.stakeholders ADD CONSTRAINT stakeholders_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.stakeholders ADD CONSTRAINT curriculum_feedback_stakeholder_id_fkey FOREIGN KEY (stakeholder_id) REFERENCES public.stakeholders(id);
ALTER TABLE public.stakeholder_feedback ADD CONSTRAINT stakeholder_feedback_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.stakeholder_feedback ADD CONSTRAINT stakeholder_feedback_stakeholder_id_fkey FOREIGN KEY (stakeholder_id) REFERENCES public.stakeholders(id);
ALTER TABLE public.stakeholder_feedback ADD CONSTRAINT stakeholder_feedback_rep_stakeholder_id_fkey FOREIGN KEY (rep_stakeholder_id) REFERENCES public.representative_stakeholders(id);
ALTER TABLE public.peos ADD CONSTRAINT peos_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.peo_drafts ADD CONSTRAINT peo_drafts_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.representative_stakeholders ADD CONSTRAINT program_vmpeo_feedback_submissions_stakeholder_ref_id_fkey FOREIGN KEY (stakeholder_ref_id) REFERENCES public.representative_stakeholders(id);
ALTER TABLE public.representative_stakeholders ADD CONSTRAINT stakeholder_feedback_rep_stakeholder_id_fkey FOREIGN KEY (rep_stakeholder_id) REFERENCES public.representative_stakeholders(id);
ALTER TABLE public.program_coordinators ADD CONSTRAINT program_coordinators_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.program_coordinators ADD CONSTRAINT program_coordinators_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.program_peos ADD CONSTRAINT program_peos_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.program_peos ADD CONSTRAINT program_vmpeo_feedback_entries_peo_id_fkey FOREIGN KEY (peo_id) REFERENCES public.program_peos(id);
ALTER TABLE public.program_outcomes ADD CONSTRAINT program_outcomes_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.program_psos ADD CONSTRAINT program_psos_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.program_visions ADD CONSTRAINT program_visions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.program_visions ADD CONSTRAINT program_missions_vision_fk FOREIGN KEY (vision_id) REFERENCES public.program_visions(program_id);
ALTER TABLE public.program_visions ADD CONSTRAINT program_missions_vision_fk FOREIGN KEY (program_id) REFERENCES public.program_visions(program_id);
ALTER TABLE public.program_visions ADD CONSTRAINT program_missions_vision_fk FOREIGN KEY (vision_id) REFERENCES public.program_visions(id);
ALTER TABLE public.program_visions ADD CONSTRAINT program_missions_vision_fk FOREIGN KEY (program_id) REFERENCES public.program_visions(id);
ALTER TABLE public.program_missions ADD CONSTRAINT program_missions_vision_fk FOREIGN KEY (vision_id) REFERENCES public.program_visions(id);
ALTER TABLE public.program_missions ADD CONSTRAINT program_missions_vision_fk FOREIGN KEY (program_id) REFERENCES public.program_visions(program_id);
ALTER TABLE public.program_missions ADD CONSTRAINT program_missions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.program_missions ADD CONSTRAINT program_missions_vision_fk FOREIGN KEY (program_id) REFERENCES public.program_visions(id);
ALTER TABLE public.program_missions ADD CONSTRAINT program_missions_vision_fk FOREIGN KEY (vision_id) REFERENCES public.program_visions(program_id);
ALTER TABLE public.program_vmpeo_feedback_submissions ADD CONSTRAINT program_vmpeo_feedback_submissions_stakeholder_ref_id_fkey FOREIGN KEY (stakeholder_ref_id) REFERENCES public.representative_stakeholders(id);
ALTER TABLE public.program_vmpeo_feedback_submissions ADD CONSTRAINT program_vmpeo_feedback_entries_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.program_vmpeo_feedback_submissions(id);
ALTER TABLE public.program_vmpeo_feedback_submissions ADD CONSTRAINT program_vmpeo_feedback_submissions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.program_vmpeo_feedback_entries ADD CONSTRAINT program_vmpeo_feedback_entries_peo_id_fkey FOREIGN KEY (peo_id) REFERENCES public.program_peos(id);
ALTER TABLE public.program_vmpeo_feedback_entries ADD CONSTRAINT program_vmpeo_feedback_entries_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.program_vmpeo_feedback_submissions(id);
ALTER TABLE public.program_vmpeo_feedback_entries ADD CONSTRAINT program_vmpeo_feedback_entries_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.curriculum_versions ADD CONSTRAINT curriculum_generated_courses_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.curriculum_versions(id);
ALTER TABLE public.curriculum_versions ADD CONSTRAINT curriculum_versions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.curriculum_category_credits ADD CONSTRAINT curriculum_category_credits_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.curriculum_electives_settings ADD CONSTRAINT curriculum_electives_settings_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.curriculum_semester_categories ADD CONSTRAINT curriculum_semester_categories_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.curriculum_generated_courses ADD CONSTRAINT curriculum_generated_courses_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.curriculum_generated_courses ADD CONSTRAINT curriculum_generated_courses_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.institutions(id);
ALTER TABLE public.curriculum_generated_courses ADD CONSTRAINT course_syllabus_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.curriculum_generated_courses(id);
ALTER TABLE public.curriculum_generated_courses ADD CONSTRAINT co_po_mapping_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.curriculum_generated_courses(id);
ALTER TABLE public.curriculum_generated_courses ADD CONSTRAINT co_pso_mapping_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.curriculum_generated_courses(id);
ALTER TABLE public.curriculum_generated_courses ADD CONSTRAINT co_attainment_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.curriculum_generated_courses(id);
ALTER TABLE public.curriculum_generated_courses ADD CONSTRAINT curriculum_generated_courses_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.curriculum_generated_courses ADD CONSTRAINT curriculum_generated_courses_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.curriculum_versions(id);
ALTER TABLE public.curriculum_course_outcomes ADD CONSTRAINT co_attainment_co_id_fkey FOREIGN KEY (co_id) REFERENCES public.curriculum_course_outcomes(id);
ALTER TABLE public.curriculum_course_outcomes ADD CONSTRAINT curriculum_course_outcomes_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.institutions(id);
ALTER TABLE public.curriculum_course_outcomes ADD CONSTRAINT curriculum_course_outcomes_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.curriculum_course_outcomes ADD CONSTRAINT curriculum_course_outcomes_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.curriculum_course_outcomes ADD CONSTRAINT co_pso_mapping_co_id_fkey FOREIGN KEY (co_id) REFERENCES public.curriculum_course_outcomes(id);
ALTER TABLE public.curriculum_course_outcomes ADD CONSTRAINT co_po_mapping_co_id_fkey FOREIGN KEY (co_id) REFERENCES public.curriculum_course_outcomes(id);
ALTER TABLE public.curriculums ADD CONSTRAINT co_pso_mapping_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.curriculums ADD CONSTRAINT co_po_mapping_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.curriculums ADD CONSTRAINT curriculums_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.curriculums ADD CONSTRAINT curriculums_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.institutions(id);
ALTER TABLE public.curriculums ADD CONSTRAINT curriculum_generated_courses_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.curriculums ADD CONSTRAINT curriculum_course_outcomes_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.curriculums ADD CONSTRAINT co_attainment_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.curriculums ADD CONSTRAINT po_attainment_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.curriculums ADD CONSTRAINT continuous_improvement_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.curriculums ADD CONSTRAINT course_syllabus_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.curriculums ADD CONSTRAINT curriculum_obe_mappings_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.co_po_mapping ADD CONSTRAINT co_po_mapping_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.curriculum_generated_courses(id);
ALTER TABLE public.co_po_mapping ADD CONSTRAINT co_po_mapping_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.co_po_mapping ADD CONSTRAINT co_po_mapping_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.co_po_mapping ADD CONSTRAINT co_po_mapping_co_id_fkey FOREIGN KEY (co_id) REFERENCES public.curriculum_course_outcomes(id);
ALTER TABLE public.co_pso_mapping ADD CONSTRAINT co_pso_mapping_co_id_fkey FOREIGN KEY (co_id) REFERENCES public.curriculum_course_outcomes(id);
ALTER TABLE public.co_pso_mapping ADD CONSTRAINT co_pso_mapping_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.co_pso_mapping ADD CONSTRAINT co_pso_mapping_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.co_pso_mapping ADD CONSTRAINT co_pso_mapping_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.curriculum_generated_courses(id);
ALTER TABLE public.co_attainment ADD CONSTRAINT co_attainment_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.co_attainment ADD CONSTRAINT co_attainment_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.curriculum_generated_courses(id);
ALTER TABLE public.co_attainment ADD CONSTRAINT co_attainment_co_id_fkey FOREIGN KEY (co_id) REFERENCES public.curriculum_course_outcomes(id);
ALTER TABLE public.co_attainment ADD CONSTRAINT co_attainment_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.institutions(id);
ALTER TABLE public.co_attainment ADD CONSTRAINT co_attainment_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.po_attainment ADD CONSTRAINT po_attainment_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.po_attainment ADD CONSTRAINT po_attainment_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.institutions(id);
ALTER TABLE public.po_attainment ADD CONSTRAINT po_attainment_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.continuous_improvement ADD CONSTRAINT continuous_improvement_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.continuous_improvement ADD CONSTRAINT continuous_improvement_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.institutions(id);
ALTER TABLE public.continuous_improvement ADD CONSTRAINT continuous_improvement_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.course_syllabus ADD CONSTRAINT course_syllabus_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.course_syllabus ADD CONSTRAINT course_syllabus_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.curriculum_generated_courses(id);
ALTER TABLE public.course_syllabus ADD CONSTRAINT course_syllabus_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.institutions(id);
ALTER TABLE public.course_syllabus ADD CONSTRAINT course_syllabus_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.academic_council ADD CONSTRAINT academic_council_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.obe_framework ADD CONSTRAINT obe_framework_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.obe_framework ADD CONSTRAINT obe_framework_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.program_vmp_versions ADD CONSTRAINT program_vmp_versions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.dashboard_preferences ADD CONSTRAINT dashboard_preferences_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.curriculum_structure ADD CONSTRAINT curriculum_structure_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.courses ADD CONSTRAINT courses_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.courses ADD CONSTRAINT courses_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.courses ADD CONSTRAINT course_outcomes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.courses ADD CONSTRAINT courses_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id);
ALTER TABLE public.courses ADD CONSTRAINT teacher_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.courses ADD CONSTRAINT course_concepts_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.courses ADD CONSTRAINT teacher_requests_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.courses ADD CONSTRAINT teacher_assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.courses ADD CONSTRAINT content_uploads_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.courses ADD CONSTRAINT ai_answer_queue_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.courses ADD CONSTRAINT student_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.courses(id);
ALTER TABLE public.courses ADD CONSTRAINT courses_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);
ALTER TABLE public.course_outcomes ADD CONSTRAINT course_outcomes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.curriculum_feedback ADD CONSTRAINT curriculum_feedback_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.curriculum_feedback ADD CONSTRAINT curriculum_feedback_stakeholder_id_fkey FOREIGN KEY (stakeholder_id) REFERENCES public.stakeholders(id);
ALTER TABLE public.consistency_matrix ADD CONSTRAINT consistency_matrix_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.program_dissemination ADD CONSTRAINT program_dissemination_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.curriculum_data ADD CONSTRAINT curriculum_data_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.curriculum_obe_mappings ADD CONSTRAINT curriculum_obe_mappings_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id);
ALTER TABLE public.curriculum_obe_mappings ADD CONSTRAINT curriculum_obe_mappings_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.program_step_completions ADD CONSTRAINT program_step_completions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE auth.webauthn_credentials ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.webauthn_challenges ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.employees ADD CONSTRAINT teacher_profiles_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);
ALTER TABLE public.employees ADD CONSTRAINT admins_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);
ALTER TABLE public.teacher_profiles ADD CONSTRAINT teacher_profiles_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);
ALTER TABLE public.admins ADD CONSTRAINT admins_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);
ALTER TABLE public.users ADD CONSTRAINT teacher_requests_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT learning_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT assessment_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT student_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT teacher_courses_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT student_credits_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT community_messages_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT teacher_requests_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT teacher_assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT departments_hod_id_fkey FOREIGN KEY (hod_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);
ALTER TABLE public.users ADD CONSTRAINT student_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT content_uploads_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT ai_answer_queue_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT ai_answer_queue_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT physical_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT physical_submissions_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT student_subjects_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.users ADD CONSTRAINT courses_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.learning_events ADD CONSTRAINT learning_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.assessment_sessions ADD CONSTRAINT assessment_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.semesters ADD CONSTRAINT courses_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id);
ALTER TABLE public.semesters ADD CONSTRAINT student_credits_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id);
ALTER TABLE public.semesters ADD CONSTRAINT student_enrollments_current_semester_id_fkey FOREIGN KEY (current_semester_id) REFERENCES public.semesters(id);
ALTER TABLE public.semesters ADD CONSTRAINT classes_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id);
ALTER TABLE public.semesters ADD CONSTRAINT semesters_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.student_enrollments ADD CONSTRAINT student_enrollments_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.student_enrollments ADD CONSTRAINT student_enrollments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);
ALTER TABLE public.student_enrollments ADD CONSTRAINT student_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.student_enrollments ADD CONSTRAINT student_enrollments_current_semester_id_fkey FOREIGN KEY (current_semester_id) REFERENCES public.semesters(id);
ALTER TABLE public.teacher_courses ADD CONSTRAINT teacher_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.teacher_courses ADD CONSTRAINT teacher_courses_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.student_credits ADD CONSTRAINT student_credits_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id);
ALTER TABLE public.student_credits ADD CONSTRAINT student_credits_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.course_concepts ADD CONSTRAINT concept_edges_from_concept_fkey FOREIGN KEY (from_concept) REFERENCES public.course_concepts(id);
ALTER TABLE public.course_concepts ADD CONSTRAINT concept_edges_to_concept_fkey FOREIGN KEY (to_concept) REFERENCES public.course_concepts(id);
ALTER TABLE public.course_concepts ADD CONSTRAINT course_concepts_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.course_concepts ADD CONSTRAINT student_progress_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.course_concepts(id);
ALTER TABLE public.community_channels ADD CONSTRAINT community_messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.community_channels(id);
ALTER TABLE public.community_messages ADD CONSTRAINT community_messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.community_channels(id);
ALTER TABLE public.community_messages ADD CONSTRAINT community_messages_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.classes ADD CONSTRAINT student_enrollments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);
ALTER TABLE public.classes ADD CONSTRAINT classes_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.classes ADD CONSTRAINT classes_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id);
ALTER TABLE public.classes ADD CONSTRAINT teacher_requests_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);
ALTER TABLE public.classes ADD CONSTRAINT teacher_assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);
ALTER TABLE public.classes ADD CONSTRAINT classes_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);
ALTER TABLE public.teacher_requests ADD CONSTRAINT teacher_requests_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.teacher_requests ADD CONSTRAINT teacher_requests_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);
ALTER TABLE public.teacher_requests ADD CONSTRAINT teacher_requests_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);
ALTER TABLE public.teacher_requests ADD CONSTRAINT teacher_requests_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);
ALTER TABLE public.teacher_requests ADD CONSTRAINT teacher_requests_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.teacher_assignments ADD CONSTRAINT teacher_assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.teacher_assignments ADD CONSTRAINT teacher_assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);
ALTER TABLE public.teacher_assignments ADD CONSTRAINT teacher_assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.departments ADD CONSTRAINT teacher_requests_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);
ALTER TABLE public.departments ADD CONSTRAINT courses_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);
ALTER TABLE public.departments ADD CONSTRAINT programs_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);
ALTER TABLE public.departments ADD CONSTRAINT departments_hod_id_fkey FOREIGN KEY (hod_id) REFERENCES public.users(id);
ALTER TABLE public.departments ADD CONSTRAINT departments_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.departments ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);
ALTER TABLE public.departments ADD CONSTRAINT classes_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);
ALTER TABLE public.content_uploads ADD CONSTRAINT content_uploads_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.content_uploads ADD CONSTRAINT content_uploads_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.ai_answer_queue ADD CONSTRAINT ai_answer_queue_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.ai_answer_queue ADD CONSTRAINT ai_answer_queue_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.ai_answer_queue ADD CONSTRAINT ai_answer_queue_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.physical_submissions ADD CONSTRAINT physical_submissions_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.physical_submissions ADD CONSTRAINT physical_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.roles ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);
ALTER TABLE public.student_subjects ADD CONSTRAINT student_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.courses(id);
ALTER TABLE public.student_subjects ADD CONSTRAINT student_subjects_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.concept_edges ADD CONSTRAINT concept_edges_to_concept_fkey FOREIGN KEY (to_concept) REFERENCES public.course_concepts(id);
ALTER TABLE public.concept_edges ADD CONSTRAINT concept_edges_from_concept_fkey FOREIGN KEY (from_concept) REFERENCES public.course_concepts(id);
ALTER TABLE public.student_progress ADD CONSTRAINT student_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);
ALTER TABLE public.student_progress ADD CONSTRAINT student_progress_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.course_concepts(id);
