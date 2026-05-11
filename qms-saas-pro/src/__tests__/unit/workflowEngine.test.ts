import { describe, it, expect, beforeEach } from 'vitest';
import {
  canTransition,
  getAllowedTransitions,
  enforceTransition,
  isLockedStatus,
  canUpdateDocumentContent,
  enforceDocumentContentLock,
  canModifyBatchRecord,
  enforceBatchRecordLock,
  canModifyFormInstance,
  enforceFormInstanceLock,
  validateValidationSequence,
  getRequiredPhasesBefore,
  getWorkflowDefinition,
  getSupportedEntityTypes,
} from '@/services/compliance/workflowEngine';
import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { Document } from '@/types/qms';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-test-001',
    documentNumber: 'VAL-TEST-001',
    title: 'Test Document',
    type: 'Validation Protocol',
    version: '1.0',
    status: 'Approved',
    organizationId: 'org-001',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WorkflowEngine', () => {
  beforeEach(() => {
    useQMSStore.setState({ documents: [] });
  });

  // =========================================================================
  // canTransition — Document
  // =========================================================================
  describe('canTransition for Documents', () => {
    it('allows Draft → In Review', () => {
      expect(canTransition('document', 'Draft', 'In Review')).toBe(true);
    });

    it('allows Draft → Approved', () => {
      expect(canTransition('document', 'Draft', 'Approved')).toBe(true);
    });

    it('allows In Review → Approved', () => {
      expect(canTransition('document', 'In Review', 'Approved')).toBe(true);
    });

    it('allows In Review → Draft (rejection)', () => {
      expect(canTransition('document', 'In Review', 'Draft')).toBe(true);
    });

    it('disallows Approved → Draft', () => {
      expect(canTransition('document', 'Approved', 'Draft')).toBe(false);
    });

    it('allows Approved → Obsolete', () => {
      expect(canTransition('document', 'Approved', 'Obsolete')).toBe(true);
    });

    it('disallows Obsolete → Draft', () => {
      expect(canTransition('document', 'Obsolete', 'Draft')).toBe(false);
    });

    it('disallows Obsolete → any other status', () => {
      expect(canTransition('document', 'Obsolete', 'Approved')).toBe(false);
      expect(canTransition('document', 'Obsolete', 'In Review')).toBe(false);
      expect(canTransition('document', 'Obsolete', 'Draft')).toBe(false);
    });
  });

  // =========================================================================
  // canTransition — CAPA
  // =========================================================================
  describe('canTransition for CAPAs', () => {
    it('allows Open → Investigation', () => {
      expect(canTransition('capa', 'Open', 'Investigation')).toBe(true);
    });

    it('allows Investigation → Implementation', () => {
      expect(canTransition('capa', 'Investigation', 'Implementation')).toBe(true);
    });

    it('allows Investigation → Open (rejection)', () => {
      expect(canTransition('capa', 'Investigation', 'Open')).toBe(true);
    });

    it('allows Effectiveness Check → Closed', () => {
      expect(canTransition('capa', 'Effectiveness Check', 'Closed')).toBe(true);
    });

    it('disallows Closed → any other status', () => {
      expect(canTransition('capa', 'Closed', 'Open')).toBe(false);
      expect(canTransition('capa', 'Closed', 'Investigation')).toBe(false);
    });
  });

  // =========================================================================
  // canTransition — NCR
  // =========================================================================
  describe('canTransition for NCRs', () => {
    it('allows Open → Under Investigation', () => {
      expect(canTransition('ncr', 'Open', 'Under Investigation')).toBe(true);
    });

    it('allows Under Investigation → Pending Disposition', () => {
      expect(canTransition('ncr', 'Under Investigation', 'Pending Disposition')).toBe(true);
    });

    it('allows Pending Disposition → Closed', () => {
      expect(canTransition('ncr', 'Pending Disposition', 'Closed')).toBe(true);
    });

    it('disallows Closed → Open', () => {
      expect(canTransition('ncr', 'Closed', 'Open')).toBe(false);
    });
  });

  // =========================================================================
  // canTransition — Batch Records
  // =========================================================================
  describe('canTransition for Batch Records', () => {
    it('allows In Progress → Pending QA Review', () => {
      expect(canTransition('batch_record', 'In Progress', 'Pending QA Review')).toBe(true);
    });

    it('allows Pending QA Review → Released', () => {
      expect(canTransition('batch_record', 'Pending QA Review', 'Released')).toBe(true);
    });

    it('allows Pending QA Review → Rejected', () => {
      expect(canTransition('batch_record', 'Pending QA Review', 'Rejected')).toBe(true);
    });

    it('disallows Released → any other status', () => {
      expect(canTransition('batch_record', 'Released', 'In Progress')).toBe(false);
      expect(canTransition('batch_record', 'Released', 'Rejected')).toBe(false);
    });

    it('allows Quarantine → In Progress', () => {
      expect(canTransition('batch_record', 'Quarantine', 'In Progress')).toBe(true);
    });
  });

  // =========================================================================
  // getAllowedTransitions
  // =========================================================================
  describe('getAllowedTransitions', () => {
    it('returns correct array for document Draft', () => {
      const transitions = getAllowedTransitions('document', 'Draft');
      expect(transitions).toEqual(['In Review', 'Approved']);
    });

    it('returns empty array for document Obsolete', () => {
      const transitions = getAllowedTransitions('document', 'Obsolete');
      expect(transitions).toEqual([]);
    });

    it('returns empty array for unknown entity type', () => {
      const transitions = getAllowedTransitions('unknown_type', 'Draft');
      expect(transitions).toEqual([]);
    });

    it('returns empty array for unknown status', () => {
      const transitions = getAllowedTransitions('document', 'UnknownStatus');
      expect(transitions).toEqual([]);
    });
  });

  // =========================================================================
  // isLockedStatus
  // =========================================================================
  describe('isLockedStatus', () => {
    it('returns false for document Approved (can be obsoleted)', () => {
      expect(isLockedStatus('document', 'Approved')).toBe(true);
    });

    it('returns true for batch_record Released', () => {
      expect(isLockedStatus('batch_record', 'Released')).toBe(true);
    });

    it('returns true for batch_record Rejected', () => {
      expect(isLockedStatus('batch_record', 'Rejected')).toBe(true);
    });

    it('returns true for form_instance Submitted', () => {
      expect(isLockedStatus('form_instance', 'Submitted')).toBe(true);
    });

    it('returns true for form_instance Approved', () => {
      expect(isLockedStatus('form_instance', 'Approved')).toBe(true);
    });

    it('returns false for document Draft', () => {
      expect(isLockedStatus('document', 'Draft')).toBe(false);
    });

    it('returns false for batch_record In Progress', () => {
      expect(isLockedStatus('batch_record', 'In Progress')).toBe(false);
    });

    it('returns false for unknown entity type', () => {
      expect(isLockedStatus('unknown_type', 'Draft')).toBe(false);
    });
  });

  // =========================================================================
  // Document content lock
  // =========================================================================
  describe('canUpdateDocumentContent', () => {
    it('allows updating content in Draft', () => {
      expect(canUpdateDocumentContent('Draft')).toBe(true);
    });

    it('allows updating content in In Review', () => {
      expect(canUpdateDocumentContent('In Review')).toBe(true);
    });

    it('disallows updating content in Approved', () => {
      expect(canUpdateDocumentContent('Approved')).toBe(false);
    });

    it('disallows updating content in Obsolete', () => {
      expect(canUpdateDocumentContent('Obsolete')).toBe(false);
    });
  });

  describe('enforceDocumentContentLock', () => {
    it('does not throw for Draft documents', () => {
      expect(() => enforceDocumentContentLock('Draft')).not.toThrow();
    });

    it('throws ComplianceError for Approved documents', () => {
      expect(() => enforceDocumentContentLock('Approved')).toThrow(ComplianceError);
    });

    it('throws with DOCUMENT_LOCKED code', () => {
      try {
        enforceDocumentContentLock('Approved');
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.DOCUMENT_LOCKED);
      }
    });
  });

  // =========================================================================
  // Batch record lock
  // =========================================================================
  describe('canModifyBatchRecord', () => {
    it('allows modification when not locked and in progress', () => {
      expect(canModifyBatchRecord('In Progress', false)).toBe(true);
    });

    it('disallows modification when isLocked is true', () => {
      expect(canModifyBatchRecord('In Progress', true)).toBe(false);
    });

    it('disallows modification when status is Released', () => {
      expect(canModifyBatchRecord('Released', false)).toBe(false);
    });

    it('disallows modification when status is Rejected', () => {
      expect(canModifyBatchRecord('Rejected', false)).toBe(false);
    });
  });

  describe('enforceBatchRecordLock', () => {
    it('throws with BATCH_LOCKED code for locked records', () => {
      try {
        enforceBatchRecordLock('Released', false, 'LOT-001');
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.BATCH_LOCKED);
      }
    });
  });

  // =========================================================================
  // Form instance lock
  // =========================================================================
  describe('canModifyFormInstance', () => {
    it('allows modification when Draft and not locked', () => {
      expect(canModifyFormInstance('Draft', false)).toBe(true);
    });

    it('disallows modification when Submitted', () => {
      expect(canModifyFormInstance('Submitted', false)).toBe(false);
    });

    it('disallows modification when Approved', () => {
      expect(canModifyFormInstance('Approved', false)).toBe(false);
    });

    it('disallows modification when isLocked is true', () => {
      expect(canModifyFormInstance('Draft', true)).toBe(false);
    });
  });

  describe('enforceFormInstanceLock', () => {
    it('throws with FORM_LOCKED code for locked forms', () => {
      try {
        enforceFormInstanceLock('Submitted', true, 'FRM-001');
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.FORM_LOCKED);
      }
    });
  });

  // =========================================================================
  // IQ/OQ/PQ Validation Sequence
  // =========================================================================
  describe('validateValidationSequence', () => {
    const parentId = 'validation-parent-001';

    it('allows IQ without prerequisite', () => {
      // IQ is the first phase — no prerequisite needed
      expect(() => validateValidationSequence('IQ', parentId)).not.toThrow();
    });

    it('throws VALIDATION_SEQUENCE_ERROR for OQ without IQ Approved', () => {
      // No IQ document exists
      useQMSStore.setState({ documents: [] });

      try {
        validateValidationSequence('OQ', parentId);
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.VALIDATION_SEQUENCE_ERROR);
      }
    });

    it('throws VALIDATION_SEQUENCE_ERROR for OQ when IQ is not Approved', () => {
      // IQ exists but is in Draft
      useQMSStore.setState({
        documents: [
          makeDocument({
            id: 'iq-draft',
            validationPhase: 'IQ',
            status: 'Draft',
            parentValidationId: parentId,
          }),
        ],
      });

      try {
        validateValidationSequence('OQ', parentId);
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.VALIDATION_SEQUENCE_ERROR);
      }
    });

    it('allows OQ when IQ is Approved', () => {
      useQMSStore.setState({
        documents: [
          makeDocument({
            id: 'iq-approved',
            validationPhase: 'IQ',
            status: 'Approved',
            parentValidationId: parentId,
          }),
        ],
      });

      expect(() => validateValidationSequence('OQ', parentId)).not.toThrow();
    });

    it('throws VALIDATION_SEQUENCE_ERROR for PQ without OQ Approved', () => {
      // IQ Approved but no OQ
      useQMSStore.setState({
        documents: [
          makeDocument({
            id: 'iq-approved-pq-test',
            validationPhase: 'IQ',
            status: 'Approved',
            parentValidationId: parentId,
          }),
        ],
      });

      try {
        validateValidationSequence('PQ', parentId);
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.VALIDATION_SEQUENCE_ERROR);
      }
    });

    it('allows PQ when OQ is Approved', () => {
      useQMSStore.setState({
        documents: [
          makeDocument({
            id: 'iq-approved-for-pq',
            validationPhase: 'IQ',
            status: 'Approved',
            parentValidationId: parentId,
          }),
          makeDocument({
            id: 'oq-approved-for-pq',
            validationPhase: 'OQ',
            status: 'Approved',
            parentValidationId: parentId,
          }),
        ],
      });

      expect(() => validateValidationSequence('PQ', parentId)).not.toThrow();
    });

    it('throws VALIDATION_SEQUENCE_ERROR for Full without PQ Approved', () => {
      useQMSStore.setState({
        documents: [
          makeDocument({
            id: 'iq-full-test',
            validationPhase: 'IQ',
            status: 'Approved',
            parentValidationId: parentId,
          }),
          makeDocument({
            id: 'oq-full-test',
            validationPhase: 'OQ',
            status: 'Approved',
            parentValidationId: parentId,
          }),
          // PQ is Draft, not Approved
          makeDocument({
            id: 'pq-draft-full-test',
            validationPhase: 'PQ',
            status: 'Draft',
            parentValidationId: parentId,
          }),
        ],
      });

      try {
        validateValidationSequence('Full', parentId);
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.VALIDATION_SEQUENCE_ERROR);
      }
    });

    it('allows Full when PQ is Approved', () => {
      useQMSStore.setState({
        documents: [
          makeDocument({
            id: 'iq-approved-full',
            validationPhase: 'IQ',
            status: 'Approved',
            parentValidationId: parentId,
          }),
          makeDocument({
            id: 'oq-approved-full',
            validationPhase: 'OQ',
            status: 'Approved',
            parentValidationId: parentId,
          }),
          makeDocument({
            id: 'pq-approved-full',
            validationPhase: 'PQ',
            status: 'Approved',
            parentValidationId: parentId,
          }),
        ],
      });

      expect(() => validateValidationSequence('Full', parentId)).not.toThrow();
    });
  });

  // =========================================================================
  // getRequiredPhasesBefore
  // =========================================================================
  describe('getRequiredPhasesBefore', () => {
    it('returns empty array for IQ', () => {
      expect(getRequiredPhasesBefore('IQ')).toEqual([]);
    });

    it('returns [IQ] for OQ', () => {
      expect(getRequiredPhasesBefore('OQ')).toEqual(['IQ']);
    });

    it('returns [IQ, OQ] for PQ', () => {
      expect(getRequiredPhasesBefore('PQ')).toEqual(['IQ', 'OQ']);
    });
  });

  // =========================================================================
  // enforceTransition
  // =========================================================================
  describe('enforceTransition', () => {
    it('does not throw for valid transition', () => {
      expect(() => enforceTransition('document', 'Draft', 'In Review')).not.toThrow();
    });

    it('throws ComplianceError for invalid transition', () => {
      expect(() => enforceTransition('document', 'Approved', 'Draft')).toThrow(ComplianceError);
    });

    it('throws with INVALID_STATUS_TRANSITION code', () => {
      try {
        enforceTransition('document', 'Approved', 'Draft');
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.INVALID_STATUS_TRANSITION);
      }
    });
  });

  // =========================================================================
  // Utility functions
  // =========================================================================
  describe('getWorkflowDefinition', () => {
    it('returns workflow definition for known entity types', () => {
      const docWorkflow = getWorkflowDefinition('document');
      expect(docWorkflow).not.toBeNull();
      expect(docWorkflow).toHaveProperty('Draft');
      expect(docWorkflow).toHaveProperty('Approved');
    });

    it('returns null for unknown entity types', () => {
      expect(getWorkflowDefinition('unknown_type')).toBeNull();
    });
  });

  describe('getSupportedEntityTypes', () => {
    it('returns all supported entity types', () => {
      const types = getSupportedEntityTypes();
      expect(types).toContain('document');
      expect(types).toContain('capa');
      expect(types).toContain('ncr');
      expect(types).toContain('batch_record');
      expect(types).toContain('form_instance');
    });
  });
});
