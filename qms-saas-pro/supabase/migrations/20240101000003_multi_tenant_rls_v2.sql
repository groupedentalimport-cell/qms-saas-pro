-- ============================================================================
-- QMS SaaS Pro - Multi-Tenant RLS v2
-- Replaces auth.user_org_ids() with user_belongs_to_org(), adds missing
-- organization_id columns, enables RLS on ALL tables, adds soft-delete columns
-- ============================================================================

-- ============================================================================
-- 1. Create user_belongs_to_org helper function (SECURITY DEFINER)
-- ============================================================================

CREATE OR REPLACE FUNCTION user_belongs_to_org(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = org_id
    AND om.user_id = auth.uid()
    AND om.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. Drop ALL existing RLS policies from v1 migration
--    (Policies must be dropped before we can reliably recreate them)
-- ============================================================================

-- Documents
DROP POLICY IF EXISTS "Users can view docs in their org" ON documents;
DROP POLICY IF EXISTS "Users can create docs in their org" ON documents;
DROP POLICY IF EXISTS "Users can update docs in their org" ON documents;
DROP POLICY IF EXISTS "Users can delete docs in their org" ON documents;

-- CAPAs
DROP POLICY IF EXISTS "Users can view capas in their org" ON capas;
DROP POLICY IF EXISTS "Users can create capas in their org" ON capas;
DROP POLICY IF EXISTS "Users can update capas in their org" ON capas;
DROP POLICY IF EXISTS "Users can delete capas in their org" ON capas;

-- Non-Conformances
DROP POLICY IF EXISTS "Users can view ncrs in their org" ON non_conformances;
DROP POLICY IF EXISTS "Users can create ncrs in their org" ON non_conformances;
DROP POLICY IF EXISTS "Users can update ncrs in their org" ON non_conformances;
DROP POLICY IF EXISTS "Users can delete ncrs in their org" ON non_conformances;

-- Audits
DROP POLICY IF EXISTS "Users can view audits in their org" ON audits;
DROP POLICY IF EXISTS "Users can create audits in their org" ON audits;
DROP POLICY IF EXISTS "Users can update audits in their org" ON audits;
DROP POLICY IF EXISTS "Users can delete audits in their org" ON audits;

-- Training
DROP POLICY IF EXISTS "Users can view training in their org" ON training;
DROP POLICY IF EXISTS "Users can create training in their org" ON training;
DROP POLICY IF EXISTS "Users can update training in their org" ON training;
DROP POLICY IF EXISTS "Users can delete training in their org" ON training;

-- Risks
DROP POLICY IF EXISTS "Users can view risks in their org" ON risks;
DROP POLICY IF EXISTS "Users can create risks in their org" ON risks;
DROP POLICY IF EXISTS "Users can update risks in their org" ON risks;
DROP POLICY IF EXISTS "Users can delete risks in their org" ON risks;

-- Batch Records
DROP POLICY IF EXISTS "Users can view batch records in their org" ON batch_records;
DROP POLICY IF EXISTS "Users can create batch records in their org" ON batch_records;
DROP POLICY IF EXISTS "Users can update batch records in their org" ON batch_records;
DROP POLICY IF EXISTS "Users can delete batch records in their org" ON batch_records;

-- Suppliers
DROP POLICY IF EXISTS "Users can view suppliers in their org" ON suppliers;
DROP POLICY IF EXISTS "Users can create suppliers in their org" ON suppliers;
DROP POLICY IF EXISTS "Users can update suppliers in their org" ON suppliers;
DROP POLICY IF EXISTS "Users can delete suppliers in their org" ON suppliers;

-- Form Templates
DROP POLICY IF EXISTS "Users can view form templates in their org" ON form_templates;
DROP POLICY IF EXISTS "Users can create form templates in their org" ON form_templates;
DROP POLICY IF EXISTS "Users can update form templates in their org" ON form_templates;

-- Form Instances
DROP POLICY IF EXISTS "Users can view form instances in their org" ON form_instances;
DROP POLICY IF EXISTS "Users can create form instances in their org" ON form_instances;
DROP POLICY IF EXISTS "Users can update form instances in their org" ON form_instances;

-- Audit Trails
DROP POLICY IF EXISTS "Users can view audit trails in their org" ON audit_trails;
DROP POLICY IF EXISTS "Users can create audit trail entries in their org" ON audit_trails;

-- Change Controls
DROP POLICY IF EXISTS "Users can view change controls in their org" ON change_controls;
DROP POLICY IF EXISTS "Users can create change controls in their org" ON change_controls;
DROP POLICY IF EXISTS "Users can update change controls in their org" ON change_controls;
DROP POLICY IF EXISTS "Users can delete change controls in their org" ON change_controls;

-- Deviations
DROP POLICY IF EXISTS "Users can view deviations in their org" ON deviations;
DROP POLICY IF EXISTS "Users can create deviations in their org" ON deviations;
DROP POLICY IF EXISTS "Users can update deviations in their org" ON deviations;
DROP POLICY IF EXISTS "Users can delete deviations in their org" ON deviations;

-- Document Prerequisites
DROP POLICY IF EXISTS "Users can view prerequisites in their org" ON document_prerequisites;
DROP POLICY IF EXISTS "Users can create prerequisites in their org" ON document_prerequisites;

-- Organization Members
DROP POLICY IF EXISTS "Users can view members in their org" ON organization_members;

-- Profiles (v1 had self-only policies)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- ============================================================================
-- 3. Add missing organization_id columns
-- ============================================================================

-- Profiles: add organization_id, populate from organization_members
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Populate existing profiles with their (first) active org membership
UPDATE profiles p
SET organization_id = om.organization_id
FROM organization_members om
WHERE p.id = om.user_id
  AND om.status = 'active'
  AND p.organization_id IS NULL;

-- Electronic Signatures: add organization_id, populate from document's org
ALTER TABLE electronic_signatures ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE electronic_signatures es
SET organization_id = d.organization_id
FROM documents d
WHERE es.document_id = d.id
  AND es.organization_id IS NULL;

-- Batch Steps: add organization_id, populate from batch_record's org
ALTER TABLE batch_steps ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE batch_steps bs
SET organization_id = br.organization_id
FROM batch_records br
WHERE bs.batch_record_id = br.id
  AND bs.organization_id IS NULL;

-- Create indexes for new organization_id columns
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_electronic_sigs_org ON electronic_signatures(organization_id);
CREATE INDEX IF NOT EXISTS idx_batch_steps_org ON batch_steps(organization_id);

-- ============================================================================
-- 4. Enable RLS on ALL tables (including those previously uncovered)
-- ============================================================================

-- Tables that already had RLS enabled in v1 (re-enable for safety / idempotent)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE capas ENABLE ROW LEVEL SECURITY;
ALTER TABLE non_conformances ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE training ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE deviations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Tables newly getting RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. Add is_deleted and deleted_at columns for soft-delete support
-- ============================================================================

-- Documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- CAPAs
ALTER TABLE capas ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE capas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Non-Conformances
ALTER TABLE non_conformances ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE non_conformances ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Batch Records
ALTER TABLE batch_records ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE batch_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Form Templates
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Form Instances
ALTER TABLE form_instances ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE form_instances ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Audits
ALTER TABLE audits ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Training
ALTER TABLE training ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE training ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Risks
ALTER TABLE risks ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE risks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Change Controls
ALTER TABLE change_controls ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE change_controls ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Deviations
ALTER TABLE deviations ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE deviations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================================================
-- 6. Create RLS policies using user_belongs_to_org()
-- ============================================================================

-- --------------------------------------------------------------------------
-- Documents
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view docs in their org"
  ON documents FOR SELECT
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

CREATE POLICY "Users can create docs in their org"
  ON documents FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update docs in their org"
  ON documents FOR UPDATE
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

-- DELETE is converted to soft delete; physical DELETE blocked via trigger

-- --------------------------------------------------------------------------
-- CAPAs
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view capas in their org"
  ON capas FOR SELECT
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

CREATE POLICY "Users can create capas in their org"
  ON capas FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update capas in their org"
  ON capas FOR UPDATE
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

-- --------------------------------------------------------------------------
-- Non-Conformances
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view ncrs in their org"
  ON non_conformances FOR SELECT
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

CREATE POLICY "Users can create ncrs in their org"
  ON non_conformances FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update ncrs in their org"
  ON non_conformances FOR UPDATE
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

-- --------------------------------------------------------------------------
-- Audits
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view audits in their org"
  ON audits FOR SELECT
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

CREATE POLICY "Users can create audits in their org"
  ON audits FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update audits in their org"
  ON audits FOR UPDATE
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

-- --------------------------------------------------------------------------
-- Training
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view training in their org"
  ON training FOR SELECT
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

CREATE POLICY "Users can create training in their org"
  ON training FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update training in their org"
  ON training FOR UPDATE
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

-- --------------------------------------------------------------------------
-- Risks
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view risks in their org"
  ON risks FOR SELECT
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

CREATE POLICY "Users can create risks in their org"
  ON risks FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update risks in their org"
  ON risks FOR UPDATE
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

-- --------------------------------------------------------------------------
-- Batch Records
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view batch records in their org"
  ON batch_records FOR SELECT
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

CREATE POLICY "Users can create batch records in their org"
  ON batch_records FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update batch records in their org"
  ON batch_records FOR UPDATE
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

-- --------------------------------------------------------------------------
-- Suppliers
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view suppliers in their org"
  ON suppliers FOR SELECT
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

CREATE POLICY "Users can create suppliers in their org"
  ON suppliers FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update suppliers in their org"
  ON suppliers FOR UPDATE
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

-- --------------------------------------------------------------------------
-- Form Templates
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view form templates in their org"
  ON form_templates FOR SELECT
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

CREATE POLICY "Users can create form templates in their org"
  ON form_templates FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update form templates in their org"
  ON form_templates FOR UPDATE
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

-- --------------------------------------------------------------------------
-- Form Instances
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view form instances in their org"
  ON form_instances FOR SELECT
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

CREATE POLICY "Users can create form instances in their org"
  ON form_instances FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update form instances in their org"
  ON form_instances FOR UPDATE
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

-- --------------------------------------------------------------------------
-- Audit Trails — SELECT and INSERT only; UPDATE and DELETE blocked
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view audit trails in their org"
  ON audit_trails FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can create audit trail entries in their org"
  ON audit_trails FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

-- No UPDATE or DELETE policies — audit_trails is append-only

-- --------------------------------------------------------------------------
-- Change Controls
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view change controls in their org"
  ON change_controls FOR SELECT
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

CREATE POLICY "Users can create change controls in their org"
  ON change_controls FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update change controls in their org"
  ON change_controls FOR UPDATE
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

-- --------------------------------------------------------------------------
-- Deviations
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view deviations in their org"
  ON deviations FOR SELECT
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

CREATE POLICY "Users can create deviations in their org"
  ON deviations FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update deviations in their org"
  ON deviations FOR UPDATE
  USING (user_belongs_to_org(organization_id) AND (is_deleted = FALSE));

-- --------------------------------------------------------------------------
-- Document Prerequisites
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view prerequisites in their org"
  ON document_prerequisites FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can create prerequisites in their org"
  ON document_prerequisites FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

-- --------------------------------------------------------------------------
-- Organization Members
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view members in their org"
  ON organization_members FOR SELECT
  USING (user_belongs_to_org(organization_id));

-- --------------------------------------------------------------------------
-- Organizations — users can view orgs they belong to
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view their own org"
  ON organizations FOR SELECT
  USING (user_belongs_to_org(id));

-- --------------------------------------------------------------------------
-- Profiles — org-scoped visibility; users can view profiles in their org
--           and can update their own profile
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view profiles in their org"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR user_belongs_to_org(organization_id)
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- --------------------------------------------------------------------------
-- Electronic Signatures — SELECT by org; INSERT by org; no UPDATE/DELETE
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view electronic signatures in their org"
  ON electronic_signatures FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can create electronic signatures in their org"
  ON electronic_signatures FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

-- No UPDATE or DELETE — electronic_signatures are immutable per 21 CFR Part 11

-- --------------------------------------------------------------------------
-- Batch Steps — SELECT, INSERT, UPDATE by org
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view batch steps in their org"
  ON batch_steps FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can create batch steps in their org"
  ON batch_steps FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update batch steps in their org"
  ON batch_steps FOR UPDATE
  USING (user_belongs_to_org(organization_id));
