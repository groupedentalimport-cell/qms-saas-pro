// documentService.ts — Règles documentaires (ISO 13485 §4.2.4 / §4.2.5)
// Gère le cycle de vie des documents : création, approbation, hiérarchie, validation IQ/OQ/PQ
// Règles métier : soft delete, document verrouillé si Approved, séquence IQ→OQ→PQ

import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { Document, DocumentStatus, ValidationPhase, ElectronicSignature, SignatureType } from '@/types/qms';

// ============================================================================
// Document CRUD Operations
// ============================================================================

/**
 * Crée un nouveau document avec validation des règles métier.
 * - Persiste type_specific_data, parent_document_id, document_level, validation_phase
 * - Vérifie que le document parent (si défini) existe et est Approved
 */
export function createDocument(doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Document {
  const store = useQMSStore.getState();

  // Vérifier l'unicité du numéro de document
  const existing = store.documents.find(d => d.documentNumber === doc.documentNumber);
  if (existing) {
    throw new ComplianceError(
      `Un document avec le numéro ${doc.documentNumber} existe déjà`,
      COMPLIANCE_CODES.DUPLICATE_RECORD
    );
  }

  // Vérifier le document parent si défini
  if (doc.parentDocumentId) {
    const parent = store.documents.find(d => d.id === doc.parentDocumentId);
    if (!parent) {
      throw new ComplianceError(
        `Document parent ${doc.parentDocumentId} introuvable`,
        COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
      );
    }
    // Un document ne peut être créé sous un parent qui n'est pas Approved
    // (sauf si c'est un brouillon qui sera approuvé plus tard)
  }

  // Vérifier la validation parent si validationPhase est défini
  if (doc.validationPhase && doc.parentValidationId) {
    const parentValidation = store.documents.find(d => d.id === doc.parentValidationId);
    if (parentValidation && parentValidation.status !== 'Approved') {
      throw new ComplianceError(
        `Le document de validation parent (${parentValidation.documentNumber}) doit être Approved avant de créer une phase ${doc.validationPhase}`,
        COMPLIANCE_CODES.VALIDATION_SEQUENCE_ERROR
      );
    }
  }

  const newDoc: Document = {
    ...doc,
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addDocument(newDoc);
  return newDoc;
}

/**
 * Met à jour un document avec vérification des règles métier.
 * - Bloque la modification si le document est Approved (DOCUMENT_LOCKED)
 * - Seul le changement de statut est autorisé pour un document Approved
 */
export function updateDocument(
  id: string,
  updates: Partial<Document>,
  allowStatusChangeOnly: boolean = false
): Document {
  const store = useQMSStore.getState();
  const existing = store.documents.find(d => d.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Document ${id} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Si le document est Approved, seuls certains changements sont autorisés
  if (existing.status === 'Approved' && !allowStatusChangeOnly) {
    // Autoriser uniquement les changements de statut (Obsolete) et de dates
    const allowedFields: (keyof Document)[] = ['status', 'expirationDate', 'updatedAt', 'nextReview'];
    const disallowedFields = Object.keys(updates).filter(
      key => !allowedFields.includes(key as keyof Document)
    );

    if (disallowedFields.length > 0) {
      throw new ComplianceError(
        `Document ${existing.documentNumber} est verrouillé (Approved). Les champs suivants ne peuvent pas être modifiés: ${disallowedFields.join(', ')}`,
        COMPLIANCE_CODES.DOCUMENT_LOCKED
      );
    }
  }

  store.updateDocument(id, updates);

  const updated = useQMSStore.getState().documents.find(d => d.id === id);
  return updated!;
}

/**
 * Suppression douce (soft delete) — passe le statut à Obsolete.
 * Ne supprime JAMAIS physiquement l'enregistrement (spec §5.2).
 */
export function softDeleteDocument(id: string, reason?: string): Document {
  const store = useQMSStore.getState();
  const existing = store.documents.find(d => d.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Document ${id} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (existing.status === 'Obsolete') {
    throw new ComplianceError(
      `Document ${existing.documentNumber} est déjà Obsolete`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  // Vérifier s'il y a des documents enfants actifs
  const activeChildren = store.documents.filter(
    d => d.parentDocumentId === id && d.status !== 'Obsolete'
  );
  if (activeChildren.length > 0) {
    throw new ComplianceError(
      `Impossible de rendre le document ${existing.documentNumber} Obsolete: ${activeChildren.length} document(s) enfant(s) actif(s)`,
      COMPLIANCE_CODES.DOCUMENT_LOCKED
    );
  }

  return updateDocument(id, {
    status: 'Obsolete',
    description: reason ? `${existing.description || ''}\n[Obsolète: ${reason}]` : existing.description,
  }, true);
}

// ============================================================================
// Document Signing & Approval (21 CFR Part 11)
// ============================================================================

/**
 * Signe un document électroniquement.
 * - Vérifie la séquence IQ→OQ→PQ si validationPhase est défini
 * - Génère un hash de signature
 * - Enregistre la signature électronique
 */
export function signDocument(
  documentId: string,
  signerId: string,
  signerName: string,
  signerRole: string,
  signatureType: SignatureType,
  reason?: string
): ElectronicSignature {
  const store = useQMSStore.getState();
  const doc = store.documents.find(d => d.id === documentId);

  if (!doc) {
    throw new ComplianceError(
      `Document ${documentId} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Validation de la séquence IQ→OQ→PQ (spec §5.2)
  if (doc.validationPhase && signatureType === 'approval') {
    validateValidationSequence(doc);
  }

  // Vérification des transitions de statut valides
  validateStatusTransition(doc.status, signatureType);

  // Générer le hash de signature (SHA-256 simulé pour démo)
  const signatureHash = store.generateSignatureHash(signerId, documentId, signatureType);

  const signature: ElectronicSignature = {
    id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    documentId,
    signedById: signerId,
    signerName,
    signerRole,
    signatureType,
    signatureHash,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    revoked: false,
    createdAt: new Date().toISOString(),
  };

  // Mettre à jour le statut du document selon le type de signature
  let newStatus: DocumentStatus = doc.status;
  switch (signatureType) {
    case 'approval':
      if (doc.status === 'In Review') {
        newStatus = 'Approved';
      }
      break;
    case 'rejection':
      if (doc.status === 'In Review') {
        newStatus = 'Draft';
      }
      break;
    case 'review':
      if (doc.status === 'Draft') {
        newStatus = 'In Review';
      }
      break;
    case 'verification':
      // Verification ne change pas le statut
      break;
  }

  // Mettre à jour le document
  const updates: Partial<Document> = {};
  if (newStatus !== doc.status) {
    updates.status = newStatus;
  }
  if (newStatus === 'Approved') {
    updates.effectiveDate = new Date().toISOString().split('T')[0];
  }

  if (Object.keys(updates).length > 0) {
    store.updateDocument(documentId, updates);
  }

  // Logger l'audit trail
  store.logAudit('SIGN', 'Document', documentId,
    { status: doc.status },
    { status: newStatus, signatureType, signerName, signatureHash }
  );

  if (signatureType === 'approval' && newStatus === 'Approved') {
    store.logAudit('APPROVE', 'Document', documentId,
      { status: doc.status },
      { status: 'Approved', approvedBy: signerName }
    );
  }

  return signature;
}

/**
 * Valide la séquence IQ→OQ→PQ pour les documents de validation.
 * Règle : IQ doit être Approved avant OQ, OQ avant PQ (spec §5.2)
 */
function validateValidationSequence(doc: Document): void {
  const store = useQMSStore.getState();

  if (!doc.validationPhase || !doc.parentValidationId) return;

  const parentDoc = store.documents.find(d => d.id === doc.parentValidationId);
  if (!parentDoc) return;

  // Séquence : IQ → OQ → PQ
  const phaseOrder: ValidationPhase[] = ['IQ', 'OQ', 'PQ'];
  const currentPhaseIndex = phaseOrder.indexOf(doc.validationPhase);

  if (currentPhaseIndex <= 0) return; // IQ est la première phase, pas de prérequis

  // Vérifier que la phase précédente est Approved
  const requiredPreviousPhase = phaseOrder[currentPhaseIndex - 1];

  if (parentDoc.validationPhase === requiredPreviousPhase && parentDoc.status !== 'Approved') {
    throw new ComplianceError(
      `Séquence de validation non respectée: la phase ${requiredPreviousPhase} du document parent (${parentDoc.documentNumber}) doit être Approved avant de signer la phase ${doc.validationPhase}`,
      COMPLIANCE_CODES.VALIDATION_SEQUENCE_ERROR
    );
  }

  // Vérifier aussi les documents frères (mêmes parentValidationId)
  const siblingPhases = store.documents.filter(
    d => d.parentValidationId === doc.parentValidationId && d.id !== doc.id && d.validationPhase
  );

  for (const sibling of siblingPhases) {
    const siblingPhaseIndex = phaseOrder.indexOf(sibling.validationPhase!);
    if (siblingPhaseIndex === currentPhaseIndex - 1 && sibling.status !== 'Approved') {
      throw new ComplianceError(
        `Séquence de validation non respectée: ${sibling.documentNumber} (${sibling.validationPhase}) doit être Approved avant de signer ${doc.documentNumber} (${doc.validationPhase})`,
        COMPLIANCE_CODES.VALIDATION_SEQUENCE_ERROR
      );
    }
  }
}

/**
 * Valide les transitions de statut autorisées pour un document.
 */
function validateStatusTransition(currentStatus: DocumentStatus, signatureType: SignatureType): void {
  const validTransitions: Record<DocumentStatus, SignatureType[]> = {
    'Draft': ['review', 'approval'],           // Draft → In Review ou direct Approved
    'In Review': ['approval', 'rejection'],    // In Review → Approved ou Draft
    'Approved': ['verification'],               // Approved → vérification uniquement
    'Obsolete': [],                              // Obsolete → aucune action possible
  };

  const allowed = validTransitions[currentStatus];
  if (!allowed.includes(signatureType)) {
    throw new ComplianceError(
      `Transition invalide: impossible de signer avec "${signatureType}" un document en statut "${currentStatus}"`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }
}

// ============================================================================
// Document Hierarchy
// ============================================================================

export interface HierarchyNode {
  document: Document;
  children: HierarchyNode[];
  level: number;
}

/**
 * Construit l'arbre hiérarchique des documents.
 * Utilise buildTree(docs, parentId=null) récursif côté client (spec §5.2)
 */
export function buildHierarchyTree(documents?: Document[]): HierarchyNode[] {
  const store = useQMSStore.getState();
  const docs = documents || store.documents;

  const buildTree = (parentId: string | null | undefined, level: number): HierarchyNode[] => {
    return docs
      .filter(d => (parentId ? d.parentDocumentId === parentId : !d.parentDocumentId))
      .map(doc => ({
        document: doc,
        children: buildTree(doc.id, level + 1),
        level,
      }))
      .sort((a, b) => a.document.documentNumber.localeCompare(b.document.documentNumber));
  };

  return buildTree(null, 1);
}

/**
 * Récupère tous les documents enfants d'un document (récursif).
 */
export function getDocumentDescendants(parentId: string): Document[] {
  const store = useQMSStore.getState();
  const children = store.documents.filter(d => d.parentDocumentId === parentId);
  const descendants: Document[] = [...children];

  for (const child of children) {
    descendants.push(...getDocumentDescendants(child.id));
  }

  return descendants;
}

/**
 * Récupère tous les documents ancêtres d'un document (récursif vers le haut).
 */
export function getDocumentAncestors(documentId: string): Document[] {
  const store = useQMSStore.getState();
  const ancestors: Document[] = [];
  let current: Document | undefined = store.documents.find(d => d.id === documentId);

  while (current?.parentDocumentId) {
    const parent = store.documents.find(d => d.id === current!.parentDocumentId);
    if (!parent) break;
    ancestors.push(parent);
    current = parent;
  }

  return ancestors;
}

/**
 * Détecte les alertes de blocage : enregistrements actifs liés à un document Obsolete.
 * (Spec §6.3 — CascadeAlerts)
 */
export function detectCascadeAlerts(): Array<{
  document: Document;
  blockingRecords: Array<{ type: string; id: string; number: string; title: string }>;
  recommendedAction: string;
}> {
  const store = useQMSStore.getState();
  const alerts: Array<{
    document: Document;
    blockingRecords: Array<{ type: string; id: string; number: string; title: string }>;
    recommendedAction: string;
  }> = [];

  // Trouver les documents Obsolete ou Draft qui ont des enfants actifs
  const problematicDocs = store.documents.filter(
    d => d.status === 'Obsolete' || d.status === 'Draft'
  );

  for (const doc of problematicDocs) {
    const blockingRecords: Array<{ type: string; id: string; number: string; title: string }> = [];

    // Vérifier les CAPA liées
    store.capas
      .filter(c => c.linkedDocumentId === doc.id && c.status !== 'Closed')
      .forEach(c => blockingRecords.push({ type: 'CAPA', id: c.id, number: c.capaNumber, title: c.title }));

    // Vérifier les NCR liées
    store.ncrs
      .filter(n => n.linkedProcedureRef === doc.id && n.status !== 'Closed')
      .forEach(n => blockingRecords.push({ type: 'NCR', id: n.id, number: n.ncrNumber, title: n.title }));

    // Vérifier les documents enfants actifs
    const activeChildren = store.documents.filter(
      d => d.parentDocumentId === doc.id && d.status !== 'Obsolete'
    );
    activeChildren.forEach(c => blockingRecords.push({ type: 'Document', id: c.id, number: c.documentNumber, title: c.title }));

    if (blockingRecords.length > 0) {
      alerts.push({
        document: doc,
        blockingRecords,
        recommendedAction: doc.status === 'Obsolete'
          ? `Mettre à jour ou créer une nouvelle version du document ${doc.documentNumber} pour remplacer la version Obsolete`
          : `Finaliser l'approbation du document ${doc.documentNumber} avant de poursuivre les enregistrements liés`,
      });
    }
  }

  return alerts;
}

/**
 * Récupère les documents Approved d'un type donné.
 * Utilisé pour les dropdowns et les vérifications de prérequis.
 */
export function getApprovedDocuments(docType?: string): Document[] {
  const store = useQMSStore.getState();
  let docs = store.documents.filter(d => d.status === 'Approved');

  if (docType) {
    docs = docs.filter(d => d.type === docType);
  }

  return docs.sort((a, b) => a.documentNumber.localeCompare(b.documentNumber));
}

/**
 * Vérifie si un document peut être édité par un utilisateur avec un rôle donné.
 */
export function canEditDocument(documentStatus: DocumentStatus, userRole: string): boolean {
  // Un document Approved ne peut pas être édité (sauf pour changement de statut)
  if (documentStatus === 'Approved') return false;
  // Un document Obsolete ne peut pas être édité
  if (documentStatus === 'Obsolete') return false;
  // Seuls admin, quality_manager et document_controller peuvent éditer
  return ['admin', 'quality_manager', 'document_controller'].includes(userRole);
}
