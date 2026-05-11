// ncrService.ts — Non-Conformance Report service
// Manages NCR lifecycle: creation, investigation, disposition, closure
// Business rules: prerequisite checks, status transitions, e-signature for closure

import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import { checkPrerequisites } from '@/services/prerequisiteService';
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
  const store = useQMSStore.getState();

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
 * - Logs audit trail
 */
export function updateNCR(id: string, updates: Partial<NonConformance>): NonConformance {
  const store = useQMSStore.getState();
  const existing = store.ncrs.find(n => n.id === id);

  if (!existing) {
    throw new ComplianceError(
      `NCR ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Validate status transition if status is changing
  if (updates.status && updates.status !== existing.status) {
    validateNcrStatusTransition(existing.status, updates.status);
  }

  store.updateNCR(id, updates);

  const updated = useQMSStore.getState().ncrs.find(n => n.id === id);
  return updated!;
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
  const store = useQMSStore.getState();
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
    closedAt: new Date().toISOString(),
    closedById: signerId,
  });

  store.logAudit('APPROVE', 'NonConformance', id,
    { status: existing.status },
    { status: 'Closed', disposition, closedBy: signerName, signatureHash }
  );

  const updated = useQMSStore.getState().ncrs.find(n => n.id === id);
  return updated!;
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
