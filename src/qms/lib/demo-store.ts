// Demo Store - Zustand store for managing QMS data in memory (demo mode)
import { create } from 'zustand';
import type { Profile, Organization, Document, Capa, NonConformance, BatchRecord, Supplier, FormTemplate, FormInstance, AuditTrail, Audit, Training, Risk, DocumentPrerequisite, OrganizationMember, OrgSettings, ChangeControl, Deviation } from '@/qms/types/qms';
import { parseOrgSettings } from '@/qms/types/qms';
import { mockProfiles, mockOrganizations, mockOrgMembers, mockDocuments, mockCapas, mockNCRs, mockBatchRecords, mockSuppliers, mockFormTemplates, mockFormInstances, mockAudits, mockTraining, mockRisks, mockAuditTrails, mockPrerequisites, mockChangeControls, mockDeviations } from './mock-data';
import { generateSignatureHashSync } from '@/qms/services/compliance/signatureEngine';

interface QMSStore {
  // Data
  profiles: Profile[];
  organizations: Organization[];
  orgMembers: OrganizationMember[];
  documents: Document[];
  capas: Capa[];
  ncrs: NonConformance[];
  batchRecords: BatchRecord[];
  suppliers: Supplier[];
  formTemplates: FormTemplate[];
  formInstances: FormInstance[];
  audits: Audit[];
  training: Training[];
  risks: Risk[];
  auditTrails: AuditTrail[];
  prerequisites: DocumentPrerequisite[];
  changeControls: ChangeControl[];
  deviations: Deviation[];

  // Computed helpers
  getProfile: (id: string) => Profile | undefined;
  getOrgSettings: (orgId: string) => OrgSettings | null;
  checkPrerequisites: (recordType: string, orgId: string) => { met: boolean; missing: DocumentPrerequisite[] };

  // CRUD operations
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  addCapa: (capa: Capa) => void;
  updateCapa: (id: string, updates: Partial<Capa>) => void;
  addNCR: (ncr: NonConformance) => void;
  updateNCR: (id: string, updates: Partial<NonConformance>) => void;
  addBatchRecord: (batch: BatchRecord) => void;
  updateBatchRecord: (id: string, updates: Partial<BatchRecord>) => void;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  addAudit: (audit: Audit) => void;
  updateAudit: (id: string, updates: Partial<Audit>) => void;
  addTraining: (training: Training) => void;
  updateTraining: (id: string, updates: Partial<Training>) => void;
  addRisk: (risk: Risk) => void;
  updateRisk: (id: string, updates: Partial<Risk>) => void;
  addFormTemplate: (template: FormTemplate) => void;
  addFormInstance: (instance: FormInstance) => void;
  updateFormInstance: (id: string, updates: Partial<FormInstance>) => void;
  addChangeControl: (cc: ChangeControl) => void;
  updateChangeControl: (id: string, updates: Partial<ChangeControl>) => void;
  addDeviation: (dev: Deviation) => void;
  updateDeviation: (id: string, updates: Partial<Deviation>) => void;

  // Profile management
  addProfile: (profile: Profile) => void;
  updateProfile: (id: string, updates: Partial<Profile>) => void;

  // Audit trail logging
  logAudit: (action: AuditTrail['action'], tableName: string, recordId?: string, oldValues?: Record<string, unknown>, newValues?: Record<string, unknown>, userContext?: { userId?: string; userEmail?: string; organizationId?: string }) => void;

  // Organization management
  updateOrganization: (id: string, updates: Partial<Organization>) => void;
  updateOrgSettings: (orgId: string, settings: Partial<OrgSettings>) => void;

  // Signature generation
  generateSignatureHash: (signerId: string, documentId: string, type: string) => string;
}

export const useQMSStore = create<QMSStore>((set, get) => ({
  // Initial data from mock
  profiles: mockProfiles,
  organizations: mockOrganizations,
  orgMembers: mockOrgMembers,
  documents: mockDocuments,
  capas: mockCapas,
  ncrs: mockNCRs,
  batchRecords: mockBatchRecords,
  suppliers: mockSuppliers,
  formTemplates: mockFormTemplates,
  formInstances: mockFormInstances,
  audits: mockAudits,
  training: mockTraining,
  risks: mockRisks,
  auditTrails: mockAuditTrails,
  prerequisites: mockPrerequisites,
  changeControls: mockChangeControls,
  deviations: mockDeviations,

  // Computed helpers
  getProfile: (id: string) => get().profiles.find(p => p.id === id),

  getOrgSettings: (orgId: string) => {
    const org = get().organizations.find(o => o.id === orgId);
    if (!org) return null;
    return parseOrgSettings(org.settings);
  },

  checkPrerequisites: (recordType: string, orgId: string) => {
    const state = get();
    const prereqs = state.prerequisites.filter(
      p => p.recordType === recordType && (!p.organizationId || p.organizationId === orgId)
    );
    const missing: DocumentPrerequisite[] = [];
    for (const prereq of prereqs) {
      const hasDoc = state.documents.some(
        d => d.type === prereq.requiredDocType && d.status === 'Approved' &&
        (!prereq.requiredDocRef || d.documentNumber === prereq.requiredDocRef)
      );
      if (!hasDoc) {
        missing.push(prereq);
      }
    }
    return { met: missing.length === 0, missing };
  },

  // CRUD operations
  addDocument: (doc) => set(state => {
    state.logAudit('CREATE', 'Document', doc.id, undefined, { documentNumber: doc.documentNumber, title: doc.title, status: doc.status });
    return { documents: [...state.documents, doc] };
  }),

  updateDocument: (id, updates) => set(state => {
    const old = state.documents.find(d => d.id === id);
    state.logAudit('UPDATE', 'Document', id, old ? { status: old.status } : undefined, updates);
    return { documents: state.documents.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d) };
  }),

  addCapa: (capa) => set(state => {
    state.logAudit('CREATE', 'Capa', capa.id, undefined, { capaNumber: capa.capaNumber, title: capa.title, status: capa.status });
    return { capas: [...state.capas, capa] };
  }),

  updateCapa: (id, updates) => set(state => {
    const old = state.capas.find(c => c.id === id);
    state.logAudit('UPDATE', 'Capa', id, old ? { status: old.status } : undefined, updates);
    return { capas: state.capas.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c) };
  }),

  addNCR: (ncr) => set(state => {
    state.logAudit('CREATE', 'NonConformance', ncr.id, undefined, { ncrNumber: ncr.ncrNumber, title: ncr.title, status: ncr.status });
    return { ncrs: [...state.ncrs, ncr] };
  }),

  updateNCR: (id, updates) => set(state => {
    const old = state.ncrs.find(n => n.id === id);
    state.logAudit('UPDATE', 'NonConformance', id, old ? { status: old.status } : undefined, updates);
    return { ncrs: state.ncrs.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n) };
  }),

  addBatchRecord: (batch) => set(state => {
    state.logAudit('CREATE', 'BatchRecord', batch.id, undefined, { lotNumber: batch.lotNumber, productName: batch.productName, status: batch.status });
    return { batchRecords: [...state.batchRecords, batch] };
  }),

  updateBatchRecord: (id, updates) => set(state => {
    const old = state.batchRecords.find(b => b.id === id);
    state.logAudit('UPDATE', 'BatchRecord', id, old ? { status: old.status } : undefined, updates);
    return { batchRecords: state.batchRecords.map(b => b.id === id ? { ...b, ...updates } : b) };
  }),

  addSupplier: (supplier) => set(state => {
    state.logAudit('CREATE', 'Supplier', supplier.id, undefined, { supplierCode: supplier.supplierCode, name: supplier.name, status: supplier.status });
    return { suppliers: [...state.suppliers, supplier] };
  }),

  updateSupplier: (id, updates) => set(state => {
    const old = state.suppliers.find(s => s.id === id);
    state.logAudit('UPDATE', 'Supplier', id, old ? { status: old.status } : undefined, updates);
    return { suppliers: state.suppliers.map(s => s.id === id ? { ...s, ...updates } : s) };
  }),

  addAudit: (audit) => set(state => {
    state.logAudit('CREATE', 'Audit', audit.id, undefined, { auditNumber: audit.auditNumber, title: audit.title, status: audit.status });
    return { audits: [...state.audits, audit] };
  }),

  updateAudit: (id, updates) => set(state => {
    const old = state.audits.find(a => a.id === id);
    state.logAudit('UPDATE', 'Audit', id, old ? { status: old.status } : undefined, updates);
    return { audits: state.audits.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a) };
  }),

  addTraining: (training) => set(state => {
    state.logAudit('CREATE', 'Training', training.id, undefined, { title: training.title, status: training.status });
    return { training: [...state.training, training] };
  }),

  updateTraining: (id, updates) => set(state => {
    const old = state.training.find(t => t.id === id);
    state.logAudit('UPDATE', 'Training', id, old ? { status: old.status } : undefined, updates);
    return { training: state.training.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t) };
  }),

  addRisk: (risk) => set(state => {
    state.logAudit('CREATE', 'Risk', risk.id, undefined, { riskNumber: risk.riskNumber, title: risk.title, riskLevel: risk.riskLevel });
    return { risks: [...state.risks, risk] };
  }),

  updateRisk: (id, updates) => set(state => {
    const old = state.risks.find(r => r.id === id);
    state.logAudit('UPDATE', 'Risk', id, old ? { status: old.status } : undefined, updates);
    return { risks: state.risks.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r) };
  }),

  addFormTemplate: (template) => set(state => {
    state.logAudit('CREATE', 'FormTemplate', template.id, undefined, { title: template.title, version: template.version, isActive: template.isActive });
    return { formTemplates: [...state.formTemplates, template] };
  }),

  addFormInstance: (instance) => set(state => {
    state.logAudit('CREATE', 'FormInstance', instance.id, undefined, { referenceNumber: instance.referenceNumber, status: instance.status });
    return { formInstances: [...state.formInstances, instance] };
  }),

  updateFormInstance: (id, updates) => set(state => {
    const old = state.formInstances.find(f => f.id === id);
    state.logAudit('UPDATE', 'FormInstance', id, old ? { status: old.status } : undefined, updates);
    return { formInstances: state.formInstances.map(f => f.id === id ? { ...f, ...updates } : f) };
  }),

  addChangeControl: (cc) => set(state => {
    state.logAudit('CREATE', 'ChangeControl', cc.id, undefined, { ccNumber: cc.ccNumber, title: cc.title, status: cc.status });
    return { changeControls: [...state.changeControls, cc] };
  }),

  updateChangeControl: (id, updates) => set(state => {
    const old = state.changeControls.find(c => c.id === id);
    state.logAudit('UPDATE', 'ChangeControl', id, old ? { status: old.status } : undefined, updates);
    return { changeControls: state.changeControls.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c) };
  }),

  addDeviation: (dev) => set(state => {
    state.logAudit('CREATE', 'Deviation', dev.id, undefined, { devNumber: dev.devNumber, title: dev.title, status: dev.status });
    return { deviations: [...state.deviations, dev] };
  }),

  updateDeviation: (id, updates) => set(state => {
    const old = state.deviations.find(d => d.id === id);
    state.logAudit('UPDATE', 'Deviation', id, old ? { status: old.status } : undefined, updates);
    return { deviations: state.deviations.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d) };
  }),

  // Profile management
  addProfile: (profile) => set(state => {
    state.logAudit('CREATE', 'Profile', profile.id, undefined, { email: profile.email, fullName: profile.fullName, role: profile.role });
    return { profiles: [...state.profiles, profile] };
  }),

  updateProfile: (id, updates) => set(state => {
    const old = state.profiles.find(p => p.id === id);
    state.logAudit('UPDATE', 'Profile', id, old ? { role: old.role, department: old.department } : undefined, updates);
    return { profiles: state.profiles.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p) };
  }),

  // Audit trail logging
  logAudit: (action, tableName, recordId, oldValues, newValues, userContext) => {
    // Resolve current user from store state (not hardcoded)
    // Falls back to the first profile if no user context is provided
    const currentState = get();
    const activeUser = userContext?.userId
      ? currentState.profiles.find(p => p.id === userContext.userId)
      : currentState.profiles.find(p => p.email === 'admin@qms-demo.com');
    const activeOrg = currentState.organizations[0];
    const entry: AuditTrail = {
      id: `at-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action,
      tableName,
      recordId,
      userId: userContext?.userId ?? activeUser?.id ?? 'anonymous',
      userEmail: userContext?.userEmail ?? activeUser?.email ?? 'unknown',
      oldValues,
      newValues,
      organizationId: userContext?.organizationId ?? activeOrg?.id ?? 'unknown',
      createdAt: new Date().toISOString(),
    };
    set(state => ({ auditTrails: [entry, ...state.auditTrails] }));
  },

  // Organization management
  updateOrganization: (id, updates) => set(state => ({
    organizations: state.organizations.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o),
  })),

  updateOrgSettings: (orgId, settingsUpdates) => set(state => {
    const org = state.organizations.find(o => o.id === orgId);
    if (!org) return state;
    const currentSettings = parseOrgSettings(org.settings);
    const newSettings = { ...currentSettings, ...settingsUpdates };
    return {
      organizations: state.organizations.map(o =>
        o.id === orgId ? { ...o, settings: JSON.stringify(newSettings), updatedAt: new Date().toISOString() } : o
      ),
    };
  }),

  // Signature generation (delegates to SHA-256 based signatureEngine)
  generateSignatureHash: (signerId, documentId, type) => {
    const timestamp = new Date().toISOString();
    return generateSignatureHashSync({
      userId: signerId,
      recordId: documentId,
      timestamp,
      passwordConfirmation: type,
    });
  },
}));
