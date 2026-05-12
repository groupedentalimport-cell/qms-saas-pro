// domains/ncr/hooks.ts — NCR domain React hooks
// Provides typed access to Non-Conformance data through the Zustand demo-store

import { useQMSStore } from '@/lib/demo-store';
import type { NcrStatus } from '@/types/qms';

/**
 * Returns all NCRs from the store.
 */
export function useNcrs() {
  const ncrs = useQMSStore(state => state.ncrs);
  return { ncrs, isLoading: false };
}

/**
 * Returns a single NCR by ID.
 */
export function useNcr(id: string) {
  const ncr = useQMSStore(state => state.ncrs.find(n => n.id === id));
  return { ncr, isLoading: false };
}

/**
 * Returns only open (non-closed) NCRs.
 * "Open" includes statuses: Open, Under Investigation, Pending Disposition
 */
export function useOpenNcrs() {
  const openStatuses: NcrStatus[] = ['Open', 'Under Investigation', 'Pending Disposition'];
  const ncrs = useQMSStore(state =>
    state.ncrs.filter(n => openStatuses.includes(n.status)),
  );
  return { ncrs, isLoading: false };
}
