// domains/training/hooks.ts — Training domain React hooks
// Provides typed access to Training data through the Zustand demo-store

import { useQMSStore } from '@/lib/demo-store';
import type { TrainingStatus } from '@/types/qms';

/**
 * Returns all training records from the store.
 */
export function useTrainingRecords() {
  const training = useQMSStore(state => state.training);
  return { training, isLoading: false };
}

/**
 * Returns a single training record by ID.
 */
export function useTrainingRecord(id: string) {
  const trainingRecord = useQMSStore(state => state.training.find(t => t.id === id));
  return { trainingRecord, isLoading: false };
}

/**
 * Returns only overdue training records.
 */
export function useOverdueTraining() {
  const overdueStatuses: TrainingStatus[] = ['Overdue'];
  const training = useQMSStore(state =>
    state.training.filter(t => overdueStatuses.includes(t.status)),
  );
  return { training, isLoading: false };
}
