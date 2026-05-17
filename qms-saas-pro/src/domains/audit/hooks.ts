// domains/audit/hooks.ts — Audit domain React hooks
// Provides typed access to Audit data through the Zustand demo-store

import { useQMSStore } from '@/lib/demo-store';
import type { AuditStatus } from '@/types/qms';

/**
 * Returns all audits from the store.
 */
export function useAudits() {
  const audits = useQMSStore(state => state.audits);
  return { audits, isLoading: false };
}

/**
 * Returns a single audit by ID.
 */
export function useAudit(id: string) {
  const audit = useQMSStore(state => state.audits.find(a => a.id === id));
  return { audit, isLoading: false };
}

/**
 * Returns only open (non-completed) audits.
 * "Open" includes statuses: Scheduled, In Progress, Pending Report
 */
export function useOpenAudits() {
  const openStatuses: AuditStatus[] = ['Planned', 'In Progress'];
  const audits = useQMSStore(state =>
    state.audits.filter(a => openStatuses.includes(a.status)),
  );
  return { audits, isLoading: false };
}
