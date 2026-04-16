-- Migration 033: Grade locking — approved grades are immutable unless unlocked by supervisor/HOD
-- Lumina AI LMS — Section E3

ALTER TABLE submission_scorecards
  ADD COLUMN IF NOT EXISTS grade_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

-- Locked grades can only be changed by supervisors, HODs, or admins
DROP POLICY IF EXISTS "Locked grades can only be changed by supervisors" ON submission_scorecards;
CREATE POLICY "Locked grades can only be changed by supervisors" ON submission_scorecards
  FOR UPDATE
  USING (
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
    AND (
      grade_locked = false   -- unlocked: any authorized teacher can edit
      OR (SELECT role FROM users WHERE id = auth.uid())
          IN ('supervisor', 'hod', 'admin', 'college_admin', 'institution_admin',
              'system_admin', 'super_admin')
    )
  );

-- Index for finding unlocked/locked scorecards efficiently
CREATE INDEX IF NOT EXISTS idx_scorecards_locked
  ON submission_scorecards (course_id, grade_locked)
  WHERE grade_locked = true;
