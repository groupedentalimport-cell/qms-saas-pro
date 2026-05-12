// ncrService.ts — Non-Conformance Report service
// Manages NCR lifecycle: creation, investigation, disposition, closure
// Business rules: prerequisite checks, status transitions, e-signature for closure

import { getStore } from '@/lib/data-access';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import { checkPrerequisites } from '@/services/compliance/prerequisiteEngine';
import type { NonConformance, NcrDisposition } from '@/types/qms';

// ============================================================================
// NCR CRUD Operations
// ============================================================================

/**
 * Creates a new Non-Conformance Report.
 * - Checks document prerequisites for NCR type
 * - Validates unique NCR number
 */
export function createNCR(ncr: Omit<NonConformance, 'id' | 'createdAt' | 'updatedAt'>): NonConformance {
  const store = getStore();

  // Check prerequisites
  const prereqResult = checkPrerequisites('NCR', ncr.organizationId);
  if (!prereqResult.met) {
    throw new ComplianceError(
      `Cannot create NCR: prerequisite documents not met`,
      COMPLIANCE_CODES.PREREQUISITE_NOT_MET
    );
  }

  // Verify unique NCR number
  const existing = store.ncrs.find(n => n.ncrNumber === ncr.ncrNumber);
  if (existing) {
    throw new ComplianceError(
      `An NCR with number ${ncr.ncrNumber} already exists`,
      COMPLIANCE_CODES.DUPLICATE_RECORD
    );
  }

  const newNcr: NonConformance = {
    ...ncr,
    id: `ncr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addNCR(newNcr);
  return newNcr;
}

/**
 * Updates an NCR with business rule validation.
 * - Validates status transitions
 * - Logs explicit audit trail with old/new values
 */
export function updateNCR(id: string, updates: Partial<NonConformance>, organizationId?: string): NonConformance {
  const store = getStore();
  const existing = store.ncrs.find(n => n.id === id);

  if (!existing) {
    throw new ComplianceError(
      `NCR ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Validate organization access
  const effectiveOrgId = organizationId || existing.organizationId;
  if (effectiveOrgId && existing.organizationId && existing.organizationId !== effectiveOrgId) {
    throw new ComplianceError(
      `NCR ${id} does not belong to organization ${effectiveOrgId}`,
      COMPLIANCE_CODES.INSUFFICIENT_PERMISSIONS
    );
  }

  // Validate status transition if status is changing
  if (updates.status && updates.status !== existing.status) {
    validateNcrStatusTransition(existing.status, updates.status);
  }

  // Capture old values before update
  const oldValues = { ...existing };

  store.updateNCR(id, updates);

  // Explicit audit trail logging with full old/new context
  store.logAudit('UPDATE', 'NonConformance', id, oldValues, updates);

  const updated = getStore().ncrs.find(n => n.id === id);
  if (!updated) {
    throw new ComplianceError('ENTITY_NOT_FOUND', 'NCR not found after update');
  }
  return updated;
}

/**
 * Gets NCRs filtered by organization.
 */
export function getNCRs(organizationId?: string): NonConformance[] {
  const store = getStore();
  if (!organizationId) return store.ncrs;
  return store.ncrs.filter(n => n.organizationId === organizationId);
}

/**
 * Closes an NCR with electronic signature requirement.
 * - NCR must be in a closable state
 * - Requires disposition decision
 */
export function closeNCR(
  id: string,
  disposition: NcrDisposition,
  signerId: string,
  signerName: string
): NonConformance {
  const store = getStore();
  const existing = store.ncrs.find(n => n.id === id);

  if (!existing) {
    throw new ComplianceError(
      `NCR ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (existing.status !== 'Under Investigation' && existing.status !== 'Pending Disposition') {
    throw new ComplianceError(
      `NCR ${existing.ncrNumber} must be in "Under Investigation" or "Pending Disposition" status to close (current: ${existing.status})`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  const signatureHash = store.generateSignatureHash(signerId, id, 'ncr-close');

  store.updateNCR(id, {
    status: 'Closed',
    disposition,
  });

  store.logAudit('APPROVE', 'NonConformance', id,
    { status: existing.status },
    { status: 'Closed', disposition, closedBy: signerName, signatureHash }
  );

  const updated = getStore().ncrs.find(n => n.id === id);
  if (!updated) {
    throw new ComplianceError('ENTITY_NOT_FOUND', 'NCR not found after closure');
  }
  return updated;
}

// ============================================================================
// Validation Helpers
// ============================================================================

const VALID_NCR_TRANSITIONS: Record<string, string[]> = {
  'Open': ['Under Investigation', 'Closed'],
  'Under Investigation': ['Pending Disposition', 'Closed'],
  'Pending Disposition': ['Closed', 'Under Investigation'],
  'Closed': [],
};

function validateNcrStatusTransition(current: string, target: string): void {
  const allowed = VALID_NCR_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    throw new ComplianceError(
      `Invalid NCR status transition: "${current}" → "${target}"`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }
}
