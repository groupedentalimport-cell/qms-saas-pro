// domains/documents/validators.ts — Document domain validation re-exports
// Re-exports from the centralized validation rules module

export {
  validateDocument,
  validateDocumentStatusTransition,
  validateDocumentForApproval,
  enforceValidation,
} from '@/qms/services/compliance/validationRules';

export type { ValidationResult } from '@/qms/services/compliance/validationRules';
