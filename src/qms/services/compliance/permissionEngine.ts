// permissionEngine.ts — Centralized permission checking
// Maps user roles to granular permissions and action+entity combinations
// Enforces ISO 13485 access control requirements

import type { UserRole, Permission } from '@/qms/types/auth';
import { rolePermissions } from '@/qms/types/qms';
import { ComplianceError, COMPLIANCE_CODES } from '@/qms/lib/errors';

// ============================================================================
// Action Types
// ============================================================================

export type EntityAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'release' | 'close' | 'reject';

const ENTITY_ACTIONS: readonly EntityAction[] = ['create', 'read', 'update', 'delete', 'approve', 'release', 'close', 'reject'];

/** Type guard to check if a string is a valid EntityAction */
function isEntityAction(value: string): value is EntityAction {
  return ENTITY_ACTIONS.includes(value as EntityAction);
}

// ============================================================================
// Action + EntityType → Permission Mapping
// ============================================================================

const ACTION_ENTITY_PERMISSION_MAP: Record<string, Record<EntityAction, Permission | null>> = {
  document: {
    create: 'documents.create',
    read: 'documents.read',
    update: 'documents.update',
    delete: 'documents.delete',
    approve: 'documents.approve',
    release: null,
    close: null,
    reject: null,
  },
  capa: {
    create: 'capa.create',
    read: 'capa.read',
    update: 'capa.update',
    delete: 'capa.delete',
    approve: 'capa.approve',
    release: null,
    close: 'capa.approve',
    reject: null,
  },
  ncr: {
    create: 'ncr.create',
    read: 'ncr.read',
    update: 'ncr.update',
    delete: 'ncr.delete',
    approve: 'ncr.approve',
    release: null,
    close: 'ncr.approve',
    reject: null,
  },
  audit: {
    create: 'audit.create',
    read: 'audit.read',
    update: 'audit.update',
    delete: 'audit.delete',
    approve: null,
    release: null,
    close: null,
    reject: null,
  },
  training: {
    create: 'training.create',
    read: 'training.read',
    update: 'training.update',
    delete: 'training.delete',
    approve: null,
    release: null,
    close: null,
    reject: null,
  },
  risk: {
    create: 'risk.create',
    read: 'risk.read',
    update: 'risk.update',
    delete: 'risk.delete',
    approve: null,
    release: null,
    close: null,
    reject: null,
  },
  batch: {
    create: 'batch.create',
    read: 'batch.read',
    update: 'batch.update',
    delete: 'batch.delete',
    approve: null,
    release: 'batch.release',
    close: null,
    reject: null,
  },
  supplier: {
    create: 'supplier.create',
    read: 'supplier.read',
    update: 'supplier.update',
    delete: 'supplier.delete',
    approve: null,
    release: null,
    close: null,
    reject: null,
  },
  report: {
    create: null,
    read: 'reports.view',
    update: null,
    delete: null,
    approve: null,
    release: null,
    close: null,
    reject: 'reports.export',
  },
  compliance: {
    create: null,
    read: 'compliance.view',
    update: 'compliance.manage',
    delete: null,
    approve: null,
    release: null,
    close: null,
    reject: null,
  },
  admin_users: {
    create: 'admin.users',
    read: 'admin.users',
    update: 'admin.users',
    delete: 'admin.users',
    approve: null,
    release: null,
    close: null,
    reject: null,
  },
  admin_settings: {
    create: 'admin.settings',
    read: 'admin.settings',
    update: 'admin.settings',
    delete: 'admin.settings',
    approve: null,
    release: null,
    close: null,
    reject: null,
  },
};

// ============================================================================
// Core Permission Functions
// ============================================================================

/**
 * Checks if a user with the given role has a specific permission.
 */
export function hasPermission(user: { role: UserRole }, permission: Permission): boolean {
  const permissions = rolePermissions[user.role] || [];
  return permissions.includes(permission);
}

/**
 * Requires a specific permission — throws ComplianceError if not granted.
 */
export function requirePermission(user: { role: UserRole }, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    throw new ComplianceError(
      `Permission denied: ${permission} (role: ${user.role})`,
      COMPLIANCE_CODES.INSUFFICIENT_PERMISSIONS
    );
  }
}

/**
 * Returns all permissions for a given role.
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Maps action + entityType to the corresponding Permission string.
 * Returns null if the action is not applicable to the entity type.
 */
export function mapActionToPermission(
  action: EntityAction,
  entityType: string
): Permission | null {
  const entityMap = ACTION_ENTITY_PERMISSION_MAP[entityType];
  if (!entityMap) return null;
  return entityMap[action];
}

/**
 * Checks whether a user can perform a specific action on an entity type.
 * Maps the action+entityType to a Permission and checks the user's role.
 */
export function canPerformAction(
  user: { role: UserRole },
  action: EntityAction,
  entityType: string
): boolean {
  const permission = mapActionToPermission(action, entityType);
  if (!permission) return false;
  return hasPermission(user, permission);
}

/**
 * Requires a user to have permission for a specific action on an entity type.
 * Throws ComplianceError if permission is not granted.
 */
export function requireActionPermission(
  user: { role: UserRole },
  action: EntityAction,
  entityType: string
): void {
  const permission = mapActionToPermission(action, entityType);
  if (!permission) {
    throw new ComplianceError(
      `Action "${action}" is not applicable to entity type "${entityType}"`,
      COMPLIANCE_CODES.INSUFFICIENT_PERMISSIONS
    );
  }
  requirePermission(user, permission);
}

// ============================================================================
// Permission Summary
// ============================================================================

/**
 * Returns a summary of what actions a user can perform on an entity type.
 */
export function getActionSummary(
  user: { role: UserRole },
  entityType: string
): Record<EntityAction, boolean> {
  const entityMap = ACTION_ENTITY_PERMISSION_MAP[entityType];
  if (!entityMap) {
    return {
      create: false, read: false, update: false, delete: false,
      approve: false, release: false, close: false, reject: false,
    };
  }

  const result: Record<EntityAction, boolean> = {
    create: false, read: false, update: false, delete: false,
    approve: false, release: false, close: false, reject: false,
  };

  for (const action of Object.keys(entityMap)) {
    if (isEntityAction(action)) {
      const permission = entityMap[action];
      result[action] = permission ? hasPermission(user, permission) : false;
    }
  }

  return result;
}

/**
 * Returns all entity types a user has any access to.
 */
export function getAccessibleEntityTypes(user: { role: UserRole }): string[] {
  const userPermissions = new Set(rolePermissions[user.role] || []);
  const accessibleEntities: string[] = [];

  for (const [entityType, actionMap] of Object.entries(ACTION_ENTITY_PERMISSION_MAP)) {
    for (const permission of Object.values(actionMap)) {
      if (permission && userPermissions.has(permission)) {
        accessibleEntities.push(entityType);
        break;
      }
    }
  }

  return accessibleEntities;
}
