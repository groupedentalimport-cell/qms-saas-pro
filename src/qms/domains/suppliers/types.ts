// domains/suppliers/types.ts — Supplier domain type definitions
// Re-exports from @/types/qms and adds domain-specific types

export type {
  Supplier,
  SupplierCategory,
  SupplierStatus,
} from '@/qms/types/qms';

// Domain-specific types

export interface SupplierFilterOptions {
  category?: string;
  status?: string;
  searchQuery?: string;
}

export interface SupplierDashboardStats {
  total: number;
  qualified: number;
  conditional: number;
  disqualified: number;
  underEvaluation: number;
  averagePerformanceScore: number;
}

export interface SupplierRating {
  rating: 'A' | 'B' | 'C' | 'D';
  label: string;
  color: string;
}
