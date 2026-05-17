'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ActiveSection } from '@/qms/types/qms';

interface NavigationContextType {
  activeSection: ActiveSection;
  navigate: (section: ActiveSection) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');

  const navigate = useCallback((section: ActiveSection) => {
    setActiveSection(section);
  }, []);

  const value = useMemo(() => ({ activeSection, navigate }), [activeSection, navigate]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
