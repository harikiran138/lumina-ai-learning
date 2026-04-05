-- 009_tutor_eligibility_cache.sql
-- Peer Tutor System - Eligibility Cache
-- Description: Caches tutor eligibility checks with TTL for performance optimization

-- 1. Tutor Eligibility Cache Table
CREATE TABLE IF NOT EXISTS tutor_eligibility_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    concept_id TEXT NOT NULL,
    mastery_score NUMERIC NOT NULL CHECK (mastery_score >= 0 AND mastery_score <= 1),
    is_eligible BOOLEAN NOT NULL,
    last_validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tutor_concept UNIQUE (tutor_id, concept_id)
);

-- TTL trigger: Auto-invalidate stale records
-- Deletes cache entries older than 5 minutes to prevent stale data
CREATE OR REPLACE FUNCTION cleanup_stale_eligibility_cache()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM tutor_eligibility_cache 
    WHERE expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger runs after INSERT to periodically clean up stale entries
CREATE TRIGGER eligibility_cache_cleanup_trigger
    AFTER INSERT ON tutor_eligibility_cache
    EXECUTE FUNCTION cleanup_stale_eligibility_cache();

-- Auto-set expires_at on insert/update
CREATE OR REPLACE FUNCTION set_eligibility_expiration()
RETURNS TRIGGER AS $$
BEGIN
    NEW.expires_at := NOW() + INTERVAL '5 minutes';
    NEW.last_validated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_eligibility_expiration_trigger
    BEFORE INSERT OR UPDATE ON tutor_eligibility_cache
    FOR EACH ROW
    EXECUTE FUNCTION set_eligibility_expiration();

-- Function to invalidate cache when mastery changes
-- This function should be called from skill_mastery triggers
CREATE OR REPLACE FUNCTION invalidate_tutor_eligibility_on_mastery_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete cache entries for this user when their mastery changes
    DELETE FROM tutor_eligibility_cache 
    WHERE tutor_id = NEW.user_id 
      AND concept_id = NEW.skill_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to skill_mastery table (if it doesn't have this trigger already)
DROP TRIGGER IF EXISTS invalidate_eligibility_cache_on_mastery_update ON skill_mastery;
CREATE TRIGGER invalidate_eligibility_cache_on_mastery_update
    AFTER INSERT OR UPDATE OF mastery_score ON skill_mastery
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_tutor_eligibility_on_mastery_change();

-- Indexes for Performance
-- Primary lookup: Check eligibility for specific tutor+concept
CREATE INDEX IF NOT EXISTS idx_tutor_eligibility_cache_tutor_concept 
    ON tutor_eligibility_cache(tutor_id, concept_id);

-- Expiration cleanup: Find expired entries efficiently
CREATE INDEX IF NOT EXISTS idx_tutor_eligibility_cache_expires_at 
    ON tutor_eligibility_cache(expires_at) 
    WHERE expires_at < NOW();

-- Eligible tutors for matching: Find available tutors for a concept
CREATE INDEX IF NOT EXISTS idx_tutor_eligibility_cache_concept_eligible 
    ON tutor_eligibility_cache(concept_id, is_eligible, expires_at) 
    WHERE is_eligible = TRUE;

-- Comments for documentation
COMMENT ON TABLE tutor_eligibility_cache IS 'Cached eligibility checks with 5-minute TTL to reduce DB load';
COMMENT ON COLUMN tutor_eligibility_cache.mastery_score IS 'Snapshot of mastery at validation time (threshold: 0.80)';
COMMENT ON COLUMN tutor_eligibility_cache.expires_at IS 'Cache entry expires after 5 minutes to ensure freshness';
COMMENT ON FUNCTION cleanup_stale_eligibility_cache IS 'Automatically deletes cache entries older than 5 minutes';
COMMENT ON FUNCTION invalidate_tutor_eligibility_on_mastery_change IS 'Invalidates cache when skill_mastery changes to prevent stale data';
