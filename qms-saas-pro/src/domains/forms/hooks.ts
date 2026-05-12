// domains/forms/hooks.ts — Forms domain React hooks
// Provides typed access to form template and instance data through the Zustand demo-store

import { useQMSStore } from '@/lib/demo-store';

/**
 * Returns all form templates from the store.
 */
export function useFormTemplates() {
  const formTemplates = useQMSStore(state => state.formTemplates);
  return { formTemplates, isLoading: false };
}

/**
 * Returns all form instances from the store.
 */
export function useFormInstances() {
  const formInstances = useQMSStore(state => state.formInstances);
  return { formInstances, isLoading: false };
}
