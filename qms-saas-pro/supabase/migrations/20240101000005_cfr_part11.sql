-- ============================================================================
-- QMS SaaS Pro - CFR Part 11 Compliance
-- Makes electronic_signatures immutable, adds CFR Part 11 columns,
-- and creates signed_records table for tracking locked/signed records.
-- ============================================================================

-- ============================================================================
-- 1. Make electronic_signatures strictly immutable (no UPDATE, no DELETE)
--    Per 21 CFR Part 11, electronic signatures and records must not be
--    alterable after creation.
-- ============================================================================

-- Block UPDATE on electronic_signatures
CREATE POLICY "No update on electronic_signatures" ON electronic_signatures
  FOR UPDATE USING (FALSE);

-- Block DELETE on electronic_signatures
CREATE POLICY "No delete on electronic_signatures" ON electronic_signatures
  FOR DELETE USING (FALSE);

-- ============================================================================
-- 2. Add CFR Part 11 compliance columns to electronic_signatures
-- ============================================================================

-- Meaning of the signature (e.g., "I approve this document", "I verify this batch step")
ALTER TABLE electronic_signatures ADD COLUMN IF NOT EXISTS meaning_of_signature TEXT;

-- Whether the signer was re-authenticated at the time of signing
ALTER TABLE electronic_signatures ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- IP address at the time of signing for audit trail
ALTER TABLE electronic_signatures ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Session identifier for audit linkage
ALTER TABLE electronic_signatures ADD COLUMN IF NOT EXISTS session_id TEXT;

-- ============================================================================
-- 3. Create signed_records table
--    Tracks which records are locked after signing, providing an immutable
--    link between a signature and the record it authorizes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS signed_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID NOT NULL,
  record_type TEXT NOT NULL,
  signature_id UUID NOT NULL REFERENCES electronic_signatures(id),
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID REFERENCES organizations(id),
  UNIQUE(record_id, record_type)
);

-- Enable RLS on signed_records
ALTER TABLE signed_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for signed_records
CREATE POLICY "Users can view signed records in their org"
  ON signed_records FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can create signed records in their org"
  ON signed_records FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

-- No UPDATE or DELETE — signed records are immutable once created
CREATE POLICY "No update on signed_records" ON signed_records
  FOR UPDATE USING (FALSE);

CREATE POLICY "No delete on signed_records" ON signed_records
  FOR DELETE USING (FALSE);

-- Indexes for signed_records
CREATE INDEX IF NOT EXISTS idx_signed_records_record ON signed_records(record_id, record_type);
CREATE INDEX IF NOT EXISTS idx_signed_records_signature ON signed_records(signature_id);
CREATE INDEX IF NOT EXISTS idx_signed_records_org ON signed_records(organization_id);

-- ============================================================================
-- 4. Prevent DELETE on signed_records via trigger (defense in depth)
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_delete_signed_records_func()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Physical DELETE is not allowed on signed_records. Signed records are immutable per 21 CFR Part 11.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_delete_signed_records ON signed_records;
CREATE TRIGGER prevent_delete_signed_records
  BEFORE DELETE ON signed_records
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_signed_records_func();

-- ============================================================================
-- 5. Add audit trigger for signed_records (INSERT only — no UPDATE/DELETE)
-- ============================================================================

DROP TRIGGER IF EXISTS audit_insert_signed_records ON signed_records;
CREATE TRIGGER audit_insert_signed_records
  AFTER INSERT ON signed_records
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
