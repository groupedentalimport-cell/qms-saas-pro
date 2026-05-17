// domains/risk/validators.ts — Risk domain validation re-exports
// Re-exports from the centralized validation rules module

export {
  validateDocumentStatusTransition,
  enforceValidation,
} from '@/qms/services/compliance/validationRules';

export type { ValidationResult } from '@/qms/services/compliance/validationRules';
