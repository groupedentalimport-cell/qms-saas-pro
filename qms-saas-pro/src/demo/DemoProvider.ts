// DemoProvider.ts — IDataProvider implementation backed by Zustand demo-store
// All data operations delegate to the in-memory Zustand store
// This provider is used when Supabase is not configured (demo mode)

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
import { useQMSStore } from '@/lib/demo-store';
import { generateSignatureHashSync } from '@/services/compliance/signatureEngine';

// ============================================================================
// Demo Context Constants
// ============================================================================

const DEMO_USER_ID = 'user-001';
const DEMO_USER_EMAIL = 'admin@qms-demo.com';
const DEMO_ORG_ID = 'org-001';

// ============================================================================
// DemoProvider Implementation
// ============================================================================

export class DemoProvider implements IDataProvider {
  // --------------------------------------------------------------------------
  // Profiles
  // --------------------------------------------------------------------------

  getProfiles(): Profile[] {
    return useQMSStore.getState().profiles;
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
    return useQMSStore.getState().orgMembers;
  }

  // --------------------------------------------------------------------------
  // Documents
  // --------------------------------------------------------------------------

  getDocuments(): Document[] {
    return useQMSStore.getState().documents;
  }

  getDocument(id: string): Document | undefined {
    return useQMSStore.getState().documents.find(d => d.id === id);
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
    return useQMSStore.getState().capas;
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
    return useQMSStore.getState().ncrs;
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
    return useQMSStore.getState().batchRecords;
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
    return useQMSStore.getState().suppliers;
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
    return useQMSStore.getState().formTemplates;
  }

  addFormTemplate(template: FormTemplate): void {
    useQMSStore.getState().addFormTemplate(template);
  }

  // --------------------------------------------------------------------------
  // Form Instances
  // --------------------------------------------------------------------------

  getFormInstances(): FormInstance[] {
    return useQMSStore.getState().formInstances;
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
    return useQMSStore.getState().audits;
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
    return useQMSStore.getState().training;
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
    return useQMSStore.getState().risks;
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
    return useQMSStore.getState().changeControls;
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
    return useQMSStore.getState().deviations;
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
    return useQMSStore.getState().auditTrails;
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
      organizationId: params.organizationId || DEMO_ORG_ID,
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
    return useQMSStore.getState().prerequisites;
  }

  // --------------------------------------------------------------------------
  // Electronic Signatures
  // --------------------------------------------------------------------------

  getSignatures(documentId: string): ElectronicSignature[] {
    const store = useQMSStore.getState();
    const doc = store.documents.find(d => d.id === documentId);
    if (doc && doc.signatures) {
      return doc.signatures;
    }

    // Fallback: reconstruct from audit trail SIGN entries
    const signEntries = store.auditTrails.filter(
      t => t.recordId === documentId && t.action === 'SIGN',
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
    return DEMO_ORG_ID;
  }
}
