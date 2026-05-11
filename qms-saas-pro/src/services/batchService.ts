// batchService.ts — Règles Dossier de Lot (BPF / GMP)
// Gère le cycle de vie des dossiers de lot : création, étapes, libération QA, verrouillage
// Règles métier : séquence étapes obligatoire, verrouillage après libération, master formula check

import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { BatchRecord, BatchStep, BatchStepStatus } from '@/types/qms';

// ============================================================================
// Batch Record CRUD
// ============================================================================

/**
 * Crée un nouveau dossier de lot.
 * - Vérifie que masterFormulaId pointe vers un document Approved de type Specification (spec §5.3)
 * - Vérifie l'unicité du numéro de lot
 */
export function createBatchRecord(batch: Omit<BatchRecord, 'id' | 'createdAt'> & { steps?: Omit<BatchStep, 'id' | 'createdAt'>[] }): BatchRecord {
  const store = useQMSStore.getState();

  // Vérifier l'unicité du numéro de lot
  const existing = store.batchRecords.find(b => b.lotNumber === batch.lotNumber);
  if (existing) {
    throw new ComplianceError(
      `Un dossier de lot avec le numéro ${batch.lotNumber} existe déjà`,
      COMPLIANCE_CODES.DUPLICATE_RECORD
    );
  }

  // Vérifier que la formule maîtresse (si spécifiée) est un document Approved
  if (batch.masterFormulaId) {
    const masterFormula = store.documents.find(d => d.id === batch.masterFormulaId);
    if (!masterFormula) {
      throw new ComplianceError(
        `Document de formule maîtresse ${batch.masterFormulaId} introuvable`,
        COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
      );
    }
    if (masterFormula.status !== 'Approved') {
      throw new ComplianceError(
        `La formule maîtresse (${masterFormula.documentNumber}) doit être en statut Approved pour créer un dossier de lot`,
        COMPLIANCE_CODES.PREREQUISITE_NOT_MET
      );
    }
    if (masterFormula.type !== 'Specification' && masterFormula.type !== 'Technical') {
      throw new ComplianceError(
        `Le document de formule maîtresse doit être de type Specification ou Technical, pas ${masterFormula.type}`,
        COMPLIANCE_CODES.PREREQUISITE_NOT_MET
      );
    }
  }

  const newBatch: BatchRecord = {
    ...batch,
    id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  store.addBatchRecord(newBatch);

  // Créer les étapes si fournies
  if (batch.steps && batch.steps.length > 0) {
    for (const step of batch.steps) {
      const newStep: BatchStep = {
        ...step,
        id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        batchRecordId: newBatch.id,
        createdAt: new Date().toISOString(),
      };
      // Les steps sont stockés dans le batch record
      const currentBatch = useQMSStore.getState().batchRecords.find(b => b.id === newBatch.id);
      if (currentBatch) {
        store.updateBatchRecord(newBatch.id, {
          steps: [...(currentBatch.steps || []), newStep],
        });
      }
    }
  }

  return newBatch;
}

/**
 * Met à jour un dossier de lot.
 * - Bloque la modification si le lot est verrouillé (BATCH_LOCKED) (spec §5.3)
 */
export function updateBatchRecord(id: string, updates: Partial<BatchRecord>): BatchRecord {
  const store = useQMSStore.getState();
  const existing = store.batchRecords.find(b => b.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Dossier de lot ${id} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Vérifier si le lot est verrouillé
  if (existing.isLocked) {
    throw new ComplianceError(
      `Le dossier de lot ${existing.lotNumber} est verrouillé et ne peut plus être modifié`,
      COMPLIANCE_CODES.BATCH_LOCKED
    );
  }

  // Vérifier si le statut permet la modification
  if (existing.status === 'Released' || existing.status === 'Rejected') {
    throw new ComplianceError(
      `Le dossier de lot ${existing.lotNumber} a le statut "${existing.status}" et ne peut plus être modifié`,
      COMPLIANCE_CODES.BATCH_LOCKED
    );
  }

  store.updateBatchRecord(id, updates);

  const updated = useQMSStore.getState().batchRecords.find(b => b.id === id);
  return updated!;
}

// ============================================================================
// Batch Step Operations
// ============================================================================

/**
 * Complète une étape du dossier de lot.
 * - Vérifie que l'étape N-1 est Completed avant de compléter N (spec §5.3)
 * - Enregistre l'opérateur et la signature
 */
export function completeBatchStep(
  batchId: string,
  stepId: string,
  operatorId: string,
  actualValue?: string
): BatchStep {
  const store = useQMSStore.getState();
  const batch = store.batchRecords.find(b => b.id === batchId);

  if (!batch) {
    throw new ComplianceError(
      `Dossier de lot ${batchId} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Vérifier si le lot est verrouillé
  if (batch.isLocked) {
    throw new ComplianceError(
      `Le dossier de lot ${batch.lotNumber} est verrouillé`,
      COMPLIANCE_CODES.BATCH_LOCKED
    );
  }

  const steps = batch.steps || [];
  const stepIndex = steps.findIndex(s => s.id === stepId);

  if (stepIndex === -1) {
    throw new ComplianceError(
      `Étape ${stepId} introuvable dans le dossier de lot ${batch.lotNumber}`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  const step = steps[stepIndex];

  // Vérifier que l'étape n'est pas déjà complétée
  if (step.status === 'Completed') {
    throw new ComplianceError(
      `L'étape "${step.stepName}" est déjà complétée`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  // Vérifier la séquence : l'étape précédente doit être Completed
  if (stepIndex > 0) {
    const previousStep = steps[stepIndex - 1];
    if (previousStep.status !== 'Completed') {
      throw new ComplianceError(
        `L'étape précédente "${previousStep.stepName}" doit être complétée avant de pouvoir compléter "${step.stepName}"`,
        COMPLIANCE_CODES.VALIDATION_SEQUENCE_ERROR
      );
    }
  }

  // Générer la signature pour l'étape
  const signatureHash = store.generateSignatureHash(operatorId, batchId, `step-${step.stepOrder}`);

  // Mettre à jour l'étape
  const updatedStep: BatchStep = {
    ...step,
    status: 'Completed' as BatchStepStatus,
    actualValue: actualValue || step.expectedValue,
    operatorId,
    performedAt: new Date().toISOString(),
    signatureHash,
  };

  // Mettre à jour la liste des étapes
  const updatedSteps = steps.map(s => s.id === stepId ? updatedStep : s);

  // Vérifier si toutes les étapes sont complétées → passer en Pending QA Review
  const allCompleted = updatedSteps.every(s => s.status === 'Completed');
  const batchUpdates: Partial<BatchRecord> = {
    steps: updatedSteps,
  };

  if (allCompleted && batch.status === 'In Progress') {
    batchUpdates.status = 'Pending QA Review';
  }

  store.updateBatchRecord(batchId, batchUpdates);

  // Logger l'audit trail
  store.logAudit('UPDATE', 'BatchStep', stepId,
    { status: step.status },
    { status: 'Completed', operatorId, signatureHash }
  );

  return updatedStep;
}

/**
 * Démarre une étape du dossier de lot.
 */
export function startBatchStep(batchId: string, stepId: string, operatorId: string): BatchStep {
  const store = useQMSStore.getState();
  const batch = store.batchRecords.find(b => b.id === batchId);

  if (!batch) {
    throw new ComplianceError(
      `Dossier de lot ${batchId} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (batch.isLocked) {
    throw new ComplianceError(
      `Le dossier de lot ${batch.lotNumber} est verrouillé`,
      COMPLIANCE_CODES.BATCH_LOCKED
    );
  }

  const steps = batch.steps || [];
  const step = steps.find(s => s.id === stepId);

  if (!step) {
    throw new ComplianceError(
      `Étape ${stepId} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (step.status !== 'Pending') {
    throw new ComplianceError(
      `L'étape "${step.stepName}" ne peut pas être démarrée (statut actuel: ${step.status})`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  const updatedStep: BatchStep = {
    ...step,
    status: 'In Progress' as BatchStepStatus,
    operatorId,
  };

  const updatedSteps = steps.map(s => s.id === stepId ? updatedStep : s);
  store.updateBatchRecord(batchId, { steps: updatedSteps });

  return updatedStep;
}

// ============================================================================
// Batch Release Operations (QA)
// ============================================================================

/**
 * Libère un dossier de lot (QA Release).
 * - Passe is_locked = TRUE, status = Released (spec §5.3)
 * - Bloque toute modification ultérieure
 * - Nécessite une signature électronique
 */
export function releaseBatch(
  batchId: string,
  qaUserId: string,
  qaUserName: string
): BatchRecord {
  const store = useQMSStore.getState();
  const batch = store.batchRecords.find(b => b.id === batchId);

  if (!batch) {
    throw new ComplianceError(
      `Dossier de lot ${batchId} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Vérifier que le lot est en Pending QA Review
  if (batch.status !== 'Pending QA Review') {
    throw new ComplianceError(
      `Le dossier de lot ${batch.lotNumber} doit être en statut "Pending QA Review" pour être libéré (statut actuel: ${batch.status})`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  // Vérifier que toutes les étapes sont complétées
  const incompleteSteps = (batch.steps || []).filter(s => s.status !== 'Completed');
  if (incompleteSteps.length > 0) {
    throw new ComplianceError(
      `${incompleteSteps.length} étape(s) incomplète(s) dans le dossier de lot ${batch.lotNumber}`,
      COMPLIANCE_CODES.PREREQUISITE_NOT_MET
    );
  }

  // Générer la signature QA
  const signatureHash = store.generateSignatureHash(qaUserId, batchId, 'qa-release');

  const updates: Partial<BatchRecord> = {
    status: 'Released',
    isLocked: true,
    qaReleaseDate: new Date().toISOString(),
    qaReleasedById: qaUserId,
  };

  store.updateBatchRecord(batchId, updates);

  // Logger l'audit trail
  store.logAudit('APPROVE', 'BatchRecord', batchId,
    { status: 'Pending QA Review', isLocked: false },
    { status: 'Released', isLocked: true, qaReleasedBy: qaUserName, signatureHash }
  );

  const updated = useQMSStore.getState().batchRecords.find(b => b.id === batchId);
  return updated!;
}

/**
 * Rejette un dossier de lot.
 * - Passe is_locked = TRUE, status = Rejected
 */
export function rejectBatch(
  batchId: string,
  qaUserId: string,
  qaUserName: string,
  reason: string
): BatchRecord {
  const store = useQMSStore.getState();
  const batch = store.batchRecords.find(b => b.id === batchId);

  if (!batch) {
    throw new ComplianceError(
      `Dossier de lot ${batchId} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (batch.status !== 'Pending QA Review' && batch.status !== 'In Progress') {
    throw new ComplianceError(
      `Le dossier de lot ${batch.lotNumber} ne peut pas être rejeté depuis le statut "${batch.status}"`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  const signatureHash = store.generateSignatureHash(qaUserId, batchId, 'qa-reject');

  const updates: Partial<BatchRecord> = {
    status: 'Rejected',
    isLocked: true,
    qaReleaseDate: new Date().toISOString(),
    qaReleasedById: qaUserId,
  };

  store.updateBatchRecord(batchId, updates);

  store.logAudit('REJECT', 'BatchRecord', batchId,
    { status: batch.status },
    { status: 'Rejected', rejectedBy: qaUserName, reason, signatureHash }
  );

  const updated = useQMSStore.getState().batchRecords.find(b => b.id === batchId);
  return updated!;
}

/**
 * Met un lot en quarantaine.
 */
export function quarantineBatch(batchId: string, reason: string): BatchRecord {
  const store = useQMSStore.getState();
  const batch = store.batchRecords.find(b => b.id === batchId);

  if (!batch) {
    throw new ComplianceError(
      `Dossier de lot ${batchId} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (batch.isLocked) {
    throw new ComplianceError(
      `Le dossier de lot ${batch.lotNumber} est verrouillé`,
      COMPLIANCE_CODES.BATCH_LOCKED
    );
  }

  const updates: Partial<BatchRecord> = {
    status: 'Quarantine',
  };

  store.updateBatchRecord(batchId, updates);

  store.logAudit('UPDATE', 'BatchRecord', batchId,
    { status: batch.status },
    { status: 'Quarantine', reason }
  );

  const updated = useQMSStore.getState().batchRecords.find(b => b.id === batchId);
  return updated!;
}
