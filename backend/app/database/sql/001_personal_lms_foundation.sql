-- Lumina Personal LMS Foundation Schema
-- Apply in Supabase SQL Editor or your PostgreSQL migration pipeline.

create extension if not exists pgcrypto;

create table if not exists learner_profiles (
  user_id text primary key,
  role text not null default 'student',
  grade_level text,
  goals jsonb not null default '[]'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  mastery_state jsonb not null default '{}'::jsonb,
  weak_topics jsonb not null default '[]'::jsonb,
  behavior_signals jsonb not null default '{}'::jsonb,
  engagement_summary jsonb not null default '{}'::jsonb,
  performance_summary jsonb not null default '{}'::jsonb,
  risk_summary jsonb not null default '{}'::jsonb,
  tutor_summary jsonb not null default '{}'::jsonb,
  assignment_summary jsonb not null default '{}'::jsonb,
  assessment_summary jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  event_type text not null,
  source text not null default 'system',
  course_id text,
  topic_id text,
  session_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_learning_events_user_id
  on learning_events (user_id);

create index if not exists idx_learning_events_event_type
  on learning_events (event_type);

create index if not exists idx_learning_events_course_id
  on learning_events (course_id);

create index if not exists idx_learning_events_created_at
  on learning_events (created_at desc);

create table if not exists intervention_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  course_id text,
  topic_id text,
  priority text not null default 'medium',
  status text not null default 'open',
  recommended_action text not null,
  reason text not null,
  confidence numeric(5,4) not null default 0.5,
  evidence jsonb not null default '{}'::jsonb,
  created_by text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_interventions_user_status
  on intervention_recommendations (user_id, status);

create index if not exists idx_interventions_priority
  on intervention_recommendations (priority);

create table if not exists assignment_rubrics (
  assignment_id text primary key,
  title text not null,
  criteria jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists submission_scorecards (
  submission_id text primary key,
  overall_score numeric(6,2) not null default 0,
  confidence numeric(5,4) not null default 0.5,
  review_required boolean not null default false,
  rubric_scores jsonb not null default '[]'::jsonb,
  rationale jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
