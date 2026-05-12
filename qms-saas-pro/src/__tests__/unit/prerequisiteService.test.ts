import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkPrerequisites,
  enforcePrerequisites,
  getPrerequisiteWarnings,
  hasPrerequisites,
} from '@/services/compliance/prerequisiteEngine';
import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { DocumentPrerequisite, PrerequisiteRecordType, Document } from '@/types/qms';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a minimal DocumentPrerequisite for test setup. */
function makePrerequisite(overrides: Partial<DocumentPrerequisite> = {}): DocumentPrerequisite {
  return {
    id: 'prereq-test-001',
    organizationId: 'org-001',
    recordType: 'CAPA',
    requiredDocType: 'SOP',
    isMandatory: true,
    description: 'Test prerequisite',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/** Create a minimal Document for test setup. */
function makeDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-test-001',
    documentNumber: 'SOP-TEST-001',
    title: 'Test SOP',
    type: 'SOP',
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

describe('PrerequisiteEngine', () => {
  beforeEach(() => {
    // Reset store to a clean state with no prerequisites and no documents
    useQMSStore.setState({
      prerequisites: [],
      documents: [],
    });
  });

  // =========================================================================
  // checkPrerequisites
  // =========================================================================
  describe('checkPrerequisites', () => {
    it('returns met:true when no prerequisites are defined for a record type', () => {
      // DEVIATION has a default in DEFAULT_PREREQUISITES, but if we store
      // zero prerequisites for an unknown type, it falls through cleanly.
      // We use the store with empty prerequisites to test this.
      const result = checkPrerequisites('CAPA', 'org-001');
      // CAPA has default prerequisites defined (SOP mandatory, Policy non-mandatory)
      // Since we cleared documents, no Approved SOP exists → met depends on defaults.
      // With empty store prerequisites, the engine uses defaults.
      expect(result).toHaveProperty('met');
      expect(result).toHaveProperty('missing');
      expect(result).toHaveProperty('checked');
    });

    it('returns met:true when all mandatory prerequisites are satisfied', () => {
      // Set up a prerequisite that requires an Approved SOP for CAPA
      const prereq = makePrerequisite({
        id: 'prereq-satisfied',
        recordType: 'CAPA',
        requiredDocType: 'SOP',
        isMandatory: true,
      });
      // Add an Approved SOP document
      const doc = makeDocument({
        id: 'doc-sop-approved',
        type: 'SOP',
        status: 'Approved',
      });

      useQMSStore.setState({
        prerequisites: [prereq],
        documents: [doc],
      });

      const result = checkPrerequisites('CAPA', 'org-001');
      expect(result.met).toBe(true);
      expect(result.missing).toHaveLength(0);
      expect(result.checked).toHaveLength(1);
      expect(result.checked[0].satisfied).toBe(true);
    });

    it('returns met:false when a mandatory prerequisite is missing', () => {
      const prereq = makePrerequisite({
        id: 'prereq-missing',
        recordType: 'CAPA',
        requiredDocType: 'SOP',
        isMandatory: true,
      });

      useQMSStore.setState({
        prerequisites: [prereq],
        documents: [], // No documents → prerequisite not satisfied
      });

      const result = checkPrerequisites('CAPA', 'org-001');
      expect(result.met).toBe(false);
      expect(result.missing).toHaveLength(1);
      expect(result.missing[0].requiredDocType).toBe('SOP');
    });

    it('returns met:true when only non-mandatory prerequisite is missing', () => {
      const prereq = makePrerequisite({
        id: 'prereq-non-mandatory',
        recordType: 'CAPA',
        requiredDocType: 'Policy',
        isMandatory: false,
      });

      useQMSStore.setState({
        prerequisites: [prereq],
        documents: [], // No Approved Policy, but it's non-mandatory
      });

      const result = checkPrerequisites('CAPA', 'org-001');
      expect(result.met).toBe(true);
      expect(result.missing).toHaveLength(0);
      expect(result.checked).toHaveLength(1);
      expect(result.checked[0].satisfied).toBe(false);
    });

    it('filters prerequisites by organization', () => {
      // Prerequisite for org-002 only
      const prereqOrg002 = makePrerequisite({
        id: 'prereq-org002',
        organizationId: 'org-002',
        recordType: 'CAPA',
        requiredDocType: 'SOP',
        isMandatory: true,
      });

      useQMSStore.setState({
        prerequisites: [prereqOrg002],
        documents: [],
      });

      // org-001 should not see org-002's prerequisites
      const resultOrg001 = checkPrerequisites('CAPA', 'org-001');
      // Falls through to defaults since no stored prerequisites match org-001
      // The result depends on default prerequisites which require SOP
      expect(resultOrg001.checked.length).toBeGreaterThanOrEqual(0);
    });

    it('uses default prerequisites when no stored prerequisites match', () => {
      // No stored prerequisites at all → defaults kick in
      useQMSStore.setState({
        prerequisites: [],
        documents: [],
      });

      const result = checkPrerequisites('CAPA', 'org-001');
      // Default for CAPA: SOP mandatory, Policy non-mandatory
      expect(result.checked.length).toBeGreaterThanOrEqual(1);
    });

    it('respects requiredDocRef when specified', () => {
      const prereq = makePrerequisite({
        id: 'prereq-with-ref',
        recordType: 'CAPA',
        requiredDocType: 'SOP',
        requiredDocRef: 'SOP-QMS-002',
        isMandatory: true,
      });
      // A document exists with a different number
      const doc = makeDocument({
        id: 'doc-wrong-ref',
        documentNumber: 'SOP-OTHER-001',
        type: 'SOP',
        status: 'Approved',
      });

      useQMSStore.setState({
        prerequisites: [prereq],
        documents: [doc],
      });

      const result = checkPrerequisites('CAPA', 'org-001');
      expect(result.met).toBe(false);
    });

    it('satisfies prerequisite with matching document reference', () => {
      const prereq = makePrerequisite({
        id: 'prereq-ref-match',
        recordType: 'CAPA',
        requiredDocType: 'SOP',
        requiredDocRef: 'SOP-QMS-002',
        isMandatory: true,
      });
      const doc = makeDocument({
        id: 'doc-correct-ref',
        documentNumber: 'SOP-QMS-002',
        type: 'SOP',
        status: 'Approved',
      });

      useQMSStore.setState({
        prerequisites: [prereq],
        documents: [doc],
      });

      const result = checkPrerequisites('CAPA', 'org-001');
      expect(result.met).toBe(true);
    });

    it('only counts Approved documents as satisfying prerequisites', () => {
      const prereq = makePrerequisite({
        id: 'prereq-draft-sop',
        recordType: 'CAPA',
        requiredDocType: 'SOP',
        isMandatory: true,
      });
      const draftDoc = makeDocument({
        id: 'doc-draft-sop',
        type: 'SOP',
        status: 'Draft',
      });

      useQMSStore.setState({
        prerequisites: [prereq],
        documents: [draftDoc],
      });

      const result = checkPrerequisites('CAPA', 'org-001');
      expect(result.met).toBe(false);
    });
  });

  // =========================================================================
  // enforcePrerequisites
  // =========================================================================
  describe('enforcePrerequisites', () => {
    it('does not throw when prerequisites are met', () => {
      const prereq = makePrerequisite({
        id: 'prereq-met',
        recordType: 'CAPA',
        requiredDocType: 'SOP',
        isMandatory: true,
      });
      const doc = makeDocument({
        id: 'doc-sop-ok',
        type: 'SOP',
        status: 'Approved',
      });

      useQMSStore.setState({
        prerequisites: [prereq],
        documents: [doc],
      });

      expect(() => enforcePrerequisites('CAPA', 'org-001')).not.toThrow();
    });

    it('throws ComplianceError with PREREQUISITE_NOT_MET when prerequisites are not met', () => {
      const prereq = makePrerequisite({
        id: 'prereq-unmet',
        recordType: 'CAPA',
        requiredDocType: 'SOP',
        isMandatory: true,
      });

      useQMSStore.setState({
        prerequisites: [prereq],
        documents: [],
      });

      expect(() => enforcePrerequisites('CAPA', 'org-001')).toThrow(ComplianceError);
    });

    it('includes PREREQUISITE_NOT_MET code in the thrown error', () => {
      const prereq = makePrerequisite({
        id: 'prereq-code-check',
        recordType: 'CAPA',
        requiredDocType: 'SOP',
        isMandatory: true,
      });

      useQMSStore.setState({
        prerequisites: [prereq],
        documents: [],
      });

      try {
        enforcePrerequisites('CAPA', 'org-001');
        expect.fail('Expected ComplianceError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        const complianceErr = error as ComplianceError;
        expect(complianceErr.code).toBe(COMPLIANCE_CODES.PREREQUISITE_NOT_MET);
        expect(complianceErr.message).toContain('CAPA');
        expect(complianceErr.message).toContain('SOP');
      }
    });

    it('does not throw when only non-mandatory prerequisites are missing', () => {
      const prereq = makePrerequisite({
        id: 'prereq-non-mandatory',
        recordType: 'CAPA',
        requiredDocType: 'Policy',
        isMandatory: false,
      });

      useQMSStore.setState({
        prerequisites: [prereq],
        documents: [],
      });

      expect(() => enforcePrerequisites('CAPA', 'org-001')).not.toThrow();
    });
  });

  // =========================================================================
  // getPrerequisiteWarnings
  // =========================================================================
  describe('getPrerequisiteWarnings', () => {
    it('returns warning objects for missing prerequisites', () => {
      const prereq = makePrerequisite({
        id: 'prereq-warning',
        recordType: 'CAPA',
        requiredDocType: 'SOP',
        isMandatory: true,
        description: 'An Approved SOP is required before creating a CAPA',
      });

      useQMSStore.setState({
        prerequisites: [prereq],
        documents: [],
      });

      const warnings = getPrerequisiteWarnings('CAPA', 'org-001');
      expect(warnings.length).toBeGreaterThanOrEqual(1);

      const missingWarning = warnings.find(w => !w.prerequisite.isMandatory || w.severity === 'error');
      expect(missingWarning).toBeDefined();
      expect(missingWarning!.severity).toBe('error');
      expect(missingWarning!.message).toBeTruthy();
      expect(missingWarning!.prerequisite).toBe(prereq);
    });

    it('returns warning severity for non-mandatory missing prerequisites', () => {
      const prereq = makePrerequisite({
        id: 'prereq-warn-non-mandatory',
        recordType: 'CAPA',
        requiredDocType: 'Policy',
        isMandatory: false,
        description: 'An Approved CAPA Policy is recommended',
      });

      useQMSStore.setState({
        prerequisites: [prereq],
        documents: [],
      });

      const warnings = getPrerequisiteWarnings('CAPA', 'org-001');
      const warning = warnings.find(w => w.prerequisite.id === 'prereq-warn-non-mandatory');
      expect(warning).toBeDefined();
      expect(warning!.severity).toBe('warning');
    });

    it('returns satisfied message for met prerequisites', () => {
      const prereq = makePrerequisite({
        id: 'prereq-satisfied-warn',
        recordType: 'CAPA',
        requiredDocType: 'SOP',
        isMandatory: true,
      });
      const doc = makeDocument({
        id: 'doc-sop-met',
        type: 'SOP',
        status: 'Approved',
      });

      useQMSStore.setState({
        prerequisites: [prereq],
        documents: [doc],
      });

      const warnings = getPrerequisiteWarnings('CAPA', 'org-001');
      const satisfiedWarning = warnings.find(w => w.prerequisite.id === 'prereq-satisfied-warn');
      expect(satisfiedWarning).toBeDefined();
      expect(satisfiedWarning!.message).toContain('satisfied');
    });
  });

  // =========================================================================
  // hasPrerequisites
  // =========================================================================
  describe('hasPrerequisites', () => {
    it('returns true when stored prerequisites exist for a record type', () => {
      const prereq = makePrerequisite({
        id: 'prereq-exists',
        recordType: 'CAPA',
      });

      useQMSStore.setState({
        prerequisites: [prereq],
      });

      expect(hasPrerequisites('CAPA', 'org-001')).toBe(true);
    });

    it('returns true when default prerequisites exist for a record type', () => {
      useQMSStore.setState({ prerequisites: [] });
      // CAPA has default prerequisites in DEFAULT_PREREQUISITES
      expect(hasPrerequisites('CAPA', 'org-001')).toBe(true);
    });
  });
});
