// deviationService.ts — Deviation service
// Manages Deviation lifecycle: creation, investigation, QA approval, closure
// Business rules: planned deviation justification, e-signature for approval

import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { Deviation } from '@/types/qms';

// ============================================================================
// Deviation CRUD Operations
// ============================================================================

/**
 * Creates a new Deviation.
 * - Validates unique deviation number
 * - For planned deviations, justification is required
 */
export function createDeviation(deviation: Omit<Deviation, 'id' | 'createdAt' | 'updatedAt'>): Deviation {
  const store = useQMSStore.getState();

  // Verify unique deviation number within organization
  const orgFilter = deviation.organizationId
    ? (d: Deviation) => d.organizationId === deviation.organizationId
    : () => true;
  const existing = store.deviations.find(d => d.devNumber === deviation.devNumber && orgFilter(d));
  if (existing) {
    throw new ComplianceError(
      `A deviation with number ${deviation.devNumber} already exists`,
      COMPLIANCE_CODES.DUPLICATE_RECORD
    );
  }

  // Planned deviations require justification
  if (deviation.type === 'Planned' && !deviation.justification) {
    throw new ComplianceError(
      'Planned deviations require a justification',
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  const newDeviation: Deviation = {
    ...deviation,
    id: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addDeviation(newDeviation);
  return newDeviation;
}

/**
 * Updates a deviation with business rule validation.
 * - Validates status transitions
 * - Logs explicit audit trail with old/new values
 */
export function updateDeviation(id: string, updates: Partial<Deviation>, organizationId?: string): Deviation {
  const store = useQMSStore.getState();
  const existing = store.deviations.find(d => d.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Deviation ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Validate organization access
  const effectiveOrgId = organizationId || existing.organizationId;
  if (effectiveOrgId && existing.organizationId && existing.organizationId !== effectiveOrgId) {
    throw new ComplianceError(
      `Deviation ${id} does not belong to organization ${effectiveOrgId}`,
      COMPLIANCE_CODES.INSUFFICIENT_PERMISSIONS
    );
  }

  // Validate status transition if status is changing
  if (updates.status && updates.status !== existing.status) {
    validateDeviationStatusTransition(existing.status, updates.status);
  }

  // Capture old values before update
  const oldValues = { ...existing };

  store.updateDeviation(id, updates);

  // Explicit audit trail logging with full old/new context
  store.logAudit('UPDATE', 'Deviation', id, oldValues, updates);

  const updated = useQMSStore.getState().deviations.find(d => d.id === id);
  if (!updated) {
    throw new ComplianceError('ENTITY_NOT_FOUND', 'Deviation not found after update');
  }
  return updated;
}

/**
 * Gets deviations filtered by organization.
 */
export function getDeviations(organizationId?: string): Deviation[] {
  const store = useQMSStore.getState();
  if (!organizationId) return store.deviations;
  return store.deviations.filter(d => d.organizationId === organizationId);
}

/**
 * Approves a deviation with QA electronic signature.
 */
export function approveDeviation(
  id: string,
  qaUserId: string,
  qaUserName: string
): Deviation {
  const store = useQMSStore.getState();
  const existing = store.deviations.find(d => d.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Deviation ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (existing.status !== 'Under Investigation' && existing.status !== 'Pending QA Review') {
    throw new ComplianceError(
      `Deviation ${existing.devNumber} must be in "Under Investigation" or "Pending QA Review" status to approve (current: ${existing.status})`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  const signatureHash = store.generateSignatureHash(qaUserId, id, 'deviation-approve');

  store.updateDeviation(id, {
    status: 'Approved',
  });

  store.logAudit('APPROVE', 'Deviation', id,
    { status: existing.status },
    { status: 'Approved', approvedBy: qaUserName, signatureHash }
  );

  const updated = useQMSStore.getState().deviations.find(d => d.id === id);
  if (!updated) {
    throw new ComplianceError('ENTITY_NOT_FOUND', 'Deviation not found after approval');
  }
  return updated;
}

// ============================================================================
// Validation Helpers
// ============================================================================

const VALID_DEVIATION_TRANSITIONS: Record<string, string[]> = {
  'Open': ['Under Investigation'],
  'Under Investigation': ['Pending QA Review', 'Open'],
  'Pending QA Review': ['Approved', 'Under Investigation'],
  'Approved': ['Closed'],
  'Closed': [],
};

function validateDeviationStatusTransition(current: string, target: string): void {
  const allowed = VALID_DEVIATION_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    throw new ComplianceError(
      `Invalid deviation status transition: "${current}" → "${target}"`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }
}
