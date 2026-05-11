import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useQMSStore } from '@/lib/demo-store';
import { mockProfiles, mockOrganizations, mockDocuments, mockCapas, mockNCRs, mockBatchRecords, mockSuppliers, mockFormTemplates, mockFormInstances, mockAudits, mockTraining, mockRisks, mockAuditTrails, mockPrerequisites, mockChangeControls, mockDeviations, mockOrgMembers } from '@/lib/mock-data';
import type { Document, Capa, NonConformance, BatchRecord, Supplier, Audit, Training, Risk, FormTemplate, FormInstance, AuditTrail, ChangeControl, Deviation, Profile, Organization } from '@/types/qms';

// ---------------------------------------------------------------------------
// Helper: capture the initial mock state so we can reset between tests
// ---------------------------------------------------------------------------
const initialState = useQMSStore.getState();

function resetStore() {
  useQMSStore.setState({
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
  });
}

// ---------------------------------------------------------------------------
// 1. Initial state
// ---------------------------------------------------------------------------
describe('useQMSStore – initial state', () => {
  it('profiles is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.profiles)).toBe(true);
    expect(state.profiles.length).toBeGreaterThan(0);
  });

  it('organizations is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.organizations)).toBe(true);
    expect(state.organizations.length).toBeGreaterThan(0);
  });

  it('orgMembers is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.orgMembers)).toBe(true);
    expect(state.orgMembers.length).toBeGreaterThan(0);
  });

  it('documents is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.documents)).toBe(true);
    expect(state.documents.length).toBeGreaterThan(0);
  });

  it('capas is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.capas)).toBe(true);
    expect(state.capas.length).toBeGreaterThan(0);
  });

  it('ncrs is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.ncrs)).toBe(true);
    expect(state.ncrs.length).toBeGreaterThan(0);
  });

  it('batchRecords is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.batchRecords)).toBe(true);
    expect(state.batchRecords.length).toBeGreaterThan(0);
  });

  it('suppliers is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.suppliers)).toBe(true);
    expect(state.suppliers.length).toBeGreaterThan(0);
  });

  it('formTemplates is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.formTemplates)).toBe(true);
    expect(state.formTemplates.length).toBeGreaterThan(0);
  });

  it('formInstances is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.formInstances)).toBe(true);
    expect(state.formInstances.length).toBeGreaterThan(0);
  });

  it('audits is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.audits)).toBe(true);
    expect(state.audits.length).toBeGreaterThan(0);
  });

  it('training is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.training)).toBe(true);
    expect(state.training.length).toBeGreaterThan(0);
  });

  it('risks is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.risks)).toBe(true);
    expect(state.risks.length).toBeGreaterThan(0);
  });

  it('auditTrails is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.auditTrails)).toBe(true);
    expect(state.auditTrails.length).toBeGreaterThan(0);
  });

  it('prerequisites is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.prerequisites)).toBe(true);
    expect(state.prerequisites.length).toBeGreaterThan(0);
  });

  it('changeControls is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.changeControls)).toBe(true);
    expect(state.changeControls.length).toBeGreaterThan(0);
  });

  it('deviations is a non-empty array from mock data', () => {
    const state = useQMSStore.getState();
    expect(Array.isArray(state.deviations)).toBe(true);
    expect(state.deviations.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 2. getProfile()
// ---------------------------------------------------------------------------
describe('getProfile()', () => {
  beforeEach(resetStore);

  it('returns the profile matching the given id', () => {
    const profile = useQMSStore.getState().getProfile('user-001');
    expect(profile).toBeDefined();
    expect(profile!.id).toBe('user-001');
    expect(profile!.email).toBe('admin@qms-demo.com');
    expect(profile!.fullName).toBe('Marie Dupont');
    expect(profile!.role).toBe('admin');
  });

  it('returns undefined for a non-existent id', () => {
    const profile = useQMSStore.getState().getProfile('non-existent-id');
    expect(profile).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 3. getOrgSettings()
// ---------------------------------------------------------------------------
describe('getOrgSettings()', () => {
  beforeEach(resetStore);

  it('returns parsed OrgSettings for a valid organization', () => {
    const settings = useQMSStore.getState().getOrgSettings('org-001');
    expect(settings).not.toBeNull();
    expect(settings!.setup_completed).toBe(true);
    expect(settings!.industry_type).toBe('medical_device');
    expect(Array.isArray(settings!.applicable_standards)).toBe(true);
    expect(settings!.applicable_standards.length).toBeGreaterThan(0);
    expect(settings!.require_electronic_signatures).toBe(true);
  });

  it('returns null for a non-existent organization id', () => {
    const settings = useQMSStore.getState().getOrgSettings('non-existent-org');
    expect(settings).toBeNull();
  });

  it('returns default settings when organization settings contain invalid JSON', () => {
    // Manually corrupt the settings of org-001 - parseOrgSettings returns defaults on error
    useQMSStore.setState({
      organizations: useQMSStore.getState().organizations.map(o =>
        o.id === 'org-001' ? { ...o, settings: '{invalid json' } : o
      ),
    });
    const settings = useQMSStore.getState().getOrgSettings('org-001');
    expect(settings).not.toBeNull();
    expect(settings?.setup_completed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. checkPrerequisites()
// ---------------------------------------------------------------------------
describe('checkPrerequisites()', () => {
  beforeEach(resetStore);

  it('returns { met: true, missing: [] } when all prerequisites are satisfied', () => {
    // CAPA prerequisite requires SOP type doc with ref 'SOP-QMS-002' and status 'Approved'
    // doc-002 matches: type 'SOP', documentNumber 'SOP-QMS-002', status 'Approved'
    const result = useQMSStore.getState().checkPrerequisites('CAPA', 'org-001');
    expect(result.met).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('returns { met: false, missing: [...] } when prerequisites are not met', () => {
    // Remove all Approved SOP documents matching 'SOP-QMS-002' to make CAPA prereq fail
    useQMSStore.setState({
      documents: useQMSStore.getState().documents.map(d =>
        d.documentNumber === 'SOP-QMS-002' ? { ...d, status: 'Draft' as const } : d
      ),
    });
    const result = useQMSStore.getState().checkPrerequisites('CAPA', 'org-001');
    expect(result.met).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
    // The missing prerequisite should reference the CAPA record type
    expect(result.missing[0].recordType).toBe('CAPA');
  });

  it('ignores prerequisites that belong to a different organization', () => {
    // Use an orgId that doesn't match any prerequisite's organizationId
    // Prerequisites with organizationId 'org-001' should not match 'org-999'
    const result = useQMSStore.getState().checkPrerequisites('CAPA', 'org-999');
    // Since the prereqs are scoped to org-001, none apply to org-999 => met: true
    expect(result.met).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('returns not met for CHANGE_CONTROL when required SOP is missing', () => {
    // prereq-004 requires any Approved SOP for CHANGE_CONTROL (no requiredDocRef)
    // Remove all Approved SOPs
    useQMSStore.setState({
      documents: useQMSStore.getState().documents.map(d =>
        d.type === 'SOP' ? { ...d, status: 'Draft' as const } : d
      ),
    });
    const result = useQMSStore.getState().checkPrerequisites('CHANGE_CONTROL', 'org-001');
    expect(result.met).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.missing.some(p => p.recordType === 'CHANGE_CONTROL')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. CRUD operations
// ---------------------------------------------------------------------------

// --- Document ---
describe('addDocument()', () => {
  beforeEach(resetStore);

  it('adds a document to the documents array', () => {
    const before = useQMSStore.getState().documents.length;
    const newDoc: Document = {
      id: 'doc-new-001',
      documentNumber: 'SOP-NEW-001',
      title: 'New Test Document',
      type: 'SOP',
      version: '1.0',
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useQMSStore.getState().addDocument(newDoc);
    const after = useQMSStore.getState().documents;
    expect(after.length).toBe(before + 1);
    expect(after.find(d => d.id === 'doc-new-001')).toBeDefined();
    expect(after.find(d => d.id === 'doc-new-001')!.title).toBe('New Test Document');
  });

  it('logs an audit trail entry', () => {
    const trailBefore = useQMSStore.getState().auditTrails.length;
    const newDoc: Document = {
      id: 'doc-new-002',
      documentNumber: 'SOP-NEW-002',
      title: 'Audit Trail Test Doc',
      type: 'WI',
      version: '1.0',
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useQMSStore.getState().addDocument(newDoc);
    const trails = useQMSStore.getState().auditTrails;
    expect(trails.length).toBeGreaterThan(trailBefore);
    const lastTrail = trails[0]; // prepended
    expect(lastTrail.action).toBe('CREATE');
    expect(lastTrail.tableName).toBe('Document');
    expect(lastTrail.recordId).toBe('doc-new-002');
  });
});

describe('updateDocument()', () => {
  beforeEach(resetStore);

  it('updates the document in the array', () => {
    useQMSStore.getState().updateDocument('doc-001', { title: 'Updated Title' });
    const doc = useQMSStore.getState().documents.find(d => d.id === 'doc-001');
    expect(doc).toBeDefined();
    expect(doc!.title).toBe('Updated Title');
  });

  it('sets updatedAt on the document', () => {
    const beforeUpdate = useQMSStore.getState().documents.find(d => d.id === 'doc-001')!.updatedAt;
    useQMSStore.getState().updateDocument('doc-001', { title: 'Updated Title' });
    const afterUpdate = useQMSStore.getState().documents.find(d => d.id === 'doc-001')!.updatedAt;
    expect(afterUpdate).not.toBe(beforeUpdate);
  });

  it('logs an audit trail entry', () => {
    const trailBefore = useQMSStore.getState().auditTrails.length;
    useQMSStore.getState().updateDocument('doc-001', { status: 'In Review' });
    const trails = useQMSStore.getState().auditTrails;
    expect(trails.length).toBeGreaterThan(trailBefore);
    const lastTrail = trails[0];
    expect(lastTrail.action).toBe('UPDATE');
    expect(lastTrail.tableName).toBe('Document');
    expect(lastTrail.recordId).toBe('doc-001');
    // oldValues should contain previous status
    expect(lastTrail.oldValues).toBeDefined();
    expect((lastTrail.oldValues as Record<string, unknown>)!.status).toBe('Approved');
  });
});

// --- CAPA ---
describe('addCapa()', () => {
  beforeEach(resetStore);

  it('adds a CAPA to the capas array', () => {
    const before = useQMSStore.getState().capas.length;
    const newCapa: Capa = {
      id: 'capa-new-001',
      capaNumber: 'CAPA-2024-NEW',
      title: 'New CAPA',
      type: 'Corrective',
      status: 'Open',
      description: 'Test CAPA',
      assignedTo: 'user-001',
      dueDate: '2024-12-31T00:00:00Z',
      createdDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useQMSStore.getState().addCapa(newCapa);
    expect(useQMSStore.getState().capas.length).toBe(before + 1);
    expect(useQMSStore.getState().capas.find(c => c.id === 'capa-new-001')).toBeDefined();
  });

  it('logs an audit trail entry', () => {
    const trailBefore = useQMSStore.getState().auditTrails.length;
    const newCapa: Capa = {
      id: 'capa-new-002',
      capaNumber: 'CAPA-2024-NEW2',
      title: 'New CAPA 2',
      type: 'Preventive',
      status: 'Open',
      description: 'Test CAPA 2',
      assignedTo: 'user-002',
      dueDate: '2024-12-31T00:00:00Z',
      createdDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useQMSStore.getState().addCapa(newCapa);
    const trails = useQMSStore.getState().auditTrails;
    expect(trails.length).toBeGreaterThan(trailBefore);
    expect(trails[0].action).toBe('CREATE');
    expect(trails[0].tableName).toBe('Capa');
  });
});

describe('updateCapa()', () => {
  beforeEach(resetStore);

  it('updates the CAPA in the array', () => {
    useQMSStore.getState().updateCapa('capa-001', { status: 'Closed' });
    const capa = useQMSStore.getState().capas.find(c => c.id === 'capa-001');
    expect(capa!.status).toBe('Closed');
  });

  it('sets updatedAt on the CAPA', () => {
    const before = useQMSStore.getState().capas.find(c => c.id === 'capa-001')!.updatedAt;
    useQMSStore.getState().updateCapa('capa-001', { status: 'Closed' });
    const after = useQMSStore.getState().capas.find(c => c.id === 'capa-001')!.updatedAt;
    expect(after).not.toBe(before);
  });

  it('logs an audit trail entry with old status', () => {
    useQMSStore.getState().updateCapa('capa-001', { status: 'Closed' });
    const trail = useQMSStore.getState().auditTrails[0];
    expect(trail.action).toBe('UPDATE');
    expect(trail.tableName).toBe('Capa');
    expect(trail.recordId).toBe('capa-001');
    expect((trail.oldValues as Record<string, unknown>)!.status).toBe('Implementation');
  });
});

// --- NCR ---
describe('addNCR()', () => {
  beforeEach(resetStore);

  it('adds an NCR to the ncrs array', () => {
    const before = useQMSStore.getState().ncrs.length;
    const newNcr: NonConformance = {
      id: 'ncr-new-001',
      ncrNumber: 'NCR-2024-NEW',
      title: 'New NCR',
      type: 'Product',
      status: 'Open',
      description: 'Test NCR',
      isOosOot: false,
      phase2Required: false,
      rejectLot: false,
      createdDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useQMSStore.getState().addNCR(newNcr);
    expect(useQMSStore.getState().ncrs.length).toBe(before + 1);
    expect(useQMSStore.getState().ncrs.find(n => n.id === 'ncr-new-001')).toBeDefined();
  });

  it('logs an audit trail entry', () => {
    const newNcr: NonConformance = {
      id: 'ncr-new-002',
      ncrNumber: 'NCR-2024-NEW2',
      title: 'New NCR 2',
      type: 'Process',
      status: 'Open',
      description: 'Test NCR 2',
      isOosOot: false,
      phase2Required: false,
      rejectLot: false,
      createdDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const trailBefore = useQMSStore.getState().auditTrails.length;
    useQMSStore.getState().addNCR(newNcr);
    expect(useQMSStore.getState().auditTrails.length).toBeGreaterThan(trailBefore);
    expect(useQMSStore.getState().auditTrails[0].tableName).toBe('NonConformance');
  });
});

describe('updateNCR()', () => {
  beforeEach(resetStore);

  it('updates the NCR in the array and sets updatedAt', () => {
    const beforeUpdate = useQMSStore.getState().ncrs.find(n => n.id === 'ncr-001')!.updatedAt;
    useQMSStore.getState().updateNCR('ncr-001', { status: 'Closed' });
    const ncr = useQMSStore.getState().ncrs.find(n => n.id === 'ncr-001');
    expect(ncr!.status).toBe('Closed');
    expect(ncr!.updatedAt).not.toBe(beforeUpdate);
  });
});

// --- BatchRecord ---
describe('addBatchRecord()', () => {
  beforeEach(resetStore);

  it('adds a batch record to the batchRecords array', () => {
    const before = useQMSStore.getState().batchRecords.length;
    const newBatch: BatchRecord = {
      id: 'batch-new-001',
      lotNumber: 'BN-NEW-001',
      productName: 'Test Product',
      manufacturingDate: new Date().toISOString(),
      status: 'In Progress',
      isLocked: false,
      createdAt: new Date().toISOString(),
    };
    useQMSStore.getState().addBatchRecord(newBatch);
    expect(useQMSStore.getState().batchRecords.length).toBe(before + 1);
    expect(useQMSStore.getState().batchRecords.find(b => b.id === 'batch-new-001')).toBeDefined();
  });

  it('logs an audit trail entry', () => {
    const newBatch: BatchRecord = {
      id: 'batch-new-002',
      lotNumber: 'BN-NEW-002',
      productName: 'Test Product 2',
      manufacturingDate: new Date().toISOString(),
      status: 'In Progress',
      isLocked: false,
      createdAt: new Date().toISOString(),
    };
    const trailBefore = useQMSStore.getState().auditTrails.length;
    useQMSStore.getState().addBatchRecord(newBatch);
    expect(useQMSStore.getState().auditTrails.length).toBeGreaterThan(trailBefore);
    expect(useQMSStore.getState().auditTrails[0].tableName).toBe('BatchRecord');
  });
});

describe('updateBatchRecord()', () => {
  beforeEach(resetStore);

  it('updates the batch record in the array', () => {
    useQMSStore.getState().updateBatchRecord('batch-001', { status: 'Released' });
    const batch = useQMSStore.getState().batchRecords.find(b => b.id === 'batch-001');
    expect(batch!.status).toBe('Released');
  });

  it('logs an audit trail entry', () => {
    useQMSStore.getState().updateBatchRecord('batch-001', { status: 'Released' });
    const trail = useQMSStore.getState().auditTrails[0];
    expect(trail.action).toBe('UPDATE');
    expect(trail.tableName).toBe('BatchRecord');
    expect(trail.recordId).toBe('batch-001');
  });
});

// --- Supplier ---
describe('addSupplier()', () => {
  beforeEach(resetStore);

  it('adds a supplier to the suppliers array', () => {
    const before = useQMSStore.getState().suppliers.length;
    const newSupplier: Supplier = {
      id: 'sup-new-001',
      supplierCode: 'NEW-SUP-001',
      name: 'New Supplier Inc.',
      status: 'Under Evaluation',
      createdAt: new Date().toISOString(),
    };
    useQMSStore.getState().addSupplier(newSupplier);
    expect(useQMSStore.getState().suppliers.length).toBe(before + 1);
    expect(useQMSStore.getState().suppliers.find(s => s.id === 'sup-new-001')).toBeDefined();
  });

  it('logs an audit trail entry', () => {
    const newSupplier: Supplier = {
      id: 'sup-new-002',
      supplierCode: 'NEW-SUP-002',
      name: 'New Supplier 2 Inc.',
      status: 'Qualified',
      createdAt: new Date().toISOString(),
    };
    const trailBefore = useQMSStore.getState().auditTrails.length;
    useQMSStore.getState().addSupplier(newSupplier);
    expect(useQMSStore.getState().auditTrails.length).toBeGreaterThan(trailBefore);
    expect(useQMSStore.getState().auditTrails[0].tableName).toBe('Supplier');
  });
});

describe('updateSupplier()', () => {
  beforeEach(resetStore);

  it('updates the supplier in the array', () => {
    useQMSStore.getState().updateSupplier('sup-001', { name: 'Updated Supplier Name' });
    const supplier = useQMSStore.getState().suppliers.find(s => s.id === 'sup-001');
    expect(supplier!.name).toBe('Updated Supplier Name');
  });

  it('logs an audit trail entry', () => {
    useQMSStore.getState().updateSupplier('sup-001', { status: 'Disqualified' });
    const trail = useQMSStore.getState().auditTrails[0];
    expect(trail.action).toBe('UPDATE');
    expect(trail.tableName).toBe('Supplier');
    expect((trail.oldValues as Record<string, unknown>)!.status).toBe('Qualified');
  });
});

// --- Audit ---
describe('addAudit()', () => {
  beforeEach(resetStore);

  it('adds an audit to the audits array', () => {
    const before = useQMSStore.getState().audits.length;
    const newAudit: Audit = {
      id: 'audit-new-001',
      auditNumber: 'AUD-NEW-001',
      title: 'New Audit',
      type: 'Internal',
      status: 'Planned',
      scheduledDate: '2024-12-01T08:00:00Z',
      leadAuditor: 'Test Auditor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useQMSStore.getState().addAudit(newAudit);
    expect(useQMSStore.getState().audits.length).toBe(before + 1);
    expect(useQMSStore.getState().audits.find(a => a.id === 'audit-new-001')).toBeDefined();
  });

  it('logs an audit trail entry', () => {
    const newAudit: Audit = {
      id: 'audit-new-002',
      auditNumber: 'AUD-NEW-002',
      title: 'New Audit 2',
      type: 'External',
      status: 'Planned',
      scheduledDate: '2024-12-01T08:00:00Z',
      leadAuditor: 'Test Auditor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const trailBefore = useQMSStore.getState().auditTrails.length;
    useQMSStore.getState().addAudit(newAudit);
    expect(useQMSStore.getState().auditTrails.length).toBeGreaterThan(trailBefore);
    expect(useQMSStore.getState().auditTrails[0].tableName).toBe('Audit');
  });
});

describe('updateAudit()', () => {
  beforeEach(resetStore);

  it('updates the audit in the array and sets updatedAt', () => {
    const beforeUpdate = useQMSStore.getState().audits.find(a => a.id === 'audit-001')!.updatedAt;
    useQMSStore.getState().updateAudit('audit-001', { status: 'In Progress' });
    const audit = useQMSStore.getState().audits.find(a => a.id === 'audit-001');
    expect(audit!.status).toBe('In Progress');
    expect(audit!.updatedAt).not.toBe(beforeUpdate);
  });
});

// --- Training ---
describe('addTraining()', () => {
  beforeEach(resetStore);

  it('adds a training to the training array', () => {
    const before = useQMSStore.getState().training.length;
    const newTraining: Training = {
      id: 'train-new-001',
      title: 'New Training',
      type: 'Skill',
      status: 'Planned',
      assignedTo: 'user-001',
      dueDate: '2024-12-31T00:00:00Z',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useQMSStore.getState().addTraining(newTraining);
    expect(useQMSStore.getState().training.length).toBe(before + 1);
    expect(useQMSStore.getState().training.find(t => t.id === 'train-new-001')).toBeDefined();
  });

  it('logs an audit trail entry', () => {
    const newTraining: Training = {
      id: 'train-new-002',
      title: 'New Training 2',
      type: 'Onboarding',
      status: 'Planned',
      assignedTo: 'user-002',
      dueDate: '2024-12-31T00:00:00Z',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const trailBefore = useQMSStore.getState().auditTrails.length;
    useQMSStore.getState().addTraining(newTraining);
    expect(useQMSStore.getState().auditTrails.length).toBeGreaterThan(trailBefore);
    expect(useQMSStore.getState().auditTrails[0].tableName).toBe('Training');
  });
});

describe('updateTraining()', () => {
  beforeEach(resetStore);

  it('updates the training in the array and sets updatedAt', () => {
    const beforeUpdate = useQMSStore.getState().training.find(t => t.id === 'train-001')!.updatedAt;
    useQMSStore.getState().updateTraining('train-001', { status: 'Overdue' });
    const training = useQMSStore.getState().training.find(t => t.id === 'train-001');
    expect(training!.status).toBe('Overdue');
    expect(training!.updatedAt).not.toBe(beforeUpdate);
  });
});

// --- Risk ---
describe('addRisk()', () => {
  beforeEach(resetStore);

  it('adds a risk to the risks array', () => {
    const before = useQMSStore.getState().risks.length;
    const newRisk: Risk = {
      id: 'risk-new-001',
      riskNumber: 'RISK-NEW-001',
      title: 'New Risk',
      probability: 3,
      impact: 3,
      detectability: 3,
      rpn: 27,
      riskLevel: 'Medium',
      status: 'Open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useQMSStore.getState().addRisk(newRisk);
    expect(useQMSStore.getState().risks.length).toBe(before + 1);
    expect(useQMSStore.getState().risks.find(r => r.id === 'risk-new-001')).toBeDefined();
  });

  it('logs an audit trail entry', () => {
    const newRisk: Risk = {
      id: 'risk-new-002',
      riskNumber: 'RISK-NEW-002',
      title: 'New Risk 2',
      probability: 2,
      impact: 4,
      detectability: 2,
      rpn: 16,
      riskLevel: 'Medium',
      status: 'Open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const trailBefore = useQMSStore.getState().auditTrails.length;
    useQMSStore.getState().addRisk(newRisk);
    expect(useQMSStore.getState().auditTrails.length).toBeGreaterThan(trailBefore);
    expect(useQMSStore.getState().auditTrails[0].tableName).toBe('Risk');
  });
});

describe('updateRisk()', () => {
  beforeEach(resetStore);

  it('updates the risk in the array and sets updatedAt', () => {
    const beforeUpdate = useQMSStore.getState().risks.find(r => r.id === 'risk-001')!.updatedAt;
    useQMSStore.getState().updateRisk('risk-001', { status: 'Closed' });
    const risk = useQMSStore.getState().risks.find(r => r.id === 'risk-001');
    expect(risk!.status).toBe('Closed');
    expect(risk!.updatedAt).not.toBe(beforeUpdate);
  });
});

// --- FormTemplate ---
describe('addFormTemplate()', () => {
  beforeEach(resetStore);

  it('adds a form template to the formTemplates array', () => {
    const before = useQMSStore.getState().formTemplates.length;
    const newTemplate: FormTemplate = {
      id: 'ft-new-001',
      documentId: 'doc-001',
      title: 'New Form Template',
      version: '1.0',
      fields: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    useQMSStore.getState().addFormTemplate(newTemplate);
    expect(useQMSStore.getState().formTemplates.length).toBe(before + 1);
    expect(useQMSStore.getState().formTemplates.find(f => f.id === 'ft-new-001')).toBeDefined();
  });

  it('logs an audit trail entry', () => {
    const newTemplate: FormTemplate = {
      id: 'ft-new-002',
      documentId: 'doc-002',
      title: 'New Form Template 2',
      version: '1.0',
      fields: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const trailBefore = useQMSStore.getState().auditTrails.length;
    useQMSStore.getState().addFormTemplate(newTemplate);
    expect(useQMSStore.getState().auditTrails.length).toBeGreaterThan(trailBefore);
    expect(useQMSStore.getState().auditTrails[0].tableName).toBe('FormTemplate');
  });
});

// --- FormInstance ---
describe('addFormInstance()', () => {
  beforeEach(resetStore);

  it('adds a form instance to the formInstances array', () => {
    const before = useQMSStore.getState().formInstances.length;
    const newInstance: FormInstance = {
      id: 'fi-new-001',
      templateId: 'ft-001',
      templateVersion: '1.0',
      referenceNumber: 'FORM-NEW-001',
      values: {},
      status: 'Draft',
      isLocked: false,
      createdAt: new Date().toISOString(),
    };
    useQMSStore.getState().addFormInstance(newInstance);
    expect(useQMSStore.getState().formInstances.length).toBe(before + 1);
    expect(useQMSStore.getState().formInstances.find(f => f.id === 'fi-new-001')).toBeDefined();
  });

  it('logs an audit trail entry', () => {
    const newInstance: FormInstance = {
      id: 'fi-new-002',
      templateId: 'ft-001',
      templateVersion: '1.0',
      referenceNumber: 'FORM-NEW-002',
      values: {},
      status: 'Draft',
      isLocked: false,
      createdAt: new Date().toISOString(),
    };
    const trailBefore = useQMSStore.getState().auditTrails.length;
    useQMSStore.getState().addFormInstance(newInstance);
    expect(useQMSStore.getState().auditTrails.length).toBeGreaterThan(trailBefore);
    expect(useQMSStore.getState().auditTrails[0].tableName).toBe('FormInstance');
  });
});

describe('updateFormInstance()', () => {
  beforeEach(resetStore);

  it('updates the form instance in the array', () => {
    useQMSStore.getState().updateFormInstance('fi-001', { status: 'Rejected' });
    const instance = useQMSStore.getState().formInstances.find(f => f.id === 'fi-001');
    expect(instance!.status).toBe('Rejected');
  });

  it('logs an audit trail entry', () => {
    useQMSStore.getState().updateFormInstance('fi-001', { status: 'Approved' });
    const trail = useQMSStore.getState().auditTrails[0];
    expect(trail.action).toBe('UPDATE');
    expect(trail.tableName).toBe('FormInstance');
    expect(trail.recordId).toBe('fi-001');
    // Old status was 'Approved' from mock data
    expect((trail.oldValues as Record<string, unknown>)!.status).toBe('Approved');
  });
});

// --- ChangeControl ---
describe('addChangeControl()', () => {
  beforeEach(resetStore);

  it('adds a change control to the changeControls array', () => {
    const before = useQMSStore.getState().changeControls.length;
    const newCC: ChangeControl = {
      id: 'cc-new-001',
      ccNumber: 'CC-NEW-001',
      title: 'New Change Control',
      type: 'Planned',
      status: 'Requested',
      priority: 'Medium',
      category: 'Process',
      description: 'Test CC',
      justification: 'Test justification',
      proposedChange: 'Test proposed change',
      assignedTo: 'user-001',
      requestedBy: 'user-002',
      dueDate: '2024-12-31T00:00:00Z',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useQMSStore.getState().addChangeControl(newCC);
    expect(useQMSStore.getState().changeControls.length).toBe(before + 1);
    expect(useQMSStore.getState().changeControls.find(c => c.id === 'cc-new-001')).toBeDefined();
  });

  it('logs an audit trail entry', () => {
    const newCC: ChangeControl = {
      id: 'cc-new-002',
      ccNumber: 'CC-NEW-002',
      title: 'New Change Control 2',
      type: 'Emergency',
      status: 'Approved',
      priority: 'Critical',
      category: 'Equipment',
      description: 'Test CC 2',
      justification: 'Test justification 2',
      proposedChange: 'Test proposed change 2',
      assignedTo: 'user-002',
      requestedBy: 'user-001',
      dueDate: '2024-12-31T00:00:00Z',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const trailBefore = useQMSStore.getState().auditTrails.length;
    useQMSStore.getState().addChangeControl(newCC);
    expect(useQMSStore.getState().auditTrails.length).toBeGreaterThan(trailBefore);
    expect(useQMSStore.getState().auditTrails[0].tableName).toBe('ChangeControl');
  });
});

describe('updateChangeControl()', () => {
  beforeEach(resetStore);

  it('updates the change control in the array and sets updatedAt', () => {
    const beforeUpdate = useQMSStore.getState().changeControls.find(c => c.id === 'cc-001')!.updatedAt;
    useQMSStore.getState().updateChangeControl('cc-001', { status: 'Completed' });
    const cc = useQMSStore.getState().changeControls.find(c => c.id === 'cc-001');
    expect(cc!.status).toBe('Completed');
    expect(cc!.updatedAt).not.toBe(beforeUpdate);
  });
});

// --- Deviation ---
describe('addDeviation()', () => {
  beforeEach(resetStore);

  it('adds a deviation to the deviations array', () => {
    const before = useQMSStore.getState().deviations.length;
    const newDev: Deviation = {
      id: 'dev-new-001',
      devNumber: 'DEV-NEW-001',
      title: 'New Deviation',
      type: 'Unplanned',
      status: 'Open',
      severity: 'Minor',
      category: 'Process',
      description: 'Test deviation',
      deviationDetails: 'Details here',
      assignedTo: 'user-001',
      dueDate: '2024-12-31T00:00:00Z',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useQMSStore.getState().addDeviation(newDev);
    expect(useQMSStore.getState().deviations.length).toBe(before + 1);
    expect(useQMSStore.getState().deviations.find(d => d.id === 'dev-new-001')).toBeDefined();
  });

  it('logs an audit trail entry', () => {
    const newDev: Deviation = {
      id: 'dev-new-002',
      devNumber: 'DEV-NEW-002',
      title: 'New Deviation 2',
      type: 'Planned',
      status: 'Open',
      severity: 'Major',
      category: 'Documentation',
      description: 'Test deviation 2',
      deviationDetails: 'Details here 2',
      assignedTo: 'user-002',
      dueDate: '2024-12-31T00:00:00Z',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const trailBefore = useQMSStore.getState().auditTrails.length;
    useQMSStore.getState().addDeviation(newDev);
    expect(useQMSStore.getState().auditTrails.length).toBeGreaterThan(trailBefore);
    expect(useQMSStore.getState().auditTrails[0].tableName).toBe('Deviation');
  });
});

describe('updateDeviation()', () => {
  beforeEach(resetStore);

  it('updates the deviation in the array and sets updatedAt', () => {
    const firstDev = useQMSStore.getState().deviations[0];
    const beforeUpdate = firstDev.updatedAt;
    useQMSStore.getState().updateDeviation(firstDev.id, { status: 'Closed' });
    const dev = useQMSStore.getState().deviations.find(d => d.id === firstDev.id);
    expect(dev!.status).toBe('Closed');
    expect(dev!.updatedAt).not.toBe(beforeUpdate);
  });
});

// --- Profile ---
describe('addProfile()', () => {
  beforeEach(resetStore);

  it('adds a profile to the profiles array', () => {
    const before = useQMSStore.getState().profiles.length;
    const newProfile: Profile = {
      id: 'user-new-001',
      email: 'new@qms-demo.com',
      fullName: 'New User',
      role: 'operator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useQMSStore.getState().addProfile(newProfile);
    expect(useQMSStore.getState().profiles.length).toBe(before + 1);
    expect(useQMSStore.getState().profiles.find(p => p.id === 'user-new-001')).toBeDefined();
  });

  it('logs an audit trail entry', () => {
    const newProfile: Profile = {
      id: 'user-new-002',
      email: 'new2@qms-demo.com',
      fullName: 'New User 2',
      role: 'auditor',
      department: 'Audit',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const trailBefore = useQMSStore.getState().auditTrails.length;
    useQMSStore.getState().addProfile(newProfile);
    expect(useQMSStore.getState().auditTrails.length).toBeGreaterThan(trailBefore);
    expect(useQMSStore.getState().auditTrails[0].tableName).toBe('Profile');
  });
});

describe('updateProfile()', () => {
  beforeEach(resetStore);

  it('updates the profile in the array and sets updatedAt', () => {
    const beforeUpdate = useQMSStore.getState().profiles.find(p => p.id === 'user-001')!.updatedAt;
    useQMSStore.getState().updateProfile('user-001', { department: 'New Department' });
    const profile = useQMSStore.getState().profiles.find(p => p.id === 'user-001');
    expect(profile!.department).toBe('New Department');
    expect(profile!.updatedAt).not.toBe(beforeUpdate);
  });

  it('logs an audit trail entry with old role and department', () => {
    useQMSStore.getState().updateProfile('user-001', { role: 'quality_manager' });
    const trail = useQMSStore.getState().auditTrails[0];
    expect(trail.action).toBe('UPDATE');
    expect(trail.tableName).toBe('Profile');
    expect((trail.oldValues as Record<string, unknown>)!.role).toBe('admin');
    expect((trail.oldValues as Record<string, unknown>)!.department).toBe('Quality Assurance');
  });
});

// ---------------------------------------------------------------------------
// 6. logAudit()
// ---------------------------------------------------------------------------
describe('logAudit()', () => {
  beforeEach(resetStore);

  it('creates an AuditTrail entry with correct fields', () => {
    const trailBefore = useQMSStore.getState().auditTrails.length;
    useQMSStore.getState().logAudit('CREATE', 'TestTable', 'rec-001', undefined, { name: 'test' });

    const trails = useQMSStore.getState().auditTrails;
    expect(trails.length).toBe(trailBefore + 1);

    const entry = trails[0]; // prepended
    expect(entry.id).toMatch(/^at-/);
    expect(entry.action).toBe('CREATE');
    expect(entry.tableName).toBe('TestTable');
    expect(entry.recordId).toBe('rec-001');
    expect(entry.userId).toBe('user-001');
    expect(entry.userEmail).toBe('admin@qms-demo.com');
    expect(entry.organizationId).toBe('org-001');
    expect(entry.createdAt).toBeDefined();
    expect(entry.oldValues).toBeUndefined();
    expect(entry.newValues).toEqual({ name: 'test' });
  });

  it('prepends the entry to the auditTrails array', () => {
    const firstBefore = useQMSStore.getState().auditTrails[0];
    useQMSStore.getState().logAudit('UPDATE', 'AnotherTable');
    const firstAfter = useQMSStore.getState().auditTrails[0];
    // The new entry should be at position 0 (prepended)
    expect(firstAfter.tableName).toBe('AnotherTable');
    expect(firstAfter.action).toBe('UPDATE');
    // Previous first entry should now be second
    expect(useQMSStore.getState().auditTrails[1].id).toBe(firstBefore.id);
  });

  it('includes oldValues when provided', () => {
    useQMSStore.getState().logAudit('UPDATE', 'SomeTable', 'rec-002', { status: 'old' }, { status: 'new' });
    const entry = useQMSStore.getState().auditTrails[0];
    expect(entry.oldValues).toEqual({ status: 'old' });
    expect(entry.newValues).toEqual({ status: 'new' });
  });

  it('allows undefined recordId', () => {
    useQMSStore.getState().logAudit('LOGIN', 'Profile');
    const entry = useQMSStore.getState().auditTrails[0];
    expect(entry.recordId).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 7. updateOrganization()
// ---------------------------------------------------------------------------
describe('updateOrganization()', () => {
  beforeEach(resetStore);

  it('updates organization fields', () => {
    useQMSStore.getState().updateOrganization('org-001', { name: 'Updated Org Name' });
    const org = useQMSStore.getState().organizations.find(o => o.id === 'org-001');
    expect(org!.name).toBe('Updated Org Name');
  });

  it('sets updatedAt on the organization', () => {
    const before = useQMSStore.getState().organizations.find(o => o.id === 'org-001')!.updatedAt;
    useQMSStore.getState().updateOrganization('org-001', { name: 'Updated Org Name' });
    const after = useQMSStore.getState().organizations.find(o => o.id === 'org-001')!.updatedAt;
    expect(after).not.toBe(before);
  });

  it('does not modify other organizations', () => {
    // Add a second org for this test
    useQMSStore.setState({
      organizations: [
        ...useQMSStore.getState().organizations,
        {
          id: 'org-002',
          name: 'Other Org',
          slug: 'other-org',
          subscriptionStatus: 'trial' as const,
          settings: '{}',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    });
    useQMSStore.getState().updateOrganization('org-001', { name: 'Updated Org Name' });
    const otherOrg = useQMSStore.getState().organizations.find(o => o.id === 'org-002');
    expect(otherOrg!.name).toBe('Other Org');
  });
});

// ---------------------------------------------------------------------------
// 8. updateOrgSettings()
// ---------------------------------------------------------------------------
describe('updateOrgSettings()', () => {
  beforeEach(resetStore);

  it('merges settings and serializes to JSON', () => {
    useQMSStore.getState().updateOrgSettings('org-001', { company_name: 'New Company Name' });
    const org = useQMSStore.getState().organizations.find(o => o.id === 'org-001');
    const parsed = JSON.parse(org!.settings);
    expect(parsed.company_name).toBe('New Company Name');
    // Existing settings should be preserved
    expect(parsed.setup_completed).toBe(true);
    expect(parsed.industry_type).toBe('medical_device');
  });

  it('sets updatedAt on the organization', () => {
    const before = useQMSStore.getState().organizations.find(o => o.id === 'org-001')!.updatedAt;
    useQMSStore.getState().updateOrgSettings('org-001', { company_name: 'Another Name' });
    const after = useQMSStore.getState().organizations.find(o => o.id === 'org-001')!.updatedAt;
    expect(after).not.toBe(before);
  });

  it('does not modify the organization if orgId does not exist', () => {
    const before = useQMSStore.getState().organizations.find(o => o.id === 'org-001')!.settings;
    useQMSStore.getState().updateOrgSettings('non-existent-org', { company_name: 'Should Not Appear' });
    const after = useQMSStore.getState().organizations.find(o => o.id === 'org-001')!.settings;
    expect(after).toBe(before);
  });

  it('overwrites existing settings keys', () => {
    useQMSStore.getState().updateOrgSettings('org-001', { setup_completed: false });
    const org = useQMSStore.getState().organizations.find(o => o.id === 'org-001');
    const parsed = JSON.parse(org!.settings);
    expect(parsed.setup_completed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 9. generateSignatureHash()
// ---------------------------------------------------------------------------
describe('generateSignatureHash()', () => {
  beforeEach(resetStore);

  it('returns a string starting with "SIG-"', () => {
    const hash = useQMSStore.getState().generateSignatureHash('user-001', 'doc-001', 'approval');
    expect(hash).toMatch(/^SIG-/);
  });

  it('is deterministic for the same inputs when Date.now is fixed', () => {
    const fixedNow = 1700000000000;
    const originalDateNow = Date.now;
    Date.now = vi.fn(() => fixedNow);

    const hash1 = useQMSStore.getState().generateSignatureHash('user-001', 'doc-001', 'approval');
    const hash2 = useQMSStore.getState().generateSignatureHash('user-001', 'doc-001', 'approval');

    expect(hash1).toBe(hash2);

    Date.now = originalDateNow;
  });

  it('produces different hashes for different inputs', () => {
    const fixedNow = 1700000000000;
    const originalDateNow = Date.now;
    Date.now = vi.fn(() => fixedNow);

    const hash1 = useQMSStore.getState().generateSignatureHash('user-001', 'doc-001', 'approval');
    const hash2 = useQMSStore.getState().generateSignatureHash('user-002', 'doc-001', 'approval');

    expect(hash1).not.toBe(hash2);

    Date.now = originalDateNow;
  });

  it('contains the timestamp portion in base-36', () => {
    const fixedNow = 1700000000000;
    const originalDateNow = Date.now;
    Date.now = vi.fn(() => fixedNow);

    const hash = useQMSStore.getState().generateSignatureHash('user-001', 'doc-001', 'approval');
    // The hash format is SIG-<hex>-<base36timestamp>
    const parts = hash.split('-');
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe('SIG');
    // The last part should be the base-36 representation of the timestamp
    expect(parseInt(parts[2], 36)).toBe(fixedNow);

    Date.now = originalDateNow;
  });
});
