// DemoProvider.ts — IDataProvider implementation backed by Zustand demo-store
// All data operations delegate to the in-memory Zustand store
// This provider is used when Supabase is not configured (demo mode)
//
// Multi-tenant fidelity: all list-returning methods filter by organizationId
// to mirror the RLS policies that would be enforced by Supabase in production.

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
} from '@/qms/types/qms';
import { useQMSStore } from '@/qms/lib/demo-store';
import { generateSignatureHashSync } from '@/qms/services/compliance/signatureEngine';

// ============================================================================
// Demo Context Constants
// ============================================================================

const DEMO_USER_ID = 'user-001';
const DEMO_USER_EMAIL = 'admin@qms-demo.com';
const DEMO_ORG_ID = 'org-001';

// ============================================================================
// Type helper: entities that carry an organizationId field
// ============================================================================

type OrgScoped = { organizationId?: string; id: string };

/**
 * Filters an array of org-scoped entities to only those belonging to the
 * current demo organization. If an entity has no `organizationId` set
 * (legacy data), it is included by default to avoid breaking existing demos.
 */
function filterByOrg<T extends OrgScoped>(items: T[], orgId: string): T[] {
  return items.filter(item => !item.organizationId || item.organizationId === orgId);
}

// ============================================================================
// DemoProvider Implementation
// ============================================================================

export class DemoProvider implements IDataProvider {

  /** The organization ID used for multi-tenant filtering in demo mode */
  private readonly orgId: string;

  constructor(orgId: string = DEMO_ORG_ID) {
    this.orgId = orgId;
  }

  // --------------------------------------------------------------------------
  // Profiles
  // --------------------------------------------------------------------------

  getProfiles(): Profile[] {
    return filterByOrg(useQMSStore.getState().profiles, this.orgId);
  }

  getProfile(id: string): Profile | undefined {
    return useQMSStore.getState().getProfile(id);
  }

  addProfile(profile: Profile): void {
    useQMSStore.getState().addProfile(profile);
  }

  updateProfile(id: string, updates: Partial<Profile>): void {
    useQMSStore.getState().updateProfile(id, updates);
  }

  // --------------------------------------------------------------------------
  // Organizations
  // --------------------------------------------------------------------------

  getOrganizations(): Organization[] {
    return useQMSStore.getState().organizations;
  }

  getOrganization(id: string): Organization | undefined {
    return useQMSStore.getState().organizations.find(o => o.id === id);
  }

  updateOrganization(id: string, updates: Partial<Organization>): void {
    useQMSStore.getState().updateOrganization(id, updates);
  }

  updateOrgSettings(orgId: string, settings: Partial<OrgSettings>): void {
    useQMSStore.getState().updateOrgSettings(orgId, settings);
  }

  // --------------------------------------------------------------------------
  // Organization Members
  // --------------------------------------------------------------------------

  getOrgMembers(): OrganizationMember[] {
    const orgId = this.orgId;
    return useQMSStore.getState().orgMembers.filter(
      m => !m.organizationId || m.organizationId === orgId,
    );
  }

  // --------------------------------------------------------------------------
  // Documents
  // --------------------------------------------------------------------------

  getDocuments(): Document[] {
    return filterByOrg(useQMSStore.getState().documents, this.orgId);
  }

  getDocument(id: string): Document | undefined {
    const doc = useQMSStore.getState().documents.find(d => d.id === id);
    // Verify org membership for single-record access
    if (doc && doc.organizationId && doc.organizationId !== this.orgId) {
      return undefined;
    }
    return doc;
  }

  addDocument(doc: Document): void {
    useQMSStore.getState().addDocument(doc);
  }

  updateDocument(id: string, updates: Partial<Document>): void {
    useQMSStore.getState().updateDocument(id, updates);
  }

  // --------------------------------------------------------------------------
  // CAPAs
  // --------------------------------------------------------------------------

  getCapas(): Capa[] {
    return filterByOrg(useQMSStore.getState().capas, this.orgId);
  }

  addCapa(capa: Capa): void {
    useQMSStore.getState().addCapa(capa);
  }

  updateCapa(id: string, updates: Partial<Capa>): void {
    useQMSStore.getState().updateCapa(id, updates);
  }

  // --------------------------------------------------------------------------
  // NCRs
  // --------------------------------------------------------------------------

  getNcrs(): NonConformance[] {
    return filterByOrg(useQMSStore.getState().ncrs, this.orgId);
  }

  addNcr(ncr: NonConformance): void {
    useQMSStore.getState().addNCR(ncr);
  }

  updateNcr(id: string, updates: Partial<NonConformance>): void {
    useQMSStore.getState().updateNCR(id, updates);
  }

  // --------------------------------------------------------------------------
  // Batch Records
  // --------------------------------------------------------------------------

  getBatchRecords(): BatchRecord[] {
    return filterByOrg(useQMSStore.getState().batchRecords, this.orgId);
  }

  addBatchRecord(batch: BatchRecord): void {
    useQMSStore.getState().addBatchRecord(batch);
  }

  updateBatchRecord(id: string, updates: Partial<BatchRecord>): void {
    useQMSStore.getState().updateBatchRecord(id, updates);
  }

  // --------------------------------------------------------------------------
  // Suppliers
  // --------------------------------------------------------------------------

  getSuppliers(): Supplier[] {
    return filterByOrg(useQMSStore.getState().suppliers, this.orgId);
  }

  addSupplier(supplier: Supplier): void {
    useQMSStore.getState().addSupplier(supplier);
  }

  updateSupplier(id: string, updates: Partial<Supplier>): void {
    useQMSStore.getState().updateSupplier(id, updates);
  }

  // --------------------------------------------------------------------------
  // Form Templates
  // --------------------------------------------------------------------------

  getFormTemplates(): FormTemplate[] {
    return filterByOrg(useQMSStore.getState().formTemplates, this.orgId);
  }

  addFormTemplate(template: FormTemplate): void {
    useQMSStore.getState().addFormTemplate(template);
  }

  // --------------------------------------------------------------------------
  // Form Instances
  // --------------------------------------------------------------------------

  getFormInstances(): FormInstance[] {
    return filterByOrg(useQMSStore.getState().formInstances, this.orgId);
  }

  addFormInstance(instance: FormInstance): void {
    useQMSStore.getState().addFormInstance(instance);
  }

  updateFormInstance(id: string, updates: Partial<FormInstance>): void {
    useQMSStore.getState().updateFormInstance(id, updates);
  }

  // --------------------------------------------------------------------------
  // Audits
  // --------------------------------------------------------------------------

  getAudits(): Audit[] {
    return filterByOrg(useQMSStore.getState().audits, this.orgId);
  }

  addAudit(audit: Audit): void {
    useQMSStore.getState().addAudit(audit);
  }

  updateAudit(id: string, updates: Partial<Audit>): void {
    useQMSStore.getState().updateAudit(id, updates);
  }

  // --------------------------------------------------------------------------
  // Training
  // --------------------------------------------------------------------------

  getTraining(): Training[] {
    return filterByOrg(useQMSStore.getState().training, this.orgId);
  }

  addTraining(training: Training): void {
    useQMSStore.getState().addTraining(training);
  }

  updateTraining(id: string, updates: Partial<Training>): void {
    useQMSStore.getState().updateTraining(id, updates);
  }

  // --------------------------------------------------------------------------
  // Risks
  // --------------------------------------------------------------------------

  getRisks(): Risk[] {
    return filterByOrg(useQMSStore.getState().risks, this.orgId);
  }

  addRisk(risk: Risk): void {
    useQMSStore.getState().addRisk(risk);
  }

  updateRisk(id: string, updates: Partial<Risk>): void {
    useQMSStore.getState().updateRisk(id, updates);
  }

  // --------------------------------------------------------------------------
  // Change Controls
  // --------------------------------------------------------------------------

  getChangeControls(): ChangeControl[] {
    return filterByOrg(useQMSStore.getState().changeControls, this.orgId);
  }

  addChangeControl(cc: ChangeControl): void {
    useQMSStore.getState().addChangeControl(cc);
  }

  updateChangeControl(id: string, updates: Partial<ChangeControl>): void {
    useQMSStore.getState().updateChangeControl(id, updates);
  }

  // --------------------------------------------------------------------------
  // Deviations
  // --------------------------------------------------------------------------

  getDeviations(): Deviation[] {
    return filterByOrg(useQMSStore.getState().deviations, this.orgId);
  }

  addDeviation(dev: Deviation): void {
    useQMSStore.getState().addDeviation(dev);
  }

  updateDeviation(id: string, updates: Partial<Deviation>): void {
    useQMSStore.getState().updateDeviation(id, updates);
  }

  // --------------------------------------------------------------------------
  // Audit Trail
  // --------------------------------------------------------------------------

  getAuditTrails(): AuditTrail[] {
    return filterByOrg(useQMSStore.getState().auditTrails, this.orgId);
  }

  logAudit(params: AuditLogParams): AuditTrail {
    const store = useQMSStore.getState();
    const entry: AuditTrail = {
      id: `at-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action: params.action as AuditTrail['action'],
      tableName: params.tableName,
      recordId: params.recordId,
      userId: DEMO_USER_ID,
      userEmail: DEMO_USER_EMAIL,
      oldValues: params.oldValues,
      newValues: params.newValues,
      organizationId: params.organizationId || this.orgId,
      createdAt: new Date().toISOString(),
    };

    store.logAudit(
      params.action as AuditTrail['action'],
      params.tableName,
      params.recordId,
      params.oldValues,
      params.newValues,
    );

    return entry;
  }

  // --------------------------------------------------------------------------
  // Prerequisites
  // --------------------------------------------------------------------------

  getPrerequisites(): DocumentPrerequisite[] {
    return filterByOrg(useQMSStore.getState().prerequisites, this.orgId);
  }

  // --------------------------------------------------------------------------
  // Electronic Signatures
  // --------------------------------------------------------------------------

  getSignatures(documentId: string): ElectronicSignature[] {
    const store = useQMSStore.getState();

    // Ensure the document belongs to the current org before returning signatures
    const doc = store.documents.find(d => d.id === documentId);
    if (doc && doc.organizationId && doc.organizationId !== this.orgId) {
      return [];
    }

    if (doc && doc.signatures) {
      return doc.signatures;
    }

    // Fallback: reconstruct from audit trail SIGN entries (org-scoped)
    const signEntries = store.auditTrails.filter(
      t => t.recordId === documentId && t.action === 'SIGN'
        && (!t.organizationId || t.organizationId === this.orgId),
    );

    return signEntries.map(entry => ({
      id: entry.id,
      documentId,
      signedById: entry.userId || 'unknown',
      signerName: (entry.newValues?.signerName as string) || 'Unknown',
      signerRole: (entry.newValues?.signerRole as string) || 'Unknown',
      signatureType: (entry.newValues?.signatureType as ElectronicSignature['signatureType']) || 'approval',
      signatureHash: (entry.newValues?.signatureHash as string) || '',
      userAgent: entry.userAgent,
      revoked: false,
      createdAt: entry.createdAt,
    }));
  }

  generateSignatureHash(params: SignatureParams): string {
    return generateSignatureHashSync({
      userId: params.signerId,
      recordId: params.recordId,
      timestamp: new Date().toISOString(),
      passwordConfirmation: params.passwordConfirmation,
    });
  }

  // --------------------------------------------------------------------------
  // Current User Context
  // --------------------------------------------------------------------------

  getCurrentUserId(): string {
    return DEMO_USER_ID;
  }

  getCurrentUserEmail(): string {
    return DEMO_USER_EMAIL;
  }

  getCurrentOrganizationId(): string {
    return this.orgId;
  }
}
