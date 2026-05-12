// profileService.ts — User Profile service
// Manages user profile lifecycle: creation, role assignment, updates
// Business rules: role validation, email uniqueness

import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { Profile, UserRole } from '@/types/qms';
import { isUserRole } from '@/types/qms';

// ============================================================================
// Profile CRUD Operations
// ============================================================================

/**
 * Creates a new user profile.
 * - Validates email uniqueness
 * - Validates role
 * - Logs explicit audit trail
 */
export function createProfile(profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>): Profile {
  const store = useQMSStore.getState();

  // Verify unique email
  const existing = store.profiles.find(p => p.email === profile.email);
  if (existing) {
    throw new ComplianceError(
      `A profile with email ${profile.email} already exists`,
      COMPLIANCE_CODES.DUPLICATE_RECORD
    );
  }

  // Validate role
  if (!isUserRole(profile.role)) {
    throw new ComplianceError(
      `Invalid role: ${profile.role}`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  const newProfile: Profile = {
    ...profile,
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addProfile(newProfile);

  // Explicit audit trail logging
  store.logAudit('CREATE', 'Profile', newProfile.id, undefined, {
    email: newProfile.email,
    fullName: newProfile.fullName,
    role: newProfile.role,
    department: newProfile.department,
  });

  return newProfile;
}

/**
 * Updates a user profile with business rule validation.
 * - Validates role if changing
 * - Logs explicit audit trail with old/new values
 */
export function updateProfile(id: string, updates: Partial<Profile>): Profile {
  const store = useQMSStore.getState();
  const existing = store.profiles.find(p => p.id === id);

  if (!existing) {
    throw new ComplianceError(
      `Profile ${id} not found`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Validate role if changing
  if (updates.role && !isUserRole(updates.role)) {
    throw new ComplianceError(
      `Invalid role: ${updates.role}`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Validate email uniqueness if changing
  if (updates.email && updates.email !== existing.email) {
    const duplicate = store.profiles.find(p => p.email === updates.email && p.id !== id);
    if (duplicate) {
      throw new ComplianceError(
        `A profile with email ${updates.email} already exists`,
        COMPLIANCE_CODES.DUPLICATE_RECORD
      );
    }
  }

  // Capture old values before update
  const oldValues = { ...existing };

  store.updateProfile(id, updates);

  // Explicit audit trail logging with full old/new context
  store.logAudit('UPDATE', 'Profile', id, oldValues, updates);

  const updated = useQMSStore.getState().profiles.find(p => p.id === id);
  if (!updated) {
    throw new ComplianceError('ENTITY_NOT_FOUND', 'Profile not found after update');
  }
  return updated;
}

/**
 * Gets a profile by ID.
 */
export function getProfile(id: string): Profile | undefined {
  const store = useQMSStore.getState();
  return store.profiles.find(p => p.id === id);
}

/**
 * Gets all profiles, optionally filtered by organization.
 * Note: Profile type does not have organizationId, so this returns
 * all profiles. Organization filtering is handled at the application layer.
 */
export function getAllProfiles(organizationId?: string): Profile[] {
  const store = useQMSStore.getState();
  // Profile type doesn't have organizationId field
  // Return all profiles; org filtering is handled elsewhere
  return store.profiles;
}
