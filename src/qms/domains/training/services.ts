// domains/training/services.ts — Training domain service re-exports
// Re-exports from the existing trainingService module

export {
  createTraining,
  updateTraining,
  startTraining,
  completeTraining,
  getTrainingOrgSettings,
  refreshOverdueStatuses,
} from '@/qms/services/trainingService';
