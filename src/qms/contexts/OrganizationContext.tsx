
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Organization, OrgSettings, IndustryType } from '@/qms/types/qms';
import { STANDARDS_BY_INDUSTRY, parseOrgSettings } from '@/qms/types/qms';
import { useQMSStore } from '@/qms/lib/demo-store';
import { useAuth } from './AuthContext';
import { updateOrganization as serviceUpdateOrganization, updateOrgSettings as serviceUpdateOrgSettings } from '@/qms/services/organizationService';

interface OrganizationContextType {
  currentOrg: Organization | null;
  orgSettings: OrgSettings | null;
  updateOrganization: (updates: Partial<Organization>) => void;
  updateSettings: (settings: Partial<OrgSettings>) => void;
  useOrgSettings: () => OrgSettings | null;
  useIndustry: () => IndustryType;
  useApplicableStandards: () => string[];
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const organizations = useQMSStore(state => state.organizations);

  // Get the first organization for demo mode
  const currentOrg = useMemo(() => {
    if (!currentUser) return null;
    return organizations[0] || null;
  }, [currentUser, organizations]);

  const orgSettings = useMemo(() => {
    if (!currentOrg) return null;
    return parseOrgSettings(currentOrg.settings);
  }, [currentOrg]);

  const updateOrganization = useCallback((updates: Partial<Organization>) => {
    if (currentOrg) {
      serviceUpdateOrganization(currentOrg.id, updates);
    }
  }, [currentOrg]);

  const updateSettings = useCallback((settings: Partial<OrgSettings>) => {
    if (currentOrg) {
      serviceUpdateOrgSettings(currentOrg.id, settings);
    }
  }, [currentOrg]);

  const useOrgSettingsHook = useCallback(() => orgSettings, [orgSettings]);

  const useIndustry = useCallback((): IndustryType => {
    return orgSettings?.industry_type || 'medical_device';
  }, [orgSettings]);

  const useApplicableStandards = useCallback((): string[] => {
    const industry = orgSettings?.industry_type || 'medical_device';
    return orgSettings?.applicable_standards || STANDARDS_BY_INDUSTRY[industry] || [];
  }, [orgSettings]);

  return (
    <OrganizationContext.Provider value={{
      currentOrg,
      orgSettings,
      updateOrganization,
      updateSettings,
      useOrgSettings: useOrgSettingsHook,
      useIndustry,
      useApplicableStandards,
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
