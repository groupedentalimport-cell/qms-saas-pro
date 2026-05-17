-- QMS SaaS Pro - RLS Policies and Helper Functions
-- Row-Level Security for multi-tenant isolation

-- Enable RLS on all tenant-scoped tables
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

-- ============================================================================
-- Helper function: get current user's organization IDs
-- ============================================================================

CREATE OR REPLACE FUNCTION auth.user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid() AND status = 'active';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- Documents policies
-- ============================================================================

CREATE POLICY "Users can view docs in their org"
  ON documents FOR SELECT
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can create docs in their org"
  ON documents FOR INSERT
  WITH CHECK (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can update docs in their org"
  ON documents FOR UPDATE
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can delete docs in their org"
  ON documents FOR DELETE
  USING (organization_id IN (SELECT auth.user_org_ids()));

-- ============================================================================
-- CAPAs policies
-- ============================================================================

CREATE POLICY "Users can view capas in their org"
  ON capas FOR SELECT
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can create capas in their org"
  ON capas FOR INSERT
  WITH CHECK (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can update capas in their org"
  ON capas FOR UPDATE
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can delete capas in their org"
  ON capas FOR DELETE
  USING (organization_id IN (SELECT auth.user_org_ids()));

-- ============================================================================
-- NCRs policies
-- ============================================================================

CREATE POLICY "Users can view ncrs in their org"
  ON non_conformances FOR SELECT
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can create ncrs in their org"
  ON non_conformances FOR INSERT
  WITH CHECK (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can update ncrs in their org"
  ON non_conformances FOR UPDATE
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can delete ncrs in their org"
  ON non_conformances FOR DELETE
  USING (organization_id IN (SELECT auth.user_org_ids()));

-- ============================================================================
-- Audits policies
-- ============================================================================

CREATE POLICY "Users can view audits in their org"
  ON audits FOR SELECT
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can create audits in their org"
  ON audits FOR INSERT
  WITH CHECK (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can update audits in their org"
  ON audits FOR UPDATE
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can delete audits in their org"
  ON audits FOR DELETE
  USING (organization_id IN (SELECT auth.user_org_ids()));

-- ============================================================================
-- Training policies
-- ============================================================================

CREATE POLICY "Users can view training in their org"
  ON training FOR SELECT
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can create training in their org"
  ON training FOR INSERT
  WITH CHECK (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can update training in their org"
  ON training FOR UPDATE
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can delete training in their org"
  ON training FOR DELETE
  USING (organization_id IN (SELECT auth.user_org_ids()));

-- ============================================================================
-- Risks policies
-- ============================================================================

CREATE POLICY "Users can view risks in their org"
  ON risks FOR SELECT
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can create risks in their org"
  ON risks FOR INSERT
  WITH CHECK (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can update risks in their org"
  ON risks FOR UPDATE
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can delete risks in their org"
  ON risks FOR DELETE
  USING (organization_id IN (SELECT auth.user_org_ids()));

-- ============================================================================
-- Batch Records policies
-- ============================================================================

CREATE POLICY "Users can view batch records in their org"
  ON batch_records FOR SELECT
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can create batch records in their org"
  ON batch_records FOR INSERT
  WITH CHECK (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can update batch records in their org"
  ON batch_records FOR UPDATE
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can delete batch records in their org"
  ON batch_records FOR DELETE
  USING (organization_id IN (SELECT auth.user_org_ids()));

-- ============================================================================
-- Suppliers policies
-- ============================================================================

CREATE POLICY "Users can view suppliers in their org"
  ON suppliers FOR SELECT
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can create suppliers in their org"
  ON suppliers FOR INSERT
  WITH CHECK (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can update suppliers in their org"
  ON suppliers FOR UPDATE
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can delete suppliers in their org"
  ON suppliers FOR DELETE
  USING (organization_id IN (SELECT auth.user_org_ids()));

-- ============================================================================
-- Form Templates policies
-- ============================================================================

CREATE POLICY "Users can view form templates in their org"
  ON form_templates FOR SELECT
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can create form templates in their org"
  ON form_templates FOR INSERT
  WITH CHECK (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can update form templates in their org"
  ON form_templates FOR UPDATE
  USING (organization_id IN (SELECT auth.user_org_ids()));

-- ============================================================================
-- Form Instances policies
-- ============================================================================

CREATE POLICY "Users can view form instances in their org"
  ON form_instances FOR SELECT
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can create form instances in their org"
  ON form_instances FOR INSERT
  WITH CHECK (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can update form instances in their org"
  ON form_instances FOR UPDATE
  USING (organization_id IN (SELECT auth.user_org_ids()));

-- ============================================================================
-- Audit Trail policies
-- ============================================================================

CREATE POLICY "Users can view audit trails in their org"
  ON audit_trails FOR SELECT
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can create audit trail entries in their org"
  ON audit_trails FOR INSERT
  WITH CHECK (organization_id IN (SELECT auth.user_org_ids()));

-- ============================================================================
-- Change Controls policies
-- ============================================================================

CREATE POLICY "Users can view change controls in their org"
  ON change_controls FOR SELECT
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can create change controls in their org"
  ON change_controls FOR INSERT
  WITH CHECK (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can update change controls in their org"
  ON change_controls FOR UPDATE
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can delete change controls in their org"
  ON change_controls FOR DELETE
  USING (organization_id IN (SELECT auth.user_org_ids()));

-- ============================================================================
-- Deviations policies
-- ============================================================================

CREATE POLICY "Users can view deviations in their org"
  ON deviations FOR SELECT
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can create deviations in their org"
  ON deviations FOR INSERT
  WITH CHECK (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can update deviations in their org"
  ON deviations FOR UPDATE
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can delete deviations in their org"
  ON deviations FOR DELETE
  USING (organization_id IN (SELECT auth.user_org_ids()));

-- ============================================================================
-- Document Prerequisites policies
-- ============================================================================

CREATE POLICY "Users can view prerequisites in their org"
  ON document_prerequisites FOR SELECT
  USING (organization_id IN (SELECT auth.user_org_ids()));

CREATE POLICY "Users can create prerequisites in their org"
  ON document_prerequisites FOR INSERT
  WITH CHECK (organization_id IN (SELECT auth.user_org_ids()));

-- ============================================================================
-- Organization Members policies
-- ============================================================================

CREATE POLICY "Users can view members in their org"
  ON organization_members FOR SELECT
  USING (organization_id IN (SELECT auth.user_org_ids()));

-- ============================================================================
-- Profiles — users can view their own profile
-- ============================================================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());
