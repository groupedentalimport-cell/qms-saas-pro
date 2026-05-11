// IDataProvider.ts — Abstract data provider interface
// Enables switching between demo mode (Zustand in-memory) and Supabase backend
// All data access in the application should go through this interface

import type {
  Document,
  Capa,
  NonConformance,
  BatchRecord,
  Supplier,
  FormTemplate,
  FormInstance,
  AuditTrail,
  Audit,
  Training,
  Risk,
  DocumentPrerequisite,
  Organization,
  OrganizationMember,
  Profile,
  ChangeControl,
  Deviation,
  ElectronicSignature,
  OrgSettings,
} from '@/types/qms';

// ============================================================================
// Parameter Types
// ============================================================================

export interface AuditLogParams {
  action: string;
  tableName: string;
  recordId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  organizationId?: string;
}

export interface SignatureParams {
  signerId: string;
  recordId: string;
  signatureType: string;
  passwordConfirmation: string;
}

// ============================================================================
// IDataProvider Interface
// ============================================================================

export interface IDataProvider {
  // Profiles
  getProfiles(): Profile[];
  getProfile(id: string): Profile | undefined;
  addProfile(profile: Profile): void;
  updateProfile(id: string, updates: Partial<Profile>): void;

  // Organizations
  getOrganizations(): Organization[];
  getOrganization(id: string): Organization | undefined;
  updateOrganization(id: string, updates: Partial<Organization>): void;
  updateOrgSettings(orgId: string, settings: Partial<OrgSettings>): void;

  // Organization Members
  getOrgMembers(): OrganizationMember[];

  // Documents
  getDocuments(): Document[];
  getDocument(id: string): Document | undefined;
  addDocument(doc: Document): void;
  updateDocument(id: string, updates: Partial<Document>): void;

  // CAPAs
  getCapas(): Capa[];
  addCapa(capa: Capa): void;
  updateCapa(id: string, updates: Partial<Capa>): void;

  // NCRs
  getNcrs(): NonConformance[];
  addNcr(ncr: NonConformance): void;
  updateNcr(id: string, updates: Partial<NonConformance>): void;

  // Batch Records
  getBatchRecords(): BatchRecord[];
  addBatchRecord(batch: BatchRecord): void;
  updateBatchRecord(id: string, updates: Partial<BatchRecord>): void;

  // Suppliers
  getSuppliers(): Supplier[];
  addSupplier(supplier: Supplier): void;
  updateSupplier(id: string, updates: Partial<Supplier>): void;

  // Form Templates
  getFormTemplates(): FormTemplate[];
  addFormTemplate(template: FormTemplate): void;

  // Form Instances
  getFormInstances(): FormInstance[];
  addFormInstance(instance: FormInstance): void;
  updateFormInstance(id: string, updates: Partial<FormInstance>): void;

  // Audits
  getAudits(): Audit[];
  addAudit(audit: Audit): void;
  updateAudit(id: string, updates: Partial<Audit>): void;

  // Training
  getTraining(): Training[];
  addTraining(training: Training): void;
  updateTraining(id: string, updates: Partial<Training>): void;

  // Risks
  getRisks(): Risk[];
  addRisk(risk: Risk): void;
  updateRisk(id: string, updates: Partial<Risk>): void;

  // Change Controls
  getChangeControls(): ChangeControl[];
  addChangeControl(cc: ChangeControl): void;
  updateChangeControl(id: string, updates: Partial<ChangeControl>): void;

  // Deviations
  getDeviations(): Deviation[];
  addDeviation(dev: Deviation): void;
  updateDeviation(id: string, updates: Partial<Deviation>): void;

  // Audit Trail
  getAuditTrails(): AuditTrail[];
  logAudit(params: AuditLogParams): AuditTrail;

  // Prerequisites
  getPrerequisites(): DocumentPrerequisite[];

  // Electronic Signatures
  getSignatures(documentId: string): ElectronicSignature[];

  // Signature generation (returns hash)
  generateSignatureHash(params: SignatureParams): string;

  // Current user context
  getCurrentUserId(): string;
  getCurrentUserEmail(): string;
  getCurrentOrganizationId(): string;
}
