// domains/ncr/types.ts — NCR domain type definitions
// Re-exports from @/types/qms and adds domain-specific types

export type {
  NonConformance,
  NcrType,
  NcrStatus,
  NcrSeverity,
  NcrDisposition,
} from '@/qms/types/qms';

// Domain-specific types

export interface NcrFilterOptions {
  type?: string;
  status?: string;
  severity?: string;
  assignedTo?: string;
  isOosOot?: boolean;
  searchQuery?: string;
}

export interface NcrDashboardStats {
  total: number;
  open: number;
  closed: number;
  overdue: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}
