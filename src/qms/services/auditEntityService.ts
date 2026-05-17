// auditEntityService.ts — Audit Entity service (not audit trail)
// Manages Audit entity lifecycle: creation, scheduling, findings, completion
// Business rules: finding management, e-signature for completion

import { useQMSStore } from '@/qms/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/qms/lib/errors';
import { checkPrerequisites } from '@/qms/services/compliance/prerequisiteEngine';
import type { Audit, AuditFinding } from '@/qms/types/qms';

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
 * - Logs explicit audit trail with old/new values
 */
export function updateAudit(id: string, updates: Partial<Audit>, organizationId?: string): Audit {
  const store = useQMSStore.getState();
  const existing = store.audits.find(a => a.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Audit ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Validate organization access
  const effectiveOrgId = organizationId || existing.organizationId;
  if (effectiveOrgId && existing.organizationId && existing.organizationId !== effectiveOrgId) {
    throw new ComplianceError(
      `Audit ${id} does not belong to organization ${effectiveOrgId}`,
      COMPLIANCE_CODES.INSUFFICIENT_PERMISSIONS
    );
  }

  // Validate status transition if status is changing
  if (updates.status && updates.status !== existing.status) {
    validateAuditStatusTransition(existing.status, updates.status);
  }

  // Capture old values before update
  const oldValues = { ...existing };

  store.updateAudit(id, updates);

  // Explicit audit trail logging with full old/new context
  store.logAudit('UPDATE', 'Audit', id, oldValues, updates);

  const updated = useQMSStore.getState().audits.find(a => a.id === id);
  if (!updated) {
    throw new ComplianceError('ENTITY_NOT_FOUND', 'Audit not found after update');
  }
  return updated;
}

/**
 * Gets audits filtered by organization.
 */
export function getAudits(organizationId?: string): Audit[] {
  const store = useQMSStore.getState();
  if (!organizationId) return store.audits;
  return store.audits.filter(a => a.organizationId === organizationId);
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

  if (existing.status !== 'In Progress') {
    throw new ComplianceError(
      `Audit ${existing.auditNumber} must be in "In Progress" status to complete (current: ${existing.status})`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  const signatureHash = store.generateSignatureHash(signerId, id, 'audit-complete');

  store.updateAudit(id, {
    status: 'Completed',
    completedDate: new Date().toISOString(),
  });

  store.logAudit('APPROVE', 'Audit', id,
    { status: existing.status },
    { status: 'Completed', completedBy: signerName, signatureHash }
  );

  const updated = useQMSStore.getState().audits.find(a => a.id === id);
  if (!updated) {
    throw new ComplianceError('ENTITY_NOT_FOUND', 'Audit not found after completion');
  }
  return updated;
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

  const updated = useQMSStore.getState().audits.find(a => a.id === auditId);
  if (!updated) {
    throw new ComplianceError('ENTITY_NOT_FOUND', 'Audit not found after adding finding');
  }
  return updated;
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

  const updated = useQMSStore.getState().audits.find(a => a.id === auditId);
  if (!updated) {
    throw new ComplianceError('ENTITY_NOT_FOUND', 'Audit not found after updating finding');
  }
  return updated;
}

// ============================================================================
// Validation Helpers
// ============================================================================

const VALID_AUDIT_TRANSITIONS: Record<string, string[]> = {
  'Planned': ['In Progress'],
  'In Progress': ['Completed', 'Planned'],
  'Completed': [],
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
