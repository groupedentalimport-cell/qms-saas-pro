// Test data factories for QMS entities
// Provides reusable factory functions for creating test data

import type {
  Document, Capa, NonConformance, Audit, Training, Risk,
  BatchRecord, Supplier, FormTemplate, FormInstance,
  AuditTrail, ChangeControl, Deviation, Profile, Organization,
  OrganizationMember, DocumentPrerequisite,
} from '@/types/qms';

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${String(counter).padStart(3, '0')}`;
}

export function resetCounter(): void {
  counter = 0;
}

// ---------------------------------------------------------------------------
// Profile Factory
// ---------------------------------------------------------------------------

export function createProfile(overrides: Partial<Profile> = {}): Profile {
  const id = overrides.id || nextId('user');
  return {
    id,
    email: `${id}@qms-test.com`,
    fullName: `Test User ${id}`,
    role: 'admin',
    department: 'Quality',
    jobTitle: 'QA Manager',
    phone: '+1-555-0100',
    avatarUrl: undefined,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    organizationId: 'org-001',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Organization Factory
// ---------------------------------------------------------------------------

export function createOrganization(overrides: Partial<Organization> = {}): Organization {
  const id = overrides.id || nextId('org');
  const defaultSettings = {
    industry: 'medical_device' as const,
    modules: {
      documents: true, capa: true, ncr: true, audits: true, training: true,
      risks: true, batchRecords: true, suppliers: true, forms: true,
      changeControl: true, deviations: true,
    },
    regulatoryFrameworks: ['ISO 13485:2016'],
    locale: 'en',
    timezone: 'UTC',
  };
  return {
    id,
    name: `Test Org ${id}`,
    slug: `test-org-${id}`,
    subscriptionStatus: 'trial',
    settings: JSON.stringify(defaultSettings),
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Document Factory
// ---------------------------------------------------------------------------

export function createDocument(overrides: Partial<Document> = {}): Document {
  const id = overrides.id || nextId('doc');
  return {
    id,
    documentNumber: `SOP-${String(counter).padStart(3, '0')}`,
    title: `Test Document ${id}`,
    type: 'SOP',
    version: '1.0',
    status: 'Draft',
    effectiveDate: undefined,
    expirationDate: undefined,
    owner: 'user-001',
    department: 'Quality',
    lastReviewed: undefined,
    nextReview: undefined,
    description: 'Test document description',
    classification: 'Internal',
    retentionPeriod: '5 years',
    scope: 'Test scope',
    references: undefined,
    typeSpecificData: undefined,
    parentDocumentId: undefined,
    documentLevel: 1,
    validationPhase: undefined,
    parentValidationId: undefined,
    authorId: 'user-001',
    organizationId: 'org-001',
    createdById: 'user-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// CAPA Factory
// ---------------------------------------------------------------------------

export function createCapa(overrides: Partial<Capa> = {}): Capa {
  const id = overrides.id || nextId('capa');
  return {
    id,
    capaNumber: `CAPA-${String(counter).padStart(3, '0')}`,
    title: `Test CAPA ${id}`,
    type: 'Corrective',
    status: 'Open',
    priority: 'High',
    source: 'Non-Conformance',
    sourceReferenceId: undefined,
    description: 'Test CAPA description',
    problemStatement: 'Test problem statement',
    investigationDetails: undefined,
    rootCauseAnalysis: undefined,
    rootCauseCategory: undefined,
    fiveWhys: undefined,
    correctiveAction: undefined,
    effectivenessVerificationMethod: undefined,
    effectivenessCriteria: undefined,
    effectivenessResult: undefined,
    linkedDocumentId: undefined,
    linkedNcrId: undefined,
    linkedAuditId: undefined,
    assignedTo: 'user-001',
    dueDate: '2024-12-31',
    createdDate: '2024-01-01T00:00:00.000Z',
    closedDate: undefined,
    createdById: 'user-001',
    organizationId: 'org-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// NCR Factory
// ---------------------------------------------------------------------------

export function createNcr(overrides: Partial<NonConformance> = {}): NonConformance {
  const id = overrides.id || nextId('ncr');
  return {
    id,
    ncrNumber: `NCR-${String(counter).padStart(3, '0')}`,
    title: `Test NCR ${id}`,
    type: 'Product',
    status: 'Open',
    severity: 'Major',
    source: 'Internal Inspection',
    description: 'Test NCR description',
    lotNumber: undefined,
    quantityAffected: undefined,
    disposition: 'Pending',
    linkedCapaId: undefined,
    linkedProcedureRef: undefined,
    supplierId: undefined,
    isOosOot: false,
    analyticalMethod: undefined,
    measuredValue: undefined,
    measuredUnit: undefined,
    specLimit: undefined,
    phase1Conclusion: undefined,
    phase2Required: false,
    phase2Conclusion: undefined,
    rejectLot: false,
    assignedTo: 'user-001',
    createdDate: '2024-01-01T00:00:00.000Z',
    createdById: 'user-001',
    organizationId: 'org-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Audit Factory
// ---------------------------------------------------------------------------

export function createAudit(overrides: Partial<Audit> = {}): Audit {
  const id = overrides.id || nextId('audit');
  return {
    id,
    auditNumber: `AUD-${String(counter).padStart(3, '0')}`,
    title: `Test Audit ${id}`,
    type: 'Internal',
    status: 'Planned',
    scope: 'Full QMS audit',
    scheduledDate: '2024-06-15',
    completedDate: undefined,
    leadAuditor: 'user-001',
    auditees: ['user-002'],
    findings: [],
    organizationId: 'org-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Training Factory
// ---------------------------------------------------------------------------

export function createTraining(overrides: Partial<Training> = {}): Training {
  const id = overrides.id || nextId('train');
  return {
    id,
    title: `Test Training ${id}`,
    description: 'Test training description',
    type: 'SOP',
    status: 'Planned',
    assignedTo: 'user-001',
    dueDate: '2024-12-31',
    completedDate: undefined,
    documentId: undefined,
    organizationId: 'org-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Risk Factory
// ---------------------------------------------------------------------------

export function createRisk(overrides: Partial<Risk> = {}): Risk {
  const id = overrides.id || nextId('risk');
  const probability = overrides.probability ?? 3;
  const impact = overrides.impact ?? 3;
  const detectability = overrides.detectability ?? 3;
  return {
    id,
    riskNumber: `RSK-${String(counter).padStart(3, '0')}`,
    title: `Test Risk ${id}`,
    category: 'Process',
    probability,
    impact,
    detectability,
    rpn: probability * impact * detectability,
    riskLevel: 'Medium',
    mitigation: undefined,
    residualRisk: undefined,
    status: 'Open',
    organizationId: 'org-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Batch Record Factory
// ---------------------------------------------------------------------------

export function createBatchRecord(overrides: Partial<BatchRecord> = {}): BatchRecord {
  const id = overrides.id || nextId('batch');
  return {
    id,
    lotNumber: `LOT-${String(counter).padStart(3, '0')}`,
    productName: 'Test Product',
    productCode: 'TP-001',
    batchSize: 1000,
    batchSizeUnit: 'units',
    masterFormulaId: undefined,
    manufacturingDate: '2024-01-15',
    expiryDate: '2025-01-15',
    status: 'In Progress',
    isLocked: false,
    steps: [],
    qaReleaseDate: undefined,
    qaReleasedById: undefined,
    organizationId: 'org-001',
    createdById: 'user-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Supplier Factory
// ---------------------------------------------------------------------------

export function createSupplier(overrides: Partial<Supplier> = {}): Supplier {
  const id = overrides.id || nextId('sup');
  return {
    id,
    supplierCode: `SUP-${String(counter).padStart(3, '0')}`,
    name: `Test Supplier ${id}`,
    category: 'Raw Material',
    status: 'Qualified',
    qualificationDate: '2024-01-01',
    nextReviewDate: '2025-01-01',
    certifications: ['ISO 9001'],
    performanceScore: 85,
    qualificationDocId: undefined,
    organizationId: 'org-001',
    createdById: 'user-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Change Control Factory
// ---------------------------------------------------------------------------

export function createChangeControl(overrides: Partial<ChangeControl> = {}): ChangeControl {
  const id = overrides.id || nextId('cc');
  return {
    id,
    ccNumber: `CC-${String(counter).padStart(3, '0')}`,
    title: `Test Change Control ${id}`,
    type: 'Planned',
    status: 'Requested',
    priority: 'Medium',
    category: 'Process',
    description: 'Test change control description',
    justification: 'Test justification',
    proposedChange: 'Test proposed change',
    riskAssessment: undefined,
    impactAnalysis: undefined,
    implementationPlan: undefined,
    implementationDate: undefined,
    completionDate: undefined,
    linkedDocumentId: undefined,
    linkedCapaId: undefined,
    assignedTo: 'user-001',
    requestedBy: 'user-001',
    approvedBy: undefined,
    dueDate: '2024-12-31',
    createdById: 'user-001',
    organizationId: 'org-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Deviation Factory
// ---------------------------------------------------------------------------

export function createDeviation(overrides: Partial<Deviation> = {}): Deviation {
  const id = overrides.id || nextId('dev');
  return {
    id,
    devNumber: `DEV-${String(counter).padStart(3, '0')}`,
    title: `Test Deviation ${id}`,
    type: 'Unplanned',
    status: 'Open',
    severity: 'Minor',
    category: 'Process',
    description: 'Test deviation description',
    deviationDetails: 'Test deviation details',
    justification: undefined,
    riskAssessment: undefined,
    correctiveAction: undefined,
    preventiveAction: undefined,
    lotNumber: undefined,
    productCode: undefined,
    quantityAffected: undefined,
    linkedCapaId: undefined,
    linkedDocumentId: undefined,
    assignedTo: 'user-001',
    dueDate: '2024-12-31',
    closedDate: undefined,
    createdById: 'user-001',
    organizationId: 'org-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Form Template Factory
// ---------------------------------------------------------------------------

export function createFormTemplate(overrides: Partial<FormTemplate> = {}): FormTemplate {
  const id = overrides.id || nextId('ft');
  return {
    id,
    documentId: 'doc-001',
    title: `Test Form Template ${id}`,
    version: '1.0',
    fields: [
      {
        id: 'field-1',
        name: 'temperature',
        label: 'Temperature',
        type: 'number',
        required: true,
        validation: { min: 0, max: 100 },
      },
      {
        id: 'field-2',
        name: 'observations',
        label: 'Observations',
        type: 'textarea',
        required: false,
      },
    ],
    isActive: true,
    organizationId: 'org-001',
    createdById: 'user-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Form Instance Factory
// ---------------------------------------------------------------------------

export function createFormInstance(overrides: Partial<FormInstance> = {}): FormInstance {
  const id = overrides.id || nextId('fi');
  return {
    id,
    templateId: overrides.templateId || 'ft-001',
    templateVersion: '1.0',
    referenceNumber: `FI-${String(counter).padStart(3, '0')}`,
    values: { temperature: 25, observations: 'Normal' },
    status: 'Draft',
    isLocked: false,
    submittedById: undefined,
    submittedAt: undefined,
    signatureHash: undefined,
    parentDocumentId: undefined,
    organizationId: 'org-001',
    createdById: 'user-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Audit Trail Factory
// ---------------------------------------------------------------------------

export function createAuditTrail(overrides: Partial<AuditTrail> = {}): AuditTrail {
  const id = overrides.id || nextId('at');
  return {
    id,
    action: 'CREATE',
    tableName: 'Document',
    recordId: 'doc-001',
    userId: 'user-001',
    userEmail: 'admin@qms-test.com',
    oldValues: undefined,
    newValues: { status: 'Draft' },
    organizationId: 'org-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Compliance Data Factory (for compliance checklists)
// ---------------------------------------------------------------------------

export function createComplianceData(overrides: Partial<import('@/lib/compliance-checklists').ComplianceData> = {}) {
  return {
    approvedDocCount: 8,
    totalDocCount: 10,
    closedCapaCount: 4,
    totalCapaCount: 5,
    completedTrainingCount: 9,
    totalTrainingCount: 10,
    completedAuditCount: 2,
    totalAuditCount: 3,
    closedNcrCount: 6,
    totalNcrCount: 8,
    openRiskCount: 2,
    totalRiskCount: 5,
    releasedBatchCount: 3,
    totalBatchCount: 4,
    qualifiedSupplierCount: 5,
    totalSupplierCount: 6,
    inReviewDocCount: 1,
    recordDocCount: 3,
    validationDocCount: 2,
    batchWithProductCodeCount: 3,
    capaWithRootCauseCount: 3,
    changeControlOpenCount: 1,
    deviationOpenCount: 2,
    ...overrides,
  };
}
