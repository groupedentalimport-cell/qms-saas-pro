// domains/batch/types.ts — Batch Record domain type definitions
// Re-exports from @/types/qms and adds domain-specific types

export type {
  BatchRecord,
  BatchStatus,
  BatchStep,
  BatchStepStatus,
} from '@/types/qms';

// Domain-specific types

export interface BatchFilterOptions {
  status?: string;
  productName?: string;
  lotNumber?: string;
  isLocked?: boolean;
  searchQuery?: string;
}

export interface BatchDashboardStats {
  total: number;
  inProgress: number;
  pendingQaReview: number;
  released: number;
  rejected: number;
  quarantine: number;
}
