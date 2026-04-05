-- Migration: 023_parent_verification_status.sql
-- Description: Adds verification_status to parent link tables and updates RLS for admin verification requirement.

-- 1. Update parent_student_links (Main table used by admin router)
DO $$ 
BEGIN 
    -- verification_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parent_student_links' AND column_name='verification_status') THEN
        ALTER TABLE public.parent_student_links ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'flagged'));
    END IF;
    
    -- verified_by_admin
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parent_student_links' AND column_name='verified_by_admin') THEN
        ALTER TABLE public.parent_student_links ADD COLUMN verified_by_admin BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- verified_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parent_student_links' AND column_name='verified_at') THEN
        ALTER TABLE public.parent_student_links ADD COLUMN verified_at TIMESTAMPTZ;
    END IF;
    
    -- verified_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parent_student_links' AND column_name='verified_by') THEN
        ALTER TABLE public.parent_student_links ADD COLUMN verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    -- verification_notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parent_student_links' AND column_name='verification_notes') THEN
        ALTER TABLE public.parent_student_links ADD COLUMN verification_notes TEXT;
    END IF;
END $$;

-- 2. Update parent_guardian table for consistency
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parent_guardian' AND column_name='verification_status') THEN
        ALTER TABLE public.parent_guardian ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected'));
        ALTER TABLE public.parent_guardian ADD COLUMN verified_by_admin BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE public.parent_guardian ADD COLUMN verified_at TIMESTAMPTZ;
        ALTER TABLE public.parent_guardian ADD COLUMN verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Update parent_student (from migration 022) for consistency
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='parent_student') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parent_student' AND column_name='verification_status') THEN
            ALTER TABLE public.parent_student ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'pending';
            ALTER TABLE public.parent_student ADD COLUMN verified_by_admin BOOLEAN NOT NULL DEFAULT false;
        END IF;
    END IF;
END $$;

-- 4. Update RLS Policies to enforce admin-verified links for portal access
-- First, drop existing policies to recreate them with flags
DROP POLICY IF EXISTS "Parents can view linked codes" ON public.parent_student_links;
DROP POLICY IF EXISTS "parents_see_child_progress" ON public.progress;

-- 4.1 Update parent_student_links policy: Parents can see their own links always (to see status), 
-- but only students can see code details until linked.
CREATE POLICY "Parents can view own links only" ON public.parent_student_links
    FOR SELECT USING (auth.uid() = parent_id OR (status = 'pending' AND auth.uid() IS NOT NULL));

-- 4.2 Restrictive Access: Parents can ONLY view child progress if the link is verified_by_admin = true
CREATE POLICY "Parents can see verified child progress" ON public.progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_student_links psl
            WHERE psl.parent_id = auth.uid()
            AND psl.student_id = progress.user_id
            AND psl.verified_by_admin = true
        )
        OR
        EXISTS (
            SELECT 1 FROM parent_guardian pg
            WHERE pg.parent_user_id = auth.uid()
            AND pg.student_user_id = progress.user_id
            AND pg.verified_by_admin = true
        )
    );

-- 4.3 Same for submissions
DROP POLICY IF EXISTS "parents_see_child_submissions" ON public.submissions;
CREATE POLICY "Parents can see verified child submissions" ON public.submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_student_links psl
            WHERE psl.parent_id = auth.uid()
            AND psl.student_id = submissions.user_id
            AND psl.verified_by_admin = true
        )
    );

-- 4.4 Ensure only admins can verify links via RLS (even if the API handles it, RLS is the final gate)
ALTER TABLE public.parent_student_links FORCE ROW LEVEL SECURITY;
CREATE POLICY "Admins can update verification status" ON public.parent_student_links
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
    );
