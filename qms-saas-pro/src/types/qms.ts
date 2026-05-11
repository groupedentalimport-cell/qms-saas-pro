// QMS Types - Complete type definitions for the Quality Management System

// ============================================================================
// User Roles & Permissions
// ============================================================================

export type UserRole = 'admin' | 'quality_manager' | 'auditor' | 'document_controller' | 'executive' | 'operator';

export type Permission =
  | 'documents.create' | 'documents.read' | 'documents.update' | 'documents.delete' | 'documents.approve'
  | 'capa.create' | 'capa.read' | 'capa.update' | 'capa.delete' | 'capa.approve'
  | 'ncr.create' | 'ncr.read' | 'ncr.update' | 'ncr.delete' | 'ncr.approve'
  | 'audit.create' | 'audit.read' | 'audit.update' | 'audit.delete'
  | 'training.create' | 'training.read' | 'training.update' | 'training.delete'
  | 'risk.create' | 'risk.read' | 'risk.update' | 'risk.delete'
  | 'batch.create' | 'batch.read' | 'batch.update' | 'batch.delete' | 'batch.release'
  | 'supplier.create' | 'supplier.read' | 'supplier.update' | 'supplier.delete'
  | 'reports.view' | 'reports.export'
  | 'compliance.view' | 'compliance.manage'
  | 'admin.users' | 'admin.settings' | 'admin.audit_trail';

export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'documents.create', 'documents.read', 'documents.update', 'documents.delete', 'documents.approve',
    'capa.create', 'capa.read', 'capa.update', 'capa.delete', 'capa.approve',
    'ncr.create', 'ncr.read', 'ncr.update', 'ncr.delete', 'ncr.approve',
    'audit.create', 'audit.read', 'audit.update', 'audit.delete',
    'training.create', 'training.read', 'training.update', 'training.delete',
    'risk.create', 'risk.read', 'risk.update', 'risk.delete',
    'batch.create', 'batch.read', 'batch.update', 'batch.delete', 'batch.release',
    'supplier.create', 'supplier.read', 'supplier.update', 'supplier.delete',
    'reports.view', 'reports.export',
    'compliance.view', 'compliance.manage',
    'admin.users', 'admin.settings', 'admin.audit_trail',
  ],
  quality_manager: [
    'documents.create', 'documents.read', 'documents.update', 'documents.approve',
    'capa.create', 'capa.read', 'capa.update', 'capa.approve',
    'ncr.create', 'ncr.read', 'ncr.update', 'ncr.approve',
    'audit.create', 'audit.read', 'audit.update',
    'training.create', 'training.read', 'training.update',
    'risk.create', 'risk.read', 'risk.update',
    'batch.create', 'batch.read', 'batch.update', 'batch.release',
    'supplier.create', 'supplier.read', 'supplier.update',
    'reports.view', 'reports.export',
    'compliance.view', 'compliance.manage',
    'admin.audit_trail',
  ],
  auditor: [
    'documents.read',
    'capa.read',
    'ncr.read',
    'audit.create', 'audit.read', 'audit.update',
    'training.read',
    'risk.read',
    'batch.read',
    'supplier.read',
    'reports.view',
    'compliance.view',
    'admin.audit_trail',
  ],
  document_controller: [
    'documents.create', 'documents.read', 'documents.update', 'documents.delete', 'documents.approve',
    'capa.read',
    'ncr.read',
    'audit.read',
    'training.create', 'training.read', 'training.update',
    'batch.read',
    'supplier.read',
    'reports.view',
    'compliance.view',
  ],
  executive: [
    'documents.read',
    'capa.read',
    'ncr.read',
    'audit.read',
    'training.read',
    'risk.read',
    'batch.read',
    'supplier.read',
    'reports.view', 'reports.export',
    'compliance.view',
  ],
  operator: [
    'documents.read',
    'capa.read',
    'ncr.create', 'ncr.read',
    'batch.create', 'batch.read', 'batch.update',
    'training.read',
    'supplier.read',
  ],
};

// ============================================================================
// Organization & Settings
// ============================================================================

export type IndustryType = 'medical_device' | 'pharmaceutical' | 'biotech' | 'ivd' | 'combination_product';

export const CORE_MODULES = ['documents', 'capa', 'ncr', 'audits', 'training', 'reports', 'compliance'] as const;
export const OPTIONAL_MODULES = ['risks', 'hierarchy', 'batch_records', 'suppliers', 'forms', 'change_control', 'deviations', 'oos_oot'] as const;

export const STANDARDS_BY_INDUSTRY: Record<IndustryType, string[]> = {
  medical_device: ['ISO 13485:2016', 'ISO 14971:2019', 'IEC 62304', 'FDA 21 CFR 820', 'MDR EU 2017/745'],
  pharmaceutical: ['ICH Q10', 'FDA 21 CFR 210/211', 'cGMP', 'EU GMP Annex 15', 'ISO 13485:2016'],
  biotech: ['ICH Q10', 'FDA 21 CFR 210/211', 'cGMP', 'ISO 14971:2019', 'ISO 13485:2016'],
  ivd: ['IVDR EU 2017/746', 'ISO 13485:2016', 'ISO 14971:2019', 'FDA 21 CFR 820', 'CLSI Guidelines'],
  combination_product: ['ISO 13485:2016', 'ISO 14971:2019', 'FDA 21 CFR 820', 'FDA 21 CFR 210/211', 'MDR EU 2017/745'],
};

// ============================================================================
// Industry Configuration
// ============================================================================

export interface IndustryConfig {
  label: string;
  primaryStandard: string;
  recommendedModules: string[];
  complianceWeights: {
    documents: number;
    capas: number;
    training: number;
    audits: number;
    ncrs: number;
    risks: number;
    batchRecords: number;
    suppliers: number;
  };
  checklistId: string;
  terminology: Record<string, string>;
}

export const INDUSTRY_CONFIG: Record<IndustryType, IndustryConfig> = {
  medical_device: {
    label: 'Medical Device',
    primaryStandard: 'ISO 13485:2016',
    recommendedModules: ['risks', 'hierarchy', 'suppliers', 'forms'],
    complianceWeights: { documents: 0.25, capas: 0.20, training: 0.15, audits: 0.15, ncrs: 0.10, risks: 0.10, batchRecords: 0.03, suppliers: 0.02 },
    checklistId: 'iso13485',
    terminology: { batchRecord: 'Production Record', deviation: 'Nonconformity' },
  },
  pharmaceutical: {
    label: 'Pharmaceutical',
    primaryStandard: 'ICH Q10',
    recommendedModules: ['risks', 'batch_records', 'suppliers', 'forms', 'oos_oot', 'deviations', 'change_control'],
    complianceWeights: { documents: 0.20, capas: 0.20, training: 0.10, audits: 0.10, ncrs: 0.10, risks: 0.05, batchRecords: 0.15, suppliers: 0.10 },
    checklistId: 'ichq10',
    terminology: { batchRecord: 'Batch Record', deviation: 'Deviation' },
  },
  biotech: {
    label: 'Biotech',
    primaryStandard: 'ICH Q10',
    recommendedModules: ['risks', 'batch_records', 'suppliers', 'forms', 'oos_oot', 'deviations', 'change_control'],
    complianceWeights: { documents: 0.20, capas: 0.20, training: 0.10, audits: 0.10, ncrs: 0.10, risks: 0.10, batchRecords: 0.10, suppliers: 0.10 },
    checklistId: 'ichq10',
    terminology: { batchRecord: 'Batch Record', deviation: 'Deviation' },
  },
  ivd: {
    label: 'IVD',
    primaryStandard: 'IVDR EU 2017/746',
    recommendedModules: ['risks', 'hierarchy', 'suppliers', 'forms'],
    complianceWeights: { documents: 0.25, capas: 0.20, training: 0.15, audits: 0.15, ncrs: 0.10, risks: 0.10, batchRecords: 0.03, suppliers: 0.02 },
    checklistId: 'ivdr',
    terminology: { batchRecord: 'Production Record', deviation: 'Nonconformity' },
  },
  combination_product: {
    label: 'Combination Product',
    primaryStandard: 'ISO 13485:2016',
    recommendedModules: ['risks', 'hierarchy', 'batch_records', 'suppliers', 'forms', 'oos_oot', 'deviations', 'change_control'],
    complianceWeights: { documents: 0.22, capas: 0.18, training: 0.12, audits: 0.12, ncrs: 0.10, risks: 0.10, batchRecords: 0.10, suppliers: 0.06 },
    checklistId: 'iso13485',
    terminology: { batchRecord: 'Batch Record', deviation: 'Deviation' },
  },
};

export interface OrgSettings {
  setup_completed: boolean;
  industry_type: IndustryType;
  applicable_standards: string[];
  active_modules: string[];
  company_name?: string;
  logo_url?: string;
  default_document_retention?: string;
  require_electronic_signatures?: boolean;
  require_prerequisite_docs?: boolean;
  audit_trail_enabled?: boolean;
  notification_settings?: {
    capa_overdue: boolean;
    ncr_overdue: boolean;
    document_expiry: boolean;
    training_overdue: boolean;
    audit_due: boolean;
  };
}

// ============================================================================
// Document Types
// ============================================================================

export type DocumentType = 'SOP' | 'WI' | 'Form' | 'Policy' | 'Specification' | 'Technical' | 'Risk Analysis' | 'Validation Protocol' | 'Record';
export type DocumentStatus = 'Draft' | 'In Review' | 'Approved' | 'Obsolete';
export type DocumentClassification = 'Internal' | 'External' | 'Regulatory' | 'Confidential';
export type DocumentLevel = 1 | 2 | 3 | 4;
export type ValidationPhase = 'IQ' | 'OQ' | 'PQ' | 'Full';

export interface Document {
  id: string;
  documentNumber: string;
  title: string;
  type: DocumentType;
  version: string;
  status: DocumentStatus;
  effectiveDate?: string;
  expirationDate?: string;
  owner?: string;
  department?: string;
  lastReviewed?: string;
  nextReview?: string;
  description?: string;
  classification?: DocumentClassification;
  retentionPeriod?: string;
  scope?: string;
  references?: string;
  typeSpecificData?: Record<string, unknown>;
  parentDocumentId?: string;
  documentLevel?: DocumentLevel;
  validationPhase?: ValidationPhase;
  parentValidationId?: string;
  authorId?: string;
  organizationId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  signatures?: ElectronicSignature[];
  childDocuments?: Document[];
  author?: Profile;
  createdBy?: Profile;
}

// ============================================================================
// Electronic Signature
// ============================================================================

export type SignatureType = 'approval' | 'rejection' | 'review' | 'verification';

export interface ElectronicSignature {
  id: string;
  documentId: string;
  signedById: string;
  signerName: string;
  signerRole: string;
  signatureType: SignatureType;
  signatureHash: string;
  userAgent?: string;
  revoked: boolean;
  revocationReason?: string;
  createdAt: string;
}

// ============================================================================
// CAPA
// ============================================================================

export type CapaType = 'Corrective' | 'Preventive';
export type CapaStatus = 'Open' | 'Investigation' | 'Implementation' | 'Effectiveness Check' | 'Closed';
export type CapaPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type CapaSource = 'Non-Conformance' | 'Audit Finding' | 'Customer Complaint' | 'Management Review' | 'Process Monitoring' | 'Supplier Issue';
export type RootCauseCategory = 'Man' | 'Machine' | 'Method' | 'Material' | 'Measurement' | 'Environment' | 'Management';

export interface Capa {
  id: string;
  capaNumber: string;
  title: string;
  type: CapaType;
  status: CapaStatus;
  priority?: CapaPriority;
  source?: CapaSource;
  sourceReferenceId?: string;
  description: string;
  problemStatement?: string;
  investigationDetails?: string;
  rootCauseAnalysis?: string;
  rootCauseCategory?: RootCauseCategory;
  fiveWhys?: string[];
  correctiveAction?: string;
  effectivenessVerificationMethod?: string;
  effectivenessCriteria?: string;
  effectivenessResult?: 'Effective' | 'Not Effective' | 'Pending Review';
  linkedDocumentId?: string;
  linkedNcrId?: string;
  linkedAuditId?: string;
  assignedTo: string;
  dueDate: string;
  createdDate: string;
  closedDate?: string;
  createdById?: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Non-Conformance
// ============================================================================

export type NcrType = 'Product' | 'Process' | 'System' | 'Supplier' | 'OOS' | 'OOT';
export type NcrStatus = 'Open' | 'Under Investigation' | 'Pending Disposition' | 'Closed';
export type NcrSeverity = 'Critical' | 'Major' | 'Minor';
export type NcrDisposition = 'Use As Is' | 'Rework' | 'Scrap' | 'Return to Supplier' | 'Concession' | 'Pending';

export interface NonConformance {
  id: string;
  ncrNumber: string;
  title: string;
  type: NcrType;
  status: NcrStatus;
  severity?: NcrSeverity;
  source?: string;
  description: string;
  lotNumber?: string;
  quantityAffected?: number;
  disposition?: NcrDisposition;
  linkedCapaId?: string;
  linkedProcedureRef?: string;
  supplierId?: string;
  isOosOot: boolean;
  analyticalMethod?: string;
  measuredValue?: number;
  measuredUnit?: string;
  specLimit?: string;
  phase1Conclusion?: 'Error Found' | 'No Error Found' | 'Pending';
  phase2Required: boolean;
  phase2Conclusion?: 'Confirmed OOS' | 'Invalidated' | 'Pending';
  rejectLot: boolean;
  assignedTo?: string;
  dueDate?: string;
  createdDate: string;
  createdById?: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Batch Record
// ============================================================================

export type BatchStatus = 'In Progress' | 'Pending QA Review' | 'Released' | 'Rejected' | 'Quarantine';
export type BatchStepStatus = 'Pending' | 'In Progress' | 'Completed' | 'Failed';

export interface BatchStep {
  id: string;
  batchRecordId: string;
  stepOrder: number;
  stepName: string;
  instructions?: string;
  expectedValue?: string;
  actualValue?: string;
  status: BatchStepStatus;
  operatorId?: string;
  performedAt?: string;
  signatureHash?: string;
  createdAt: string;
}

export interface BatchRecord {
  id: string;
  lotNumber: string;
  productName: string;
  productCode?: string;
  batchSize?: number;
  batchSizeUnit?: string;
  masterFormulaId?: string;
  manufacturingDate: string;
  expiryDate?: string;
  status: BatchStatus;
  isLocked: boolean;
  qaReleaseDate?: string;
  qaReleasedById?: string;
  organizationId?: string;
  createdById?: string;
  createdAt: string;
  steps?: BatchStep[];
}

// ============================================================================
// Supplier
// ============================================================================

export type SupplierCategory = 'Raw Material' | 'Packaging' | 'Equipment' | 'Service' | 'Contract Manufacturer' | 'Laboratory' | 'Other';
export type SupplierStatus = 'Qualified' | 'Conditional' | 'Disqualified' | 'Under Evaluation';

export interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  category?: SupplierCategory;
  status: SupplierStatus;
  qualificationDate?: string;
  nextReviewDate?: string;
  certifications?: string[];
  performanceScore?: number;
  qualificationDocId?: string;
  organizationId?: string;
  createdById?: string;
  createdAt: string;
}

// ============================================================================
// Form Template & Instance
// ============================================================================

export interface FormFieldDefinition {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'signature' | 'table';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
  validation?: { min?: number; max?: number; pattern?: string };
}

export interface FormTemplate {
  id: string;
  documentId: string;
  title: string;
  version: string;
  fields: FormFieldDefinition[];
  isActive: boolean;
  organizationId?: string;
  createdById?: string;
  createdAt: string;
  instances?: FormInstance[];
}

export type FormInstanceStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

export interface FormInstance {
  id: string;
  templateId: string;
  templateVersion: string;
  referenceNumber: string;
  values: Record<string, unknown>;
  status: FormInstanceStatus;
  isLocked: boolean;
  submittedById?: string;
  submittedAt?: string;
  signatureHash?: string;
  parentDocumentId?: string;
  organizationId?: string;
  createdById?: string;
  createdAt: string;
}

// ============================================================================
// Audit Trail
// ============================================================================

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'SIGN' | 'LOGIN' | 'EXPORT';

export interface AuditTrail {
  id: string;
  action: AuditAction;
  tableName: string;
  recordId?: string;
  userId?: string;
  userEmail?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
  createdAt: string;
}

// ============================================================================
// Document Prerequisite
// ============================================================================

export type PrerequisiteRecordType = 'CAPA' | 'NCR' | 'TRAINING' | 'RISK' | 'AUDIT' | 'CHANGE_CONTROL' | 'DEVIATION';

export interface DocumentPrerequisite {
  id: string;
  organizationId?: string;
  recordType: PrerequisiteRecordType;
  requiredDocType: string;
  requiredDocRef?: string;
  isMandatory: boolean;
  description?: string;
  createdAt: string;
}

// ============================================================================
// Profile
// ============================================================================

export interface Profile {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  department?: string;
  jobTitle?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Organization
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscriptionStatus: 'trial' | 'active' | 'suspended' | 'cancelled';
  settings: string; // JSON string of OrgSettings
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  invitedBy?: string;
  createdAt: string;
}

// ============================================================================
// Audit
// ============================================================================

export type AuditType = 'Internal' | 'External' | 'Supplier';
export type AuditStatus = 'Planned' | 'In Progress' | 'Completed';

export interface AuditFinding {
  id: string;
  description: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Observation';
  referenceClause?: string;
  correctiveActionRequired: boolean;
  capaId?: string;
}

export interface Audit {
  id: string;
  auditNumber: string;
  title: string;
  type: AuditType;
  status: AuditStatus;
  scope?: string;
  scheduledDate: string;
  completedDate?: string;
  leadAuditor: string;
  auditees?: string[];
  findings?: AuditFinding[];
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Training
// ============================================================================

export type TrainingType = 'Onboarding' | 'SOP' | 'Regulatory' | 'Skill' | 'Certification';
export type TrainingStatus = 'Planned' | 'In Progress' | 'Completed' | 'Overdue';

export interface Training {
  id: string;
  title: string;
  description?: string;
  type: TrainingType;
  status: TrainingStatus;
  assignedTo: string;
  dueDate: string;
  completedDate?: string;
  documentId?: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Risk
// ============================================================================

export type RiskCategory = 'Product' | 'Process' | 'System' | 'Supplier';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type RiskStatus = 'Open' | 'Mitigated' | 'Accepted' | 'Closed';

export interface Risk {
  id: string;
  riskNumber: string;
  title: string;
  category?: RiskCategory;
  probability: number; // 1-5
  impact: number; // 1-5
  detectability: number; // 1-5
  rpn: number; // probability * impact * detectability
  riskLevel: RiskLevel;
  mitigation?: string;
  residualRisk?: string;
  status: RiskStatus;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Navigation
// ============================================================================

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  module?: string;
  badge?: number;
  children?: NavItem[];
}

// ============================================================================
// Change Control
// ============================================================================

export type ChangeControlType = 'Planned' | 'Unplanned' | 'Emergency';
export type ChangeControlStatus = 'Requested' | 'Under Review' | 'Approved' | 'In Implementation' | 'Completed' | 'Rejected';
export type ChangeControlPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ChangeControlCategory = 'Process' | 'Equipment' | 'Facility' | 'Document' | 'Material' | 'Computer System' | 'Organizational';

export interface ChangeControl {
  id: string;
  ccNumber: string;
  title: string;
  type: ChangeControlType;
  status: ChangeControlStatus;
  priority: ChangeControlPriority;
  category: ChangeControlCategory;
  description: string;
  justification: string;
  proposedChange: string;
  riskAssessment?: string;
  impactAnalysis?: string;
  implementationPlan?: string;
  implementationDate?: string;
  completionDate?: string;
  linkedDocumentId?: string;
  linkedCapaId?: string;
  assignedTo: string;
  requestedBy: string;
  approvedBy?: string;
  dueDate: string;
  createdById?: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Deviation
// ============================================================================

export type DeviationType = 'Planned' | 'Unplanned';
export type DeviationStatus = 'Open' | 'Under Investigation' | 'Pending QA Review' | 'Approved' | 'Closed';
export type DeviationSeverity = 'Critical' | 'Major' | 'Minor';
export type DeviationCategory = 'Process' | 'Equipment' | 'Material' | 'Environment' | 'Personnel' | 'Documentation';

export interface Deviation {
  id: string;
  devNumber: string;
  title: string;
  type: DeviationType;
  status: DeviationStatus;
  severity: DeviationSeverity;
  category: DeviationCategory;
  description: string;
  deviationDetails: string;
  justification?: string;
  riskAssessment?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  lotNumber?: string;
  productCode?: string;
  quantityAffected?: number;
  linkedCapaId?: string;
  linkedDocumentId?: string;
  assignedTo: string;
  dueDate: string;
  closedDate?: string;
  createdById?: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Navigation
// ============================================================================

export type ActiveSection =
  | 'dashboard'
  | 'documents' | 'document-hierarchy'
  | 'ncr' | 'capa' | 'audits' | 'risks' | 'training' | 'change-control' | 'deviations' | 'batch-records' | 'suppliers' | 'oos-oot' | 'forms'
  | 'reports' | 'compliance'
  | 'user-management';

// ============================================================================
// Type Guards
// ============================================================================

const USER_ROLES: readonly UserRole[] = ['admin', 'quality_manager', 'auditor', 'document_controller', 'executive', 'operator'];

/** Type guard to check if a string is a valid UserRole */
export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

/** Safely cast a string to UserRole, returning a default if invalid */
export function asUserRole(value: string, fallback: UserRole = 'operator'): UserRole {
  return isUserRole(value) ? value : fallback;
}

const INDUSTRY_TYPES: readonly IndustryType[] = ['medical_device', 'pharmaceutical', 'biotech', 'ivd', 'combination_product'];

/** Type guard to check if a string is a valid IndustryType */
export function isIndustryType(value: string): value is IndustryType {
  return INDUSTRY_TYPES.includes(value as IndustryType);
}

/** Safely cast a string to IndustryType, returning a default if invalid */
export function asIndustryType(value: string, fallback: IndustryType = 'medical_device'): IndustryType {
  return isIndustryType(value) ? value : fallback;
}

const SIGNATURE_TYPES: readonly SignatureType[] = ['approval', 'rejection', 'review', 'verification'];

/** Type guard to check if a string is a valid SignatureType */
export function isSignatureType(value: string): value is SignatureType {
  return SIGNATURE_TYPES.includes(value as SignatureType);
}

/** Safely cast an unknown value to a string, with fallback */
export function asString(value: unknown, fallback: string = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/** Default OrgSettings for initialization */
export const DEFAULT_ORG_SETTINGS: OrgSettings = {
  setup_completed: false,
  industry_type: 'medical_device',
  applicable_standards: ['ISO 13485:2016'],
  active_modules: [],
  require_electronic_signatures: true,
  require_prerequisite_docs: true,
  audit_trail_enabled: true,
  notification_settings: {
    capa_overdue: true,
    ncr_overdue: true,
    document_expiry: true,
    training_overdue: true,
    audit_due: true,
  },
};

/** Parse and validate OrgSettings from a JSON string, with fallback to defaults */
export function parseOrgSettings(json: string): OrgSettings {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed === 'object' && parsed !== null) {
      return { ...DEFAULT_ORG_SETTINGS, ...parsed };
    }
    return { ...DEFAULT_ORG_SETTINGS };
  } catch {
    return { ...DEFAULT_ORG_SETTINGS };
  }
}
