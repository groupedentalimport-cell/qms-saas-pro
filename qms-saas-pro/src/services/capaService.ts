// capaService.ts — Corrective and Preventive Action service
// Manages CAPA lifecycle: creation, investigation, effectiveness check, closure
// Business rules: prerequisite checks, status transitions, e-signature for closure

import { getStore } from '@/lib/data-access';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import { checkPrerequisites } from '@/services/compliance/prerequisiteEngine';
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
  const store = getStore();

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
 * - Logs explicit audit trail with old/new values
 */
export function updateCapa(id: string, updates: Partial<Capa>, organizationId?: string): Capa {
  const store = getStore();
  const existing = store.capas.find(c => c.id === id);

  if (!existing) {
    throw new ComplianceError(
      `CAPA ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Validate organization access
  const effectiveOrgId = organizationId || existing.organizationId;
  if (effectiveOrgId && existing.organizationId && existing.organizationId !== effectiveOrgId) {
    throw new ComplianceError(
      `CAPA ${id} does not belong to organization ${effectiveOrgId}`,
      COMPLIANCE_CODES.INSUFFICIENT_PERMISSIONS
    );
  }

  // Validate status transition if status is changing
  if (updates.status && updates.status !== existing.status) {
    validateCapaStatusTransition(existing.status, updates.status);
  }

  // Capture old values before update
  const oldValues = { ...existing };

  store.updateCapa(id, updates);

  // Explicit audit trail logging with full old/new context
  store.logAudit('UPDATE', 'Capa', id, oldValues, updates);

  const updated = getStore().capas.find(c => c.id === id);
  if (!updated) {
    throw new ComplianceError('ENTITY_NOT_FOUND', 'CAPA not found after update');
  }
  return updated;
}

/**
 * Gets CAPAs filtered by organization.
 */
export function getCapas(organizationId?: string): Capa[] {
  const store = getStore();
  if (!organizationId) return store.capas;
  return store.capas.filter(c => c.organizationId === organizationId);
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
  const store = getStore();
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
    closedDate: new Date().toISOString(),
  });

  store.logAudit('APPROVE', 'Capa', id,
    { status: existing.status },
    { status: 'Closed', closedBy: signerName, signatureHash }
  );

  const updated = getStore().capas.find(c => c.id === id);
  if (!updated) {
    throw new ComplianceError('ENTITY_NOT_FOUND', 'CAPA not found after closure');
  }
  return updated;
}

// ============================================================================
// Validation Helpers
// ============================================================================

const VALID_CAPA_TRANSITIONS: Record<string, string[]> = {
  'Open': ['Investigation', 'Closed'],
  'Investigation': ['Implementation', 'Closed'],
  'Implementation': ['Effectiveness Check', 'Investigation'],
  'Effectiveness Check': ['Closed', 'Investigation'],
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
