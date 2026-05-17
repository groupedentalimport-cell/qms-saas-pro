// domains/capa/types.ts — CAPA domain type definitions
// Re-exports from @/types/qms and adds domain-specific types

export type {
  Capa,
  CapaType,
  CapaStatus,
  CapaPriority,
  CapaSource,
  RootCauseCategory,
} from '@/qms/types/qms';

// Domain-specific types

export interface CapaFilterOptions {
  type?: string;
  status?: string;
  priority?: string;
  source?: string;
  assignedTo?: string;
  searchQuery?: string;
}

export interface CapaDashboardStats {
  total: number;
  open: number;
  closed: number;
  overdue: number;
  byPriority: Record<string, number>;
  bySource: Record<string, number>;
}
