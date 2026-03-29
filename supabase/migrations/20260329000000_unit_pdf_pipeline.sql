-- Unit PDF -> Smart Content Pipeline

CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    source_file_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'parsing',
    parse_error TEXT,
    ppt_file_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unit_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unit_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES unit_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_text TEXT,
    summary_bullets JSONB NOT NULL DEFAULT '[]',
    quiz_questions JSONB NOT NULL DEFAULT '[]',
    source_tables JSONB NOT NULL DEFAULT '[]',
    source_images JSONB NOT NULL DEFAULT '[]',
    detected_signals JSONB NOT NULL DEFAULT '[]',
    generation_status TEXT NOT NULL DEFAULT 'pending',
    generation_error TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topic_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES unit_topics(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT,
    is_generated BOOLEAN NOT NULL DEFAULT FALSE,
    generation_status TEXT NOT NULL DEFAULT 'ready',
    error_message TEXT,
    content_json JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unit_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES unit_topics(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    attempts INT NOT NULL DEFAULT 0,
    error_message TEXT,
    payload JSONB NOT NULL DEFAULT '{}',
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_units_teacher_id ON units(teacher_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_unit_modules_unit_id ON unit_modules(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_topics_unit_id ON unit_topics(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_topics_module_id ON unit_topics(module_id);
CREATE INDEX IF NOT EXISTS idx_unit_topics_generation_status ON unit_topics(generation_status);
CREATE INDEX IF NOT EXISTS idx_topic_assets_topic_id ON topic_assets(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_assets_unit_id ON topic_assets(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_processing_jobs_unit_id ON unit_processing_jobs(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_processing_jobs_topic_id ON unit_processing_jobs(topic_id);
CREATE INDEX IF NOT EXISTS idx_unit_processing_jobs_status ON unit_processing_jobs(status);
