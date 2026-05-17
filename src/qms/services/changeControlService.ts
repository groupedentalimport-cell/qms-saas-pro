// changeControlService.ts — Change Control service
// Manages Change Control lifecycle: creation, review, approval, implementation, closure
// Business rules: prerequisite checks, status transitions, e-signature for approval

import { useQMSStore } from '@/qms/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/qms/lib/errors';
import { checkPrerequisites } from '@/qms/services/compliance/prerequisiteEngine';
import type { ChangeControl } from '@/qms/types/qms';

// ============================================================================
// Change Control CRUD Operations
// ============================================================================

/**
 * Creates a new Change Control.
 * - Checks document prerequisites
 * - Validates unique CC number
 */
export function createChangeControl(cc: Omit<ChangeControl, 'id' | 'createdAt' | 'updatedAt'>): ChangeControl {
  const store = useQMSStore.getState();

  // Check prerequisites
  const prereqResult = checkPrerequisites('CHANGE_CONTROL', cc.organizationId);
  if (!prereqResult.met) {
    throw new ComplianceError(
      `Cannot create Change Control: prerequisite documents not met`,
      COMPLIANCE_CODES.PREREQUISITE_NOT_MET
    );
  }

  // Verify unique CC number within organization
  const orgFilter = cc.organizationId
    ? (c: ChangeControl) => c.organizationId === cc.organizationId
    : () => true;
  const existing = store.changeControls.find(c => c.ccNumber === cc.ccNumber && orgFilter(c));
  if (existing) {
    throw new ComplianceError(
      `A Change Control with number ${cc.ccNumber} already exists`,
      COMPLIANCE_CODES.DUPLICATE_RECORD
    );
  }

  const newCC: ChangeControl = {
    ...cc,
    id: `cc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addChangeControl(newCC);
  return newCC;
}

/**
 * Updates a Change Control with business rule validation.
 * - Validates status transitions
 * - Logs explicit audit trail with old/new values
 */
export function updateChangeControl(id: string, updates: Partial<ChangeControl>, organizationId?: string): ChangeControl {
  const store = useQMSStore.getState();
  const existing = store.changeControls.find(c => c.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Change Control ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Validate organization access
  const effectiveOrgId = organizationId || existing.organizationId;
  if (effectiveOrgId && existing.organizationId && existing.organizationId !== effectiveOrgId) {
    throw new ComplianceError(
      `Change Control ${id} does not belong to organization ${effectiveOrgId}`,
      COMPLIANCE_CODES.INSUFFICIENT_PERMISSIONS
    );
  }

  // Validate status transition if status is changing
  if (updates.status && updates.status !== existing.status) {
    validateCCStatusTransition(existing.status, updates.status);
  }

  // Capture old values before update
  const oldValues = { ...existing };

  store.updateChangeControl(id, updates);

  // Explicit audit trail logging with full old/new context
  store.logAudit('UPDATE', 'ChangeControl', id, oldValues, updates);

  const updated = useQMSStore.getState().changeControls.find(c => c.id === id);
  if (!updated) {
    throw new ComplianceError('ENTITY_NOT_FOUND', 'Change Control not found after update');
  }
  return updated;
}

/**
 * Gets change controls filtered by organization.
 */
export function getChangeControls(organizationId?: string): ChangeControl[] {
  const store = useQMSStore.getState();
  if (!organizationId) return store.changeControls;
  return store.changeControls.filter(c => c.organizationId === organizationId);
}

/**
 * Approves a Change Control with electronic signature.
 */
export function approveChangeControl(
  id: string,
  signerId: string,
  signerName: string
): ChangeControl {
  const store = useQMSStore.getState();
  const existing = store.changeControls.find(c => c.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Change Control ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (existing.status !== 'Under Review') {
    throw new ComplianceError(
      `Change Control ${existing.ccNumber} must be in "Under Review" status to approve (current: ${existing.status})`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  const signatureHash = store.generateSignatureHash(signerId, id, 'cc-approve');

  store.updateChangeControl(id, {
    status: 'Approved',
    approvedBy: signerId,
  });

  store.logAudit('APPROVE', 'ChangeControl', id,
    { status: existing.status },
    { status: 'Approved', approvedBy: signerName, signatureHash }
  );

  const updated = useQMSStore.getState().changeControls.find(c => c.id === id);
  if (!updated) {
    throw new ComplianceError('ENTITY_NOT_FOUND', 'Change Control not found after approval');
  }
  return updated;
}

/**
 * Rejects a Change Control.
 */
export function rejectChangeControl(
  id: string,
  rejecterId: string,
  rejecterName: string,
  reason: string
): ChangeControl {
  const store = useQMSStore.getState();
  const existing = store.changeControls.find(c => c.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Change Control ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (existing.status !== 'Under Review') {
    throw new ComplianceError(
      `Change Control ${existing.ccNumber} must be in "Under Review" status to reject (current: ${existing.status})`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  store.updateChangeControl(id, { status: 'Rejected' });

  store.logAudit('REJECT', 'ChangeControl', id,
    { status: existing.status },
    { status: 'Rejected', rejectedBy: rejecterName, reason }
  );

  const updated = useQMSStore.getState().changeControls.find(c => c.id === id);
  if (!updated) {
    throw new ComplianceError('ENTITY_NOT_FOUND', 'Change Control not found after rejection');
  }
  return updated;
}

// ============================================================================
// Validation Helpers
// ============================================================================

const VALID_CC_TRANSITIONS: Record<string, string[]> = {
  'Requested': ['Under Review', 'Rejected'],
  'Under Review': ['Approved', 'Rejected', 'Requested'],
  'Approved': ['In Implementation'],
  'In Implementation': ['Completed', 'Approved'],
  'Completed': [],
  'Rejected': ['Requested'],
};

function validateCCStatusTransition(current: string, target: string): void {
  const allowed = VALID_CC_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    throw new ComplianceError(
      `Invalid Change Control status transition: "${current}" → "${target}"`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }
}
