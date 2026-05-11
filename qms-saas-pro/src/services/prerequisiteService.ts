// prerequisiteService.ts — Garde-fou réglementaire (ISO 13485 §4.2.4 / §4.2.5)
// Vérifie qu'un document parent de type SOP/WI est en statut Approved avant
// de pouvoir créer un enregistrement QMS (CAPA, NCR, Training, Risk, etc.)

import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { DocumentPrerequisite } from '@/types/qms';

export interface PrerequisiteCheckResult {
  met: boolean;
  missing: DocumentPrerequisite[];
  checked: Array<{
    prerequisite: DocumentPrerequisite;
    satisfied: boolean;
    satisfyingDocument?: string;
  }>;
}

/**
 * Vérifie les prérequis documentaires pour un type d'enregistrement donné.
 * En mode démo (sans Supabase), utilise le store Zustand.
 * Si Supabase est indisponible, laisse passer silencieusement (spec §5.1).
 *
 * @param recordType - Type d'enregistrement (CAPA, NCR, TRAINING, RISK, AUDIT, CHANGE_CONTROL, DEVIATION)
 * @param organizationId - ID de l'organisation (optionnel en mode démo)
 * @returns Résultat détaillé de la vérification
 */
export function checkPrerequisites(
  recordType: string,
  organizationId?: string
): PrerequisiteCheckResult {
  try {
    const store = useQMSStore.getState();
    const prerequisites = store.prerequisites.filter(
      p => p.recordType === recordType && (!p.organizationId || p.organizationId === organizationId)
    );

    // Si aucun prérequis n'est défini pour ce type, on laisse passer
    if (prerequisites.length === 0) {
      return { met: true, missing: [], checked: [] };
    }

    const checked: PrerequisiteCheckResult['checked'] = [];
    const missing: DocumentPrerequisite[] = [];

    for (const prereq of prerequisites) {
      // Chercher un document Approved du type requis
      let query = store.documents.filter(
        d => d.type === prereq.requiredDocType && d.status === 'Approved'
      );

      // Si un numéro de document spécifique est requis
      if (prereq.requiredDocRef) {
        query = query.filter(d => d.documentNumber === prereq.requiredDocRef);
      }

      // Filtrer par organisation si spécifié
      if (organizationId) {
        query = query.filter(d => !d.organizationId || d.organizationId === organizationId);
      }

      const satisfyingDoc = query[0];
      const satisfied = !!satisfyingDoc;

      checked.push({
        prerequisite: prereq,
        satisfied,
        satisfyingDocument: satisfyingDoc ? `${satisfyingDoc.documentNumber} - ${satisfyingDoc.title}` : undefined,
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
    // En mode démo ou si le store est indisponible, laisser passer silencieusement
    console.warn('[prerequisiteService] Check failed, allowing operation in fallback mode:', error);
    return { met: true, missing: [], checked: [] };
  }
}

/**
 * Version synchrone pour utilisation dans les composants React.
 * Lève une ComplianceError si un prérequis obligatoire n'est pas satisfait.
 */
export function enforcePrerequisites(
  recordType: string,
  organizationId?: string
): PrerequisiteCheckResult {
  const result = checkPrerequisites(recordType, organizationId);

  if (!result.met) {
    const missingDocs = result.missing
      .map(p => `${p.requiredDocType}${p.requiredDocRef ? ` (${p.requiredDocRef})` : ''}`)
      .join(', ');

    throw new ComplianceError(
      `Prérequis non satisfait pour ${recordType}: aucun document Approved de type ${missingDocs}`,
      COMPLIANCE_CODES.PREREQUISITE_NOT_MET
    );
  }

  return result;
}

/**
 * Retourne un message descriptif des prérequis manquants (sans lever d'erreur).
 * Utile pour afficher des avertissements dans l'UI.
 */
export function getPrerequisiteWarnings(
  recordType: string,
  organizationId?: string
): Array<{ message: string; prerequisite: DocumentPrerequisite }> {
  const result = checkPrerequisites(recordType, organizationId);

  return result.missing.map(p => ({
    message: p.description || `Document ${p.requiredDocType} Approved requis pour créer un enregistrement ${recordType}`,
    prerequisite: p,
  }));
}

/**
 * Vérifie si un type d'enregistrement a des prérequis définis.
 */
export function hasPrerequisites(recordType: string): boolean {
  try {
    const store = useQMSStore.getState();
    return store.prerequisites.some(p => p.recordType === recordType);
  } catch {
    return false;
  }
}
