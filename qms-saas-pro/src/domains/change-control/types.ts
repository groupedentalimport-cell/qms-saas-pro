// domains/change-control/types.ts — Change Control domain type definitions
// Re-exports from @/types/qms and adds domain-specific types

export type {
  ChangeControl,
  ChangeControlType,
  ChangeControlStatus,
  ChangeControlPriority,
  ChangeControlCategory,
} from '@/types/qms';

// Domain-specific types

export interface ChangeControlFilterOptions {
  type?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  searchQuery?: string;
}

export interface ChangeControlDashboardStats {
  total: number;
  open: number;
  completed: number;
  overdue: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
}
