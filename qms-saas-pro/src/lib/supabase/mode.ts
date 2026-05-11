let _isSupabaseConfigured: boolean | null = null;

export function isSupabaseConfigured(): boolean {
  if (_isSupabaseConfigured !== null) return _isSupabaseConfigured;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  _isSupabaseConfigured = !!(url && key && !url.includes('your-project') && !url.includes('localhost'));
  return _isSupabaseConfigured;
}

export function getDataSource(): 'supabase' | 'demo' {
  return isSupabaseConfigured() ? 'supabase' : 'demo';
}

export function resetModeCache(): void { _isSupabaseConfigured = null; }
