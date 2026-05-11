-- ============================================================================
-- QMS SaaS Pro - Audit Trail Immutable & Auto-Logging Triggers
-- Makes audit_trails append-only, creates audit trigger function,
-- prevents physical DELETE on business tables (soft delete only),
-- and creates AFTER INSERT/UPDATE triggers for automatic audit logging.
-- ============================================================================

-- ============================================================================
-- 1. Make audit_trails strictly append-only (no UPDATE, no DELETE)
-- ============================================================================

-- Explicitly block DELETE on audit_trails
CREATE POLICY "No delete on audit_trails" ON audit_trails
  FOR DELETE USING (FALSE);

-- Explicitly block UPDATE on audit_trails
CREATE POLICY "No update on audit_trails" ON audit_trails
  FOR UPDATE USING (FALSE);

-- ============================================================================
-- 2. Create audit trigger function — automatically logs INSERT/UPDATE/DELETE
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  audit_action TEXT;
  old_data JSONB;
  new_data JSONB;
  current_org_id UUID;
  current_user_id UUID;
  current_user_email TEXT;
BEGIN
  -- Determine operation type and capture data
  IF TG_OP = 'INSERT' THEN
    audit_action := 'CREATE';
    old_data := NULL;
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    audit_action := 'UPDATE';
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    audit_action := 'DELETE';
    old_data := to_jsonb(OLD);
    new_data := NULL;
  END IF;

  -- Get organization_id from the record
  IF NEW IS NOT NULL THEN
    current_org_id := NEW.organization_id;
  ELSIF OLD IS NOT NULL THEN
    current_org_id := OLD.organization_id;
  END IF;

  -- Get current user
  current_user_id := auth.uid();

  -- Get user email from profiles
  SELECT email INTO current_user_email FROM profiles WHERE id = current_user_id;

  -- Insert audit trail record
  INSERT INTO audit_trails (action, table_name, record_id, user_id, user_email, old_values, new_values, organization_id)
  VALUES (
    audit_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    current_user_id,
    current_user_email,
    old_data,
    new_data,
    current_org_id
  );

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. Create prevent_delete_func — blocks physical DELETE, enforces soft delete
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_delete_func()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Physical DELETE is not allowed on %. Use soft delete instead (set is_deleted = true).', TG_TABLE_NAME;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Create BEFORE DELETE triggers on all business tables
--    These block physical DELETEs; soft delete must be used instead.
-- ============================================================================

DROP TRIGGER IF EXISTS prevent_delete_documents ON documents;
CREATE TRIGGER prevent_delete_documents
  BEFORE DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_func();

DROP TRIGGER IF EXISTS prevent_delete_capas ON capas;
CREATE TRIGGER prevent_delete_capas
  BEFORE DELETE ON capas
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_func();

DROP TRIGGER IF EXISTS prevent_delete_non_conformances ON non_conformances;
CREATE TRIGGER prevent_delete_non_conformances
  BEFORE DELETE ON non_conformances
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_func();

DROP TRIGGER IF EXISTS prevent_delete_batch_records ON batch_records;
CREATE TRIGGER prevent_delete_batch_records
  BEFORE DELETE ON batch_records
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_func();

DROP TRIGGER IF EXISTS prevent_delete_suppliers ON suppliers;
CREATE TRIGGER prevent_delete_suppliers
  BEFORE DELETE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_func();

DROP TRIGGER IF EXISTS prevent_delete_form_templates ON form_templates;
CREATE TRIGGER prevent_delete_form_templates
  BEFORE DELETE ON form_templates
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_func();

DROP TRIGGER IF EXISTS prevent_delete_form_instances ON form_instances;
CREATE TRIGGER prevent_delete_form_instances
  BEFORE DELETE ON form_instances
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_func();

DROP TRIGGER IF EXISTS prevent_delete_audits ON audits;
CREATE TRIGGER prevent_delete_audits
  BEFORE DELETE ON audits
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_func();

DROP TRIGGER IF EXISTS prevent_delete_training ON training;
CREATE TRIGGER prevent_delete_training
  BEFORE DELETE ON training
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_func();

DROP TRIGGER IF EXISTS prevent_delete_risks ON risks;
CREATE TRIGGER prevent_delete_risks
  BEFORE DELETE ON risks
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_func();

DROP TRIGGER IF EXISTS prevent_delete_change_controls ON change_controls;
CREATE TRIGGER prevent_delete_change_controls
  BEFORE DELETE ON change_controls
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_func();

DROP TRIGGER IF EXISTS prevent_delete_deviations ON deviations;
CREATE TRIGGER prevent_delete_deviations
  BEFORE DELETE ON deviations
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_func();

DROP TRIGGER IF EXISTS prevent_delete_electronic_signatures ON electronic_signatures;
CREATE TRIGGER prevent_delete_electronic_signatures
  BEFORE DELETE ON electronic_signatures
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_func();

-- ============================================================================
-- 5. Create AFTER INSERT triggers for automatic audit logging
-- ============================================================================

DROP TRIGGER IF EXISTS audit_insert_documents ON documents;
CREATE TRIGGER audit_insert_documents
  AFTER INSERT ON documents
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_insert_capas ON capas;
CREATE TRIGGER audit_insert_capas
  AFTER INSERT ON capas
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_insert_non_conformances ON non_conformances;
CREATE TRIGGER audit_insert_non_conformances
  AFTER INSERT ON non_conformances
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_insert_batch_records ON batch_records;
CREATE TRIGGER audit_insert_batch_records
  AFTER INSERT ON batch_records
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_insert_suppliers ON suppliers;
CREATE TRIGGER audit_insert_suppliers
  AFTER INSERT ON suppliers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_insert_form_instances ON form_instances;
CREATE TRIGGER audit_insert_form_instances
  AFTER INSERT ON form_instances
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_insert_audits ON audits;
CREATE TRIGGER audit_insert_audits
  AFTER INSERT ON audits
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_insert_training ON training;
CREATE TRIGGER audit_insert_training
  AFTER INSERT ON training
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_insert_risks ON risks;
CREATE TRIGGER audit_insert_risks
  AFTER INSERT ON risks
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_insert_change_controls ON change_controls;
CREATE TRIGGER audit_insert_change_controls
  AFTER INSERT ON change_controls
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_insert_deviations ON deviations;
CREATE TRIGGER audit_insert_deviations
  AFTER INSERT ON deviations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================================
-- 6. Create AFTER UPDATE triggers for automatic audit logging
-- ============================================================================

DROP TRIGGER IF EXISTS audit_update_documents ON documents;
CREATE TRIGGER audit_update_documents
  AFTER UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_update_capas ON capas;
CREATE TRIGGER audit_update_capas
  AFTER UPDATE ON capas
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_update_non_conformances ON non_conformances;
CREATE TRIGGER audit_update_non_conformances
  AFTER UPDATE ON non_conformances
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_update_batch_records ON batch_records;
CREATE TRIGGER audit_update_batch_records
  AFTER UPDATE ON batch_records
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_update_suppliers ON suppliers;
CREATE TRIGGER audit_update_suppliers
  AFTER UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_update_form_instances ON form_instances;
CREATE TRIGGER audit_update_form_instances
  AFTER UPDATE ON form_instances
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_update_audits ON audits;
CREATE TRIGGER audit_update_audits
  AFTER UPDATE ON audits
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_update_training ON training;
CREATE TRIGGER audit_update_training
  AFTER UPDATE ON training
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_update_risks ON risks;
CREATE TRIGGER audit_update_risks
  AFTER UPDATE ON risks
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_update_change_controls ON change_controls;
CREATE TRIGGER audit_update_change_controls
  AFTER UPDATE ON change_controls
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_update_deviations ON deviations;
CREATE TRIGGER audit_update_deviations
  AFTER UPDATE ON deviations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================================
-- 7. Add indexes to support audit trail queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_trails_record_id ON audit_trails(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_user_id ON audit_trails(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_table_record ON audit_trails(table_name, record_id);
