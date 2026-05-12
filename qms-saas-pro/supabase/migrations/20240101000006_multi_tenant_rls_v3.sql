-- ============================================================================
-- QMS SaaS Pro - Multi-Tenant RLS v3 & Immutable Audit Trail
-- ============================================================================
-- This migration:
--   1. Creates/replaces user_belongs_to_org() helper function
--   2. Ensures ALL business tables have organization_id column
--   3. Enables RLS on all business tables
--   4. Replaces v2 RLS policies with v3 CRUD policies including admin-only DELETE
--   5. Creates per-table immutable audit trail triggers (INSERT, UPDATE, DELETE)
--   6. Makes audit_trail truly immutable via trigger-level protection
--
-- Idempotent: uses CREATE OR REPLACE, DROP IF EXISTS, ADD COLUMN IF NOT EXISTS
-- Does NOT drop/recreate policies from earlier migrations blindly — drops by name
-- and recreates with the updated v3 pattern.
-- ============================================================================

-- ============================================================================
-- 1. Create / replace the user_belongs_to_org() helper function
--    (SECURITY DEFINER so it runs with the function owner's privileges,
--     allowing RLS policies to use it without exposing internal table structure)
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
-- 2. Ensure ALL business tables have organization_id column
--    (Uses ADD COLUMN IF NOT EXISTS for idempotency. Most tables already have
--     this from the initial schema or v2 migration, but this guarantees it.)
-- ============================================================================

ALTER TABLE documents ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE capas ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE non_conformances ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE audits ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE risks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE training ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE batch_records ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE change_controls ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE deviations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE form_instances ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE electronic_signatures ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE document_prerequisites ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- ============================================================================
-- 3. Enable RLS on all business tables
--    (Idempotent — running ENABLE ROW LEVEL SECURITY on a table that already
--     has it enabled is a no-op.)
-- ============================================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE capas ENABLE ROW LEVEL SECURITY;
ALTER TABLE non_conformances ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE training ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE deviations ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_prerequisites ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Replace v2 RLS policies with v3 CRUD policies
--    Pattern per table:
--      SELECT  — users can see their org's data
--      INSERT  — users can insert into their org
--      UPDATE  — users can update their org's data
--      DELETE  — only org admins (owner/admin role) can delete
-- ============================================================================

-- --------------------------------------------------------------------------
-- 4a. Drop ALL existing v2 RLS policies
--     (v2 policy names are listed here; we drop before recreating to avoid
--      conflicts. We also drop v1 policy names in case v2 drop was skipped.)
-- --------------------------------------------------------------------------

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

-- Document Prerequisites
DROP POLICY IF EXISTS "Users can view prerequisites in their org" ON document_prerequisites;
DROP POLICY IF EXISTS "Users can create prerequisites in their org" ON document_prerequisites;

-- Electronic Signatures
DROP POLICY IF EXISTS "Users can view electronic signatures in their org" ON electronic_signatures;
DROP POLICY IF EXISTS "Users can create electronic signatures in their org" ON electronic_signatures;
DROP POLICY IF EXISTS "No update on electronic_signatures" ON electronic_signatures;
DROP POLICY IF EXISTS "No delete on electronic_signatures" ON electronic_signatures;

-- Audit Trails — keep existing immutability policies, will re-create below
DROP POLICY IF EXISTS "Users can view audit trails in their org" ON audit_trails;
DROP POLICY IF EXISTS "Users can create audit trail entries in their org" ON audit_trails;
DROP POLICY IF EXISTS "No delete on audit_trails" ON audit_trails;
DROP POLICY IF EXISTS "No update on audit_trails" ON audit_trails;

-- --------------------------------------------------------------------------
-- 4b. Create v3 RLS policies — documents
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own org documents"
  ON documents FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert own org documents"
  ON documents FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update own org documents"
  ON documents FOR UPDATE
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Org admins can delete own org documents"
  ON documents FOR DELETE
  USING (user_belongs_to_org(organization_id) AND
         EXISTS (SELECT 1 FROM organization_members om
                 WHERE om.organization_id = documents.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner', 'admin')));

-- --------------------------------------------------------------------------
-- 4c. Create v3 RLS policies — capas
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own org capas"
  ON capas FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert own org capas"
  ON capas FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update own org capas"
  ON capas FOR UPDATE
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Org admins can delete own org capas"
  ON capas FOR DELETE
  USING (user_belongs_to_org(organization_id) AND
         EXISTS (SELECT 1 FROM organization_members om
                 WHERE om.organization_id = capas.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner', 'admin')));

-- --------------------------------------------------------------------------
-- 4d. Create v3 RLS policies — non_conformances
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own org non_conformances"
  ON non_conformances FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert own org non_conformances"
  ON non_conformances FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update own org non_conformances"
  ON non_conformances FOR UPDATE
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Org admins can delete own org non_conformances"
  ON non_conformances FOR DELETE
  USING (user_belongs_to_org(organization_id) AND
         EXISTS (SELECT 1 FROM organization_members om
                 WHERE om.organization_id = non_conformances.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner', 'admin')));

-- --------------------------------------------------------------------------
-- 4e. Create v3 RLS policies — audits
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own org audits"
  ON audits FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert own org audits"
  ON audits FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update own org audits"
  ON audits FOR UPDATE
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Org admins can delete own org audits"
  ON audits FOR DELETE
  USING (user_belongs_to_org(organization_id) AND
         EXISTS (SELECT 1 FROM organization_members om
                 WHERE om.organization_id = audits.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner', 'admin')));

-- --------------------------------------------------------------------------
-- 4f. Create v3 RLS policies — risks
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own org risks"
  ON risks FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert own org risks"
  ON risks FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update own org risks"
  ON risks FOR UPDATE
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Org admins can delete own org risks"
  ON risks FOR DELETE
  USING (user_belongs_to_org(organization_id) AND
         EXISTS (SELECT 1 FROM organization_members om
                 WHERE om.organization_id = risks.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner', 'admin')));

-- --------------------------------------------------------------------------
-- 4g. Create v3 RLS policies — training
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own org training"
  ON training FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert own org training"
  ON training FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update own org training"
  ON training FOR UPDATE
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Org admins can delete own org training"
  ON training FOR DELETE
  USING (user_belongs_to_org(organization_id) AND
         EXISTS (SELECT 1 FROM organization_members om
                 WHERE om.organization_id = training.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner', 'admin')));

-- --------------------------------------------------------------------------
-- 4h. Create v3 RLS policies — batch_records
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own org batch_records"
  ON batch_records FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert own org batch_records"
  ON batch_records FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update own org batch_records"
  ON batch_records FOR UPDATE
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Org admins can delete own org batch_records"
  ON batch_records FOR DELETE
  USING (user_belongs_to_org(organization_id) AND
         EXISTS (SELECT 1 FROM organization_members om
                 WHERE om.organization_id = batch_records.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner', 'admin')));

-- --------------------------------------------------------------------------
-- 4i. Create v3 RLS policies — suppliers
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own org suppliers"
  ON suppliers FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert own org suppliers"
  ON suppliers FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update own org suppliers"
  ON suppliers FOR UPDATE
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Org admins can delete own org suppliers"
  ON suppliers FOR DELETE
  USING (user_belongs_to_org(organization_id) AND
         EXISTS (SELECT 1 FROM organization_members om
                 WHERE om.organization_id = suppliers.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner', 'admin')));

-- --------------------------------------------------------------------------
-- 4j. Create v3 RLS policies — change_controls
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own org change_controls"
  ON change_controls FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert own org change_controls"
  ON change_controls FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update own org change_controls"
  ON change_controls FOR UPDATE
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Org admins can delete own org change_controls"
  ON change_controls FOR DELETE
  USING (user_belongs_to_org(organization_id) AND
         EXISTS (SELECT 1 FROM organization_members om
                 WHERE om.organization_id = change_controls.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner', 'admin')));

-- --------------------------------------------------------------------------
-- 4k. Create v3 RLS policies — deviations
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own org deviations"
  ON deviations FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert own org deviations"
  ON deviations FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update own org deviations"
  ON deviations FOR UPDATE
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Org admins can delete own org deviations"
  ON deviations FOR DELETE
  USING (user_belongs_to_org(organization_id) AND
         EXISTS (SELECT 1 FROM organization_members om
                 WHERE om.organization_id = deviations.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner', 'admin')));

-- --------------------------------------------------------------------------
-- 4l. Create v3 RLS policies — form_templates
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own org form_templates"
  ON form_templates FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert own org form_templates"
  ON form_templates FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update own org form_templates"
  ON form_templates FOR UPDATE
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Org admins can delete own org form_templates"
  ON form_templates FOR DELETE
  USING (user_belongs_to_org(organization_id) AND
         EXISTS (SELECT 1 FROM organization_members om
                 WHERE om.organization_id = form_templates.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner', 'admin')));

-- --------------------------------------------------------------------------
-- 4m. Create v3 RLS policies — form_instances
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own org form_instances"
  ON form_instances FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert own org form_instances"
  ON form_instances FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update own org form_instances"
  ON form_instances FOR UPDATE
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Org admins can delete own org form_instances"
  ON form_instances FOR DELETE
  USING (user_belongs_to_org(organization_id) AND
         EXISTS (SELECT 1 FROM organization_members om
                 WHERE om.organization_id = form_instances.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner', 'admin')));

-- --------------------------------------------------------------------------
-- 4n. Create v3 RLS policies — electronic_signatures
--     Per 21 CFR Part 11, e-signatures are immutable after creation.
--     SELECT/INSERT only for regular users; UPDATE blocked; DELETE for admins.
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own org electronic_signatures"
  ON electronic_signatures FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert own org electronic_signatures"
  ON electronic_signatures FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

-- Block UPDATE entirely — electronic signatures must never be modified
CREATE POLICY "No update on electronic_signatures"
  ON electronic_signatures FOR UPDATE
  USING (FALSE);

-- Only org admins can delete (e.g., for data cleanup in exceptional cases)
CREATE POLICY "Org admins can delete own org electronic_signatures"
  ON electronic_signatures FOR DELETE
  USING (user_belongs_to_org(organization_id) AND
         EXISTS (SELECT 1 FROM organization_members om
                 WHERE om.organization_id = electronic_signatures.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner', 'admin')));

-- --------------------------------------------------------------------------
-- 4o. Create v3 RLS policies — document_prerequisites
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own org document_prerequisites"
  ON document_prerequisites FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert own org document_prerequisites"
  ON document_prerequisites FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

CREATE POLICY "Users can update own org document_prerequisites"
  ON document_prerequisites FOR UPDATE
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Org admins can delete own org document_prerequisites"
  ON document_prerequisites FOR DELETE
  USING (user_belongs_to_org(organization_id) AND
         EXISTS (SELECT 1 FROM organization_members om
                 WHERE om.organization_id = document_prerequisites.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner', 'admin')));

-- --------------------------------------------------------------------------
-- 4p. Re-create audit_trails policies (append-only: SELECT + INSERT only)
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own org audit_trails"
  ON audit_trails FOR SELECT
  USING (user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert own org audit_trails"
  ON audit_trails FOR INSERT
  WITH CHECK (user_belongs_to_org(organization_id));

-- Block UPDATE — audit trail records must never be modified
CREATE POLICY "No update on audit_trails"
  ON audit_trails FOR UPDATE
  USING (FALSE);

-- Block DELETE — audit trail records must never be removed
CREATE POLICY "No delete on audit_trails"
  ON audit_trails FOR DELETE
  USING (FALSE);

-- ============================================================================
-- 5. Create per-table immutable audit trail triggers
--    For each business table, we create three trigger functions:
--      - audit_{table}_insert() — AFTER INSERT, logs CREATE action
--      - audit_{table}_update() — AFTER UPDATE, logs UPDATE action with old/new values
--      - audit_{table}_delete() — BEFORE DELETE, logs DELETE action then allows it
--
--    These replace the generic audit_trigger_func() and prevent_delete_func()
--    triggers from migration v4, providing per-table control and clarity.
--    The generic audit_trigger_func() is retained for use by other tables
--    (e.g., signed_records from migration v5).
-- ============================================================================

-- --------------------------------------------------------------------------
-- 5a. Drop existing v4 audit and prevent_delete triggers
--     (These are replaced by the new per-table triggers below.)
-- --------------------------------------------------------------------------

-- Documents
DROP TRIGGER IF EXISTS prevent_delete_documents ON documents;
DROP TRIGGER IF EXISTS audit_insert_documents ON documents;
DROP TRIGGER IF EXISTS audit_update_documents ON documents;

-- CAPAs
DROP TRIGGER IF EXISTS prevent_delete_capas ON capas;
DROP TRIGGER IF EXISTS audit_insert_capas ON capas;
DROP TRIGGER IF EXISTS audit_update_capas ON capas;

-- Non-Conformances
DROP TRIGGER IF EXISTS prevent_delete_non_conformances ON non_conformances;
DROP TRIGGER IF EXISTS audit_insert_non_conformances ON non_conformances;
DROP TRIGGER IF EXISTS audit_update_non_conformances ON non_conformances;

-- Batch Records
DROP TRIGGER IF EXISTS prevent_delete_batch_records ON batch_records;
DROP TRIGGER IF EXISTS audit_insert_batch_records ON batch_records;
DROP TRIGGER IF EXISTS audit_update_batch_records ON batch_records;

-- Suppliers
DROP TRIGGER IF EXISTS prevent_delete_suppliers ON suppliers;
DROP TRIGGER IF EXISTS audit_insert_suppliers ON suppliers;
DROP TRIGGER IF EXISTS audit_update_suppliers ON suppliers;

-- Form Templates
DROP TRIGGER IF EXISTS prevent_delete_form_templates ON form_templates;

-- Form Instances
DROP TRIGGER IF EXISTS prevent_delete_form_instances ON form_instances;
DROP TRIGGER IF EXISTS audit_insert_form_instances ON form_instances;
DROP TRIGGER IF EXISTS audit_update_form_instances ON form_instances;

-- Audits
DROP TRIGGER IF EXISTS prevent_delete_audits ON audits;
DROP TRIGGER IF EXISTS audit_insert_audits ON audits;
DROP TRIGGER IF EXISTS audit_update_audits ON audits;

-- Training
DROP TRIGGER IF EXISTS prevent_delete_training ON training;
DROP TRIGGER IF EXISTS audit_insert_training ON training;
DROP TRIGGER IF EXISTS audit_update_training ON training;

-- Risks
DROP TRIGGER IF EXISTS prevent_delete_risks ON risks;
DROP TRIGGER IF EXISTS audit_insert_risks ON risks;
DROP TRIGGER IF EXISTS audit_update_risks ON risks;

-- Change Controls
DROP TRIGGER IF EXISTS prevent_delete_change_controls ON change_controls;
DROP TRIGGER IF EXISTS audit_insert_change_controls ON change_controls;
DROP TRIGGER IF EXISTS audit_update_change_controls ON change_controls;

-- Deviations
DROP TRIGGER IF EXISTS prevent_delete_deviations ON deviations;
DROP TRIGGER IF EXISTS audit_insert_deviations ON deviations;
DROP TRIGGER IF EXISTS audit_update_deviations ON deviations;

-- Electronic Signatures
DROP TRIGGER IF EXISTS prevent_delete_electronic_signatures ON electronic_signatures;

-- --------------------------------------------------------------------------
-- 5b. Documents audit triggers
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_documents_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, new_values, user_id, organization_id)
  VALUES ('CREATE', 'documents', NEW.id, to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_documents_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, new_values, user_id, organization_id)
  VALUES ('UPDATE', 'documents', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_documents_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, user_id, organization_id)
  VALUES ('DELETE', 'documents', OLD.id, to_jsonb(OLD), auth.uid(), OLD.organization_id);
  RETURN OLD; -- Allow the delete but log it first
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS documents_after_insert ON documents;
CREATE TRIGGER documents_after_insert AFTER INSERT ON documents
  FOR EACH ROW EXECUTE FUNCTION audit_documents_insert();

DROP TRIGGER IF EXISTS documents_after_update ON documents;
CREATE TRIGGER documents_after_update AFTER UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION audit_documents_update();

DROP TRIGGER IF EXISTS documents_before_delete ON documents;
CREATE TRIGGER documents_before_delete BEFORE DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION audit_documents_delete();

-- --------------------------------------------------------------------------
-- 5c. CAPAs audit triggers
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_capas_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, new_values, user_id, organization_id)
  VALUES ('CREATE', 'capas', NEW.id, to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_capas_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, new_values, user_id, organization_id)
  VALUES ('UPDATE', 'capas', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_capas_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, user_id, organization_id)
  VALUES ('DELETE', 'capas', OLD.id, to_jsonb(OLD), auth.uid(), OLD.organization_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS capas_after_insert ON capas;
CREATE TRIGGER capas_after_insert AFTER INSERT ON capas
  FOR EACH ROW EXECUTE FUNCTION audit_capas_insert();

DROP TRIGGER IF EXISTS capas_after_update ON capas;
CREATE TRIGGER capas_after_update AFTER UPDATE ON capas
  FOR EACH ROW EXECUTE FUNCTION audit_capas_update();

DROP TRIGGER IF EXISTS capas_before_delete ON capas;
CREATE TRIGGER capas_before_delete BEFORE DELETE ON capas
  FOR EACH ROW EXECUTE FUNCTION audit_capas_delete();

-- --------------------------------------------------------------------------
-- 5d. Non-Conformances audit triggers
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_non_conformances_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, new_values, user_id, organization_id)
  VALUES ('CREATE', 'non_conformances', NEW.id, to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_non_conformances_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, new_values, user_id, organization_id)
  VALUES ('UPDATE', 'non_conformances', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_non_conformances_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, user_id, organization_id)
  VALUES ('DELETE', 'non_conformances', OLD.id, to_jsonb(OLD), auth.uid(), OLD.organization_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS non_conformances_after_insert ON non_conformances;
CREATE TRIGGER non_conformances_after_insert AFTER INSERT ON non_conformances
  FOR EACH ROW EXECUTE FUNCTION audit_non_conformances_insert();

DROP TRIGGER IF EXISTS non_conformances_after_update ON non_conformances;
CREATE TRIGGER non_conformances_after_update AFTER UPDATE ON non_conformances
  FOR EACH ROW EXECUTE FUNCTION audit_non_conformances_update();

DROP TRIGGER IF EXISTS non_conformances_before_delete ON non_conformances;
CREATE TRIGGER non_conformances_before_delete BEFORE DELETE ON non_conformances
  FOR EACH ROW EXECUTE FUNCTION audit_non_conformances_delete();

-- --------------------------------------------------------------------------
-- 5e. Audits audit triggers
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_audits_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, new_values, user_id, organization_id)
  VALUES ('CREATE', 'audits', NEW.id, to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_audits_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, new_values, user_id, organization_id)
  VALUES ('UPDATE', 'audits', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_audits_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, user_id, organization_id)
  VALUES ('DELETE', 'audits', OLD.id, to_jsonb(OLD), auth.uid(), OLD.organization_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audits_after_insert ON audits;
CREATE TRIGGER audits_after_insert AFTER INSERT ON audits
  FOR EACH ROW EXECUTE FUNCTION audit_audits_insert();

DROP TRIGGER IF EXISTS audits_after_update ON audits;
CREATE TRIGGER audits_after_update AFTER UPDATE ON audits
  FOR EACH ROW EXECUTE FUNCTION audit_audits_update();

DROP TRIGGER IF EXISTS audits_before_delete ON audits;
CREATE TRIGGER audits_before_delete BEFORE DELETE ON audits
  FOR EACH ROW EXECUTE FUNCTION audit_audits_delete();

-- --------------------------------------------------------------------------
-- 5f. Risks audit triggers
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_risks_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, new_values, user_id, organization_id)
  VALUES ('CREATE', 'risks', NEW.id, to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_risks_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, new_values, user_id, organization_id)
  VALUES ('UPDATE', 'risks', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_risks_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, user_id, organization_id)
  VALUES ('DELETE', 'risks', OLD.id, to_jsonb(OLD), auth.uid(), OLD.organization_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS risks_after_insert ON risks;
CREATE TRIGGER risks_after_insert AFTER INSERT ON risks
  FOR EACH ROW EXECUTE FUNCTION audit_risks_insert();

DROP TRIGGER IF EXISTS risks_after_update ON risks;
CREATE TRIGGER risks_after_update AFTER UPDATE ON risks
  FOR EACH ROW EXECUTE FUNCTION audit_risks_update();

DROP TRIGGER IF EXISTS risks_before_delete ON risks;
CREATE TRIGGER risks_before_delete BEFORE DELETE ON risks
  FOR EACH ROW EXECUTE FUNCTION audit_risks_delete();

-- --------------------------------------------------------------------------
-- 5g. Training audit triggers
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_training_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, new_values, user_id, organization_id)
  VALUES ('CREATE', 'training', NEW.id, to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_training_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, new_values, user_id, organization_id)
  VALUES ('UPDATE', 'training', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_training_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, user_id, organization_id)
  VALUES ('DELETE', 'training', OLD.id, to_jsonb(OLD), auth.uid(), OLD.organization_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS training_after_insert ON training;
CREATE TRIGGER training_after_insert AFTER INSERT ON training
  FOR EACH ROW EXECUTE FUNCTION audit_training_insert();

DROP TRIGGER IF EXISTS training_after_update ON training;
CREATE TRIGGER training_after_update AFTER UPDATE ON training
  FOR EACH ROW EXECUTE FUNCTION audit_training_update();

DROP TRIGGER IF EXISTS training_before_delete ON training;
CREATE TRIGGER training_before_delete BEFORE DELETE ON training
  FOR EACH ROW EXECUTE FUNCTION audit_training_delete();

-- --------------------------------------------------------------------------
-- 5h. Batch Records audit triggers
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_batch_records_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, new_values, user_id, organization_id)
  VALUES ('CREATE', 'batch_records', NEW.id, to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_batch_records_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, new_values, user_id, organization_id)
  VALUES ('UPDATE', 'batch_records', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_batch_records_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, user_id, organization_id)
  VALUES ('DELETE', 'batch_records', OLD.id, to_jsonb(OLD), auth.uid(), OLD.organization_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS batch_records_after_insert ON batch_records;
CREATE TRIGGER batch_records_after_insert AFTER INSERT ON batch_records
  FOR EACH ROW EXECUTE FUNCTION audit_batch_records_insert();

DROP TRIGGER IF EXISTS batch_records_after_update ON batch_records;
CREATE TRIGGER batch_records_after_update AFTER UPDATE ON batch_records
  FOR EACH ROW EXECUTE FUNCTION audit_batch_records_update();

DROP TRIGGER IF EXISTS batch_records_before_delete ON batch_records;
CREATE TRIGGER batch_records_before_delete BEFORE DELETE ON batch_records
  FOR EACH ROW EXECUTE FUNCTION audit_batch_records_delete();

-- --------------------------------------------------------------------------
-- 5i. Suppliers audit triggers
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_suppliers_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, new_values, user_id, organization_id)
  VALUES ('CREATE', 'suppliers', NEW.id, to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_suppliers_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, new_values, user_id, organization_id)
  VALUES ('UPDATE', 'suppliers', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_suppliers_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, user_id, organization_id)
  VALUES ('DELETE', 'suppliers', OLD.id, to_jsonb(OLD), auth.uid(), OLD.organization_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS suppliers_after_insert ON suppliers;
CREATE TRIGGER suppliers_after_insert AFTER INSERT ON suppliers
  FOR EACH ROW EXECUTE FUNCTION audit_suppliers_insert();

DROP TRIGGER IF EXISTS suppliers_after_update ON suppliers;
CREATE TRIGGER suppliers_after_update AFTER UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION audit_suppliers_update();

DROP TRIGGER IF EXISTS suppliers_before_delete ON suppliers;
CREATE TRIGGER suppliers_before_delete BEFORE DELETE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION audit_suppliers_delete();

-- --------------------------------------------------------------------------
-- 5j. Change Controls audit triggers
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_change_controls_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, new_values, user_id, organization_id)
  VALUES ('CREATE', 'change_controls', NEW.id, to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_change_controls_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, new_values, user_id, organization_id)
  VALUES ('UPDATE', 'change_controls', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_change_controls_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, user_id, organization_id)
  VALUES ('DELETE', 'change_controls', OLD.id, to_jsonb(OLD), auth.uid(), OLD.organization_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS change_controls_after_insert ON change_controls;
CREATE TRIGGER change_controls_after_insert AFTER INSERT ON change_controls
  FOR EACH ROW EXECUTE FUNCTION audit_change_controls_insert();

DROP TRIGGER IF EXISTS change_controls_after_update ON change_controls;
CREATE TRIGGER change_controls_after_update AFTER UPDATE ON change_controls
  FOR EACH ROW EXECUTE FUNCTION audit_change_controls_update();

DROP TRIGGER IF EXISTS change_controls_before_delete ON change_controls;
CREATE TRIGGER change_controls_before_delete BEFORE DELETE ON change_controls
  FOR EACH ROW EXECUTE FUNCTION audit_change_controls_delete();

-- --------------------------------------------------------------------------
-- 5k. Deviations audit triggers
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_deviations_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, new_values, user_id, organization_id)
  VALUES ('CREATE', 'deviations', NEW.id, to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_deviations_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, new_values, user_id, organization_id)
  VALUES ('UPDATE', 'deviations', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_deviations_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, user_id, organization_id)
  VALUES ('DELETE', 'deviations', OLD.id, to_jsonb(OLD), auth.uid(), OLD.organization_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS deviations_after_insert ON deviations;
CREATE TRIGGER deviations_after_insert AFTER INSERT ON deviations
  FOR EACH ROW EXECUTE FUNCTION audit_deviations_insert();

DROP TRIGGER IF EXISTS deviations_after_update ON deviations;
CREATE TRIGGER deviations_after_update AFTER UPDATE ON deviations
  FOR EACH ROW EXECUTE FUNCTION audit_deviations_update();

DROP TRIGGER IF EXISTS deviations_before_delete ON deviations;
CREATE TRIGGER deviations_before_delete BEFORE DELETE ON deviations
  FOR EACH ROW EXECUTE FUNCTION audit_deviations_delete();

-- --------------------------------------------------------------------------
-- 5l. Form Templates audit triggers
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_form_templates_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, new_values, user_id, organization_id)
  VALUES ('CREATE', 'form_templates', NEW.id, to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_form_templates_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, new_values, user_id, organization_id)
  VALUES ('UPDATE', 'form_templates', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_form_templates_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, user_id, organization_id)
  VALUES ('DELETE', 'form_templates', OLD.id, to_jsonb(OLD), auth.uid(), OLD.organization_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS form_templates_after_insert ON form_templates;
CREATE TRIGGER form_templates_after_insert AFTER INSERT ON form_templates
  FOR EACH ROW EXECUTE FUNCTION audit_form_templates_insert();

DROP TRIGGER IF EXISTS form_templates_after_update ON form_templates;
CREATE TRIGGER form_templates_after_update AFTER UPDATE ON form_templates
  FOR EACH ROW EXECUTE FUNCTION audit_form_templates_update();

DROP TRIGGER IF EXISTS form_templates_before_delete ON form_templates;
CREATE TRIGGER form_templates_before_delete BEFORE DELETE ON form_templates
  FOR EACH ROW EXECUTE FUNCTION audit_form_templates_delete();

-- --------------------------------------------------------------------------
-- 5m. Form Instances audit triggers
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_form_instances_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, new_values, user_id, organization_id)
  VALUES ('CREATE', 'form_instances', NEW.id, to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_form_instances_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, new_values, user_id, organization_id)
  VALUES ('UPDATE', 'form_instances', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_form_instances_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, user_id, organization_id)
  VALUES ('DELETE', 'form_instances', OLD.id, to_jsonb(OLD), auth.uid(), OLD.organization_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS form_instances_after_insert ON form_instances;
CREATE TRIGGER form_instances_after_insert AFTER INSERT ON form_instances
  FOR EACH ROW EXECUTE FUNCTION audit_form_instances_insert();

DROP TRIGGER IF EXISTS form_instances_after_update ON form_instances;
CREATE TRIGGER form_instances_after_update AFTER UPDATE ON form_instances
  FOR EACH ROW EXECUTE FUNCTION audit_form_instances_update();

DROP TRIGGER IF EXISTS form_instances_before_delete ON form_instances;
CREATE TRIGGER form_instances_before_delete BEFORE DELETE ON form_instances
  FOR EACH ROW EXECUTE FUNCTION audit_form_instances_delete();

-- --------------------------------------------------------------------------
-- 5n. Electronic Signatures audit triggers
--     Per 21 CFR Part 11, e-signatures are immutable. We log creation only;
--     there is no UPDATE trigger (updates are blocked by RLS policy).
--     DELETE is logged before the row is removed (admin-only via RLS).
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_electronic_signatures_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, new_values, user_id, organization_id)
  VALUES ('CREATE', 'electronic_signatures', NEW.id, to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_electronic_signatures_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, user_id, organization_id)
  VALUES ('DELETE', 'electronic_signatures', OLD.id, to_jsonb(OLD), auth.uid(), OLD.organization_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS electronic_signatures_after_insert ON electronic_signatures;
CREATE TRIGGER electronic_signatures_after_insert AFTER INSERT ON electronic_signatures
  FOR EACH ROW EXECUTE FUNCTION audit_electronic_signatures_insert();

DROP TRIGGER IF EXISTS electronic_signatures_before_delete ON electronic_signatures;
CREATE TRIGGER electronic_signatures_before_delete BEFORE DELETE ON electronic_signatures
  FOR EACH ROW EXECUTE FUNCTION audit_electronic_signatures_delete();

-- --------------------------------------------------------------------------
-- 5o. Document Prerequisites audit triggers
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_document_prerequisites_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, new_values, user_id, organization_id)
  VALUES ('CREATE', 'document_prerequisites', NEW.id, to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_document_prerequisites_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, new_values, user_id, organization_id)
  VALUES ('UPDATE', 'document_prerequisites', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_document_prerequisites_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_trails (action, table_name, record_id, old_values, user_id, organization_id)
  VALUES ('DELETE', 'document_prerequisites', OLD.id, to_jsonb(OLD), auth.uid(), OLD.organization_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS document_prerequisites_after_insert ON document_prerequisites;
CREATE TRIGGER document_prerequisites_after_insert AFTER INSERT ON document_prerequisites
  FOR EACH ROW EXECUTE FUNCTION audit_document_prerequisites_insert();

DROP TRIGGER IF EXISTS document_prerequisites_after_update ON document_prerequisites;
CREATE TRIGGER document_prerequisites_after_update AFTER UPDATE ON document_prerequisites
  FOR EACH ROW EXECUTE FUNCTION audit_document_prerequisites_update();

DROP TRIGGER IF EXISTS document_prerequisites_before_delete ON document_prerequisites;
CREATE TRIGGER document_prerequisites_before_delete BEFORE DELETE ON document_prerequisites
  FOR EACH ROW EXECUTE FUNCTION audit_document_prerequisites_delete();

-- ============================================================================
-- 6. Make audit_trail table truly immutable
--    While RLS policies already block UPDATE/DELETE on audit_trails (from v4),
--    we add trigger-level protection as defense in depth. This ensures that
--    even a superuser or a SECURITY DEFINER function cannot modify or delete
--    audit trail records accidentally.
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit trail records are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_audit_update ON audit_trails;
CREATE TRIGGER prevent_audit_update BEFORE UPDATE ON audit_trails
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

DROP TRIGGER IF EXISTS prevent_audit_delete ON audit_trails;
CREATE TRIGGER prevent_audit_delete BEFORE DELETE ON audit_trails
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- ============================================================================
-- End of migration 20240101000006_multi_tenant_rls_v3.sql
-- ============================================================================
