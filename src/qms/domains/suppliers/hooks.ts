// domains/suppliers/hooks.ts — Supplier domain React hooks
// Provides typed access to supplier data through the Zustand demo-store

import { useQMSStore } from '@/qms/lib/demo-store';

/**
 * Returns all suppliers from the store.
 */
export function useSuppliers() {
  const suppliers = useQMSStore(state => state.suppliers);
  return { suppliers, isLoading: false };
}

/**
 * Returns a single supplier by ID.
 */
export function useSupplier(id: string) {
  const supplier = useQMSStore(state => state.suppliers.find(s => s.id === id));
  return { supplier, isLoading: false };
}
