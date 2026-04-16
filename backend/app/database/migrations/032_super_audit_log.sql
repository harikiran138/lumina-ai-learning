-- Migration 032: Non-deletable super_admin audit log
-- Lumina AI LMS — Section I2
-- Append-only log; no UPDATE or DELETE policies intentionally.

CREATE TABLE IF NOT EXISTS super_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,   -- NO FK — this log must survive even if the user is deleted
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE super_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super_admin can read; nobody can UPDATE or DELETE (policies omitted intentionally)
DROP POLICY IF EXISTS "Super admin can read audit log" ON super_audit_log;
CREATE POLICY "Super admin can read audit log" ON super_audit_log
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('super_admin', 'system_admin')
  );

-- INSERT is done server-side via service_role (bypasses RLS — no INSERT policy needed)
-- UPDATE policy deliberately omitted → blocked
-- DELETE policy deliberately omitted → blocked

CREATE INDEX IF NOT EXISTS idx_super_audit_log_user_time
  ON super_audit_log (user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_super_audit_log_entity
  ON super_audit_log (entity_type, entity_id, timestamp DESC);
