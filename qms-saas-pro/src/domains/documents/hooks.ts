// domains/documents/hooks.ts — Document domain React hooks
// Provides typed access to document data through the Zustand demo-store

import { useQMSStore } from '@/lib/demo-store';
import type { Document, DocumentStatus } from '@/types/qms';

/**
 * Returns all documents from the store.
 */
export function useDocuments() {
  const documents = useQMSStore(state => state.documents);
  return { documents, isLoading: false };
}

/**
 * Returns a single document by ID.
 */
export function useDocument(id: string) {
  const document = useQMSStore(state => state.documents.find(d => d.id === id));
  return { document, isLoading: false };
}

/**
 * Returns only Approved documents, optionally filtered by type.
 */
export function useApprovedDocuments(type?: string) {
  const documents = useQMSStore(state =>
    state.documents
      .filter(d => d.status === 'Approved' as DocumentStatus)
      .filter(d => !type || d.type === type)
      .sort((a, b) => a.documentNumber.localeCompare(b.documentNumber)),
  );
  return { documents, isLoading: false };
}

/**
 * Returns documents organized as a hierarchy tree.
 * Root documents (no parent) are at level 1, children are nested recursively.
 */
export function useDocumentHierarchy() {
  const documents = useQMSStore(state => state.documents);

  interface HierarchyNode {
    document: Document;
    children: HierarchyNode[];
    level: number;
  }

  const buildTree = (parentId: string | null | undefined, level: number): HierarchyNode[] => {
    return documents
      .filter(d => (parentId ? d.parentDocumentId === parentId : !d.parentDocumentId))
      .map(doc => ({
        document: doc,
        children: buildTree(doc.id, level + 1),
        level,
      }))
      .sort((a, b) => a.document.documentNumber.localeCompare(b.document.documentNumber));
  };

  const hierarchy = buildTree(null, 1);
  return { hierarchy, isLoading: false };
}
