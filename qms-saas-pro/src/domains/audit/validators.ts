// domains/audit/validators.ts — Audit domain validation re-exports
// Re-exports from the centralized validation rules module

export {
  validateDocumentStatusTransition,
  enforceValidation,
} from '@/services/compliance/validationRules';

export type { ValidationResult } from '@/services/compliance/validationRules';
