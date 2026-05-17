// domains/training/types.ts — Training domain type definitions
// Re-exports from @/types/qms and adds domain-specific types

export type {
  Training,
  TrainingType,
  TrainingStatus,
} from '@/types/qms';

// Domain-specific types

export interface TrainingFilterOptions {
  type?: string;
  status?: string;
  assignedTo?: string;
  searchQuery?: string;
}

export interface TrainingDashboardStats {
  total: number;
  completed: number;
  overdue: number;
  inProgress: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}
