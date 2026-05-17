// domains/batch/hooks.ts — Batch Record domain React hooks
// Provides typed access to batch record data through the Zustand demo-store

import { useQMSStore } from '@/qms/lib/demo-store';

/**
 * Returns all batch records from the store.
 */
export function useBatchRecords() {
  const batchRecords = useQMSStore(state => state.batchRecords);
  return { batchRecords, isLoading: false };
}

/**
 * Returns a single batch record by ID.
 */
export function useBatchRecord(id: string) {
  const batchRecord = useQMSStore(state => state.batchRecords.find(b => b.id === id));
  return { batchRecord, isLoading: false };
}
