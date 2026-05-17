// domains/forms/validators.ts — Forms domain validation re-exports
// Re-exports from the centralized validation rules module

export {
  validateFormInstance,
  validateFormInstanceNotLocked,
  enforceValidation,
} from '@/qms/services/compliance/validationRules';

export type { ValidationResult } from '@/qms/services/compliance/validationRules';
