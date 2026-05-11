import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let browserClient: ReturnType<typeof createClient> | null = null;

export function createBrowserClient() {
  if (browserClient) return browserClient;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured');
  }
  browserClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

// Default export for backward compatibility
export default createBrowserClient;
