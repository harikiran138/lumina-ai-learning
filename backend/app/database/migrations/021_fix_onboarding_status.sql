-- Migration 021_fix_onboarding_status.sql
-- Description: Adds missing status columns to fix student onboarding redirect loop.

-- 1. Add status column to learner_profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'learner_profiles' AND COLUMN_NAME = 'status') THEN
        ALTER TABLE PUBLIC.learner_profiles ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
END $$;

-- 2. Add onboarding_completed column to users if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'onboarding_completed') THEN
        ALTER TABLE PUBLIC.users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Backfill: Mark users as completed if they have reached the final step and have a learner profile
UPDATE PUBLIC.users 
SET onboarding_completed = TRUE 
WHERE onboarding_step >= 5 
AND id IN (SELECT user_id FROM PUBLIC.learner_profiles);

-- 4. Update existing learner_profiles to 'completed' status where applicable
UPDATE PUBLIC.learner_profiles
SET status = 'completed'
WHERE user_id IN (SELECT user_id FROM PUBLIC.onboarding_sessions WHERE status = 'completed');
