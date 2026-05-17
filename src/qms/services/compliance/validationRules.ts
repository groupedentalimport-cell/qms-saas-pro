// validationRules.ts — Centralized validation rules for all QMS entities
// Enforces ISO 13485, 21 CFR Part 11, and GMP compliance requirements
// Each validation function returns { valid: boolean; errors: string[] }

import type {
  Document,
  DocumentStatus,
  Capa,
  CapaStatus,
  NonConformance,
  NcrType,
  BatchRecord,
  BatchStep,
  FormInstance,
  FormTemplate,
  Supplier,
  SupplierStatus,
} from '@/qms/types/qms';
import { ComplianceError, COMPLIANCE_CODES } from '@/qms/lib/errors';

// ============================================================================
// Validation Result Type
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function valid(): ValidationResult {
  return { valid: true, errors: [] };
}

function invalid(errors: string[]): ValidationResult {
  return { valid: false, errors };
}

// ============================================================================
// Document Validation
// ============================================================================

const VALID_DOCUMENT_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  'Draft': ['In Review', 'Approved'],
  'In Review': ['Approved', 'Draft'],
  'Approved': ['Obsolete'],
  'Obsolete': [],
};

/**
 * Validates document status transitions.
 * Allowed: Draft→In Review→Approved, Approved→Obsolete only.
 */
export function validateDocumentStatusTransition(
  currentStatus: DocumentStatus,
  targetStatus: DocumentStatus
): ValidationResult {
  const allowed = VALID_DOCUMENT_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    return invalid([
      `Invalid document status transition: "${currentStatus}" → "${targetStatus}". ` +
      `Allowed transitions from "${currentStatus}": [${allowed.join(', ')}]`,
    ]);
  }
  return valid();
}

/**
 * Validates a document for compliance before status change.
 * Checks: required fields, status transitions, lock status.
 */
export function validateDocument(doc: Partial<Document> & { status: DocumentStatus }): ValidationResult {
  const errors: string[] = [];

  if (!doc.documentNumber || doc.documentNumber.trim() === '') {
    errors.push('Document number is required');
  }

  if (!doc.title || doc.title.trim() === '') {
    errors.push('Document title is required');
  }

  if (!doc.type) {
    errors.push('Document type is required');
  }

  if (!doc.version || doc.version.trim() === '') {
    errors.push('Document version is required');
  }

  // Approved documents cannot have content updated
  if (doc.status === 'Approved' && doc.id) {
    // Only status changes to Obsolete are allowed
    errors.push('Document is Approved and locked for content changes. Only transition to Obsolete or new version is allowed.');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Validates document data before approval.
 */
export function validateDocumentForApproval(doc: Document): ValidationResult {
  const errors: string[] = [];

  if (doc.status !== 'In Review' && doc.status !== 'Draft') {
    errors.push(`Document must be in "In Review" or "Draft" status to be approved. Current status: "${doc.status}"`);
  }

  if (!doc.effectiveDate && doc.status === 'Approved') {
    errors.push('Effective date is required for approved documents');
  }

  if (!doc.owner) {
    errors.push('Document owner is required before approval');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

// ============================================================================
// CAPA Validation
// ============================================================================

const CAPA_REQUIRED_FIELDS_BY_STATUS: Record<CapaStatus, string[]> = {
  'Open': ['title', 'description', 'type', 'assignedTo', 'dueDate'],
  'Investigation': ['title', 'description', 'type', 'assignedTo', 'dueDate', 'problemStatement', 'investigationDetails'],
  'Implementation': ['title', 'description', 'type', 'assignedTo', 'dueDate', 'problemStatement', 'investigationDetails', 'rootCauseAnalysis', 'correctiveAction'],
  'Effectiveness Check': ['title', 'description', 'type', 'assignedTo', 'dueDate', 'problemStatement', 'investigationDetails', 'rootCauseAnalysis', 'correctiveAction', 'effectivenessVerificationMethod', 'effectivenessCriteria'],
  'Closed': ['title', 'description', 'type', 'assignedTo', 'dueDate', 'problemStatement', 'investigationDetails', 'rootCauseAnalysis', 'correctiveAction', 'effectivenessVerificationMethod', 'effectivenessCriteria', 'effectivenessResult'],
};

const CAPA_FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  type: 'CAPA Type',
  assignedTo: 'Assigned To',
  dueDate: 'Due Date',
  problemStatement: 'Problem Statement',
  investigationDetails: 'Investigation Details',
  rootCauseAnalysis: 'Root Cause Analysis',
  correctiveAction: 'Corrective Action',
  effectivenessVerificationMethod: 'Effectiveness Verification Method',
  effectivenessCriteria: 'Effectiveness Criteria',
  effectivenessResult: 'Effectiveness Result',
};

/**
 * Validates CAPA required fields per status.
 */
export function validateCapa(capa: Partial<Capa>, targetStatus?: CapaStatus): ValidationResult {
  const errors: string[] = [];
  const status = targetStatus || capa.status;

  if (!status) {
    errors.push('CAPA status is required');
    return invalid(errors);
  }

  const requiredFields = CAPA_REQUIRED_FIELDS_BY_STATUS[status];
  if (!requiredFields) {
    errors.push(`Unknown CAPA status: "${status}"`);
    return invalid(errors);
  }

  for (const field of requiredFields) {
    const value = capa[field as keyof Capa];
    if (value === undefined || value === null || value === '') {
      const label = CAPA_FIELD_LABELS[field] || field;
      errors.push(`Field "${label}" is required for CAPA status "${status}"`);
    }
  }

  // Effectiveness check requirements
  if (status === 'Effectiveness Check') {
    if (!capa.effectivenessVerificationMethod || capa.effectivenessVerificationMethod.trim() === '') {
      errors.push('Effectiveness verification method is required when performing effectiveness check');
    }
    if (!capa.effectivenessCriteria || capa.effectivenessCriteria.trim() === '') {
      errors.push('Effectiveness criteria must be defined before effectiveness check');
    }
  }

  // Closed CAPA must have effectiveness result
  if (status === 'Closed' && capa.effectivenessResult === 'Pending Review') {
    errors.push('CAPA cannot be closed with effectiveness result still "Pending Review"');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Validates CAPA status transition.
 */
export function validateCapaStatusTransition(
  currentStatus: CapaStatus,
  targetStatus: CapaStatus
): ValidationResult {
  const validTransitions: Record<CapaStatus, CapaStatus[]> = {
    'Open': ['Investigation'],
    'Investigation': ['Implementation', 'Open'],
    'Implementation': ['Effectiveness Check', 'Investigation'],
    'Effectiveness Check': ['Closed', 'Implementation'],
    'Closed': [],
  };

  const allowed = validTransitions[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    return invalid([
      `Invalid CAPA status transition: "${currentStatus}" → "${targetStatus}". ` +
      `Allowed: [${allowed.join(', ')}]`,
    ]);
  }
  return valid();
}

// ============================================================================
// NCR Validation
// ============================================================================

const OOS_OOT_TYPES: NcrType[] = ['OOS', 'OOT'];

/**
 * Validates NCR data with OOS/OOT specific validations and phase conclusions.
 */
export function validateNcr(ncr: Partial<NonConformance>): ValidationResult {
  const errors: string[] = [];

  if (!ncr.ncrNumber || ncr.ncrNumber.trim() === '') {
    errors.push('NCR number is required');
  }

  if (!ncr.title || ncr.title.trim() === '') {
    errors.push('NCR title is required');
  }

  if (!ncr.description || ncr.description.trim() === '') {
    errors.push('NCR description is required');
  }

  if (!ncr.type) {
    errors.push('NCR type is required');
  }

  // OOS/OOT specific validations
  if (ncr.type && OOS_OOT_TYPES.includes(ncr.type)) {
    if (!ncr.isOosOot) {
      errors.push(`NCR type "${ncr.type}" requires isOosOot to be true`);
    }

    if (!ncr.analyticalMethod || ncr.analyticalMethod.trim() === '') {
      errors.push('Analytical method is required for OOS/OOT NCRs');
    }

    if (ncr.measuredValue === undefined || ncr.measuredValue === null) {
      errors.push('Measured value is required for OOS/OOT NCRs');
    }

    if (!ncr.measuredUnit || ncr.measuredUnit.trim() === '') {
      errors.push('Measured unit is required for OOS/OOT NCRs');
    }

    if (!ncr.specLimit || ncr.specLimit.trim() === '') {
      errors.push('Specification limit is required for OOS/OOT NCRs');
    }

    // Phase 1 conclusion validation
    if (ncr.status === 'Under Investigation' || ncr.status === 'Pending Disposition') {
      if (!ncr.phase1Conclusion) {
        errors.push('Phase 1 conclusion is required for OOS/OOT NCRs in investigation or pending disposition');
      }
    }

    // Phase 2 conclusion validation
    if (ncr.phase2Required) {
      if (ncr.phase1Conclusion === 'No Error Found' && ncr.phase2Conclusion === 'Pending') {
        // Phase 2 is pending — that's acceptable if still under investigation
      }
      if (ncr.status === 'Pending Disposition' && (!ncr.phase2Conclusion || ncr.phase2Conclusion === 'Pending')) {
        errors.push('Phase 2 conclusion is required before disposition when phase 2 is required');
      }
    }

    // If phase 1 found error, no phase 2 needed
    if (ncr.phase1Conclusion === 'Error Found' && ncr.phase2Required) {
      errors.push('Phase 2 is not required when Phase 1 finds an error (the error explains the OOS result)');
    }
  }

  // Non-OOS/OOT NCR should not have OOS fields populated
  if (ncr.type && !OOS_OOT_TYPES.includes(ncr.type) && ncr.isOosOot) {
    errors.push(`NCR type "${ncr.type}" should not have isOosOot set to true`);
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Validates NCR phase1 conclusion.
 */
export function validateNcrPhase1Conclusion(ncr: Partial<NonConformance>): ValidationResult {
  const errors: string[] = [];

  if (!ncr.isOosOot) {
    return valid();
  }

  if (!ncr.phase1Conclusion) {
    errors.push('Phase 1 conclusion is required for OOS/OOT investigations');
  }

  if (ncr.phase1Conclusion === 'Pending') {
    errors.push('Phase 1 conclusion must be resolved before proceeding');
  }

  // If no error found, phase 2 is required
  if (ncr.phase1Conclusion === 'No Error Found' && !ncr.phase2Required) {
    errors.push('Phase 2 investigation is required when Phase 1 finds no error');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Validates NCR phase2 conclusion.
 */
export function validateNcrPhase2Conclusion(ncr: Partial<NonConformance>): ValidationResult {
  const errors: string[] = [];

  if (!ncr.isOosOot || !ncr.phase2Required) {
    return valid();
  }

  if (!ncr.phase2Conclusion) {
    errors.push('Phase 2 conclusion is required');
  }

  if (ncr.phase2Conclusion === 'Pending') {
    errors.push('Phase 2 conclusion must be resolved before disposition');
  }

  // If confirmed OOS, lot must be rejected or dispositioned
  if (ncr.phase2Conclusion === 'Confirmed OOS' && !ncr.rejectLot) {
    errors.push('Lot must be rejected when OOS is confirmed');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Validates NCR status transition.
 */
export function validateNcrStatusTransition(
  currentStatus: NonConformance['status'],
  targetStatus: NonConformance['status']
): ValidationResult {
  const validTransitions: Record<string, string[]> = {
    'Open': ['Under Investigation'],
    'Under Investigation': ['Pending Disposition', 'Open'],
    'Pending Disposition': ['Closed', 'Under Investigation'],
    'Closed': [],
  };

  const allowed = validTransitions[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    return invalid([
      `Invalid NCR status transition: "${currentStatus}" → "${targetStatus}". ` +
      `Allowed: [${allowed.join(', ')}]`,
    ]);
  }
  return valid();
}

// ============================================================================
// Batch Record Validation
// ============================================================================

/**
 * Validates batch record step sequence.
 * Steps must be completed in order.
 */
export function validateBatchStepSequence(
  steps: BatchStep[],
  stepToCompleteId: string
): ValidationResult {
  const errors: string[] = [];

  const stepIndex = steps.findIndex(s => s.id === stepToCompleteId);
  if (stepIndex === -1) {
    errors.push(`Step ${stepToCompleteId} not found in batch record`);
    return invalid(errors);
  }

  // Check that all previous steps are completed
  for (let i = 0; i < stepIndex; i++) {
    if (steps[i].status !== 'Completed') {
      errors.push(
        `Step "${steps[i].stepName}" (order ${steps[i].stepOrder}) must be completed before proceeding to "${steps[stepIndex].stepName}"`
      );
    }
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Validates batch record for lock status and compliance.
 */
export function validateBatchRecord(batch: Partial<BatchRecord>): ValidationResult {
  const errors: string[] = [];

  if (!batch.lotNumber || batch.lotNumber.trim() === '') {
    errors.push('Lot number is required');
  }

  if (!batch.productName || batch.productName.trim() === '') {
    errors.push('Product name is required');
  }

  if (!batch.manufacturingDate) {
    errors.push('Manufacturing date is required');
  }

  // Lock status checks
  if (batch.isLocked) {
    if (batch.status !== 'Released' && batch.status !== 'Rejected') {
      errors.push(`Batch record is locked but status is "${batch.status}". Locked records must be Released or Rejected.`);
    }
  }

  if (batch.status === 'Released' || batch.status === 'Rejected') {
    if (!batch.isLocked) {
      errors.push(`Batch record with status "${batch.status}" must be locked`);
    }
    if (!batch.qaReleaseDate) {
      errors.push('QA release date is required for released/rejected batches');
    }
    if (!batch.qaReleasedById) {
      errors.push('QA released by is required for released/rejected batches');
    }
  }

  // All steps must be completed before QA review
  if (batch.status === 'Pending QA Review' && batch.steps) {
    const incompleteSteps = batch.steps.filter(s => s.status !== 'Completed');
    if (incompleteSteps.length > 0) {
      errors.push(`${incompleteSteps.length} incomplete step(s) must be completed before QA review`);
    }
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Validates that a batch record can be modified.
 */
export function validateBatchRecordNotLocked(batch: BatchRecord): ValidationResult {
  if (batch.isLocked) {
    return invalid([
      `Batch record ${batch.lotNumber} is locked and cannot be modified`,
    ]);
  }

  if (batch.status === 'Released' || batch.status === 'Rejected') {
    return invalid([
      `Batch record ${batch.lotNumber} has status "${batch.status}" and cannot be modified`,
    ]);
  }

  return valid();
}

// ============================================================================
// Form Instance Validation
// ============================================================================

/**
 * Validates form instance required fields against template definition.
 */
export function validateFormInstance(
  instance: Partial<FormInstance>,
  template?: FormTemplate
): ValidationResult {
  const errors: string[] = [];

  if (!instance.referenceNumber || instance.referenceNumber.trim() === '') {
    errors.push('Reference number is required');
  }

  if (!instance.templateId) {
    errors.push('Template ID is required');
  }

  // Lock status checks
  if (instance.isLocked) {
    if (instance.status !== 'Submitted' && instance.status !== 'Approved') {
      errors.push(`Form instance is locked but status is "${instance.status}". Locked instances must be Submitted or Approved.`);
    }
  }

  if (instance.status === 'Submitted' || instance.status === 'Approved') {
    if (!instance.isLocked) {
      errors.push(`Form instance with status "${instance.status}" must be locked`);
    }
  }

  // Validate required fields against template
  if (template && instance.values) {
    const requiredFields = template.fields.filter(f => f.required);
    for (const field of requiredFields) {
      const value = instance.values[field.name];
      if (value === undefined || value === null || value === '' || value === false) {
        errors.push(`Required field "${field.label}" is missing`);
      }
    }

    // Validate field constraints
    for (const field of template.fields) {
      if (!field.validation) continue;
      const value = instance.values[field.name];

      if (field.type === 'number' && typeof value === 'number') {
        if (field.validation.min !== undefined && value < field.validation.min) {
          errors.push(`Field "${field.label}" must be >= ${field.validation.min}`);
        }
        if (field.validation.max !== undefined && value > field.validation.max) {
          errors.push(`Field "${field.label}" must be <= ${field.validation.max}`);
        }
      }

      if (field.validation.pattern && typeof value === 'string' && value !== '') {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          errors.push(`Field "${field.label}" does not match the required format`);
        }
      }
    }
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Validates that a form instance is not locked for editing.
 */
export function validateFormInstanceNotLocked(instance: FormInstance): ValidationResult {
  if (instance.isLocked) {
    return invalid([
      `Form instance ${instance.referenceNumber} is locked and cannot be modified`,
    ]);
  }

  if (instance.status === 'Submitted' || instance.status === 'Approved') {
    return invalid([
      `Form instance ${instance.referenceNumber} has status "${instance.status}" and cannot be modified`,
    ]);
  }

  return valid();
}

// ============================================================================
// Supplier Validation
// ============================================================================

const VALID_SUPPLIER_TRANSITIONS: Record<SupplierStatus, SupplierStatus[]> = {
  'Qualified': ['Conditional', 'Disqualified', 'Under Evaluation'],
  'Conditional': ['Qualified', 'Disqualified', 'Under Evaluation'],
  'Disqualified': ['Under Evaluation'],
  'Under Evaluation': ['Qualified', 'Conditional', 'Disqualified'],
};

/**
 * Validates supplier status transitions.
 */
export function validateSupplierStatusTransition(
  currentStatus: SupplierStatus,
  targetStatus: SupplierStatus
): ValidationResult {
  const allowed = VALID_SUPPLIER_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    return invalid([
      `Invalid supplier status transition: "${currentStatus}" → "${targetStatus}". ` +
      `Allowed: [${allowed.join(', ')}]`,
    ]);
  }
  return valid();
}

/**
 * Validates supplier data including qualification document requirements.
 */
export function validateSupplier(supplier: Partial<Supplier>): ValidationResult {
  const errors: string[] = [];

  if (!supplier.supplierCode || supplier.supplierCode.trim() === '') {
    errors.push('Supplier code is required');
  }

  if (!supplier.name || supplier.name.trim() === '') {
    errors.push('Supplier name is required');
  }

  // Qualified supplier must have qualification document and date
  if (supplier.status === 'Qualified') {
    if (!supplier.qualificationDocId) {
      errors.push('Qualified supplier must have a qualification document reference');
    }
    if (!supplier.qualificationDate) {
      errors.push('Qualified supplier must have a qualification date');
    }
  }

  // Conditional supplier should have a review date set
  if (supplier.status === 'Conditional' && !supplier.nextReviewDate) {
    errors.push('Conditional supplier must have a next review date');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Validates supplier before qualification.
 * Checks that qualification document is Approved.
 */
export function validateSupplierForQualification(
  supplier: Supplier,
  qualificationDocStatus?: DocumentStatus
): ValidationResult {
  const errors: string[] = [];

  if (!supplier.qualificationDocId) {
    errors.push('Qualification document ID is required for supplier qualification');
  }

  if (qualificationDocStatus && qualificationDocStatus !== 'Approved') {
    errors.push(`Qualification document must be Approved. Current status: "${qualificationDocStatus}"`);
  }

  if (supplier.status === 'Disqualified') {
    errors.push('Disqualified supplier must go through "Under Evaluation" before qualification');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

// ============================================================================
// Convenience: Throw ComplianceError helper
// ============================================================================

/**
 * Validates and throws ComplianceError if validation fails.
 */
export function enforceValidation(result: ValidationResult, errorCode: string = COMPLIANCE_CODES.REQUIRED_FIELD_MISSING): void {
  if (!result.valid) {
    throw new ComplianceError(
      result.errors.join('; '),
      errorCode
    );
  }
}
