// providerRegistry.ts — Singleton registry that returns the correct IDataProvider
// Determines which provider to use based on environment configuration
// When Supabase environment variables are set, uses SupabaseProvider
// Otherwise, falls back to DemoProvider (Zustand in-memory store)

import type { IDataProvider } from './IDataProvider';
import { DemoProvider } from './DemoProvider';
import { SupabaseProvider } from './SupabaseProvider';

// ============================================================================
// Provider Singleton
// ============================================================================

let provider: IDataProvider | null = null;

// ============================================================================
// Public API
// ============================================================================

/**
 * Returns the active data provider instance.
 * Creates the appropriate provider on first access based on environment configuration.
 * Subsequent calls return the same cached instance.
 */
export function getDataProvider(): IDataProvider {
  if (!provider) {
    const isDemo = !isSupabaseConfigured();
    provider = isDemo ? new DemoProvider() : new SupabaseProvider();
  }
  return provider;
}

/**
 * Resets the cached provider instance.
 * Useful for testing or when switching between modes at runtime.
 */
export function resetProvider(): void {
  provider = null;
}

// ============================================================================
// Configuration Check
// ============================================================================

/**
 * Determines whether Supabase is properly configured based on environment variables.
 * Returns false if variables are missing, empty, or contain placeholder values.
 */
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return false;
  if (url.includes('your-project')) return false;
  // Allow localhost for local Supabase development/testing
  if (key.includes('your-')) return false;

  return true;
}
