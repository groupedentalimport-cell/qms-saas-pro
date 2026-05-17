// domains/capa/hooks.ts — CAPA domain React hooks
// Provides typed access to CAPA data through the Zustand demo-store

import { useQMSStore } from '@/qms/lib/demo-store';
import type { CapaStatus } from '@/qms/types/qms';

/**
 * Returns all CAPAs from the store.
 */
export function useCapas() {
  const capas = useQMSStore(state => state.capas);
  return { capas, isLoading: false };
}

/**
 * Returns a single CAPA by ID.
 */
export function useCapa(id: string) {
  const capa = useQMSStore(state => state.capas.find(c => c.id === id));
  return { capa, isLoading: false };
}

/**
 * Returns only open (non-closed) CAPAs.
 * "Open" includes statuses: Open, Investigation, Implementation, Effectiveness Check
 */
export function useOpenCapas() {
  const openStatuses: CapaStatus[] = ['Open', 'Investigation', 'Implementation', 'Effectiveness Check'];
  const capas = useQMSStore(state =>
    state.capas.filter(c => openStatuses.includes(c.status)),
  );
  return { capas, isLoading: false };
}
