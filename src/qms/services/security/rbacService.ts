// rbacService.ts — Centralized Role-Based Access Control
// Provides RBAC checking, module access control, and org role management
// Integrates with AuthUser type and rolePermissions from QMS types

import type { AuthUser, UserRole, Permission, OrgRole } from '@/qms/types/auth';
import { rolePermissions, isUserRole } from '@/qms/types/qms';
import { ComplianceError, COMPLIANCE_CODES } from '@/qms/lib/errors';

// ============================================================================
// Permission Checking
// ============================================================================

/**
 * Checks if a user has a specific permission based on their role.
 * Returns false for null/undefined users.
 */
export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
  if (!user) return false;
  const permissions = rolePermissions[user.role] || [];
  return permissions.includes(permission);
}

/**
 * Requires a specific permission — throws ComplianceError if not granted.
 * Also throws if the user is null (not authenticated).
 */
export function requirePermission(user: AuthUser | null, permission: Permission): void {
  if (!user) {
    throw new ComplianceError(
      `Authentication required: ${permission}`,
      COMPLIANCE_CODES.INSUFFICIENT_PERMISSIONS
    );
  }

  if (!hasPermission(user, permission)) {
    throw new ComplianceError(
      `Permission denied: ${permission} (role: ${user.role})`,
      COMPLIANCE_CODES.INSUFFICIENT_PERMISSIONS
    );
  }
}

// ============================================================================
// Module Access Control
// ============================================================================

const CORE_MODULES = ['documents', 'capa', 'ncr', 'audits', 'training', 'reports', 'compliance'];

/**
 * Checks if a user can access a specific module.
 * Core modules are always accessible.
 * Optional modules require the module to be in the organization's active modules list.
 */
export function canAccessModule(
  user: AuthUser | null,
  moduleId: string,
  activeModules: string[]
): boolean {
  if (!user) return false;

  // Core modules are always accessible to authenticated users
  if (CORE_MODULES.includes(moduleId)) return true;

  // Optional modules must be in the organization's active modules
  return activeModules.includes(moduleId);
}

/**
 * Requires access to a module — throws ComplianceError if access is denied.
 */
export function requireModuleAccess(
  user: AuthUser | null,
  moduleId: string,
  activeModules: string[]
): void {
  if (!user) {
    throw new ComplianceError(
      `Authentication required to access module: ${moduleId}`,
      COMPLIANCE_CODES.INSUFFICIENT_PERMISSIONS
    );
  }

  if (!canAccessModule(user, moduleId, activeModules)) {
    throw new ComplianceError(
      `Access denied to module: ${moduleId}. This module is not enabled for your organization.`,
      COMPLIANCE_CODES.INSUFFICIENT_PERMISSIONS
    );
  }
}

// ============================================================================
// Role-Based Permission Queries
// ============================================================================

/**
 * Returns all permissions for a given role.
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Returns all roles that have a specific permission.
 */
export function getRolesWithPermission(permission: Permission): UserRole[] {
  const roles: UserRole[] = [];
  for (const [role, permissions] of Object.entries(rolePermissions)) {
    if (isUserRole(role) && permissions.includes(permission)) {
      roles.push(role);
    }
  }
  return roles;
}

/**
 * Checks if a role has any permissions in a given module prefix.
 */
export function hasModuleAccess(role: UserRole, modulePrefix: string): boolean {
  const permissions = rolePermissions[role] || [];
  return permissions.some(p => p.startsWith(`${modulePrefix}.`));
}

// ============================================================================
// Organization Role Management
// ============================================================================

/**
 * Checks if an org role allows management actions (owner/admin).
 */
export function isOrgAdmin(orgRole: OrgRole): boolean {
  return orgRole === 'owner' || orgRole === 'admin';
}

/**
 * Checks if a user can manage other users in the organization.
 * Requires either admin user role with org admin role, or admin.users permission.
 */
export function canManageUsers(user: AuthUser | null): boolean {
  if (!user) return false;
  if (!isOrgAdmin(user.orgRole)) return false;
  return hasPermission(user, 'admin.users');
}

/**
 * Checks if a user can manage organization settings.
 */
export function canManageSettings(user: AuthUser | null): boolean {
  if (!user) return false;
  return hasPermission(user, 'admin.settings');
}

/**
 * Checks if a user can view the audit trail.
 */
export function canViewAuditTrail(user: AuthUser | null): boolean {
  if (!user) return false;
  return hasPermission(user, 'admin.audit_trail');
}

// ============================================================================
// Role Hierarchy
// ============================================================================

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  quality_manager: 80,
  document_controller: 60,
  auditor: 40,
  executive: 30,
  operator: 10,
};

/**
 * Checks if one role has higher or equal privilege than another.
 */
export function isRoleAtLeast(role: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Returns the role hierarchy level for a given role.
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] || 0;
}

// ============================================================================
// Permission Summary
// ============================================================================

export interface UserPermissionSummary {
  role: UserRole;
  orgRole: OrgRole;
  permissions: Permission[];
  accessibleModules: string[];
  canManageUsers: boolean;
  canManageSettings: boolean;
  canViewAuditTrail: boolean;
}

/**
 * Returns a comprehensive permission summary for a user.
 */
export function getUserPermissionSummary(
  user: AuthUser,
  activeModules: string[] = []
): UserPermissionSummary {
  const permissions = getPermissionsForRole(user.role);

  // Determine accessible modules from permissions
  const modulePrefixes = new Set<string>();
  for (const perm of permissions) {
    const dotIndex = perm.indexOf('.');
    if (dotIndex > 0) {
      modulePrefixes.add(perm.substring(0, dotIndex));
    }
  }

  // Map permission prefixes to module IDs
  const prefixToModule: Record<string, string> = {
    documents: 'documents',
    capa: 'capa',
    ncr: 'ncr',
    audit: 'audits',
    training: 'training',
    risk: 'risks',
    batch: 'batch_records',
    supplier: 'suppliers',
    reports: 'reports',
    compliance: 'compliance',
    admin: 'admin',
  };

  const accessibleModules: string[] = [];
  for (const prefix of modulePrefixes) {
    const moduleId = prefixToModule[prefix];
    if (moduleId && (CORE_MODULES.includes(moduleId) || activeModules.includes(moduleId))) {
      accessibleModules.push(moduleId);
    }
  }

  return {
    role: user.role,
    orgRole: user.orgRole,
    permissions,
    accessibleModules,
    canManageUsers: canManageUsers(user),
    canManageSettings: canManageSettings(user),
    canViewAuditTrail: canViewAuditTrail(user),
  };
}
