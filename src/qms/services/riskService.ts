// riskService.ts — Risk Assessment service
// Manages Risk lifecycle: creation, assessment, mitigation, closure
// Business rules: RPN calculation, risk level classification, status transitions

import { useQMSStore } from '@/qms/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/qms/lib/errors';
import type { Risk, RiskLevel } from '@/qms/types/qms';

// ============================================================================
// Risk CRUD Operations
// ============================================================================

/**
 * Creates a new Risk assessment.
 * - Validates unique risk number
 * - Auto-calculates risk level from RPN
 */
export function createRisk(risk: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'>): Risk {
  const store = useQMSStore.getState();

  // Verify unique risk number within organization
  const orgFilter = risk.organizationId
    ? (r: Risk) => r.organizationId === risk.organizationId
    : () => true;
  const existing = store.risks.find(r => r.riskNumber === risk.riskNumber && orgFilter(r));
  if (existing) {
    throw new ComplianceError(
      `A risk with number ${risk.riskNumber} already exists`,
      COMPLIANCE_CODES.DUPLICATE_RECORD
    );
  }

  // Auto-calculate risk level from RPN if not provided
  const calculatedRiskLevel = risk.riskLevel || calculateRiskLevel(risk.rpn);

  const newRisk: Risk = {
    ...risk,
    riskLevel: calculatedRiskLevel,
    id: `risk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addRisk(newRisk);
  return newRisk;
}

/**
 * Updates a risk assessment with business rule validation.
 * - Recalculates risk level if RPN changes
 * - Validates status transitions
 * - Logs explicit audit trail with old/new values
 */
export function updateRisk(id: string, updates: Partial<Risk>, organizationId?: string): Risk {
  const store = useQMSStore.getState();
  const existing = store.risks.find(r => r.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Risk ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Validate organization access
  const effectiveOrgId = organizationId || existing.organizationId;
  if (effectiveOrgId && existing.organizationId && existing.organizationId !== effectiveOrgId) {
    throw new ComplianceError(
      `Risk ${id} does not belong to organization ${effectiveOrgId}`,
      COMPLIANCE_CODES.INSUFFICIENT_PERMISSIONS
    );
  }

  // Capture old values before update
  const oldValues = { ...existing };

  // Recalculate risk level if RPN changes
  if (updates.rpn !== undefined && !updates.riskLevel) {
    updates.riskLevel = calculateRiskLevel(updates.rpn);
  }

  // Validate status transition if status is changing
  if (updates.status && updates.status !== existing.status) {
    validateRiskStatusTransition(existing.status, updates.status);
  }

  store.updateRisk(id, updates);

  // Explicit audit trail logging with full old/new context
  store.logAudit('UPDATE', 'Risk', id, oldValues, updates);

  const updated = useQMSStore.getState().risks.find(r => r.id === id);
  if (!updated) {
    throw new ComplianceError('ENTITY_NOT_FOUND', 'Risk not found after update');
  }
  return updated;
}

/**
 * Gets risks filtered by organization.
 */
export function getRisks(organizationId?: string): Risk[] {
  const store = useQMSStore.getState();
  if (!organizationId) return store.risks;
  return store.risks.filter(r => r.organizationId === organizationId);
}

/**
 * Gets a risk by ID with optional organization filter.
 */
export function getRisk(id: string, organizationId?: string): Risk | undefined {
  const store = useQMSStore.getState();
  const risk = store.risks.find(r => r.id === id);
  if (!risk) return undefined;
  if (organizationId && risk.organizationId && risk.organizationId !== organizationId) return undefined;
  return risk;
}

// ============================================================================
// Risk Calculation Helpers
// ============================================================================

/**
 * Calculates risk level from RPN value.
 * RPN = Severity × Occurrence × Detection (1-5 scale each, max RPN = 125)
 */
export function calculateRiskLevel(rpn: number): RiskLevel {
  if (rpn >= 80) return 'Critical';
  if (rpn >= 50) return 'High';
  if (rpn >= 20) return 'Medium';
  return 'Low';
}

/**
 * Returns the risk level color for display.
 */
export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================

const VALID_RISK_TRANSITIONS: Record<string, string[]> = {
  'Open': ['Under Assessment', 'Closed'],
  'Under Assessment': ['Mitigation Planned', 'Closed'],
  'Mitigation Planned': ['Mitigated', 'Under Assessment'],
  'Mitigated': ['Closed', 'Under Assessment'],
  'Closed': [],
};

function validateRiskStatusTransition(current: string, target: string): void {
  const allowed = VALID_RISK_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    throw new ComplianceError(
      `Invalid risk status transition: "${current}" → "${target}"`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }
}
