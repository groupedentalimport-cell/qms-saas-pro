// domains/risk/hooks.ts — Risk domain React hooks
// Provides typed access to Risk data through the Zustand demo-store

import { useQMSStore } from '@/qms/lib/demo-store';
import type { RiskStatus } from '@/qms/types/qms';

/**
 * Returns all risks from the store.
 */
export function useRisks() {
  const risks = useQMSStore(state => state.risks);
  return { risks, isLoading: false };
}

/**
 * Returns a single risk by ID.
 */
export function useRisk(id: string) {
  const risk = useQMSStore(state => state.risks.find(r => r.id === id));
  return { risk, isLoading: false };
}

/**
 * Returns only open (non-closed) risks.
 * "Open" includes statuses: Open, Under Assessment, Mitigation Planned
 */
export function useOpenRisks() {
  const openStatuses: RiskStatus[] = ['Open', 'Mitigated', 'Accepted'];
  const risks = useQMSStore(state =>
    state.risks.filter(r => openStatuses.includes(r.status)),
  );
  return { risks, isLoading: false };
}
