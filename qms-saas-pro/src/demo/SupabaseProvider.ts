// SupabaseProvider.ts — Stub IDataProvider implementation for Supabase backend
// All methods throw an error indicating Supabase is not configured
// This provider will be completed when Supabase integration is ready

import type { IDataProvider, AuditLogParams, SignatureParams } from './IDataProvider';
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
// Configuration Error Message
// ============================================================================

const NOT_CONFIGURED_MESSAGE =
  'Supabase backend is not configured. To enable Supabase, set the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables. ' +
  'The application is currently running in demo mode with in-memory data.';

function throwNotConfigured(): never {
  throw new Error(NOT_CONFIGURED_MESSAGE);
}

// ============================================================================
// SupabaseProvider Stub Implementation
// ============================================================================

export class SupabaseProvider implements IDataProvider {
  // Profiles
  getProfiles(): Profile[] {
    throwNotConfigured();
  }
  getProfile(_id: string): Profile | undefined {
    throwNotConfigured();
  }
  addProfile(_profile: Profile): void {
    throwNotConfigured();
  }
  updateProfile(_id: string, _updates: Partial<Profile>): void {
    throwNotConfigured();
  }

  // Organizations
  getOrganizations(): Organization[] {
    throwNotConfigured();
  }
  getOrganization(_id: string): Organization | undefined {
    throwNotConfigured();
  }
  updateOrganization(_id: string, _updates: Partial<Organization>): void {
    throwNotConfigured();
  }
  updateOrgSettings(_orgId: string, _settings: Partial<OrgSettings>): void {
    throwNotConfigured();
  }

  // Organization Members
  getOrgMembers(): OrganizationMember[] {
    throwNotConfigured();
  }

  // Documents
  getDocuments(): Document[] {
    throwNotConfigured();
  }
  getDocument(_id: string): Document | undefined {
    throwNotConfigured();
  }
  addDocument(_doc: Document): void {
    throwNotConfigured();
  }
  updateDocument(_id: string, _updates: Partial<Document>): void {
    throwNotConfigured();
  }

  // CAPAs
  getCapas(): Capa[] {
    throwNotConfigured();
  }
  addCapa(_capa: Capa): void {
    throwNotConfigured();
  }
  updateCapa(_id: string, _updates: Partial<Capa>): void {
    throwNotConfigured();
  }

  // NCRs
  getNcrs(): NonConformance[] {
    throwNotConfigured();
  }
  addNcr(_ncr: NonConformance): void {
    throwNotConfigured();
  }
  updateNcr(_id: string, _updates: Partial<NonConformance>): void {
    throwNotConfigured();
  }

  // Batch Records
  getBatchRecords(): BatchRecord[] {
    throwNotConfigured();
  }
  addBatchRecord(_batch: BatchRecord): void {
    throwNotConfigured();
  }
  updateBatchRecord(_id: string, _updates: Partial<BatchRecord>): void {
    throwNotConfigured();
  }

  // Suppliers
  getSuppliers(): Supplier[] {
    throwNotConfigured();
  }
  addSupplier(_supplier: Supplier): void {
    throwNotConfigured();
  }
  updateSupplier(_id: string, _updates: Partial<Supplier>): void {
    throwNotConfigured();
  }

  // Form Templates
  getFormTemplates(): FormTemplate[] {
    throwNotConfigured();
  }
  addFormTemplate(_template: FormTemplate): void {
    throwNotConfigured();
  }

  // Form Instances
  getFormInstances(): FormInstance[] {
    throwNotConfigured();
  }
  addFormInstance(_instance: FormInstance): void {
    throwNotConfigured();
  }
  updateFormInstance(_id: string, _updates: Partial<FormInstance>): void {
    throwNotConfigured();
  }

  // Audits
  getAudits(): Audit[] {
    throwNotConfigured();
  }
  addAudit(_audit: Audit): void {
    throwNotConfigured();
  }
  updateAudit(_id: string, _updates: Partial<Audit>): void {
    throwNotConfigured();
  }

  // Training
  getTraining(): Training[] {
    throwNotConfigured();
  }
  addTraining(_training: Training): void {
    throwNotConfigured();
  }
  updateTraining(_id: string, _updates: Partial<Training>): void {
    throwNotConfigured();
  }

  // Risks
  getRisks(): Risk[] {
    throwNotConfigured();
  }
  addRisk(_risk: Risk): void {
    throwNotConfigured();
  }
  updateRisk(_id: string, _updates: Partial<Risk>): void {
    throwNotConfigured();
  }

  // Change Controls
  getChangeControls(): ChangeControl[] {
    throwNotConfigured();
  }
  addChangeControl(_cc: ChangeControl): void {
    throwNotConfigured();
  }
  updateChangeControl(_id: string, _updates: Partial<ChangeControl>): void {
    throwNotConfigured();
  }

  // Deviations
  getDeviations(): Deviation[] {
    throwNotConfigured();
  }
  addDeviation(_dev: Deviation): void {
    throwNotConfigured();
  }
  updateDeviation(_id: string, _updates: Partial<Deviation>): void {
    throwNotConfigured();
  }

  // Audit Trail
  getAuditTrails(): AuditTrail[] {
    throwNotConfigured();
  }
  logAudit(_params: AuditLogParams): AuditTrail {
    throwNotConfigured();
  }

  // Prerequisites
  getPrerequisites(): DocumentPrerequisite[] {
    throwNotConfigured();
  }

  // Electronic Signatures
  getSignatures(_documentId: string): ElectronicSignature[] {
    throwNotConfigured();
  }

  generateSignatureHash(_params: SignatureParams): string {
    throwNotConfigured();
  }

  // Current User Context
  getCurrentUserId(): string {
    throwNotConfigured();
  }
  getCurrentUserEmail(): string {
    throwNotConfigured();
  }
  getCurrentOrganizationId(): string {
    throwNotConfigured();
  }
}
