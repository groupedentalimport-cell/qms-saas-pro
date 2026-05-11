import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBatchRecord,
  updateBatchRecord,
  releaseBatch,
  rejectBatch,
  completeBatchStep,
  startBatchStep,
  quarantineBatch,
} from '@/services/batchService';
import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { BatchRecord, BatchStep, Document } from '@/types/qms';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-master-001',
    documentNumber: 'SPEC-MASTER-001',
    title: 'Master Formula Spec',
    type: 'Specification',
    version: '1.0',
    status: 'Approved',
    organizationId: 'org-001',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeBatchSteps(count: number): Omit<BatchStep, 'id' | 'createdAt'>[] {
  const steps: Omit<BatchStep, 'id' | 'createdAt'>[] = [];
  for (let i = 1; i <= count; i++) {
    steps.push({
      batchRecordId: '', // will be set by createBatchRecord
      stepOrder: i,
      stepName: `Step ${i}`,
      instructions: `Instruction for step ${i}`,
      expectedValue: `Expected ${i}`,
      status: 'Pending',
    });
  }
  return steps;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BatchLocking', () => {
  beforeEach(() => {
    // Reset store to clean state with an Approved Specification document
    useQMSStore.setState({
      batchRecords: [],
      documents: [
        makeDocument({
          id: 'doc-master-001',
          type: 'Specification',
          status: 'Approved',
        }),
      ],
      auditTrails: [],
    });
  });

  // =========================================================================
  // Batch creation
  // =========================================================================
  describe('batch creation', () => {
    it('creates a batch record with valid data', () => {
      const batch = createBatchRecord({
        lotNumber: 'LOT-TEST-001',
        productName: 'Test Product',
        manufacturingDate: '2024-01-15',
        status: 'In Progress',
        isLocked: false,
        organizationId: 'org-001',
      });

      expect(batch).toBeDefined();
      expect(batch.id).toBeTruthy();
      expect(batch.lotNumber).toBe('LOT-TEST-001');
      expect(batch.status).toBe('In Progress');
      expect(batch.isLocked).toBe(false);
    });

    it('throws DUPLICATE_RECORD for duplicate lot number', () => {
      createBatchRecord({
        lotNumber: 'LOT-DUP-001',
        productName: 'Test Product',
        manufacturingDate: '2024-01-15',
        status: 'In Progress',
        isLocked: false,
      });

      try {
        createBatchRecord({
          lotNumber: 'LOT-DUP-001',
          productName: 'Another Product',
          manufacturingDate: '2024-01-15',
          status: 'In Progress',
          isLocked: false,
        });
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.DUPLICATE_RECORD);
      }
    });

    it('throws PREREQUISITE_NOT_MET when master formula is not Approved', () => {
      useQMSStore.setState({
        documents: [
          makeDocument({
            id: 'doc-master-draft',
            type: 'Specification',
            status: 'Draft',
          }),
        ],
      });

      try {
        createBatchRecord({
          lotNumber: 'LOT-DRAFT-MASTER',
          productName: 'Test Product',
          manufacturingDate: '2024-01-15',
          status: 'In Progress',
          isLocked: false,
          masterFormulaId: 'doc-master-draft',
        });
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.PREREQUISITE_NOT_MET);
      }
    });
  });

  // =========================================================================
  // Batch update
  // =========================================================================
  describe('batch update', () => {
    it('succeeds when batch is not locked', () => {
      const batch = createBatchRecord({
        lotNumber: 'LOT-UPD-001',
        productName: 'Test Product',
        manufacturingDate: '2024-01-15',
        status: 'In Progress',
        isLocked: false,
      });

      const updated = updateBatchRecord(batch.id, { productName: 'Updated Product' });
      expect(updated.productName).toBe('Updated Product');
    });

    it('throws BATCH_LOCKED when batch is locked', () => {
      const batch = createBatchRecord({
        lotNumber: 'LOT-LOCKED-UPD',
        productName: 'Test Product',
        manufacturingDate: '2024-01-15',
        status: 'In Progress',
        isLocked: false,
      });

      // Manually lock the batch
      useQMSStore.getState().updateBatchRecord(batch.id, { isLocked: true });

      try {
        updateBatchRecord(batch.id, { productName: 'Should Fail' });
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.BATCH_LOCKED);
      }
    });
  });

  // =========================================================================
  // Batch release
  // =========================================================================
  describe('batch release', () => {
    it('sets isLocked=true and status=Released on release', () => {
      // Create a batch with all steps completed
      const batch = createBatchRecord({
        lotNumber: 'LOT-RELEASE-001',
        productName: 'Release Test Product',
        manufacturingDate: '2024-01-15',
        status: 'Pending QA Review',
        isLocked: false,
      });

      const released = releaseBatch(batch.id, 'user-002', 'QA Manager');
      expect(released.status).toBe('Released');
      expect(released.isLocked).toBe(true);
      expect(released.qaReleasedById).toBe('user-002');
      expect(released.qaReleaseDate).toBeTruthy();
    });

    it('throws INVALID_STATUS_TRANSITION when not in Pending QA Review', () => {
      const batch = createBatchRecord({
        lotNumber: 'LOT-RELEASE-FAIL',
        productName: 'Release Fail Product',
        manufacturingDate: '2024-01-15',
        status: 'In Progress',
        isLocked: false,
      });

      try {
        releaseBatch(batch.id, 'user-002', 'QA Manager');
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.INVALID_STATUS_TRANSITION);
      }
    });

    it('throws PREREQUISITE_NOT_MET when incomplete steps exist', () => {
      const batch = createBatchRecord({
        lotNumber: 'LOT-INCOMPLETE-001',
        productName: 'Incomplete Product',
        manufacturingDate: '2024-01-15',
        status: 'Pending QA Review',
        isLocked: false,
        steps: [
          {
            id: 'step-incomplete-1',
            batchRecordId: '',
            stepOrder: 1,
            stepName: 'Step 1',
            status: 'Pending',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      });

      try {
        releaseBatch(batch.id, 'user-002', 'QA Manager');
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.PREREQUISITE_NOT_MET);
      }
    });
  });

  // =========================================================================
  // Batch reject
  // =========================================================================
  describe('batch reject', () => {
    it('sets isLocked=true and status=Rejected on reject', () => {
      const batch = createBatchRecord({
        lotNumber: 'LOT-REJECT-001',
        productName: 'Reject Test Product',
        manufacturingDate: '2024-01-15',
        status: 'Pending QA Review',
        isLocked: false,
      });

      const rejected = rejectBatch(batch.id, 'user-002', 'QA Manager', 'Quality failure');
      expect(rejected.status).toBe('Rejected');
      expect(rejected.isLocked).toBe(true);
    });

    it('allows rejecting from In Progress status', () => {
      const batch = createBatchRecord({
        lotNumber: 'LOT-REJECT-IP',
        productName: 'Reject In Progress',
        manufacturingDate: '2024-01-15',
        status: 'In Progress',
        isLocked: false,
      });

      const rejected = rejectBatch(batch.id, 'user-002', 'QA Manager', 'Critical deviation found');
      expect(rejected.status).toBe('Rejected');
      expect(rejected.isLocked).toBe(true);
    });
  });

  // =========================================================================
  // Step completion sequence
  // =========================================================================
  describe('step completion sequence', () => {
    it('requires steps to be completed sequentially', () => {
      const batch = createBatchRecord({
        lotNumber: 'LOT-SEQ-001',
        productName: 'Sequence Test Product',
        manufacturingDate: '2024-01-15',
        status: 'In Progress',
        isLocked: false,
        steps: [
          {
            id: 'seq-step-1',
            batchRecordId: '',
            stepOrder: 1,
            stepName: 'Step 1 - Weighing',
            expectedValue: '100g',
            status: 'Pending',
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'seq-step-2',
            batchRecordId: '',
            stepOrder: 2,
            stepName: 'Step 2 - Mixing',
            expectedValue: '30 min',
            status: 'Pending',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      });

      // Trying to complete step 2 before step 1 should throw
      try {
        completeBatchStep(batch.id, 'seq-step-2', 'user-006', '30 min');
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.VALIDATION_SEQUENCE_ERROR);
      }
    });

    it('allows completing steps in order', () => {
      const batch = createBatchRecord({
        lotNumber: 'LOT-SEQ-OK',
        productName: 'Sequence OK Product',
        manufacturingDate: '2024-01-15',
        status: 'In Progress',
        isLocked: false,
        steps: [
          {
            id: 'ok-step-1',
            batchRecordId: '',
            stepOrder: 1,
            stepName: 'Step 1 - Weighing',
            expectedValue: '100g',
            status: 'Pending',
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'ok-step-2',
            batchRecordId: '',
            stepOrder: 2,
            stepName: 'Step 2 - Mixing',
            expectedValue: '30 min',
            status: 'Pending',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      });

      // Complete step 1
      const step1 = completeBatchStep(batch.id, 'ok-step-1', 'user-006', '100g');
      expect(step1.status).toBe('Completed');
      expect(step1.operatorId).toBe('user-006');

      // Now step 2 can be completed
      const step2 = completeBatchStep(batch.id, 'ok-step-2', 'user-006', '30 min');
      expect(step2.status).toBe('Completed');
    });

    it('throws BATCH_LOCKED when completing step on a locked batch', () => {
      const batch = createBatchRecord({
        lotNumber: 'LOT-LOCKED-STEP',
        productName: 'Locked Step Product',
        manufacturingDate: '2024-01-15',
        status: 'In Progress',
        isLocked: false,
        steps: [
          {
            id: 'locked-step-1',
            batchRecordId: '',
            stepOrder: 1,
            stepName: 'Step 1',
            status: 'Pending',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      });

      // Lock the batch
      useQMSStore.getState().updateBatchRecord(batch.id, { isLocked: true });

      try {
        completeBatchStep(batch.id, 'locked-step-1', 'user-006', 'value');
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.BATCH_LOCKED);
      }
    });
  });

  // =========================================================================
  // Released batch cannot have steps modified
  // =========================================================================
  describe('released batch immutability', () => {
    it('prevents step completion on a released batch', () => {
      // Create and release a batch
      const batch = createBatchRecord({
        lotNumber: 'LOT-IMMUTABLE-001',
        productName: 'Immutable Product',
        manufacturingDate: '2024-01-15',
        status: 'Pending QA Review',
        isLocked: false,
      });

      // Release the batch
      releaseBatch(batch.id, 'user-002', 'QA Manager');

      // Now try to update the released batch
      try {
        updateBatchRecord(batch.id, { productName: 'Modified Name' });
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.BATCH_LOCKED);
      }
    });
  });
});
