-- Counselor System Migration
-- Tables for Psychologically-Aware Safeguarding

-- 1. Risk Alerts Table (Anonymized)
CREATE TABLE IF NOT EXISTS risk_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id),
    anonymized_name TEXT NOT NULL, -- e.g., "Subject-Alpha-42"
    signal_type TEXT NOT NULL,    -- e.g., "Self-Harm Indicators", "Severe Anxiety"
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    metadata JSONB DEFAULT '{}',
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Reveal Audit Logs (Deanonymization tracking)
CREATE TABLE IF NOT EXISTS reveal_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES risk_alerts(id),
    counselor_id UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Encrypted Intervention Notes
-- These stay encrypted on the server; only decrypted in the browser with the counselor's key.
CREATE TABLE IF NOT EXISTS intervention_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id),
    counselor_id UUID NOT NULL REFERENCES users(id),
    encrypted_blob TEXT NOT NULL, -- Base64
    iv TEXT NOT NULL,             -- Base64
    auth_tag TEXT NOT NULL,       -- Base64
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Safeguarding)
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reveal_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_notes ENABLE ROW LEVEL SECURITY;

-- Only Counselor role can access these tables
CREATE POLICY counselor_access_alerts ON risk_alerts FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'counselor'));

CREATE POLICY counselor_access_notes ON intervention_notes FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'counselor'));
