// auditEntityService.ts — Audit Entity service (not audit trail)
// Manages Audit entity lifecycle: creation, scheduling, findings, completion
// Business rules: finding management, e-signature for completion

import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import { checkPrerequisites } from '@/services/prerequisiteService';
import type { Audit, AuditFinding } from '@/types/qms';

// ============================================================================
// Audit CRUD Operations
// ============================================================================

/**
 * Creates a new Audit.
 * - Checks document prerequisites for Audit type
 * - Validates unique audit number
 */
export function createAudit(audit: Omit<Audit, 'id' | 'createdAt' | 'updatedAt'>): Audit {
  const store = useQMSStore.getState();

  // Check prerequisites
  const prereqResult = checkPrerequisites('AUDIT', audit.organizationId);
  if (!prereqResult.met) {
    throw new ComplianceError(
      `Cannot create Audit: prerequisite documents not met`,
      COMPLIANCE_CODES.PREREQUISITE_NOT_MET
    );
  }

  // Verify unique audit number
  const existing = store.audits.find(a => a.auditNumber === audit.auditNumber);
  if (existing) {
    throw new ComplianceError(
      `An audit with number ${audit.auditNumber} already exists`,
      COMPLIANCE_CODES.DUPLICATE_RECORD
    );
  }

  const newAudit: Audit = {
    ...audit,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addAudit(newAudit);
  return newAudit;
}

/**
 * Updates an Audit with business rule validation.
 * - Validates status transitions
 * - Logs audit trail
 */
export function updateAudit(id: string, updates: Partial<Audit>): Audit {
  const store = useQMSStore.getState();
  const existing = store.audits.find(a => a.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Audit ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Validate status transition if status is changing
  if (updates.status && updates.status !== existing.status) {
    validateAuditStatusTransition(existing.status, updates.status);
  }

  store.updateAudit(id, updates);

  const updated = useQMSStore.getState().audits.find(a => a.id === id);
  return updated!;
}

/**
 * Completes an audit with electronic signature.
 * - All findings must be addressed
 */
export function completeAudit(
  id: string,
  signerId: string,
  signerName: string
): Audit {
  const store = useQMSStore.getState();
  const existing = store.audits.find(a => a.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Audit ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (existing.status !== 'In Progress' && existing.status !== 'Pending Report') {
    throw new ComplianceError(
      `Audit ${existing.auditNumber} must be in "In Progress" or "Pending Report" status to complete (current: ${existing.status})`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  const signatureHash = store.generateSignatureHash(signerId, id, 'audit-complete');

  store.updateAudit(id, {
    status: 'Completed',
    completedAt: new Date().toISOString(),
    completedById: signerId,
  });

  store.logAudit('APPROVE', 'Audit', id,
    { status: existing.status },
    { status: 'Completed', completedBy: signerName, signatureHash }
  );

  return useQMSStore.getState().audits.find(a => a.id === id)!;
}

/**
 * Adds a finding to an audit.
 */
export function addAuditFinding(
  auditId: string,
  finding: Omit<AuditFinding, 'id'>
): Audit {
  const store = useQMSStore.getState();
  const existing = store.audits.find(a => a.id === auditId);

  if (!existing) {
    throw new ComplianceError(
      `Audit ${auditId} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  const newFinding: AuditFinding = {
    ...finding,
    id: `find-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };

  const updatedFindings = [...(existing.findings || []), newFinding];
  store.updateAudit(auditId, { findings: updatedFindings });

  return useQMSStore.getState().audits.find(a => a.id === auditId)!;
}

/**
 * Updates a specific finding within an audit.
 */
export function updateAuditFinding(
  auditId: string,
  findingId: string,
  updates: Partial<AuditFinding>
): Audit {
  const store = useQMSStore.getState();
  const existing = store.audits.find(a => a.id === auditId);

  if (!existing) {
    throw new ComplianceError(
      `Audit ${auditId} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  const updatedFindings = (existing.findings || []).map(f =>
    f.id === findingId ? { ...f, ...updates } : f
  );
  store.updateAudit(auditId, { findings: updatedFindings });

  return useQMSStore.getState().audits.find(a => a.id === auditId)!;
}

// ============================================================================
// Validation Helpers
// ============================================================================

const VALID_AUDIT_TRANSITIONS: Record<string, string[]> = {
  'Scheduled': ['In Progress', 'Cancelled'],
  'In Progress': ['Pending Report', 'Scheduled'],
  'Pending Report': ['Completed', 'In Progress'],
  'Completed': [],
  'Cancelled': [],
};

function validateAuditStatusTransition(current: string, target: string): void {
  const allowed = VALID_AUDIT_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    throw new ComplianceError(
      `Invalid audit status transition: "${current}" → "${target}"`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }
}
