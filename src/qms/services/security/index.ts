// Security Services — Re-export all security-related services
// Central import point for RBAC and security functionality

export {
  hasPermission,
  requirePermission,
  canAccessModule,
  requireModuleAccess,
  getPermissionsForRole,
  getRolesWithPermission,
  hasModuleAccess,
  isOrgAdmin,
  canManageUsers,
  canManageSettings,
  canViewAuditTrail,
  isRoleAtLeast,
  getRoleLevel,
  getUserPermissionSummary,
  type UserPermissionSummary,
} from './rbacService';
