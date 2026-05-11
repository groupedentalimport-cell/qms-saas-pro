import { describe, it, expect, beforeEach } from 'vitest';
import {
  createFormTemplate,
  createFormInstance,
  submitFormInstance,
  approveFormInstance,
  rejectFormInstance,
  updateFormInstanceValues,
} from '@/services/formService';
import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { FormTemplate, FormInstance, Document, FormFieldDefinition } from '@/types/qms';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-form-001',
    documentNumber: 'FORM-DOC-001',
    title: 'Test Form Document',
    type: 'Form',
    version: '1.0',
    status: 'Approved',
    organizationId: 'org-001',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

const testFields: FormFieldDefinition[] = [
  {
    id: 'field-temp',
    name: 'temperature',
    label: 'Temperature',
    type: 'number',
    required: true,
    validation: { min: 0, max: 100 },
  },
  {
    id: 'field-obs',
    name: 'observations',
    label: 'Observations',
    type: 'textarea',
    required: false,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FormImmutability', () => {
  beforeEach(() => {
    // Reset store with an Approved Form document
    useQMSStore.setState({
      documents: [makeFormDocument()],
      formTemplates: [],
      formInstances: [],
      auditTrails: [],
    });
  });

  // =========================================================================
  // Creating form instance from active template
  // =========================================================================
  describe('creating form instance from active template', () => {
    it('creates an instance from an active template', () => {
      const template = createFormTemplate({
        documentId: 'doc-form-001',
        title: 'Temperature Log',
        version: '1.0',
        fields: testFields,
        isActive: true,
        organizationId: 'org-001',
      });

      const instance = createFormInstance(template.id, 'user-006', 'org-001');
      expect(instance).toBeDefined();
      expect(instance.status).toBe('Draft');
      expect(instance.isLocked).toBe(false);
      expect(instance.templateId).toBe(template.id);
      expect(instance.values).toHaveProperty('temperature');
    });

    it('throws when template is not active', () => {
      // Add an inactive template directly to the store
      const inactiveTemplate: FormTemplate = {
        id: 'ft-inactive',
        documentId: 'doc-form-001',
        title: 'Inactive Template',
        version: '1.0',
        fields: testFields,
        isActive: false,
        organizationId: 'org-001',
        createdAt: '2024-01-01T00:00:00Z',
      };
      useQMSStore.setState({ formTemplates: [inactiveTemplate] });

      try {
        createFormInstance('ft-inactive', 'user-006', 'org-001');
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.PREREQUISITE_NOT_MET);
      }
    });
  });

  // =========================================================================
  // Updating values in Draft status
  // =========================================================================
  describe('updating values in Draft status', () => {
    it('succeeds when form is in Draft status', () => {
      const template = createFormTemplate({
        documentId: 'doc-form-001',
        title: 'Update Test Form',
        version: '1.0',
        fields: testFields,
        isActive: true,
        organizationId: 'org-001',
      });

      const instance = createFormInstance(template.id, 'user-006', 'org-001');
      const updated = updateFormInstanceValues(instance.id, { temperature: 42 });

      expect(updated.values.temperature).toBe(42);
    });
  });

  // =========================================================================
  // Submitting form
  // =========================================================================
  describe('submitting form', () => {
    it('sets isLocked=true on submission', () => {
      const template = createFormTemplate({
        documentId: 'doc-form-001',
        title: 'Submit Test Form',
        version: '1.0',
        fields: testFields,
        isActive: true,
        organizationId: 'org-001',
      });

      const instance = createFormInstance(template.id, 'user-006', 'org-001');
      // Fill required field
      updateFormInstanceValues(instance.id, { temperature: 25 });

      const submitted = submitFormInstance(instance.id, 'user-006', 'Test User');
      expect(submitted.status).toBe('Submitted');
      expect(submitted.isLocked).toBe(true);
      expect(submitted.submittedById).toBe('user-006');
      expect(submitted.submittedAt).toBeTruthy();
      expect(submitted.signatureHash).toBeTruthy();
    });

    it('throws REQUIRED_FIELD_MISSING when required fields are empty', () => {
      const template = createFormTemplate({
        documentId: 'doc-form-001',
        title: 'Missing Fields Form',
        version: '1.0',
        fields: testFields,
        isActive: true,
        organizationId: 'org-001',
      });

      const instance = createFormInstance(template.id, 'user-006', 'org-001');
      // Don't fill required temperature field

      try {
        submitFormInstance(instance.id, 'user-006', 'Test User');
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.REQUIRED_FIELD_MISSING);
      }
    });
  });

  // =========================================================================
  // Updating values after submission
  // =========================================================================
  describe('updating values after submission', () => {
    it('throws FORM_LOCKED when updating values after submission', () => {
      const template = createFormTemplate({
        documentId: 'doc-form-001',
        title: 'Locked Form',
        version: '1.0',
        fields: testFields,
        isActive: true,
        organizationId: 'org-001',
      });

      const instance = createFormInstance(template.id, 'user-006', 'org-001');
      updateFormInstanceValues(instance.id, { temperature: 25 });
      submitFormInstance(instance.id, 'user-006', 'Test User');

      try {
        updateFormInstanceValues(instance.id, { temperature: 99 });
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.FORM_LOCKED);
      }
    });
  });

  // =========================================================================
  // Approving submitted form
  // =========================================================================
  describe('approving submitted form', () => {
    it('transitions Submitted form to Approved', () => {
      const template = createFormTemplate({
        documentId: 'doc-form-001',
        title: 'Approve Form',
        version: '1.0',
        fields: testFields,
        isActive: true,
        organizationId: 'org-001',
      });

      const instance = createFormInstance(template.id, 'user-006', 'org-001');
      updateFormInstanceValues(instance.id, { temperature: 25 });
      submitFormInstance(instance.id, 'user-006', 'Test User');

      const approved = approveFormInstance(instance.id, 'user-002', 'QA Manager');
      expect(approved.status).toBe('Approved');
    });

    it('throws INVALID_STATUS_TRANSITION when approving non-Submitted form', () => {
      const template = createFormTemplate({
        documentId: 'doc-form-001',
        title: 'Approve Fail Form',
        version: '1.0',
        fields: testFields,
        isActive: true,
        organizationId: 'org-001',
      });

      const instance = createFormInstance(template.id, 'user-006', 'org-001');

      try {
        approveFormInstance(instance.id, 'user-002', 'QA Manager');
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.INVALID_STATUS_TRANSITION);
      }
    });
  });

  // =========================================================================
  // Rejecting submitted form
  // =========================================================================
  describe('rejecting submitted form', () => {
    it('transitions Submitted form to Rejected', () => {
      const template = createFormTemplate({
        documentId: 'doc-form-001',
        title: 'Reject Form',
        version: '1.0',
        fields: testFields,
        isActive: true,
        organizationId: 'org-001',
      });

      const instance = createFormInstance(template.id, 'user-006', 'org-001');
      updateFormInstanceValues(instance.id, { temperature: 25 });
      submitFormInstance(instance.id, 'user-006', 'Test User');

      const rejected = rejectFormInstance(instance.id, 'user-002', 'QA Manager', 'Incomplete data');
      expect(rejected.status).toBe('Rejected');
    });

    it('throws INVALID_STATUS_TRANSITION when rejecting non-Submitted form', () => {
      const template = createFormTemplate({
        documentId: 'doc-form-001',
        title: 'Reject Fail Form',
        version: '1.0',
        fields: testFields,
        isActive: true,
        organizationId: 'org-001',
      });

      const instance = createFormInstance(template.id, 'user-006', 'org-001');

      try {
        rejectFormInstance(instance.id, 'user-002', 'QA Manager', 'Bad data');
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.INVALID_STATUS_TRANSITION);
      }
    });
  });

  // =========================================================================
  // Locked form cannot be modified
  // =========================================================================
  describe('locked form immutability', () => {
    it('prevents modifications after approval', () => {
      const template = createFormTemplate({
        documentId: 'doc-form-001',
        title: 'Locked After Approval',
        version: '1.0',
        fields: testFields,
        isActive: true,
        organizationId: 'org-001',
      });

      const instance = createFormInstance(template.id, 'user-006', 'org-001');
      updateFormInstanceValues(instance.id, { temperature: 25 });
      submitFormInstance(instance.id, 'user-006', 'Test User');
      approveFormInstance(instance.id, 'user-002', 'QA Manager');

      // The approved form should be locked — trying to update should throw
      // Note: Approved forms have isLocked=true from the store check
      const storeInstance = useQMSStore.getState().formInstances.find(f => f.id === instance.id);
      expect(storeInstance!.isLocked).toBe(true);

      try {
        updateFormInstanceValues(instance.id, { temperature: 99 });
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.FORM_LOCKED);
      }
    });

    it('prevents modifications after rejection', () => {
      const template = createFormTemplate({
        documentId: 'doc-form-001',
        title: 'Locked After Rejection',
        version: '1.0',
        fields: testFields,
        isActive: true,
        organizationId: 'org-001',
      });

      const instance = createFormInstance(template.id, 'user-006', 'org-001');
      updateFormInstanceValues(instance.id, { temperature: 25 });
      submitFormInstance(instance.id, 'user-006', 'Test User');
      rejectFormInstance(instance.id, 'user-002', 'QA Manager', 'Bad data');

      try {
        updateFormInstanceValues(instance.id, { temperature: 99 });
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        // Could be FORM_LOCKED (isLocked) or FORM_LOCKED (status !== Draft)
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.FORM_LOCKED);
      }
    });
  });

  // =========================================================================
  // Form template creation validations
  // =========================================================================
  describe('form template creation validations', () => {
    it('throws when associated document is not of type Form', () => {
      useQMSStore.setState({
        documents: [makeFormDocument({ type: 'SOP', id: 'doc-sop-not-form' })],
      });

      try {
        createFormTemplate({
          documentId: 'doc-sop-not-form',
          title: 'Wrong Type Template',
          version: '1.0',
          fields: testFields,
          isActive: true,
        });
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.PREREQUISITE_NOT_MET);
      }
    });

    it('throws when associated document is not Approved', () => {
      useQMSStore.setState({
        documents: [makeFormDocument({ status: 'Draft', id: 'doc-draft-form' })],
      });

      try {
        createFormTemplate({
          documentId: 'doc-draft-form',
          title: 'Draft Doc Template',
          version: '1.0',
          fields: testFields,
          isActive: true,
        });
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.PREREQUISITE_NOT_MET);
      }
    });

    it('throws when template has no fields', () => {
      try {
        createFormTemplate({
          documentId: 'doc-form-001',
          title: 'Empty Template',
          version: '1.0',
          fields: [],
          isActive: true,
        });
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.REQUIRED_FIELD_MISSING);
      }
    });
  });
});
