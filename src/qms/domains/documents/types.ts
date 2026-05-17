// domains/documents/types.ts — Document domain type definitions
// Re-exports from @/types/qms and adds domain-specific types

import type { Document } from '@/qms/types/qms';

export type {
  Document,
  DocumentType,
  DocumentStatus,
  DocumentClassification,
  DocumentLevel,
  ValidationPhase,
  ElectronicSignature,
  SignatureType,
} from '@/qms/types/qms';

// Domain-specific types

export interface DocumentFilterOptions {
  type?: string;
  status?: string;
  owner?: string;
  department?: string;
  classification?: string;
  parentDocumentId?: string | null;
  searchQuery?: string;
}

export interface DocumentHierarchyNode {
  document: Document;
  children: DocumentHierarchyNode[];
  level: number;
}
