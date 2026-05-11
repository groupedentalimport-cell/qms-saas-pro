// supplierService.ts — Règles Fournisseurs / ASL (Approved Supplier List)
// Gère le cycle de vie des fournisseurs et le calcul du score de performance
// Règles métier : scoring basé sur NCR et audits, qualification documentaire

import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { Supplier, SupplierStatus } from '@/types/qms';

// ============================================================================
// Supplier CRUD
// ============================================================================

/**
 * Crée un nouveau fournisseur.
 * - Vérifie l'unicité du code fournisseur
 * - Vérifie le document de qualification si spécifié
 */
export function createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
  const store = useQMSStore.getState();

  // Vérifier l'unicité du code fournisseur
  const existing = store.suppliers.find(s => s.supplierCode === supplier.supplierCode);
  if (existing) {
    throw new ComplianceError(
      `Un fournisseur avec le code ${supplier.supplierCode} existe déjà`,
      COMPLIANCE_CODES.DUPLICATE_RECORD
    );
  }

  // Vérifier le document de qualification si spécifié
  if (supplier.qualificationDocId) {
    const qualDoc = store.documents.find(d => d.id === supplier.qualificationDocId);
    if (!qualDoc) {
      throw new ComplianceError(
        `Document de qualification ${supplier.qualificationDocId} introuvable`,
        COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
      );
    }
    if (qualDoc.status !== 'Approved') {
      throw new ComplianceError(
        `Le document de qualification (${qualDoc.documentNumber}) doit être Approved`,
        COMPLIANCE_CODES.PREREQUISITE_NOT_MET
      );
    }
  }

  const newSupplier: Supplier = {
    ...supplier,
    id: `sup-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  store.addSupplier(newSupplier);
  return newSupplier;
}

/**
 * Met à jour un fournisseur.
 */
export function updateSupplier(id: string, updates: Partial<Supplier>): Supplier {
  const store = useQMSStore.getState();
  const existing = store.suppliers.find(s => s.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Fournisseur ${id} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Vérifier les transitions de statut valides
  if (updates.status && updates.status !== existing.status) {
    validateStatusTransition(existing.status, updates.status);
  }

  store.updateSupplier(id, updates);

  const updated = useQMSStore.getState().suppliers.find(s => s.id === id);
  return updated!;
}

/**
 * Disqualifie un fournisseur.
 * - Vérifie qu'il n'y a pas de NCR ouvertes liées à ce fournisseur
 */
export function disqualifySupplier(id: string, reason: string): Supplier {
  const store = useQMSStore.getState();
  const supplier = store.suppliers.find(s => s.id === id);

  if (!supplier) {
    throw new ComplianceError(
      `Fournisseur ${id} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Vérifier les NCR ouvertes
  const openNCRs = store.ncrs.filter(
    n => n.supplierId === id && n.status !== 'Closed'
  );

  if (openNCRs.length > 0) {
    throw new ComplianceError(
      `Impossible de disqualifier ${supplier.name}: ${openNCRs.length} NCR(s) ouverte(s)`,
      COMPLIANCE_CODES.PREREQUISITE_NOT_MET
    );
  }

  store.updateSupplier(id, {
    status: 'Disqualified',
  });

  store.logAudit('UPDATE', 'Supplier', id,
    { status: supplier.status },
    { status: 'Disqualified', reason }
  );

  const updated = useQMSStore.getState().suppliers.find(s => s.id === id);
  return updated!;
}

// ============================================================================
// Performance Score Calculation (spec §5.5)
// ============================================================================

// Pénalités NCR (sur 12 derniers mois)
const NCR_PENALTY: Record<string, number> = {
  Critical: -15,
  Major: -8,
  Minor: -3,
};

// Pénalités Audit (sur 12 derniers mois)
const AUDIT_PENALTY: Record<string, number> = {
  Critical: -20,
  Major: -5,
  Minor: -2,
  Observation: -1,
};

/**
 * Calcule le score de performance d'un fournisseur.
 * Score de base = 100, pénalités appliquées pour NCR et audits sur 12 mois.
 * Le score est compris entre 0 et 100. (spec §5.5)
 *
 * @param supplierId - ID du fournisseur
 * @returns Score entre 0 et 100
 */
export function calculatePerformanceScore(supplierId: string): number {
  const store = useQMSStore.getState();
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  let score = 100;

  // Pénalités NCR (sur 12 mois)
  const supplierNCRs = store.ncrs.filter(n => {
    if (n.supplierId !== supplierId) return false;
    if (n.status === 'Closed') return false;
    const createdDate = new Date(n.createdDate);
    return createdDate >= twelveMonthsAgo;
  });

  for (const ncr of supplierNCRs) {
    const penalty = NCR_PENALTY[ncr.severity || 'Minor'] || -3;
    score += penalty;
  }

  // Pénalités Audits (sur 12 mois)
  const supplierAudits = store.audits.filter(a => {
    // Audits de type Supplier qui mentionnent ce fournisseur
    if (a.type !== 'Supplier') return false;
    const auditDate = new Date(a.scheduledDate);
    return auditDate >= twelveMonthsAgo;
  });

  for (const audit of supplierAudits) {
    if (audit.findings) {
      for (const finding of audit.findings) {
        const penalty = AUDIT_PENALTY[finding.severity] || -1;
        score += penalty;
      }
    }
  }

  // Score entre 0 et 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Met à jour le score de performance d'un fournisseur.
 */
export function refreshPerformanceScore(supplierId: string): Supplier {
  const score = calculatePerformanceScore(supplierId);
  return updateSupplier(supplierId, { performanceScore: score });
}

/**
 * Calcule les scores de performance pour tous les fournisseurs.
 */
export function refreshAllPerformanceScores(): void {
  const store = useQMSStore.getState();
  for (const supplier of store.suppliers) {
    const score = calculatePerformanceScore(supplier.id);
    store.updateSupplier(supplier.id, { performanceScore: score });
  }
}

/**
 * Retourne la classification du fournisseur basée sur son score.
 */
export function getSupplierRating(score: number): {
  rating: 'A' | 'B' | 'C' | 'D';
  label: string;
  color: string;
} {
  if (score >= 90) return { rating: 'A', label: 'Excellent', color: 'text-green-600' };
  if (score >= 75) return { rating: 'B', label: 'Bon', color: 'text-blue-600' };
  if (score >= 60) return { rating: 'C', label: 'Conditionnel', color: 'text-yellow-600' };
  return { rating: 'D', label: 'Critique', color: 'text-red-600' };
}

// ============================================================================
// Validation Helpers
// ============================================================================

function validateStatusTransition(current: SupplierStatus, target: SupplierStatus): void {
  const validTransitions: Record<SupplierStatus, SupplierStatus[]> = {
    'Qualified': ['Conditional', 'Disqualified', 'Under Evaluation'],
    'Conditional': ['Qualified', 'Disqualified', 'Under Evaluation'],
    'Disqualified': ['Under Evaluation'],
    'Under Evaluation': ['Qualified', 'Conditional', 'Disqualified'],
  };

  const allowed = validTransitions[current];
  if (!allowed || !allowed.includes(target)) {
    throw new ComplianceError(
      `Transition invalide: "${current}" → "${target}"`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }
}
