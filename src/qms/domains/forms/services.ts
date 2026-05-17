// domains/forms/services.ts — Forms domain service re-exports
// Re-exports from the existing formService module

export {
  createFormTemplate,
  deactivateTemplate,
  createFormInstance,
  submitFormInstance,
  approveFormInstance,
  rejectFormInstance,
  updateFormInstanceValues,
} from '@/qms/services/formService';
