// capaService.ts — Corrective and Preventive Action service
// Manages CAPA lifecycle: creation, investigation, effectiveness check, closure
// Business rules: prerequisite checks, status transitions, e-signature for closure

import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import { checkPrerequisites } from '@/services/prerequisiteService';
import type { Capa } from '@/types/qms';

// ============================================================================
// CAPA CRUD Operations
// ============================================================================

/**
 * Creates a new CAPA.
 * - Checks document prerequisites for CAPA type
 * - Validates unique CAPA number
 */
export function createCapa(capa: Omit<Capa, 'id' | 'createdAt' | 'updatedAt'>): Capa {
  const store = useQMSStore.getState();

  // Check prerequisites
  const prereqResult = checkPrerequisites('CAPA', capa.organizationId);
  if (!prereqResult.met) {
    throw new ComplianceError(
      `Cannot create CAPA: prerequisite documents not met`,
      COMPLIANCE_CODES.PREREQUISITE_NOT_MET
    );
  }

  // Verify unique CAPA number
  const existing = store.capas.find(c => c.capaNumber === capa.capaNumber);
  if (existing) {
    throw new ComplianceError(
      `A CAPA with number ${capa.capaNumber} already exists`,
      COMPLIANCE_CODES.DUPLICATE_RECORD
    );
  }

  const newCapa: Capa = {
    ...capa,
    id: `capa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addCapa(newCapa);
  return newCapa;
}

/**
 * Updates a CAPA with business rule validation.
 * - Validates status transitions
 * - Logs audit trail
 */
export function updateCapa(id: string, updates: Partial<Capa>): Capa {
  const store = useQMSStore.getState();
  const existing = store.capas.find(c => c.id === id);

  if (!existing) {
    throw new ComplianceError(
      `CAPA ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Validate status transition if status is changing
  if (updates.status && updates.status !== existing.status) {
    validateCapaStatusTransition(existing.status, updates.status);
  }

  store.updateCapa(id, updates);

  const updated = useQMSStore.getState().capas.find(c => c.id === id);
  return updated!;
}

/**
 * Closes a CAPA with electronic signature requirement.
 * - CAPA must have effectiveness verification completed
 */
export function closeCapa(
  id: string,
  signerId: string,
  signerName: string
): Capa {
  const store = useQMSStore.getState();
  const existing = store.capas.find(c => c.id === id);

  if (!existing) {
    throw new ComplianceError(
      `CAPA ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (existing.status !== 'Effectiveness Check') {
    throw new ComplianceError(
      `CAPA ${existing.capaNumber} must be in "Effectiveness Check" status to close (current: ${existing.status})`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  const signatureHash = store.generateSignatureHash(signerId, id, 'capa-close');

  store.updateCapa(id, {
    status: 'Closed',
    closedAt: new Date().toISOString(),
    closedById: signerId,
  });

  store.logAudit('APPROVE', 'Capa', id,
    { status: existing.status },
    { status: 'Closed', closedBy: signerName, signatureHash }
  );

  const updated = useQMSStore.getState().capas.find(c => c.id === id);
  return updated!;
}

// ============================================================================
// Validation Helpers
// ============================================================================

const VALID_CAPA_TRANSITIONS: Record<string, string[]> = {
  'Open': ['Under Investigation', 'Closed'],
  'Under Investigation': ['Corrective Action', 'Closed'],
  'Corrective Action': ['Effectiveness Check', 'Under Investigation'],
  'Effectiveness Check': ['Closed', 'Under Investigation'],
  'Closed': [],
};

function validateCapaStatusTransition(current: string, target: string): void {
  const allowed = VALID_CAPA_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    throw new ComplianceError(
      `Invalid CAPA status transition: "${current}" → "${target}"`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }
}
