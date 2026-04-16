-- Migration: 003_attendance_audit_system.sql
-- Description: Implements immutable audit logging for attendance changes with triggers.

-- 1. Create the Audit Log Table
CREATE TABLE IF NOT EXISTS public.attendance_audit_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id     UUID,
  student_id        UUID,
  course_id         UUID,
  old_status        BOOLEAN,
  new_status        BOOLEAN,
  changed_by        UUID, -- References auth.users(id) conceptually
  change_type       TEXT NOT NULL, -- INSERT | UPDATE | DELETE
  reason            TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexing for High-Performance Audit Queries
CREATE INDEX IF NOT EXISTS idx_attendance_audit_student ON public.attendance_audit_log(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_audit_course ON public.attendance_audit_log(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_audit_created ON public.attendance_audit_log(created_at);

-- 3. Trigger Function for Immutable Logging
CREATE OR REPLACE FUNCTION public.log_attendance_change()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Try to capture the authenticated user ID from Supabase context
    BEGIN
        current_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
    END;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.attendance_audit_log (
            attendance_id, student_id, course_id, old_status, new_status, 
            changed_by, change_type
        ) VALUES (
            NEW.id, NEW.student_id, NEW.course_id, NULL, NEW.is_present,
            current_user_id, 'INSERT'
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.is_present IS DISTINCT FROM NEW.is_present) THEN
            INSERT INTO public.attendance_audit_log (
                attendance_id, student_id, course_id, old_status, new_status, 
                changed_by, change_type
            ) VALUES (
                OLD.id, OLD.student_id, OLD.course_id, OLD.is_present, NEW.is_present,
                current_user_id, 'UPDATE'
            );
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.attendance_audit_log (
            attendance_id, student_id, course_id, old_status, new_status, 
            changed_by, change_type
        ) VALUES (
            OLD.id, OLD.student_id, OLD.course_id, OLD.is_present, NULL,
            current_user_id, 'DELETE'
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply Trigger to Attendance Table
DROP TRIGGER IF EXISTS trg_log_attendance_change ON public.attendance;
CREATE TRIGGER trg_log_attendance_change
AFTER INSERT OR UPDATE OR DELETE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.log_attendance_change();

-- 5. Security Posture: Row Level Security
ALTER TABLE public.attendance_audit_log ENABLE ROW LEVEL SECURITY;

-- Only Admins and HODs can view the audit trail
DROP POLICY IF EXISTS admin_view_audit_log ON public.attendance_audit_log;
CREATE POLICY admin_view_audit_log ON public.attendance_audit_log
FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('super_admin', 'institution_admin', 'hod')
);

-- Deny all modifications to the audit log (Immutability)
DROP POLICY IF EXISTS immutable_audit_log ON public.attendance_audit_log;
CREATE POLICY immutable_audit_log ON public.attendance_audit_log
FOR ALL USING (false) WITH CHECK (false);
