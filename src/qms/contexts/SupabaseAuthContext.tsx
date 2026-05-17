import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { Profile, UserRole, Permission } from '@/qms/types/qms';
import { rolePermissions, isUserRole, asUserRole } from '@/qms/types/qms';
import { useQMSStore } from '@/qms/lib/demo-store';

// ---------------------------------------------------------------------------
// Auth context types
// ---------------------------------------------------------------------------

interface AuthContextType {
  currentUser: Profile | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  switchUser: (userId: string) => void;
  isDemoMode: boolean;
}

const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helper: detect demo mode
// ---------------------------------------------------------------------------

/** Shape of a profile row in Supabase (snake_case) */
interface SupabaseProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  department: string | null;
  job_title: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

function getIsDemoMode(): boolean {
  if (typeof window === 'undefined') return true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !(url && key && !url.includes('your-project') && !url.includes('localhost'));
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const profiles = useQMSStore(state => state.profiles);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loggedOut, setLoggedOut] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<Profile | null>(null);

  const isDemoMode = getIsDemoMode();

  // -----------------------------------------------------------------------
  // Demo mode: derive user from Zustand store
  // -----------------------------------------------------------------------
  const demoUser = useMemo(() => {
    if (loggedOut) return null;
    if (selectedUserId) {
      return profiles.find(p => p.id === selectedUserId) || null;
    }
    return profiles.find(p => p.email === 'admin@qms-demo.com') || null;
  }, [profiles, selectedUserId, loggedOut]);

  // -----------------------------------------------------------------------
  // Supabase mode: listen to auth state changes
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (isDemoMode) return;

    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const { createBrowserClient } = await import('@/qms/lib/supabase/browser');
        const supabase = createBrowserClient();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            // Fetch profile from supabase
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (data) {
              // Type the Supabase response and map snake_case to camelCase
              const row = data as unknown as SupabaseProfileRow;
              setSupabaseUser({
                id: row.id,
                email: row.email,
                fullName: row.full_name ?? undefined,
                role: isUserRole(row.role) ? row.role : 'operator',
                department: row.department ?? undefined,
                jobTitle: row.job_title ?? undefined,
                phone: row.phone ?? undefined,
                avatarUrl: row.avatar_url ?? undefined,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
              });
            }
          } else {
            setSupabaseUser(null);
          }
        });

        unsubscribe = () => subscription.unsubscribe();
      } catch {
        // Supabase not configured — fall back to demo
      }
    })();

    return () => { unsubscribe?.(); };
  }, [isDemoMode]);

  // -----------------------------------------------------------------------
  // Current user
  // -----------------------------------------------------------------------
  const currentUser = isDemoMode ? demoUser : supabaseUser;
  const isAuthenticated = currentUser !== null;

  // -----------------------------------------------------------------------
  // Login
  // -----------------------------------------------------------------------
  const login = useCallback(async (email: string, password?: string): Promise<boolean> => {
    if (isDemoMode) {
      const user = profiles.find(p => p.email === email);
      if (user) {
        setSelectedUserId(user.id);
        setLoggedOut(false);
        return true;
      }
      return false;
    }

    // Supabase mode
    try {
      const { createBrowserClient } = await import('@/qms/lib/supabase/browser');
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password: password || '' });
      return !error;
    } catch {
      return false;
    }
  }, [isDemoMode, profiles]);

  // -----------------------------------------------------------------------
  // Logout
  // -----------------------------------------------------------------------
  const logout = useCallback(async () => {
    if (isDemoMode) {
      setSelectedUserId(null);
      setLoggedOut(true);
      return;
    }

    try {
      const { createBrowserClient } = await import('@/qms/lib/supabase/browser');
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setSupabaseUser(null);
  }, [isDemoMode]);

  // -----------------------------------------------------------------------
  // Permission & Role checks
  // -----------------------------------------------------------------------
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!currentUser) return false;
    const permissions = rolePermissions[currentUser.role] || [];
    return permissions.includes(permission);
  }, [currentUser]);

  const hasRole = useCallback((role: UserRole): boolean => {
    if (!currentUser) return false;
    return currentUser.role === role;
  }, [currentUser]);

  // -----------------------------------------------------------------------
  // Switch user (demo only)
  // -----------------------------------------------------------------------
  const switchUser = useCallback((userId: string) => {
    if (!isDemoMode) return;
    const user = profiles.find(p => p.id === userId);
    if (user) {
      setSelectedUserId(user.id);
      setLoggedOut(false);
    }
  }, [isDemoMode, profiles]);

  // -----------------------------------------------------------------------
  // Context value
  // -----------------------------------------------------------------------
  const value = useMemo(() => ({
    currentUser,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    hasRole,
    switchUser,
    isDemoMode,
  }), [currentUser, isAuthenticated, login, logout, hasPermission, hasRole, switchUser, isDemoMode]);

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}

// Backward-compatible alias
export const useAuth = useSupabaseAuth;

export default SupabaseAuthProvider;
