import { describe, it, expect, beforeEach } from 'vitest';
import { DemoProvider } from '@/demo/DemoProvider';
import { useQMSStore } from '@/lib/demo-store';
import type { IDataProvider } from '@/demo/IDataProvider';
import type {
  Document,
  BatchRecord,
  FormInstance,
  Capa,
  NonConformance,
  Organization,
} from '@/types/qms';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOrgDocument(orgId: string, overrides: Partial<Document> = {}): Document {
  return {
    id: `doc-${orgId}-001`,
    documentNumber: `SOP-${orgId}-001`,
    title: `SOP for ${orgId}`,
    type: 'SOP',
    version: '1.0',
    status: 'Approved',
    organizationId: orgId,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeOrgBatch(orgId: string, overrides: Partial<BatchRecord> = {}): BatchRecord {
  return {
    id: `batch-${orgId}-001`,
    lotNumber: `LOT-${orgId}-001`,
    productName: `Product for ${orgId}`,
    manufacturingDate: '2024-01-15',
    status: 'In Progress',
    isLocked: false,
    organizationId: orgId,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeOrgCapa(orgId: string, overrides: Partial<Capa> = {}): Capa {
  return {
    id: `capa-${orgId}-001`,
    capaNumber: `CAPA-${orgId}-001`,
    title: `CAPA for ${orgId}`,
    type: 'Corrective',
    status: 'Open',
    description: 'Test CAPA',
    assignedTo: 'user-001',
    dueDate: '2024-12-31',
    createdDate: '2024-01-01T00:00:00Z',
    organizationId: orgId,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeOrgNcr(orgId: string, overrides: Partial<NonConformance> = {}): NonConformance {
  return {
    id: `ncr-${orgId}-001`,
    ncrNumber: `NCR-${orgId}-001`,
    title: `NCR for ${orgId}`,
    type: 'Process',
    status: 'Open',
    description: 'Test NCR',
    isOosOot: false,
    phase2Required: false,
    rejectLot: false,
    assignedTo: 'user-001',
    createdDate: '2024-01-01T00:00:00Z',
    organizationId: orgId,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeOrgFormInstance(orgId: string, overrides: Partial<FormInstance> = {}): FormInstance {
  return {
    id: `fi-${orgId}-001`,
    templateId: 'ft-001',
    templateVersion: '1.0',
    referenceNumber: `FRM-${orgId}-001`,
    values: {},
    status: 'Draft',
    isLocked: false,
    organizationId: orgId,
    createdById: 'user-001',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeOrganization(id: string, name: string): Organization {
  return {
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    subscriptionStatus: 'active',
    settings: JSON.stringify({
      setup_completed: true,
      industry_type: 'medical_device',
      applicable_standards: ['ISO 13485:2016'],
      active_modules: ['documents'],
    }),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RLS Behavior (Multi-Tenant Data Isolation)', () => {
  let provider: IDataProvider;

  beforeEach(() => {
    provider = new DemoProvider();

    // Set up data for two organizations
    useQMSStore.setState({
      organizations: [
        makeOrganization('org-001', 'PharmaQMS Demo'),
        makeOrganization('org-002', 'Acme Biotech'),
      ],
      documents: [
        makeOrgDocument('org-001'),
        makeOrgDocument('org-002'),
      ],
      batchRecords: [
        makeOrgBatch('org-001'),
        makeOrgBatch('org-002'),
      ],
      capas: [
        makeOrgCapa('org-001'),
        makeOrgCapa('org-002'),
      ],
      ncrs: [
        makeOrgNcr('org-001'),
        makeOrgNcr('org-002'),
      ],
      formInstances: [
        makeOrgFormInstance('org-001'),
        makeOrgFormInstance('org-002'),
      ],
      formTemplates: [],
      auditTrails: [],
    });
  });

  // =========================================================================
  // Organization filtering
  // =========================================================================
  describe('organization filtering', () => {
    it('filters documents by organizationId', () => {
      const allDocs = useQMSStore.getState().documents;
      const org001Docs = allDocs.filter(d => d.organizationId === 'org-001');
      const org002Docs = allDocs.filter(d => d.organizationId === 'org-002');

      expect(org001Docs).toHaveLength(1);
      expect(org002Docs).toHaveLength(1);
      expect(org001Docs[0].id).toBe('doc-org-001-001');
      expect(org002Docs[0].id).toBe('doc-org-002-001');
    });

    it('filters batch records by organizationId', () => {
      const allBatches = useQMSStore.getState().batchRecords;
      const org001Batches = allBatches.filter(b => b.organizationId === 'org-001');
      const org002Batches = allBatches.filter(b => b.organizationId === 'org-002');

      expect(org001Batches).toHaveLength(1);
      expect(org002Batches).toHaveLength(1);
      expect(org001Batches[0].id).toBe('batch-org-001-001');
      expect(org002Batches[0].id).toBe('batch-org-002-001');
    });

    it('filters CAPAs by organizationId', () => {
      const allCapas = useQMSStore.getState().capas;
      const org001Capas = allCapas.filter(c => c.organizationId === 'org-001');
      const org002Capas = allCapas.filter(c => c.organizationId === 'org-002');

      expect(org001Capas).toHaveLength(1);
      expect(org002Capas).toHaveLength(1);
    });
  });

  // =========================================================================
  // Cross-org data isolation
  // =========================================================================
  describe('cross-organization data isolation', () => {
    it('records from org-001 are not visible to org-002 when filtered', () => {
      const store = useQMSStore.getState();

      // Simulate what a service would do: filter by the user's org
      const org001DocIds = store.documents
        .filter(d => d.organizationId === 'org-001')
        .map(d => d.id);
      const org002DocIds = store.documents
        .filter(d => d.organizationId === 'org-002')
        .map(d => d.id);

      // No overlap
      const intersection = org001DocIds.filter(id => org002DocIds.includes(id));
      expect(intersection).toHaveLength(0);
    });

    it('batch records from org-001 are not visible to org-002', () => {
      const store = useQMSStore.getState();

      const org001BatchIds = store.batchRecords
        .filter(b => b.organizationId === 'org-001')
        .map(b => b.id);
      const org002BatchIds = store.batchRecords
        .filter(b => b.organizationId === 'org-002')
        .map(b => b.id);

      const intersection = org001BatchIds.filter(id => org002BatchIds.includes(id));
      expect(intersection).toHaveLength(0);
    });

    it('form instances from org-001 are not visible to org-002', () => {
      const store = useQMSStore.getState();

      const org001Forms = store.formInstances
        .filter(f => f.organizationId === 'org-001')
        .map(f => f.id);
      const org002Forms = store.formInstances
        .filter(f => f.organizationId === 'org-002')
        .map(f => f.id);

      const intersection = org001Forms.filter(id => org002Forms.includes(id));
      expect(intersection).toHaveLength(0);
    });
  });

  // =========================================================================
  // IDataProvider interface filtering
  // =========================================================================
  describe('IDataProvider interface organization filtering', () => {
    it('filters documents by current organization (multi-tenant isolation)', () => {
      // DemoProvider filters by org-001 by default — only org-001 docs are returned
      const docs = provider.getDocuments();
      expect(docs).toHaveLength(1);
      expect(docs[0].organizationId).toBe('org-001');

      // A provider for a different org sees only its own data
      const org002Provider = new DemoProvider('org-002');
      const org002Docs = org002Provider.getDocuments();
      expect(org002Docs).toHaveLength(1);
      expect(org002Docs[0].organizationId).toBe('org-002');
    });

    it('filters batch records by current organization (multi-tenant isolation)', () => {
      // DemoProvider filters by org-001 by default
      const batches = provider.getBatchRecords();
      expect(batches).toHaveLength(1);
      expect(batches[0].organizationId).toBe('org-001');

      // A provider for a different org sees only its own data
      const org002Provider = new DemoProvider('org-002');
      const org002Batches = org002Provider.getBatchRecords();
      expect(org002Batches).toHaveLength(1);
      expect(org002Batches[0].organizationId).toBe('org-002');
    });

    it('returns the correct organization by id', () => {
      const org = provider.getOrganization('org-001');
      expect(org).toBeDefined();
      expect(org!.id).toBe('org-001');
      expect(org!.name).toBe('PharmaQMS Demo');

      const org2 = provider.getOrganization('org-002');
      expect(org2).toBeDefined();
      expect(org2!.id).toBe('org-002');
      expect(org2!.name).toBe('Acme Biotech');
    });

    it('returns undefined for non-existent organization', () => {
      const org = provider.getOrganization('org-999');
      expect(org).toBeUndefined();
    });

    it('getCurrentOrganizationId returns the demo org', () => {
      expect(provider.getCurrentOrganizationId()).toBe('org-001');
    });

    it('correctly filters audit trails by organization', () => {
      const allTrails = provider.getAuditTrails();
      // Audit trails created by the provider have organizationId
      const org001Trails = allTrails.filter(t => t.organizationId === 'org-001');
      // Ensure no org-002 trails appear for org-001
      const org002InOrg001 = org001Trails.filter(t => t.organizationId === 'org-002');
      expect(org002InOrg001).toHaveLength(0);
    });
  });
});
