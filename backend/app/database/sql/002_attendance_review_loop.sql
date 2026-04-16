-- Migration: 002_attendance_review_loop.sql
-- Description: Creates the attendance_override_requests table for Counselor oversight.

CREATE TABLE IF NOT EXISTS public.attendance_override_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id    UUID NOT NULL, -- Logical scoping
  counselor_id      UUID REFERENCES auth.users(id),
  student_id        UUID REFERENCES auth.users(id),
  original_status   TEXT,
  requested_status  TEXT,
  reason            TEXT NOT NULL,
  hod_id            UUID REFERENCES auth.users(id),
  status            TEXT DEFAULT 'PENDING', -- PENDING | APPROVED | REJECTED
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.attendance_override_requests ENABLE ROW LEVEL SECURITY;

-- RLS: Counselor can see their own requests
CREATE POLICY counselor_view_own_requests ON public.attendance_override_requests
FOR SELECT USING (counselor_id = auth.uid());

-- RLS: HOD can see requests in their institution (simplified, ideally scoped by department)
CREATE POLICY hod_view_institution_requests ON public.attendance_override_requests
FOR SELECT USING (
  institution_id::text = auth.jwt() ->> 'institution_id'
  AND auth.jwt() ->> 'role' IN ('hod', 'institution_admin')
);

-- RLS: Counselor can insert requests
CREATE POLICY counselor_insert_requests ON public.attendance_override_requests
FOR INSERT WITH CHECK (
  auth.jwt() ->> 'role' = 'counselor'
  AND counselor_id = auth.uid()
);

-- RLS: HOD can update (approve/reject) requests
CREATE POLICY hod_update_requests ON public.attendance_override_requests
FOR UPDATE USING (
  institution_id::text = auth.jwt() ->> 'institution_id'
  AND auth.jwt() ->> 'role' IN ('hod', 'institution_admin')
);
