// prerequisiteEngine.ts — Centralized prerequisite checking engine
// Verifies that required prerequisite documents are in Approved status before
// creating QMS records (CAPA, NCR, Training, Risk, Audit, Change Control, Deviation)
// ISO 13485 §4.2.4 / §4.2.5 compliance

import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { PrerequisiteRecordType, DocumentPrerequisite } from '@/types/qms';

// ============================================================================
// Types
// ============================================================================

export interface PrerequisiteCheckResult {
  met: boolean;
  missing: DocumentPrerequisite[];
  checked: Array<{
    prerequisite: DocumentPrerequisite;
    satisfied: boolean;
    satisfyingDocument?: string;
  }>;
}

export interface Warning {
  message: string;
  prerequisite: DocumentPrerequisite;
  severity: 'error' | 'warning';
}

// ============================================================================
// Default Prerequisites by Record Type
// ============================================================================

const DEFAULT_PREREQUISITES: Record<PrerequisiteRecordType, Array<{
  requiredDocType: string;
  isMandatory: boolean;
  description: string;
}>> = {
  CAPA: [
    { requiredDocType: 'SOP', isMandatory: true, description: 'An Approved SOP is required before creating a CAPA' },
    { requiredDocType: 'Policy', isMandatory: false, description: 'An Approved CAPA Policy is recommended' },
  ],
  NCR: [
    { requiredDocType: 'SOP', isMandatory: true, description: 'An Approved SOP is required before creating an NCR' },
  ],
  TRAINING: [
    { requiredDocType: 'SOP', isMandatory: true, description: 'An Approved SOP must exist before assigning training' },
  ],
  RISK: [
    { requiredDocType: 'Policy', isMandatory: true, description: 'An Approved Risk Management Policy is required' },
    { requiredDocType: 'Risk Analysis', isMandatory: false, description: 'An Approved Risk Analysis template is recommended' },
  ],
  AUDIT: [
    { requiredDocType: 'SOP', isMandatory: true, description: 'An Approved Audit SOP is required before creating an audit' },
  ],
  CHANGE_CONTROL: [
    { requiredDocType: 'SOP', isMandatory: true, description: 'An Approved Change Control SOP is required' },
    { requiredDocType: 'Policy', isMandatory: false, description: 'An Approved Change Management Policy is recommended' },
  ],
  DEVIATION: [
    { requiredDocType: 'SOP', isMandatory: true, description: 'An Approved Deviation SOP is required before creating a deviation' },
  ],
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Checks prerequisites for a given record type and organization.
 * Returns a detailed result showing which prerequisites are met and which are missing.
 */
export function checkPrerequisites(
  recordType: PrerequisiteRecordType,
  organizationId?: string
): PrerequisiteCheckResult {
  try {
    const store = useQMSStore.getState();

    // Get organization-specific prerequisites from the store
    const storedPrerequisites = store.prerequisites.filter(
      p => p.recordType === recordType && (!p.organizationId || p.organizationId === organizationId)
    );

    // Merge with defaults if no stored prerequisites exist
    const prerequisites = storedPrerequisites.length > 0
      ? storedPrerequisites
      : getDefaultPrerequisites(recordType, organizationId);

    if (prerequisites.length === 0) {
      return { met: true, missing: [], checked: [] };
    }

    const checked: PrerequisiteCheckResult['checked'] = [];
    const missing: DocumentPrerequisite[] = [];

    for (const prereq of prerequisites) {
      // Find an Approved document of the required type
      let candidates = store.documents.filter(
        d => d.type === prereq.requiredDocType && d.status === 'Approved'
      );

      // If a specific document reference is required
      if (prereq.requiredDocRef) {
        candidates = candidates.filter(d => d.documentNumber === prereq.requiredDocRef);
      }

      // Filter by organization if specified
      if (organizationId) {
        candidates = candidates.filter(
          d => !d.organizationId || d.organizationId === organizationId
        );
      }

      const satisfyingDoc = candidates[0];
      const satisfied = !!satisfyingDoc;

      checked.push({
        prerequisite: prereq,
        satisfied,
        satisfyingDocument: satisfyingDoc
          ? `${satisfyingDoc.documentNumber} - ${satisfyingDoc.title}`
          : undefined,
      });

      if (!satisfied && prereq.isMandatory) {
        missing.push(prereq);
      }
    }

    return {
      met: missing.length === 0,
      missing,
      checked,
    };
  } catch (error) {
    // In demo mode or if store is unavailable, allow silently
    console.warn('[prerequisiteEngine] Check failed, allowing operation in fallback mode:', error);
    return { met: true, missing: [], checked: [] };
  }
}

/**
 * Enforces prerequisites — throws ComplianceError if mandatory prerequisites are not met.
 */
export function enforcePrerequisites(
  recordType: PrerequisiteRecordType,
  organizationId?: string
): void {
  const result = checkPrerequisites(recordType, organizationId);

  if (!result.met) {
    const missingDocs = result.missing
      .map(p => `${p.requiredDocType}${p.requiredDocRef ? ` (${p.requiredDocRef})` : ''}`)
      .join(', ');

    throw new ComplianceError(
      `Prerequisite not met for ${recordType}: no Approved document of type ${missingDocs}`,
      COMPLIANCE_CODES.PREREQUISITE_NOT_MET
    );
  }
}

/**
 * Returns prerequisite warnings without throwing errors.
 * Useful for displaying warnings in the UI before the user attempts an action.
 */
export function getPrerequisiteWarnings(
  recordType: PrerequisiteRecordType,
  organizationId?: string
): Warning[] {
  const result = checkPrerequisites(recordType, organizationId);

  return result.checked.map(check => ({
    message: check.satisfied
      ? `Prerequisite satisfied: ${check.prerequisite.requiredDocType}`
      : check.prerequisite.description ||
        `Approved document of type ${check.prerequisite.requiredDocType} is ${check.prerequisite.isMandatory ? 'required' : 'recommended'} for creating ${recordType} records`,
    prerequisite: check.prerequisite,
    severity: check.satisfied ? 'warning' : (check.prerequisite.isMandatory ? 'error' : 'warning'),
  }));
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Creates default prerequisite records for a given record type.
 * Used when no organization-specific prerequisites are defined.
 */
function getDefaultPrerequisites(
  recordType: PrerequisiteRecordType,
  organizationId?: string
): DocumentPrerequisite[] {
  const defaults = DEFAULT_PREREQUISITES[recordType] || [];

  return defaults.map((def, index) => ({
    id: `prereq-default-${recordType}-${index}`,
    organizationId: organizationId || '',
    recordType,
    requiredDocType: def.requiredDocType,
    isMandatory: def.isMandatory,
    description: def.description,
    createdAt: new Date().toISOString(),
  }));
}

/**
 * Checks whether a record type has any prerequisites defined.
 */
export function hasPrerequisites(recordType: PrerequisiteRecordType, organizationId?: string): boolean {
  const store = useQMSStore.getState();
  const stored = organizationId
    ? store.prerequisites.filter(
        p => p.recordType === recordType && (!p.organizationId || p.organizationId === organizationId)
      )
    : store.prerequisites.filter(p => p.recordType === recordType);
  if (stored.length > 0) return true;
  return recordType in DEFAULT_PREREQUISITES;
}

/**
 * Returns a summary of all prerequisites for a record type.
 * Useful for displaying prerequisite status in dashboards.
 */
export function getPrerequisiteSummary(
  recordType: PrerequisiteRecordType,
  organizationId?: string
): {
  total: number;
  satisfied: number;
  missing: number;
  mandatoryMissing: number;
  details: Array<{
    docType: string;
    satisfied: boolean;
    mandatory: boolean;
    satisfyingDocument?: string;
  }>;
} {
  const result = checkPrerequisites(recordType, organizationId);

  return {
    total: result.checked.length,
    satisfied: result.checked.filter(c => c.satisfied).length,
    missing: result.checked.filter(c => !c.satisfied).length,
    mandatoryMissing: result.missing.length,
    details: result.checked.map(c => ({
      docType: c.prerequisite.requiredDocType,
      satisfied: c.satisfied,
      mandatory: c.prerequisite.isMandatory,
      satisfyingDocument: c.satisfyingDocument,
    })),
  };
}
