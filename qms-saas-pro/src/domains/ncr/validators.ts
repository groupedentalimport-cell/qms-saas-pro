// domains/ncr/validators.ts — NCR domain validation re-exports
// Re-exports from the centralized validation rules module

export {
  validateNcr,
  validateNcrStatusTransition,
  validateNcrPhase1Conclusion,
  validateNcrPhase2Conclusion,
  enforceValidation,
} from '@/services/compliance/validationRules';

export type { ValidationResult } from '@/services/compliance/validationRules';
