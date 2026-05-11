-- QMS SaaS Pro - Seed Data for Demo
-- Insert demo data matching the mock-data.ts contents

-- ============================================================================
-- Demo Organization
-- ============================================================================

INSERT INTO organizations (id, name, slug, subscription_status, settings) VALUES
('org-001', 'PharmaQMS Demo', 'pharmaqms-demo', 'active',
 '{"setup_completed":true,"industry_type":"medical_device","applicable_standards":["ISO 13485:2016","ISO 14971:2019","FDA 21 CFR 820"],"active_modules":["documents","capa","ncr","audits","training","reports","compliance","risks","hierarchy","batch_records","suppliers","forms","change_control","deviations","oos_oot"],"company_name":"PharmaQMS Demo","require_electronic_signatures":true,"require_prerequisite_docs":true,"audit_trail_enabled":true,"notification_settings":{"capa_overdue":true,"ncr_overdue":true,"document_expiry":true,"training_overdue":true,"audit_due":true}}'
);

-- ============================================================================
-- Demo Profiles
-- ============================================================================

INSERT INTO profiles (id, email, full_name, role, department, job_title, phone) VALUES
('user-001', 'admin@qms-demo.com', 'Marie Dupont', 'admin', 'Quality Assurance', 'QA Director', '+33 1 23 45 67 89'),
('user-002', 'qm@qms-demo.com', 'Jean Martin', 'quality_manager', 'Quality Assurance', 'Quality Manager', '+33 1 23 45 67 90'),
('user-003', 'auditor@qms-demo.com', 'Sophie Laurent', 'auditor', 'Internal Audit', 'Lead Auditor', NULL),
('user-004', 'dc@qms-demo.com', 'Pierre Bernard', 'document_controller', 'Document Control', 'Document Control Specialist', NULL),
('user-005', 'exec@qms-demo.com', 'Claire Moreau', 'executive', 'Executive', 'VP Quality', NULL),
('user-006', 'operator@qms-demo.com', 'Lucas Petit', 'operator', 'Production', 'Manufacturing Operator', NULL);

-- ============================================================================
-- Organization Members
-- ============================================================================

INSERT INTO organization_members (id, organization_id, user_id, role, status) VALUES
('mem-001', 'org-001', 'user-001', 'owner', 'active'),
('mem-002', 'org-001', 'user-002', 'admin', 'active'),
('mem-003', 'org-001', 'user-003', 'member', 'active'),
('mem-004', 'org-001', 'user-004', 'member', 'active'),
('mem-005', 'org-001', 'user-005', 'member', 'active'),
('mem-006', 'org-001', 'user-006', 'member', 'active');

-- ============================================================================
-- Demo Documents
-- ============================================================================

INSERT INTO documents (id, document_number, title, type, version, status, effective_date, next_review, owner, department, description, classification, retention_period, document_level, author_id, organization_id, created_by_id) VALUES
('doc-001', 'SOP-QMS-001', 'Document Control Procedure', 'SOP', '3.0', 'Approved', '2024-01-15T00:00:00Z', '2025-01-15T00:00:00Z', 'Pierre Bernard', 'Document Control', 'Defines the procedure for creating, reviewing, approving, and controlling documents within the QMS.', 'Internal', '10 years', 2, 'user-004', 'org-001', 'user-004'),
('doc-002', 'SOP-QMS-002', 'CAPA Management Procedure', 'SOP', '2.1', 'Approved', '2024-02-01T00:00:00Z', '2025-02-01T00:00:00Z', 'Jean Martin', 'Quality Assurance', 'Defines the procedure for initiating, investigating, and closing Corrective and Preventive Actions.', 'Internal', '15 years', 2, 'user-002', 'org-001', 'user-002'),
('doc-003', 'SOP-QMS-003', 'Non-Conformance Management', 'SOP', '2.0', 'Approved', '2024-01-20T00:00:00Z', '2025-01-20T00:00:00Z', 'Jean Martin', 'Quality Assurance', 'Procedure for identifying, documenting, and resolving non-conformances.', 'Internal', '15 years', 2, 'user-002', 'org-001', 'user-002'),
('doc-004', 'SOP-PROD-001', 'Sterile Manufacturing Process', 'SOP', '4.2', 'Approved', '2024-03-01T00:00:00Z', '2025-03-01T00:00:00Z', 'Lucas Petit', 'Production', 'Standard operating procedure for sterile manufacturing of pharmaceutical products.', 'Confidential', '20 years', 2, 'user-006', 'org-001', 'user-006'),
('doc-005', 'POL-QMS-001', 'Quality Policy', 'Policy', '1.0', 'Approved', '2024-01-15T00:00:00Z', '2027-01-15T00:00:00Z', 'Claire Moreau', 'Executive', 'Company quality policy statement and commitment to regulatory compliance.', 'Internal', 'Permanent', 1, 'user-005', 'org-001', 'user-005');

-- ============================================================================
-- Demo CAPAs
-- ============================================================================

INSERT INTO capas (id, capa_number, title, type, status, priority, source, description, assigned_to, due_date, created_date, organization_id, created_by_id) VALUES
('capa-001', 'CAPA-2024-001', 'Environmental Monitoring Excursion - Cleanroom Grade A', 'Corrective', 'Implementation', 'Critical', 'Non-Conformance', 'CFU counts exceeded alert limits in Grade A cleanroom during routine environmental monitoring.', 'user-002', '2024-06-15T00:00:00Z', '2024-03-16T08:00:00Z', 'org-001', 'user-002'),
('capa-002', 'CAPA-2024-002', 'Documentation Gap in Batch Record Review', 'Corrective', 'Investigation', 'High', 'Audit Finding', 'Internal audit found missing QA review signatures on 3 batch records.', 'user-004', '2024-07-01T00:00:00Z', '2024-04-10T08:00:00Z', 'org-001', 'user-003'),
('capa-003', 'CAPA-2024-003', 'Preventive Maintenance Schedule Compliance', 'Preventive', 'Open', 'Medium', 'Management Review', 'Trend analysis shows 15% of preventive maintenance tasks completed late in Q1 2024.', 'user-002', '2024-08-01T00:00:00Z', '2024-05-01T08:00:00Z', 'org-001', 'user-005');

-- ============================================================================
-- Demo NCRs
-- ============================================================================

INSERT INTO non_conformances (id, ncr_number, title, type, status, severity, source, description, lot_number, quantity_affected, disposition, linked_capa_id, assigned_to, created_date, organization_id, created_by_id, is_oos_oot, phase2_required, reject_lot) VALUES
('ncr-001', 'NCR-2024-001', 'Environmental Monitoring Excursion - Grade A', 'Process', 'Under Investigation', 'Critical', 'Environmental Monitoring', 'CFU counts exceeded alert limits in Grade A cleanroom during routine monitoring.', 'BN-2024-038', 500, 'Pending', 'capa-001', 'user-002', '2024-03-15T08:00:00Z', 'org-001', 'user-006', FALSE, FALSE, FALSE),
('ncr-002', 'NCR-2024-002', 'Out of Specification Result - API Assay', 'OOS', 'Pending Disposition', 'Major', 'Quality Control Testing', 'Assay result for API X-200 showed 92.3% vs specification 95.0-105.0%.', 'BN-2024-042', 1000, 'Pending', NULL, 'user-002', '2024-04-05T08:00:00Z', 'org-001', 'user-002', TRUE, TRUE, TRUE);

-- ============================================================================
-- Demo Audits
-- ============================================================================

INSERT INTO audits (id, audit_number, title, type, status, scope, scheduled_date, completed_date, lead_auditor, organization_id) VALUES
('audit-001', 'AUD-2024-001', 'Q1 2024 Internal Quality Audit', 'Internal', 'Completed', 'Document control and batch record review process', '2024-04-01T08:00:00Z', '2024-04-03T17:00:00Z', 'Sophie Laurent', 'org-001'),
('audit-002', 'AUD-2024-002', 'Supplier Audit - MedPharm Raw Materials', 'Supplier', 'Planned', 'Supplier quality system and raw material control', '2024-07-15T08:00:00Z', NULL, 'Sophie Laurent', 'org-001');

-- ============================================================================
-- Demo Training
-- ============================================================================

INSERT INTO training (id, title, description, type, status, assigned_to, due_date, completed_date, document_id, organization_id) VALUES
('train-001', 'SOP-QMS-001 Document Control Training', 'Training on the updated document control procedure v3.0', 'SOP', 'Completed', 'user-006', '2024-02-15T00:00:00Z', '2024-02-10T10:00:00Z', 'doc-001', 'org-001'),
('train-002', 'Cleanroom Gowning Certification', 'Annual recertification for cleanroom gowning procedure', 'Certification', 'Overdue', 'user-006', '2024-04-01T00:00:00Z', NULL, 'doc-006', 'org-001'),
('train-003', 'ISO 13485:2016 Regulatory Update', 'Training on recent regulatory updates', 'Regulatory', 'Planned', 'user-002', '2024-07-15T00:00:00Z', NULL, NULL, 'org-001');

-- ============================================================================
-- Demo Risks
-- ============================================================================

INSERT INTO risks (id, risk_number, title, category, probability, impact, detectability, rpn, risk_level, mitigation, residual_risk, status, organization_id) VALUES
('risk-001', 'RISK-2024-001', 'HEPA Filter Failure in Grade A', 'Process', 2, 5, 3, 30, 'High', 'Implement predictive maintenance for HEPA filters. Add differential pressure monitoring with alerts.', 'Low - with predictive maintenance and monitoring in place', 'Mitigated', 'org-001'),
('risk-002', 'RISK-2024-002', 'Supply Chain Disruption - API X-200', 'Supplier', 3, 4, 4, 48, 'High', 'Qualify second source supplier. Maintain 3-month safety stock.', 'Medium - dependent on second source qualification timeline', 'Open', 'org-001');

-- ============================================================================
-- Demo Batch Records
-- ============================================================================

INSERT INTO batch_records (id, lot_number, product_name, product_code, batch_size, batch_size_unit, manufacturing_date, expiry_date, status, is_locked, organization_id, created_by_id) VALUES
('batch-001', 'BN-2024-055', 'Sterile Solution Alpha', 'PROD-ALPHA-001', 5000, 'vials', '2024-05-01T08:00:00Z', '2026-05-01T00:00:00Z', 'In Progress', FALSE, 'org-001', 'user-006'),
('batch-002', 'BN-2024-052', 'Device Alpha', 'PROD-DEV-001', 2000, 'units', '2024-04-15T08:00:00Z', '2025-04-15T00:00:00Z', 'Released', TRUE, 'org-001', 'user-006');

-- ============================================================================
-- Demo Suppliers
-- ============================================================================

INSERT INTO suppliers (id, supplier_code, name, category, status, qualification_date, next_review_date, certifications, performance_score, organization_id, created_by_id) VALUES
('sup-001', 'MED-SUP-001', 'MedPharm Raw Materials GmbH', 'Raw Material', 'Qualified', '2023-06-15T00:00:00Z', '2025-06-15T00:00:00Z', '["ISO 9001:2015", "ISO 13485:2016", "GMP Certificate"]', 92, 'org-001', 'user-002'),
('sup-002', 'PKG-SUP-001', 'PharmaPack Solutions SA', 'Packaging', 'Qualified', '2023-08-01T00:00:00Z', '2025-08-01T00:00:00Z', '["ISO 9001:2015", "ISO 15378"]', 88, 'org-001', 'user-002');
