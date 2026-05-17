// domains/deviation/types.ts — Deviation domain type definitions
// Re-exports from @/types/qms and adds domain-specific types

export type {
  Deviation,
  DeviationType,
  DeviationStatus,
  DeviationSeverity,
  DeviationCategory,
} from '@/types/qms';

// Domain-specific types

export interface DeviationFilterOptions {
  deviationType?: string;
  status?: string;
  severity?: string;
  category?: string;
  assignedTo?: string;
  searchQuery?: string;
}

export interface DeviationDashboardStats {
  total: number;
  open: number;
  closed: number;
  overdue: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
}
