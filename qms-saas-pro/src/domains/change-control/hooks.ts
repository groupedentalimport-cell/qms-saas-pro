// domains/change-control/hooks.ts — Change Control domain React hooks
// Provides typed access to Change Control data through the Zustand demo-store

import { useQMSStore } from '@/lib/demo-store';
import type { ChangeControlStatus } from '@/types/qms';

/**
 * Returns all change controls from the store.
 */
export function useChangeControls() {
  const changeControls = useQMSStore(state => state.changeControls);
  return { changeControls, isLoading: false };
}

/**
 * Returns a single change control by ID.
 */
export function useChangeControl(id: string) {
  const changeControl = useQMSStore(state => state.changeControls.find(cc => cc.id === id));
  return { changeControl, isLoading: false };
}

/**
 * Returns only open (non-completed) change controls.
 * "Open" includes statuses: Draft, Pending Approval, Approved, In Implementation
 */
export function useOpenChangeControls() {
  const openStatuses: ChangeControlStatus[] = ['Requested', 'Under Review', 'Approved', 'In Implementation'];
  const changeControls = useQMSStore(state =>
    state.changeControls.filter(cc => openStatuses.includes(cc.status)),
  );
  return { changeControls, isLoading: false };
}
