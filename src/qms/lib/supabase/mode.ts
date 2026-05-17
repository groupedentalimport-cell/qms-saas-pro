let _isSupabaseConfigured: boolean | null = null;

export function isSupabaseConfigured(): boolean {
  if (_isSupabaseConfigured !== null) return _isSupabaseConfigured;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  _isSupabaseConfigured = !!(url && key && !url.includes('your-project') && !url.includes('localhost'));
  return _isSupabaseConfigured;
}

export function getDataSource(): 'supabase' | 'demo' {
  return isSupabaseConfigured() ? 'supabase' : 'demo';
}

export function resetModeCache(): void { _isSupabaseConfigured = null; }
