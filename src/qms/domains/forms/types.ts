// domains/forms/types.ts — Forms domain type definitions
// Re-exports from @/types/qms and adds domain-specific types

export type {
  FormTemplate,
  FormInstance,
  FormInstanceStatus,
  FormFieldDefinition,
} from '@/qms/types/qms';

// Domain-specific types

export interface FormFilterOptions {
  templateId?: string;
  status?: string;
  isLocked?: boolean;
  searchQuery?: string;
}

export interface FormDashboardStats {
  totalTemplates: number;
  activeTemplates: number;
  totalInstances: number;
  draftInstances: number;
  submittedInstances: number;
  approvedInstances: number;
  rejectedInstances: number;
}
