// organizationService.ts — Organization service
// Manages organization and org settings updates
// Business rules: settings validation, audit trail

import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { Organization, OrgSettings } from '@/types/qms';
import { parseOrgSettings } from '@/types/qms';

// ============================================================================
// Organization Operations
// ============================================================================

/**
 * Updates an organization.
 * - Validates organization exists
 * - Logs audit trail
 */
export function updateOrganization(id: string, updates: Partial<Organization>): Organization {
  const store = useQMSStore.getState();
  const existing = store.organizations.find(o => o.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Organization ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  store.updateOrganization(id, updates);

  // Log the organization update
  store.logAudit('UPDATE', 'Organization', id,
    { name: existing.name },
    updates
  );

  const updated = useQMSStore.getState().organizations.find(o => o.id === id);
  return updated!;
}

/**
 * Updates organization settings.
 * - Validates settings structure
 * - Logs audit trail
 */
export function updateOrgSettings(orgId: string, settingsUpdates: Partial<OrgSettings>): Organization {
  const store = useQMSStore.getState();
  const existing = store.organizations.find(o => o.id === orgId);

  if (!existing) {
    throw new ComplianceError(
      `Organization ${orgId} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Get current settings
  const currentSettings = parseOrgSettings(existing.settings);
  const newSettings = { ...currentSettings, ...settingsUpdates };

  store.updateOrgSettings(orgId, settingsUpdates);

  // Log the settings update
  store.logAudit('UPDATE', 'Organization', orgId,
    currentSettings,
    newSettings
  );

  const updated = useQMSStore.getState().organizations.find(o => o.id === orgId);
  return updated!;
}

/**
 * Gets an organization by ID.
 */
export function getOrganization(id: string): Organization | undefined {
  const store = useQMSStore.getState();
  return store.organizations.find(o => o.id === id);
}

/**
 * Gets organization settings.
 */
export function getOrgSettings(orgId: string): OrgSettings | null {
  const store = useQMSStore.getState();
  return store.getOrgSettings(orgId);
}
