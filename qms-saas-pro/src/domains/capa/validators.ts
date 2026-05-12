// domains/capa/validators.ts — CAPA domain validation re-exports
// Re-exports from the centralized validation rules module

export {
  validateCapa,
  validateCapaStatusTransition,
  enforceValidation,
} from '@/services/compliance/validationRules';

export type { ValidationResult } from '@/services/compliance/validationRules';
