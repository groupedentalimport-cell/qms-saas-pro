// domains/suppliers/validators.ts — Supplier domain validation re-exports
// Re-exports from the centralized validation rules module

export {
  validateSupplier,
  validateSupplierStatusTransition,
  validateSupplierForQualification,
  enforceValidation,
} from '@/services/compliance/validationRules';

export type { ValidationResult } from '@/services/compliance/validationRules';
