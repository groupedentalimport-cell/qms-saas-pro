// domains/deviation/hooks.ts — Deviation domain React hooks
// Provides typed access to Deviation data through the Zustand demo-store

import { useQMSStore } from '@/lib/demo-store';
import type { DeviationStatus } from '@/types/qms';

/**
 * Returns all deviations from the store.
 */
export function useDeviations() {
  const deviations = useQMSStore(state => state.deviations);
  return { deviations, isLoading: false };
}

/**
 * Returns a single deviation by ID.
 */
export function useDeviation(id: string) {
  const deviation = useQMSStore(state => state.deviations.find(d => d.id === id));
  return { deviation, isLoading: false };
}

/**
 * Returns only open (non-closed) deviations.
 * "Open" includes statuses: Open, Under Investigation, Pending QA Review, Approved
 */
export function useOpenDeviations() {
  const openStatuses: DeviationStatus[] = ['Open', 'Under Investigation', 'Pending QA Review', 'Approved'];
  const deviations = useQMSStore(state =>
    state.deviations.filter(d => openStatuses.includes(d.status)),
  );
  return { deviations, isLoading: false };
}
