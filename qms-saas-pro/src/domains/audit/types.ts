// domains/audit/types.ts — Audit domain type definitions
// Re-exports from @/types/qms and adds domain-specific types

export type {
  Audit,
  AuditType,
  AuditStatus,
  AuditFinding,
} from '@/types/qms';

// Domain-specific types

export interface AuditFilterOptions {
  type?: string;
  status?: string;
  leadAuditor?: string;
  searchQuery?: string;
}

export interface AuditDashboardStats {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}
