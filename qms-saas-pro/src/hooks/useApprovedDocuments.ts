// useApprovedDocuments.ts — Hook pour les documents approuvés
// Fournit un accès simplifié aux documents Approved, filtrés par type,
// utilisés dans les dropdowns et les vérifications de prérequis

import { useMemo } from 'react';
import { useQMSStore } from '@/lib/demo-store';
import type { Document, DocumentType } from '@/types/qms';

/**
 * Hook pour obtenir tous les documents Approved.
 * Peut être filtré par type de document.
 */
export function useApprovedDocuments(docType?: DocumentType): Document[] {
  const documents = useQMSStore(state => state.documents);

  return useMemo(() => {
    let filtered = documents.filter(d => d.status === 'Approved');

    if (docType) {
      filtered = filtered.filter(d => d.type === docType);
    }

    return filtered.sort((a, b) => a.documentNumber.localeCompare(b.documentNumber));
  }, [documents, docType]);
}

/**
 * Hook pour obtenir les documents en cours de revue.
 */
export function useInReviewDocuments(docType?: DocumentType): Document[] {
  const documents = useQMSStore(state => state.documents);

  return useMemo(() => {
    let filtered = documents.filter(d => d.status === 'In Review');

    if (docType) {
      filtered = filtered.filter(d => d.type === docType);
    }

    return filtered.sort((a, b) => a.documentNumber.localeCompare(b.documentNumber));
  }, [documents, docType]);
}

/**
 * Hook pour obtenir les documents brouillon.
 */
export function useDraftDocuments(docType?: DocumentType): Document[] {
  const documents = useQMSStore(state => state.documents);

  return useMemo(() => {
    let filtered = documents.filter(d => d.status === 'Draft');

    if (docType) {
      filtered = filtered.filter(d => d.type === docType);
    }

    return filtered.sort((a, b) => a.documentNumber.localeCompare(b.documentNumber));
  }, [documents, docType]);
}

/**
 * Hook pour obtenir un document spécifique par ID.
 */
export function useDocument(documentId: string | undefined): Document | undefined {
  const documents = useQMSStore(state => state.documents);

  return useMemo(() => {
    if (!documentId) return undefined;
    return documents.find(d => d.id === documentId);
  }, [documents, documentId]);
}

/**
 * Hook pour vérifier s'il existe au moins un document Approved d'un type donné.
 * Utilisé pour les prérequis documentaires.
 */
export function useHasApprovedDocument(docType: DocumentType): boolean {
  const approvedDocs = useApprovedDocuments(docType);
  return approvedDocs.length > 0;
}
