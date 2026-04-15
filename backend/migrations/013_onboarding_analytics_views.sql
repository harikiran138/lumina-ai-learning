-- ============================================================================
-- Migration 013: Onboarding Analytics Views
-- Purpose: Create views for monitoring onboarding completion and bottlenecks
-- ============================================================================

-- 1. ONBOARDING_COMPLETION_STATS - Historical completion data
CREATE VIEW IF NOT EXISTS public.onboarding_completion_stats AS
SELECT
    DATE(completed_at) as completion_date,
    role,
    COUNT(*) as total_completions,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_completion_time_minutes,
    MIN(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as min_completion_time_minutes,
    MAX(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as max_completion_time_minutes,
    AVG(array_length(completed_steps, 1))::DECIMAL(5,2) as avg_steps_completed
FROM public.onboarding_progress
WHERE completed_at IS NOT NULL
GROUP BY DATE(completed_at), role
ORDER BY completion_date DESC, role;

-- 2. ONBOARDING_RETENTION_BY_STEP - Identify bottleneck steps
CREATE VIEW IF NOT EXISTS public.onboarding_retention_by_step AS
WITH step_counts AS (
    SELECT
        role,
        step,
        COUNT(*) as users_at_step
    FROM public.onboarding_events
    WHERE event_type = 'step_started'
    GROUP BY role, step
)
SELECT
    role,
    step,
    users_at_step,
    LAG(users_at_step) OVER (PARTITION BY role ORDER BY step) as users_at_previous_step,
    ROUND(
        100.0 * users_at_step / 
        LAG(users_at_step) OVER (PARTITION BY role ORDER BY step),
        2
    ) as retention_percentage
FROM step_counts
ORDER BY role, step;

-- 3. ONBOARDING_ABANDONMENT_ANALYSIS - Users who abandoned
CREATE VIEW IF NOT EXISTS public.onboarding_abandonment_analysis AS
SELECT
    op.role,
    op.current_step,
    TRUNC(AVG(EXTRACT(EPOCH FROM (NOW() - op.last_saved_at))/3600))::INT as hours_since_last_activity,
    COUNT(*) as abandoned_users,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.onboarding_progress WHERE status = 'in_progress') as abandonment_rate_pct
FROM public.onboarding_progress op
WHERE op.status = 'in_progress'
  AND NOW() - op.last_saved_at > INTERVAL '24 hours'
GROUP BY op.role, op.current_step
ORDER BY abandonment_rate_pct DESC;

-- 4. ONBOARDING_ERROR_ANALYSIS - Common validation errors
CREATE VIEW IF NOT EXISTS public.onboarding_error_analysis AS
SELECT
    role,
    step,
    error_message,
    COUNT(*) as error_count,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.onboarding_events WHERE event_type = 'validation_error') as error_rate_pct
FROM public.onboarding_events
WHERE event_type = 'validation_error' AND error_message IS NOT NULL
GROUP BY role, step, error_message
ORDER BY error_count DESC;

-- 5. VERIFICATION_QUEUE - Awaiting verification
CREATE VIEW IF NOT EXISTS public.verification_queue AS
SELECT
    vr.id,
    vr.user_id,
    vr.role,
    vr.verification_type,
    vr.status,
    EXTRACT(EPOCH FROM (NOW() - vr.created_at))/3600 as hours_pending,
    vr.expires_at,
    CASE
        WHEN vr.expires_at <= NOW() THEN 'expired'
        WHEN vr.expires_at <= NOW() + INTERVAL '24 hours' THEN 'expiring_soon'
        ELSE 'active'
    END as expiry_status,
    vr.created_at,
    vr.reviewed_at,
    vr.reviewed_by_user_id
FROM public.verification_requests vr
WHERE vr.status IN ('pending', 'expired')
ORDER BY vr.created_at ASC;

-- 6. ONBOARDING_COMPLETION_RATES - By role and institution
CREATE VIEW IF NOT EXISTS public.onboarding_completion_rates AS
WITH role_stats AS (
    SELECT
        role,
        COUNT(*) as total_started,
        COUNT(*) FILTER (WHERE status = 'completed') as total_completed,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'skipped') as skipped
    FROM public.onboarding_progress
    GROUP BY role
)
SELECT
    role,
    total_started,
    total_completed,
    ROUND(100.0 * total_completed / NULLIF(total_started, 0), 2) as completion_rate_pct,
    in_progress,
    skipped,
    ROUND(100.0 * in_progress / NULLIF(total_started, 0), 2) as in_progress_pct
FROM role_stats
ORDER BY completion_rate_pct DESC;

-- ============================================================================
-- FUNCTIONS FOR ONBOARDING MONITORING
-- ============================================================================

-- Function to get user's onboarding status summary
CREATE OR REPLACE FUNCTION get_onboarding_summary(p_user_id UUID)
RETURNS TABLE (
    role TEXT,
    current_step INT,
    total_steps INT,
    status TEXT,
    completion_percentage DECIMAL,
    time_spent_minutes INT,
    last_saved_at TIMESTAMPTZ,
    next_step_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        op.role,
        op.current_step,
        op.total_steps,
        op.status,
        ROUND(100.0 * array_length(op.completed_steps, 1) / NULLIF(op.total_steps, 0), 2),
        TRUNC(EXTRACT(EPOCH FROM (NOW() - op.started_at))/60)::INT,
        op.last_saved_at,
        'Step ' || (op.current_step + 1) || ' - ' || op.role
    FROM public.onboarding_progress op
    WHERE op.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record onboarding event
CREATE OR REPLACE FUNCTION record_onboarding_event(
    p_user_id UUID,
    p_role TEXT,
    p_step INT,
    p_event_type TEXT,
    p_event_data JSONB DEFAULT '{}'::JSONB,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.onboarding_events (
        user_id, role, step, event_type, event_data, error_message
    ) VALUES (
        p_user_id, p_role, p_step, p_event_type, p_event_data, p_error_message
    )
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark step as completed
CREATE OR REPLACE FUNCTION mark_step_completed(
    p_user_id UUID,
    p_role TEXT,
    p_step INT,
    p_step_data JSONB DEFAULT '{}'::JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.onboarding_progress
    SET
        last_saved_at = NOW(),
        completed_steps = array_append(completed_steps, p_step),
        step_data = jsonb_set(
            step_data,
            ARRAY['step_' || p_step::TEXT],
            p_step_data
        ),
        updated_at = NOW()
    WHERE user_id = p_user_id AND role = p_role
        AND NOT (p_step = ANY(completed_steps)); -- Only if not already completed
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete onboarding
CREATE OR REPLACE FUNCTION complete_onboarding(
    p_user_id UUID,
    p_role TEXT,
    p_browser_info TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.onboarding_progress
    SET
        status = 'completed',
        completed_at = NOW(),
        browser_info = p_browser_info,
        ip_address = p_ip_address,
        completion_time_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INT,
        updated_at = NOW()
    WHERE user_id = p_user_id AND role = p_role;
    
    IF FOUND THEN
        -- Record completion event
        PERFORM record_onboarding_event(
            p_user_id, p_role, 0, 'onboarding_completed',
            jsonb_build_object('completed_at', NOW())
        );
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON public.onboarding_completion_stats TO authenticated;
GRANT SELECT ON public.onboarding_retention_by_step TO authenticated;
GRANT SELECT ON public.onboarding_abandonment_analysis TO authenticated;
GRANT SELECT ON public.onboarding_error_analysis TO authenticated;
GRANT SELECT ON public.verification_queue TO authenticated;
GRANT SELECT ON public.onboarding_completion_rates TO authenticated;

GRANT ALL ON public.onboarding_completion_stats TO service_role;
GRANT ALL ON public.onboarding_retention_by_step TO service_role;
GRANT ALL ON public.onboarding_abandonment_analysis TO service_role;
GRANT ALL ON public.onboarding_error_analysis TO service_role;
GRANT ALL ON public.verification_queue TO service_role;
GRANT ALL ON public.onboarding_completion_rates TO service_role;

GRANT EXECUTE ON FUNCTION get_onboarding_summary TO authenticated;
GRANT EXECUTE ON FUNCTION record_onboarding_event TO authenticated;
GRANT EXECUTE ON FUNCTION mark_step_completed TO authenticated;
GRANT EXECUTE ON FUNCTION complete_onboarding TO authenticated;

GRANT EXECUTE ON FUNCTION get_onboarding_summary TO service_role;
GRANT EXECUTE ON FUNCTION record_onboarding_event TO service_role;
GRANT EXECUTE ON FUNCTION mark_step_completed TO service_role;
GRANT EXECUTE ON FUNCTION complete_onboarding TO service_role;
