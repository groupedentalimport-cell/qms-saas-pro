
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Profile, UserRole, Permission } from '@/types/qms';
import { rolePermissions } from '@/types/qms';
import { useQMSStore } from '@/lib/demo-store';

interface AuthContextType {
  currentUser: Profile | null;
  isAuthenticated: boolean;
  login: (email: string) => boolean;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  switchUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const login = useCallback((email: string) => {
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
