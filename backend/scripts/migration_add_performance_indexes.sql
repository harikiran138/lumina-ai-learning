-- Migration: Add-- Performance Optimization Indexes for Lumina Analytics & Leaderboard
-- Target Table: learning_events (Student activities)
-- Target Table: student_progress (Student streaks and metrics)

-- 1. Index for rapid aggregation of student activity by type & time
CREATE INDEX IF NOT EXISTS idx_learning_events_user_type_time 
ON learning_events (user_id, event_type, created_at DESC);

-- 2. Index for filtering recent platform activity (global analytics)
CREATE INDEX IF NOT EXISTS idx_learning_events_recent_global
ON learning_events (created_at DESC);

-- 3. Composite index for cohort/course level analytics
CREATE INDEX IF NOT EXISTS idx_learning_events_metadata_concept
ON learning_events ((payload->>'concept_id'))
WHERE payload->>'concept_id' IS NOT NULL;

-- 4. Index for leaderboard enrichment (using student_id for mapping)
CREATE INDEX IF NOT EXISTS idx_student_progress_leaderboard_fields
ON student_progress (student_id);

-- 5. RPC Function for server-side leaderboard calculation (Version 2)
-- This avoids fetching 2000 events to the Python layer.
CREATE OR REPLACE FUNCTION get_leaderboard_v2(p_timeframe text DEFAULT 'weekly')
RETURNS TABLE (
    user_id uuid,
    xp bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        le.user_id,
        SUM(
            CASE 
                WHEN le.event_type = 'quiz_submitted' THEN (le.payload->>'score')::numeric * 15
                WHEN le.event_type = 'lesson_completed' THEN 50
                WHEN le.event_type = 'activity_logged' THEN LEAST((le.payload->>'duration_minutes')::integer, 60)
                ELSE 0
            END
        )::bigint as total_xp
    FROM learning_events le
    WHERE 
        le.created_at > (
            CASE 
                WHEN p_timeframe = 'weekly' THEN now() - interval '7 days'
                WHEN p_timeframe = 'daily' THEN now() - interval '1 day'
                ELSE now() - interval '30 days'
            END
        )
    GROUP BY le.user_id
    ORDER BY total_xp DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
