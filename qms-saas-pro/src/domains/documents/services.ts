// domains/documents/services.ts — Document domain service re-exports
// Re-exports from the existing documentService module

export {
  createDocument,
  updateDocument,
  softDeleteDocument,
  signDocument,
  buildHierarchyTree,
  getDocumentDescendants,
  getDocumentAncestors,
  detectCascadeAlerts,
  getApprovedDocuments,
  canEditDocument,
} from '@/services/documentService';

export type { HierarchyNode } from '@/services/documentService';
