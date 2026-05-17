// domains/risk/types.ts — Risk domain type definitions
// Re-exports from @/types/qms and adds domain-specific types

export type {
  Risk,
  RiskCategory,
  RiskLevel,
  RiskStatus,
} from '@/qms/types/qms';

// Domain-specific types

export interface RiskFilterOptions {
  category?: string;
  status?: string;
  riskLevel?: string;
  assignedTo?: string;
  searchQuery?: string;
}

export interface RiskDashboardStats {
  total: number;
  open: number;
  mitigated: number;
  closed: number;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
}
