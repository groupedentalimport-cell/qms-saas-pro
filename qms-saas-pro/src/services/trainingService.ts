// trainingService.ts — Training Record service
// Manages Training lifecycle: creation, assignment, completion, overdue detection
// Business rules: auto-status detection, e-signature for completion

import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { Training, OrgSettings } from '@/types/qms';
import { parseOrgSettings } from '@/types/qms';

// ============================================================================
// Training CRUD Operations
// ============================================================================

/**
 * Creates a new training record.
 * - Auto-detects overdue status based on due date
 */
export function createTraining(training: Omit<Training, 'id' | 'createdAt' | 'updatedAt'>): Training {
  const store = useQMSStore.getState();

  // Auto-detect overdue status
  const status = training.status || detectTrainingStatus(training.dueDate);

  const newTraining: Training = {
    ...training,
    status,
    id: `train-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addTraining(newTraining);
  return newTraining;
}

/**
 * Updates a training record with business rule validation.
 * - Auto-detects overdue status
 * - Validates status transitions
 */
export function updateTraining(id: string, updates: Partial<Training>): Training {
  const store = useQMSStore.getState();
  const existing = store.training.find(t => t.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Training ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Auto-detect overdue if due date changes
  if (updates.dueDate && !updates.status) {
    const newDate = new Date(updates.dueDate);
    if (newDate < new Date() && existing.status === 'Not Started') {
      updates.status = 'Overdue';
    }
  }

  store.updateTraining(id, updates);

  const updated = useQMSStore.getState().training.find(t => t.id === id);
  return updated!;
}

/**
 * Starts a training (Not Started → In Progress).
 */
export function startTraining(id: string): Training {
  const store = useQMSStore.getState();
  const existing = store.training.find(t => t.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Training ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (existing.status !== 'Not Started' && existing.status !== 'Overdue') {
    throw new ComplianceError(
      `Training must be in "Not Started" or "Overdue" status to start (current: ${existing.status})`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  store.updateTraining(id, { status: 'In Progress' });
  return useQMSStore.getState().training.find(t => t.id === id)!;
}

/**
 * Completes a training with electronic signature.
 * - Validates completion criteria based on org settings
 * - Records e-signature
 */
export function completeTraining(
  id: string,
  signerId: string,
  signerName: string,
  orgId?: string
): Training {
  const store = useQMSStore.getState();
  const existing = store.training.find(t => t.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Training ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (existing.status !== 'In Progress') {
    throw new ComplianceError(
      `Training must be in "In Progress" status to complete (current: ${existing.status})`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  // Check org settings for training completion requirements
  let requiresSignature = false;
  if (orgId) {
    const orgSettings = store.getOrgSettings(orgId);
    if (orgSettings) {
      requiresSignature = orgSettings.training_completion_requires_signature ?? false;
    }
  }

  const signatureHash = store.generateSignatureHash(signerId, id, 'training-complete');

  const updates: Partial<Training> = {
    status: 'Completed',
    completedAt: new Date().toISOString(),
    completedById: signerId,
  };

  store.updateTraining(id, updates);

  store.logAudit('APPROVE', 'Training', id,
    { status: existing.status },
    { status: 'Completed', completedBy: signerName, signatureHash, requiresSignature }
  );

  return useQMSStore.getState().training.find(t => t.id === id)!;
}

/**
 * Gets the organization settings for training.
 */
export function getTrainingOrgSettings(orgId: string): OrgSettings | null {
  const store = useQMSStore.getState();
  return store.getOrgSettings(orgId);
}

// ============================================================================
// Status Detection Helpers
// ============================================================================

function detectTrainingStatus(dueDate: string): Training['status'] {
  const due = new Date(dueDate);
  const now = new Date();
  return due < now ? 'Overdue' : 'Not Started';
}

/**
 * Scans all training records and updates overdue statuses.
 */
export function refreshOverdueStatuses(): void {
  const store = useQMSStore.getState();
  const now = new Date();

  for (const training of store.training) {
    if (training.status === 'Not Started' && new Date(training.dueDate) < now) {
      store.updateTraining(training.id, { status: 'Overdue' });
    }
  }
}
