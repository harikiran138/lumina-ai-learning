-- 009_dual_mastery_trigger.sql
-- Peer Tutor System - Dual Mastery Tracking
-- Description: Updates mastery for both tutor and tutee when learning occurs, with real-time notifications

-- Function: Update mastery for both users when tutee answers correctly after scaffolding
CREATE OR REPLACE FUNCTION update_dual_mastery()
RETURNS TRIGGER AS $$
DECLARE
    v_session_record RECORD;
    v_tutor_mastery_record RECORD;
    v_tutee_mastery_record RECORD;
    v_mastery_delta NUMERIC := 0.02; -- 2% mastery increase
    v_previous_message RECORD;
    v_should_update BOOLEAN := FALSE;
BEGIN
    -- Get session details
    SELECT * INTO v_session_record
    FROM peer_tutor_sessions
    WHERE id = NEW.session_id
      AND status = 'active';
    
    -- Exit if session not found or not active
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    -- Check if this is a tutee answer that follows tutor scaffolding
    -- Logic: Tutee sends an "answer" message type after tutor sent "explanation" or "hint"
    IF NEW.sender_id = v_session_record.tutee_id 
       AND NEW.message_type = 'answer' THEN
        
        -- Get the most recent previous message
        SELECT * INTO v_previous_message
        FROM peer_session_messages
        WHERE session_id = NEW.session_id
          AND timestamp < NEW.timestamp
        ORDER BY timestamp DESC
        LIMIT 1;
        
        -- Update mastery if previous message was tutor scaffolding
        IF FOUND 
           AND v_previous_message.sender_id = v_session_record.tutor_id
           AND v_previous_message.message_type IN ('explanation', 'hint')
           AND (v_previous_message.flagged_direct_answer IS FALSE 
                OR v_previous_message.flagged_direct_answer IS NULL) THEN
            v_should_update := TRUE;
        END IF;
    END IF;
    
    -- Exit if conditions not met for mastery update
    IF NOT v_should_update THEN
        RETURN NEW;
    END IF;
    
    -- Update tutor's mastery (teaching reinforces knowledge)
    SELECT * INTO v_tutor_mastery_record
    FROM skill_mastery
    WHERE user_id = v_session_record.tutor_id
      AND skill_name = v_session_record.concept_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF FOUND THEN
        -- Update existing mastery record
        UPDATE skill_mastery
        SET mastery_score = LEAST(1.0, v_tutor_mastery_record.mastery_score + v_mastery_delta),
            updated_at = NOW()
        WHERE id = v_tutor_mastery_record.id;
    ELSE
        -- Create new mastery record for tutor
        INSERT INTO skill_mastery (user_id, course_id, skill_name, mastery_score)
        VALUES (
            v_session_record.tutor_id,
            NULL, -- course_id can be NULL for peer tutoring
            v_session_record.concept_id,
            v_mastery_delta
        );
    END IF;
    
    -- Update tutee's mastery (learning from scaffolding)
    SELECT * INTO v_tutee_mastery_record
    FROM skill_mastery
    WHERE user_id = v_session_record.tutee_id
      AND skill_name = v_session_record.concept_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF FOUND THEN
        -- Update existing mastery record
        UPDATE skill_mastery
        SET mastery_score = LEAST(1.0, v_tutee_mastery_record.mastery_score + v_mastery_delta),
            updated_at = NOW()
        WHERE id = v_tutee_mastery_record.id;
    ELSE
        -- Create new mastery record for tutee
        INSERT INTO skill_mastery (user_id, course_id, skill_name, mastery_score)
        VALUES (
            v_session_record.tutee_id,
            NULL,
            v_session_record.concept_id,
            v_mastery_delta
        );
    END IF;
    
    -- Emit NOTIFY event for real-time WebSocket broadcast
    PERFORM pg_notify(
        'mastery_updates',
        json_build_object(
            'type', 'mastery_update',
            'session_id', v_session_record.id,
            'tutor_id', v_session_record.tutor_id,
            'tutee_id', v_session_record.tutee_id,
            'concept_id', v_session_record.concept_id,
            'tutor_delta', v_mastery_delta,
            'tutee_delta', v_mastery_delta,
            'tutor_new_mastery', COALESCE(
                (SELECT mastery_score FROM skill_mastery 
                 WHERE user_id = v_session_record.tutor_id 
                   AND skill_name = v_session_record.concept_id 
                 ORDER BY updated_at DESC LIMIT 1),
                v_mastery_delta
            ),
            'tutee_new_mastery', COALESCE(
                (SELECT mastery_score FROM skill_mastery 
                 WHERE user_id = v_session_record.tutee_id 
                   AND skill_name = v_session_record.concept_id 
                 ORDER BY updated_at DESC LIMIT 1),
                v_mastery_delta
            ),
            'timestamp', extract(epoch from NOW())
        )::text
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Execute dual mastery update on message insert
DROP TRIGGER IF EXISTS peer_session_dual_mastery_trigger ON peer_session_messages;
CREATE TRIGGER peer_session_dual_mastery_trigger
    AFTER INSERT ON peer_session_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_dual_mastery();

-- Function: Manual mastery adjustment for quality-based bonuses
-- Can be called at session end based on quality score
CREATE OR REPLACE FUNCTION apply_session_quality_bonus(
    p_session_id UUID,
    p_quality_multiplier NUMERIC DEFAULT 1.0
)
RETURNS JSON AS $$
DECLARE
    v_session RECORD;
    v_base_bonus NUMERIC := 0.05; -- 5% base bonus
    v_final_bonus NUMERIC;
    v_tutor_new_mastery NUMERIC;
    v_tutee_new_mastery NUMERIC;
BEGIN
    -- Get session
    SELECT * INTO v_session
    FROM peer_tutor_sessions
    WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Session not found');
    END IF;
    
    -- Calculate final bonus based on quality
    v_final_bonus := v_base_bonus * p_quality_multiplier;
    
    -- Apply to tutor
    UPDATE skill_mastery
    SET mastery_score = LEAST(1.0, mastery_score + v_final_bonus)
    WHERE user_id = v_session.tutor_id
      AND skill_name = v_session.concept_id
    RETURNING mastery_score INTO v_tutor_new_mastery;
    
    -- Apply to tutee
    UPDATE skill_mastery
    SET mastery_score = LEAST(1.0, mastery_score + v_final_bonus)
    WHERE user_id = v_session.tutee_id
      AND skill_name = v_session.concept_id
    RETURNING mastery_score INTO v_tutee_new_mastery;
    
    -- Return results
    RETURN json_build_object(
        'session_id', p_session_id,
        'quality_bonus', v_final_bonus,
        'tutor_new_mastery', v_tutor_new_mastery,
        'tutee_new_mastery', v_tutee_new_mastery
    );
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON FUNCTION update_dual_mastery IS 'Updates mastery for both tutor and tutee when tutee answers correctly after scaffolding. Emits real-time NOTIFY event.';
COMMENT ON FUNCTION apply_session_quality_bonus IS 'Applies quality-based mastery bonus at session end. Call with quality_multiplier from session_quality_score.';
COMMENT ON TRIGGER peer_session_dual_mastery_trigger ON peer_session_messages IS 'Triggered on message insert to update dual mastery when learning occurs';
