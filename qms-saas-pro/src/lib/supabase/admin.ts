import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Supabase admin environment variables are not configured');
  }
  adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return adminClient;
}
