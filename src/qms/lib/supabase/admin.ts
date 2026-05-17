import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

/**
 * Creates a Supabase admin client with the service role key.
 *
 * SECURITY: The service role key BYPASSES Row Level Security (RLS).
 * It MUST only be used in server-side code (API routes, Server Components, Server Actions).
 * The env var is named SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix)
 * so Next.js does NOT expose it to the browser bundle.
 */
export function createAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Server-only: no NEXT_PUBLIC_ prefix — never exposed to the browser
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Supabase admin environment variables are not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return adminClient;
}
