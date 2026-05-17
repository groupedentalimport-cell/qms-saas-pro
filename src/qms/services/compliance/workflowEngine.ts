// workflowEngine.ts — Document workflow state machine
// Defines all valid state transitions for QMS entities
// Enforces ISO 13485, 21 CFR Part 11, GMP compliance rules
// Includes IQ/OQ/PQ validation sequence enforcement

import { ComplianceError, COMPLIANCE_CODES } from '@/qms/lib/errors';
import { useQMSStore } from '@/qms/lib/demo-store';
import type { ValidationPhase } from '@/qms/types/qms';

// ============================================================================
// Entity Type Constants
// ============================================================================

export type EntityType =
  | 'document'
  | 'capa'
  | 'ncr'
  | 'batch_record'
  | 'form_instance'
  | 'change_control'
  | 'deviation';

const ENTITY_TYPES: readonly EntityType[] = [
  'document', 'capa', 'ncr', 'batch_record', 'form_instance', 'change_control', 'deviation',
];

/** Type guard to check if a string is a valid EntityType */
export function isEntityType(value: string): value is EntityType {
  return ENTITY_TYPES.includes(value as EntityType);
}

// ============================================================================
// State Transition Definitions
// ============================================================================

const WORKFLOW_TRANSITIONS: Record<EntityType, Record<string, string[]>> = {
  document: {
    'Draft': ['In Review', 'Approved'],
    'In Review': ['Approved', 'Draft'],
    'Approved': ['Obsolete'],
    'Obsolete': [],
  },
  capa: {
    'Open': ['Investigation'],
    'Investigation': ['Implementation', 'Open'],
    'Implementation': ['Effectiveness Check', 'Investigation'],
    'Effectiveness Check': ['Closed', 'Implementation'],
    'Closed': [],
  },
  ncr: {
    'Open': ['Under Investigation'],
    'Under Investigation': ['Pending Disposition', 'Open'],
    'Pending Disposition': ['Closed', 'Under Investigation'],
    'Closed': [],
  },
  batch_record: {
    'In Progress': ['Pending QA Review', 'Rejected', 'Quarantine'],
    'Pending QA Review': ['Released', 'Rejected', 'In Progress'],
    'Released': [],
    'Rejected': [],
    'Quarantine': ['In Progress', 'Rejected'],
  },
  form_instance: {
    'Draft': ['Submitted'],
    'Submitted': ['Approved', 'Rejected'],
    'Approved': [],
    'Rejected': [],
  },
  change_control: {
    'Requested': ['Under Review', 'Rejected'],
    'Under Review': ['Approved', 'Rejected', 'Requested'],
    'Approved': ['In Implementation'],
    'In Implementation': ['Completed', 'Approved'],
    'Completed': [],
    'Rejected': ['Requested'],
  },
  deviation: {
    'Open': ['Under Investigation'],
    'Under Investigation': ['Pending QA Review', 'Open'],
    'Pending QA Review': ['Approved', 'Under Investigation'],
    'Approved': ['Closed'],
    'Closed': [],
  },
};

// ============================================================================
// Locked Status Definitions
// ============================================================================

const LOCKED_STATUSES: Record<EntityType, string[]> = {
  document: ['Approved', 'Obsolete'],
  capa: ['Closed'],
  ncr: ['Closed'],
  batch_record: ['Released', 'Rejected'],
  form_instance: ['Submitted', 'Approved'],
  change_control: ['Completed', 'Rejected'],
  deviation: ['Closed'],
};

// ============================================================================
// Core Transition Functions
// ============================================================================

/**
 * Checks whether a transition is valid for the given entity type.
 */
export function canTransition(
  entityType: string,
  currentStatus: string,
  targetStatus: string
): boolean {
  if (!isEntityType(entityType)) return false;
  const entityTransitions = WORKFLOW_TRANSITIONS[entityType];
  if (!entityTransitions) return false;

  const allowedTransitions = entityTransitions[currentStatus];
  if (!allowedTransitions) return false;

  return allowedTransitions.includes(targetStatus);
}

/**
 * Returns all allowed transitions from the current status for the given entity type.
 */
export function getAllowedTransitions(
  entityType: string,
  currentStatus: string
): string[] {
  if (!isEntityType(entityType)) return [];
  const entityTransitions = WORKFLOW_TRANSITIONS[entityType];
  if (!entityTransitions) return [];

  return entityTransitions[currentStatus] || [];
}

/**
 * Enforces a transition — throws ComplianceError if the transition is not valid.
 */
export function enforceTransition(
  entityType: string,
  currentStatus: string,
  targetStatus: string
): void {
  if (!canTransition(entityType, currentStatus, targetStatus)) {
    const allowed = getAllowedTransitions(entityType, currentStatus);
    throw new ComplianceError(
      `Invalid status transition for ${entityType}: "${currentStatus}" → "${targetStatus}". ` +
      `Allowed transitions from "${currentStatus}": [${allowed.length > 0 ? allowed.join(', ') : 'none'}]`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }
}

/**
 * Checks whether a given status is a locked (immutable) status for the entity type.
 * Locked records cannot be modified.
 */
export function isLockedStatus(entityType: string, status: string): boolean {
  if (!isEntityType(entityType)) return false;
  const lockedStatuses = LOCKED_STATUSES[entityType];
  if (!lockedStatuses) return false;

  return lockedStatuses.includes(status);
}

// ============================================================================
// Document-Specific Workflow Rules
// ============================================================================

/**
 * Checks whether a document can have its content updated.
 * Approved documents CANNOT be updated (content), only Obsolete or new version allowed.
 */
export function canUpdateDocumentContent(currentStatus: string): boolean {
  return currentStatus === 'Draft' || currentStatus === 'In Review';
}

/**
 * Enforces document content immutability for Approved documents.
 * Throws ComplianceError if the document is Approved and content change is attempted.
 */
export function enforceDocumentContentLock(currentStatus: string): void {
  if (!canUpdateDocumentContent(currentStatus)) {
    throw new ComplianceError(
      `Document with status "${currentStatus}" cannot have its content updated. ` +
      `Only Draft and In Review documents can be edited. For Approved documents, create a new version or transition to Obsolete.`,
      COMPLIANCE_CODES.DOCUMENT_LOCKED
    );
  }
}

// ============================================================================
// Batch Record-Specific Workflow Rules
// ============================================================================

/**
 * Checks whether a batch record can be modified.
 * Released/Rejected batch records are locked.
 */
export function canModifyBatchRecord(status: string, isLocked: boolean): boolean {
  if (isLocked) return false;
  return status !== 'Released' && status !== 'Rejected';
}

/**
 * Enforces batch record lock — throws ComplianceError if locked.
 */
export function enforceBatchRecordLock(status: string, isLocked: boolean, lotNumber: string): void {
  if (!canModifyBatchRecord(status, isLocked)) {
    throw new ComplianceError(
      `Batch record ${lotNumber} is locked (status: "${status}"). No modifications allowed.`,
      COMPLIANCE_CODES.BATCH_LOCKED
    );
  }
}

// ============================================================================
// Form Instance-Specific Workflow Rules
// ============================================================================

/**
 * Checks whether a form instance can be modified.
 * Submitted/Approved form instances are locked.
 */
export function canModifyFormInstance(status: string, isLocked: boolean): boolean {
  if (isLocked) return false;
  return status === 'Draft';
}

/**
 * Enforces form instance lock — throws ComplianceError if locked.
 */
export function enforceFormInstanceLock(status: string, isLocked: boolean, referenceNumber: string): void {
  if (!canModifyFormInstance(status, isLocked)) {
    throw new ComplianceError(
      `Form instance ${referenceNumber} is locked (status: "${status}"). No modifications allowed.`,
      COMPLIANCE_CODES.FORM_LOCKED
    );
  }
}

// ============================================================================
// IQ/OQ/PQ Validation Sequence Enforcement
// ============================================================================

const VALIDATION_PHASE_ORDER: ValidationPhase[] = ['IQ', 'OQ', 'PQ'];

/**
 * Validates that the IQ/OQ/PQ sequence is respected.
 * - IQ must be Approved before OQ can be started
 * - OQ must be Approved before PQ can be started
 * - PQ must be Approved before Full validation
 *
 * @param phase - The validation phase being started or approved
 * @param parentValidationId - The ID of the parent validation document
 */
export function validateValidationSequence(
  phase: ValidationPhase,
  parentValidationId: string
): void {
  const store = useQMSStore.getState();

  // Find all sibling validation documents under the same parent
  const siblingPhases = store.documents.filter(
    d => d.parentValidationId === parentValidationId && d.validationPhase
  );

  if (phase === 'IQ') {
    // IQ is the first phase — no prerequisite needed
    return;
  }

  if (phase === 'OQ') {
    // OQ requires IQ to be Approved
    const iqDoc = siblingPhases.find(d => d.validationPhase === 'IQ');
    if (!iqDoc) {
      throw new ComplianceError(
        'OQ cannot be started: IQ protocol does not exist for this validation',
        COMPLIANCE_CODES.VALIDATION_SEQUENCE_ERROR
      );
    }
    if (iqDoc.status !== 'Approved') {
      throw new ComplianceError(
        `OQ cannot be started: IQ (${iqDoc.documentNumber}) must be Approved first. Current status: "${iqDoc.status}"`,
        COMPLIANCE_CODES.VALIDATION_SEQUENCE_ERROR
      );
    }
  }

  if (phase === 'PQ') {
    // PQ requires OQ to be Approved (which means IQ is also Approved)
    const oqDoc = siblingPhases.find(d => d.validationPhase === 'OQ');
    if (!oqDoc) {
      throw new ComplianceError(
        'PQ cannot be started: OQ protocol does not exist for this validation',
        COMPLIANCE_CODES.VALIDATION_SEQUENCE_ERROR
      );
    }
    if (oqDoc.status !== 'Approved') {
      throw new ComplianceError(
        `PQ cannot be started: OQ (${oqDoc.documentNumber}) must be Approved first. Current status: "${oqDoc.status}"`,
        COMPLIANCE_CODES.VALIDATION_SEQUENCE_ERROR
      );
    }
  }

  if (phase === 'Full') {
    // Full validation requires PQ to be Approved
    const pqDoc = siblingPhases.find(d => d.validationPhase === 'PQ');
    if (!pqDoc) {
      throw new ComplianceError(
        'Full validation cannot be started: PQ protocol does not exist for this validation',
        COMPLIANCE_CODES.VALIDATION_SEQUENCE_ERROR
      );
    }
    if (pqDoc.status !== 'Approved') {
      throw new ComplianceError(
        `Full validation cannot be started: PQ (${pqDoc.documentNumber}) must be Approved first. Current status: "${pqDoc.status}"`,
        COMPLIANCE_CODES.VALIDATION_SEQUENCE_ERROR
      );
    }
  }
}

/**
 * Returns the validation phases that must be completed before the given phase.
 */
export function getRequiredPhasesBefore(phase: ValidationPhase): ValidationPhase[] {
  const phaseIndex = VALIDATION_PHASE_ORDER.indexOf(phase);
  if (phaseIndex <= 0) return [];
  return VALIDATION_PHASE_ORDER.slice(0, phaseIndex);
}

/**
 * Returns the current validation status for a parent validation.
 * Checks the status of all IQ/OQ/PQ child documents.
 */
export function getValidationSequenceStatus(parentValidationId: string): {
  iq: { exists: boolean; status: string | null };
  oq: { exists: boolean; status: string | null };
  pq: { exists: boolean; status: string | null };
  allApproved: boolean;
  nextPhase: ValidationPhase | null;
} {
  const store = useQMSStore.getState();
  const siblings = store.documents.filter(
    d => d.parentValidationId === parentValidationId && d.validationPhase
  );

  const iqDoc = siblings.find(d => d.validationPhase === 'IQ');
  const oqDoc = siblings.find(d => d.validationPhase === 'OQ');
  const pqDoc = siblings.find(d => d.validationPhase === 'PQ');

  const iq = { exists: !!iqDoc, status: iqDoc?.status || null };
  const oq = { exists: !!oqDoc, status: oqDoc?.status || null };
  const pq = { exists: !!pqDoc, status: pqDoc?.status || null };

  const allApproved = iq.status === 'Approved' && oq.status === 'Approved' && pq.status === 'Approved';

  let nextPhase: ValidationPhase | null = null;
  if (!iq.exists || iq.status !== 'Approved') {
    nextPhase = 'IQ';
  } else if (!oq.exists || oq.status !== 'Approved') {
    nextPhase = 'OQ';
  } else if (!pq.exists || pq.status !== 'Approved') {
    nextPhase = 'PQ';
  }

  return { iq, oq, pq, allApproved, nextPhase };
}

// ============================================================================
// Workflow Summary
// ============================================================================

/**
 * Returns the complete workflow definition for an entity type.
 * Useful for rendering workflow diagrams or status indicators.
 */
export function getWorkflowDefinition(entityType: string): Record<string, string[]> | null {
  if (!isEntityType(entityType)) return null;
  return WORKFLOW_TRANSITIONS[entityType] || null;
}

/**
 * Returns all entity types that have workflow definitions.
 */
export function getSupportedEntityTypes(): EntityType[] {
  return [...ENTITY_TYPES];
}
