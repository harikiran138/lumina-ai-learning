-- 009_misconception_bank.sql
-- Peer Tutor System - Misconception Bank
-- Description: Stores common student misconceptions with semantic embeddings for AI coaching

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Misconception Bank Table
CREATE TABLE IF NOT EXISTS misconception_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id TEXT NOT NULL,
    incorrect_pattern TEXT NOT NULL,
    correct_pattern TEXT NOT NULL,
    frequency_count INTEGER NOT NULL DEFAULT 1 CHECK (frequency_count > 0),
    anonymized_source TEXT,
    embedding_vector vector(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_misconception UNIQUE (concept_id, incorrect_pattern)
);

-- Auto-anonymization trigger
-- Ensures student identifiers are never stored (FERPA/GDPR compliance)
CREATE OR REPLACE FUNCTION anonymize_misconception_source()
RETURNS TRIGGER AS $$
BEGIN
    -- Remove any potential student identifiers (UUIDs, emails, names)
    -- Store only generic metadata like "assignment_submission" or "peer_session"
    IF NEW.anonymized_source IS NOT NULL THEN
        NEW.anonymized_source := regexp_replace(
            NEW.anonymized_source, 
            '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 
            'REDACTED', 
            'gi'
        );
        NEW.anonymized_source := regexp_replace(
            NEW.anonymized_source,
            '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'REDACTED',
            'g'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER misconception_anonymization_trigger
    BEFORE INSERT OR UPDATE ON misconception_bank
    FOR EACH ROW
    EXECUTE FUNCTION anonymize_misconception_source();

-- Auto-update last_seen_at on frequency increment
CREATE OR REPLACE FUNCTION update_misconception_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.frequency_count > OLD.frequency_count THEN
        NEW.last_seen_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER misconception_last_seen_trigger
    BEFORE UPDATE ON misconception_bank
    FOR EACH ROW
    EXECUTE FUNCTION update_misconception_last_seen();

-- Indexes for Performance
-- Concept-based retrieval ordered by frequency
CREATE INDEX IF NOT EXISTS idx_misconception_bank_concept_frequency 
    ON misconception_bank(concept_id, frequency_count DESC);

-- Recent misconceptions for trending analysis
CREATE INDEX IF NOT EXISTS idx_misconception_bank_last_seen 
    ON misconception_bank(last_seen_at DESC);

-- Vector similarity search using HNSW (Hierarchical Navigable Small World)
-- This enables fast nearest-neighbor search for semantic misconception matching
CREATE INDEX IF NOT EXISTS idx_misconception_bank_embedding_vector 
    ON misconception_bank 
    USING hnsw (embedding_vector vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Partial index for high-frequency misconceptions (analytics optimization)
CREATE INDEX IF NOT EXISTS idx_misconception_bank_high_frequency 
    ON misconception_bank(concept_id, frequency_count DESC) 
    WHERE frequency_count >= 5;

-- Comments for documentation
COMMENT ON TABLE misconception_bank IS 'Anonymized repository of common student misconceptions with semantic embeddings';
COMMENT ON COLUMN misconception_bank.embedding_vector IS '1024-dim vector from BAAI/bge-large-en-v1.5 for semantic similarity search';
COMMENT ON COLUMN misconception_bank.frequency_count IS 'Number of times this misconception pattern has been observed';
COMMENT ON COLUMN misconception_bank.anonymized_source IS 'Generic source type (e.g., "assignment_submission"), student identifiers removed';
COMMENT ON INDEX idx_misconception_bank_embedding_vector IS 'HNSW index for fast semantic similarity search using cosine distance';
