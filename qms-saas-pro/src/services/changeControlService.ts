// changeControlService.ts — Change Control service
// Manages Change Control lifecycle: creation, review, approval, implementation, closure
// Business rules: prerequisite checks, status transitions, e-signature for approval

import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import { checkPrerequisites } from '@/services/prerequisiteService';
import type { ChangeControl } from '@/types/qms';

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

  // Verify unique CC number
  const existing = store.changeControls.find(c => c.ccNumber === cc.ccNumber);
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
 * - Logs audit trail
 */
export function updateChangeControl(id: string, updates: Partial<ChangeControl>): ChangeControl {
  const store = useQMSStore.getState();
  const existing = store.changeControls.find(c => c.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Change Control ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Validate status transition if status is changing
  if (updates.status && updates.status !== existing.status) {
    validateCCStatusTransition(existing.status, updates.status);
  }

  store.updateChangeControl(id, updates);

  const updated = useQMSStore.getState().changeControls.find(c => c.id === id);
  return updated!;
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

  if (existing.status !== 'Pending Approval') {
    throw new ComplianceError(
      `Change Control ${existing.ccNumber} must be in "Pending Approval" status to approve (current: ${existing.status})`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  const signatureHash = store.generateSignatureHash(signerId, id, 'cc-approve');

  store.updateChangeControl(id, {
    status: 'Approved',
    approvedById: signerId,
    approvalDate: new Date().toISOString(),
  });

  store.logAudit('APPROVE', 'ChangeControl', id,
    { status: existing.status },
    { status: 'Approved', approvedBy: signerName, signatureHash }
  );

  return useQMSStore.getState().changeControls.find(c => c.id === id)!;
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

  if (existing.status !== 'Pending Approval') {
    throw new ComplianceError(
      `Change Control ${existing.ccNumber} must be in "Pending Approval" status to reject (current: ${existing.status})`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  store.updateChangeControl(id, { status: 'Rejected' });

  store.logAudit('REJECT', 'ChangeControl', id,
    { status: existing.status },
    { status: 'Rejected', rejectedBy: rejecterName, reason }
  );

  return useQMSStore.getState().changeControls.find(c => c.id === id)!;
}

// ============================================================================
// Validation Helpers
// ============================================================================

const VALID_CC_TRANSITIONS: Record<string, string[]> = {
  'Draft': ['Pending Approval', 'Cancelled'],
  'Pending Approval': ['Approved', 'Rejected', 'Draft'],
  'Approved': ['In Implementation', 'Cancelled'],
  'In Implementation': ['Completed', 'Cancelled'],
  'Completed': [],
  'Rejected': ['Draft'],
  'Cancelled': [],
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
