-- QMS SaaS Pro - Initial Schema
-- 19 tables, indexes, triggers

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Profiles
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'operator',
  department TEXT,
  job_title TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================================
// Organizations
-- ============================================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  settings JSONB NOT NULL DEFAULT '{"setup_completed": false, "industry_type": "medical_device"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ============================================================================
-- Organization Members
-- ============================================================================

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- ============================================================================
-- Documents
-- ============================================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_number TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'Draft',
  effective_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  owner TEXT,
  department TEXT,
  last_reviewed TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  description TEXT,
  classification TEXT,
  retention_period TEXT,
  scope TEXT,
  references TEXT,
  type_specific_data JSONB,
  parent_document_id UUID REFERENCES documents(id),
  document_level INTEGER,
  validation_phase TEXT,
  parent_validation_id UUID REFERENCES documents(id),
  author_id UUID REFERENCES profiles(id),
  organization_id UUID REFERENCES organizations(id),
  created_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_number ON documents(document_number);

-- ============================================================================
-- Electronic Signatures
-- ============================================================================

CREATE TABLE electronic_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  signed_by_id UUID NOT NULL REFERENCES profiles(id),
  signer_name TEXT NOT NULL,
  signer_role TEXT NOT NULL,
  signature_type TEXT NOT NULL,
  signature_hash TEXT NOT NULL,
  user_agent TEXT,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sigs_document ON electronic_signatures(document_id);

-- ============================================================================
-- Document Prerequisites
-- ============================================================================

CREATE TABLE document_prerequisites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  required_doc_type TEXT NOT NULL,
  required_doc_ref TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CAPAs
-- ============================================================================

CREATE TABLE capas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  capa_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  priority TEXT,
  source TEXT,
  source_reference_id TEXT,
  description TEXT NOT NULL,
  problem_statement TEXT,
  investigation_details TEXT,
  root_cause_analysis TEXT,
  root_cause_category TEXT,
  five_whys JSONB,
  corrective_action TEXT,
  effectiveness_verification_method TEXT,
  effectiveness_criteria TEXT,
  effectiveness_result TEXT,
  linked_document_id UUID REFERENCES documents(id),
  linked_ncr_id UUID,
  linked_audit_id UUID,
  assigned_to TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  created_date TIMESTAMPTZ NOT NULL,
  closed_date TIMESTAMPTZ,
  created_by_id UUID REFERENCES profiles(id),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_capas_org ON capas(organization_id);
CREATE INDEX idx_capas_status ON capas(status);

-- ============================================================================
-- Non-Conformances
-- ============================================================================

CREATE TABLE non_conformances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ncr_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  severity TEXT,
  source TEXT,
  description TEXT NOT NULL,
  lot_number TEXT,
  quantity_affected INTEGER,
  disposition TEXT,
  linked_capa_id UUID REFERENCES capas(id),
  linked_procedure_ref TEXT,
  supplier_id UUID,
  is_oos_oot BOOLEAN NOT NULL DEFAULT FALSE,
  analytical_method TEXT,
  measured_value FLOAT,
  measured_unit TEXT,
  spec_limit TEXT,
  phase1_conclusion TEXT,
  phase2_required BOOLEAN NOT NULL DEFAULT FALSE,
  phase2_conclusion TEXT,
  reject_lot BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_to TEXT,
  created_date TIMESTAMPTZ NOT NULL,
  created_by_id UUID REFERENCES profiles(id),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ncrs_org ON non_conformances(organization_id);
CREATE INDEX idx_ncrs_status ON non_conformances(status);

-- ============================================================================
-- Batch Records
-- ============================================================================

CREATE TABLE batch_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_number TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  product_code TEXT,
  batch_size FLOAT,
  batch_size_unit TEXT,
  master_formula_id UUID REFERENCES documents(id),
  manufacturing_date TIMESTAMPTZ NOT NULL,
  expiry_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'In Progress',
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  qa_release_date TIMESTAMPTZ,
  qa_released_by_id UUID REFERENCES profiles(id),
  organization_id UUID REFERENCES organizations(id),
  created_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_batch_org ON batch_records(organization_id);

-- ============================================================================
-- Batch Steps
-- ============================================================================

CREATE TABLE batch_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_record_id UUID NOT NULL REFERENCES batch_records(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  instructions TEXT,
  expected_value TEXT,
  actual_value TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  operator_id UUID REFERENCES profiles(id),
  performed_at TIMESTAMPTZ,
  signature_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_batch_steps_record ON batch_steps(batch_record_id);

-- ============================================================================
-- Suppliers
-- ============================================================================

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'Qualified',
  qualification_date TIMESTAMPTZ,
  next_review_date TIMESTAMPTZ,
  certifications JSONB,
  performance_score FLOAT,
  qualification_doc_id UUID,
  organization_id UUID REFERENCES organizations(id),
  created_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppliers_org ON suppliers(organization_id);

-- ============================================================================
-- Form Templates
-- ============================================================================

CREATE TABLE form_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id),
  title TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  fields JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  organization_id UUID REFERENCES organizations(id),
  created_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Form Instances
-- ============================================================================

CREATE TABLE form_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES form_templates(id),
  template_version TEXT NOT NULL,
  reference_number TEXT UNIQUE NOT NULL,
  values JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Draft',
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_by_id UUID REFERENCES profiles(id),
  submitted_at TIMESTAMPTZ,
  signature_hash TEXT,
  parent_document_id UUID,
  organization_id UUID REFERENCES organizations(id),
  created_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Audit Trails
-- ============================================================================

CREATE TABLE audit_trails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  user_id UUID REFERENCES profiles(id),
  user_email TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_trails_org ON audit_trails(organization_id);
CREATE INDEX idx_audit_trails_table ON audit_trails(table_name);
CREATE INDEX idx_audit_trails_action ON audit_trails(action);
CREATE INDEX idx_audit_trails_created ON audit_trails(created_at DESC);

-- ============================================================================
-- Audits
-- ============================================================================

CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Internal',
  status TEXT NOT NULL DEFAULT 'Planned',
  scope TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  completed_date TIMESTAMPTZ,
  lead_auditor TEXT NOT NULL,
  auditees JSONB,
  findings JSONB,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audits_org ON audits(organization_id);

-- ============================================================================
-- Training
-- ============================================================================

CREATE TABLE training (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Planned',
  assigned_to TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  completed_date TIMESTAMPTZ,
  document_id UUID REFERENCES documents(id),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_training_org ON training(organization_id);

-- ============================================================================
-- Risks
-- ============================================================================

CREATE TABLE risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  probability INTEGER NOT NULL DEFAULT 3,
  impact INTEGER NOT NULL DEFAULT 3,
  detectability INTEGER NOT NULL DEFAULT 3,
  rpn INTEGER NOT NULL DEFAULT 27,
  risk_level TEXT NOT NULL DEFAULT 'Medium',
  mitigation TEXT,
  residual_risk TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risks_org ON risks(organization_id);

-- ============================================================================
-- Change Controls
-- ============================================================================

CREATE TABLE change_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cc_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Requested',
  priority TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  justification TEXT NOT NULL,
  proposed_change TEXT NOT NULL,
  risk_assessment TEXT,
  impact_analysis TEXT,
  implementation_plan TEXT,
  implementation_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  linked_document_id UUID REFERENCES documents(id),
  linked_capa_id UUID REFERENCES capas(id),
  assigned_to TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  created_by_id UUID REFERENCES profiles(id),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Deviations
-- ============================================================================

CREATE TABLE deviations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dev_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  deviation_details TEXT NOT NULL,
  justification TEXT,
  risk_assessment TEXT,
  corrective_action TEXT,
  preventive_action TEXT,
  lot_number TEXT,
  product_code TEXT,
  quantity_affected INTEGER,
  linked_capa_id UUID REFERENCES capas(id),
  linked_document_id UUID REFERENCES documents(id),
  assigned_to TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  closed_date TIMESTAMPTZ,
  created_by_id UUID REFERENCES profiles(id),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Updated-at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_capas_updated_at BEFORE UPDATE ON capas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ncrs_updated_at BEFORE UPDATE ON non_conformances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON audits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_updated_at BEFORE UPDATE ON training FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON risks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_change_controls_updated_at BEFORE UPDATE ON change_controls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deviations_updated_at BEFORE UPDATE ON deviations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
