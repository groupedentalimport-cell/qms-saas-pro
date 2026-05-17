// data-access.ts — Transitional adapter layer for data source resolution
// Services should import from this module instead of directly from @/lib/demo-store
// In demo mode: returns the Zustand store methods (current behavior)
// In Supabase mode: would return IDataProvider methods (future)
// This enables incremental migration from direct store access to IDataProvider

import { useQMSStore } from '@/qms/lib/demo-store';
import { getDataProvider } from '@/qms/demo/providerRegistry';
import { isSupabaseConfigured } from '@/qms/lib/supabase/mode';
import type { IDataProvider } from '@/qms/demo/IDataProvider';

// ============================================================================
// Mode Detection
// ============================================================================

function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}

// ============================================================================
// Provider Resolution
// ============================================================================

/**
 * Returns the active data provider instance.
 * - Demo mode: returns the IDataProvider backed by Zustand (DemoProvider)
 * - Supabase mode: returns the IDataProvider backed by Supabase (SupabaseProvider)
 *
 * Use this when you want to access data through the IDataProvider interface.
 */
export function resolveDataProvider(): IDataProvider {
  return getDataProvider();
}

/**
 * Returns whether the application is running in demo mode.
 */
export function isDemoDataMode(): boolean {
  return isDemoMode();
}

/**
 * Gets the Zustand store state directly.
 * This is a convenience function for services that still need direct store access
 * during the transitional period. Prefer resolveDataProvider() for new code.
 *
 * Only available in demo mode — calling in Supabase mode will still return
 * the Zustand store, but it won't be the source of truth.
 */
export function getStore() {
  return useQMSStore.getState();
}
