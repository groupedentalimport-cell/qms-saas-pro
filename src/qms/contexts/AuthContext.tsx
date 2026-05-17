'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Profile, UserRole, Permission } from '@/qms/types/qms';
import { rolePermissions } from '@/qms/types/qms';
import { useQMSStore } from '@/qms/lib/demo-store';

interface AuthContextType {
  currentUser: Profile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  switchUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo password for all accounts — in production, Supabase Auth handles this
const DEMO_PASSWORD = 'demo';

// Initialize demo user from mock data directly
function getInitialUser(profiles: Profile[]): Profile | null {
  return profiles.find(p => p.email === 'admin@qms-demo.com') || null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const profiles = useQMSStore(state => state.profiles);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loggedOut, setLoggedOut] = useState(false);

  // Compute current user from store
  const currentUser = useMemo(() => {
    if (loggedOut) return null;
    if (selectedUserId) {
      return profiles.find(p => p.id === selectedUserId) || null;
    }
    return getInitialUser(profiles);
  }, [profiles, selectedUserId, loggedOut]);

  const isAuthenticated = currentUser !== null;

  /**
   * Login with email and password verification.
   *
   * In production mode (Supabase configured): delegates to Supabase Auth
   * for real credential verification.
   *
   * In demo mode: verifies against the known demo password ("demo")
   * to simulate authentication flow.
   */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Production mode: use Supabase Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey &&
        !supabaseUrl.includes('your-project') &&
        !supabaseKey.includes('your-')) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return false;
      } catch {
        return false;
      }
    } else {
      // Demo mode: verify password is "demo"
      if (password !== DEMO_PASSWORD) return false;
    }

    const user = profiles.find(p => p.email === email);
    if (user) {
      setSelectedUserId(user.id);
      setLoggedOut(false);
      return true;
    }
    return false;
  }, [profiles]);

  const logout = useCallback(() => {
    setSelectedUserId(null);
    setLoggedOut(true);
  }, []);

  const hasPermission = useCallback((permission: Permission) => {
    if (!currentUser) return false;
    const permissions = rolePermissions[currentUser.role] || [];
    return permissions.includes(permission);
  }, [currentUser]);

  const hasRole = useCallback((role: UserRole) => {
    if (!currentUser) return false;
    return currentUser.role === role;
  }, [currentUser]);

  const switchUser = useCallback((userId: string) => {
    const user = profiles.find(p => p.id === userId);
    if (user) {
      setSelectedUserId(user.id);
      setLoggedOut(false);
    }
  }, [profiles]);

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, login, logout, hasPermission, hasRole, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
