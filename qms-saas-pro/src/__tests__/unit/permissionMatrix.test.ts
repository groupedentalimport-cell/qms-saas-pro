import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  requirePermission,
  getPermissionsForRole,
  canPerformAction,
  mapActionToPermission,
  requireActionPermission,
  getActionSummary,
  getAccessibleEntityTypes,
} from '@/services/compliance/permissionEngine';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { UserRole, Permission } from '@/types/qms';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(role: UserRole): { role: UserRole } {
  return { role };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PermissionMatrix', () => {
  // =========================================================================
  // Admin has all permissions
  // =========================================================================
  describe('admin role', () => {
    const admin = makeUser('admin');

    it('has all document permissions', () => {
      expect(hasPermission(admin, 'documents.create')).toBe(true);
      expect(hasPermission(admin, 'documents.read')).toBe(true);
      expect(hasPermission(admin, 'documents.update')).toBe(true);
      expect(hasPermission(admin, 'documents.delete')).toBe(true);
      expect(hasPermission(admin, 'documents.approve')).toBe(true);
    });

    it('has all CAPA permissions', () => {
      expect(hasPermission(admin, 'capa.create')).toBe(true);
      expect(hasPermission(admin, 'capa.read')).toBe(true);
      expect(hasPermission(admin, 'capa.update')).toBe(true);
      expect(hasPermission(admin, 'capa.delete')).toBe(true);
      expect(hasPermission(admin, 'capa.approve')).toBe(true);
    });

    it('has admin permissions', () => {
      expect(hasPermission(admin, 'admin.users')).toBe(true);
      expect(hasPermission(admin, 'admin.settings')).toBe(true);
      expect(hasPermission(admin, 'admin.audit_trail')).toBe(true);
    });

    it('can delete documents', () => {
      expect(canPerformAction(admin, 'delete', 'document')).toBe(true);
    });

    it('can create capas', () => {
      expect(canPerformAction(admin, 'create', 'capa')).toBe(true);
    });

    it('can release batches', () => {
      expect(canPerformAction(admin, 'release', 'batch')).toBe(true);
    });
  });

  // =========================================================================
  // Quality Manager permissions
  // =========================================================================
  describe('quality_manager role', () => {
    const qm = makeUser('quality_manager');

    it('has document create/read/update/approve but not delete', () => {
      expect(hasPermission(qm, 'documents.create')).toBe(true);
      expect(hasPermission(qm, 'documents.read')).toBe(true);
      expect(hasPermission(qm, 'documents.update')).toBe(true);
      expect(hasPermission(qm, 'documents.approve')).toBe(true);
      expect(hasPermission(qm, 'documents.delete')).toBe(false);
    });

    it('has CAPA create/read/update/approve but not delete', () => {
      expect(hasPermission(qm, 'capa.create')).toBe(true);
      expect(hasPermission(qm, 'capa.read')).toBe(true);
      expect(hasPermission(qm, 'capa.update')).toBe(true);
      expect(hasPermission(qm, 'capa.approve')).toBe(true);
      expect(hasPermission(qm, 'capa.delete')).toBe(false);
    });

    it('has batch release permission', () => {
      expect(hasPermission(qm, 'batch.release')).toBe(true);
    });

    it('does not have admin.users permission', () => {
      expect(hasPermission(qm, 'admin.users')).toBe(false);
    });

    it('does not have admin.settings permission', () => {
      expect(hasPermission(qm, 'admin.settings')).toBe(false);
    });

    it('has compliance.manage permission', () => {
      expect(hasPermission(qm, 'compliance.manage')).toBe(true);
    });
  });

  // =========================================================================
  // Auditor — read-only permissions
  // =========================================================================
  describe('auditor role', () => {
    const auditor = makeUser('auditor');

    it('has read permissions across modules', () => {
      expect(hasPermission(auditor, 'documents.read')).toBe(true);
      expect(hasPermission(auditor, 'capa.read')).toBe(true);
      expect(hasPermission(auditor, 'ncr.read')).toBe(true);
      expect(hasPermission(auditor, 'batch.read')).toBe(true);
      expect(hasPermission(auditor, 'supplier.read')).toBe(true);
      expect(hasPermission(auditor, 'training.read')).toBe(true);
      expect(hasPermission(auditor, 'risk.read')).toBe(true);
    });

    it('cannot create/update/delete documents', () => {
      expect(hasPermission(auditor, 'documents.create')).toBe(false);
      expect(hasPermission(auditor, 'documents.update')).toBe(false);
      expect(hasPermission(auditor, 'documents.delete')).toBe(false);
    });

    it('cannot create/update/delete capas', () => {
      expect(hasPermission(auditor, 'capa.create')).toBe(false);
      expect(hasPermission(auditor, 'capa.update')).toBe(false);
      expect(hasPermission(auditor, 'capa.delete')).toBe(false);
    });

    it('cannot create NCRs', () => {
      expect(hasPermission(auditor, 'ncr.create')).toBe(false);
    });

    it('has audit create/update permissions', () => {
      expect(hasPermission(auditor, 'audit.create')).toBe(true);
      expect(hasPermission(auditor, 'audit.update')).toBe(true);
    });

    it('has compliance.view but not compliance.manage', () => {
      expect(hasPermission(auditor, 'compliance.view')).toBe(true);
      expect(hasPermission(auditor, 'compliance.manage')).toBe(false);
    });

    it('cannot delete capas via canPerformAction', () => {
      expect(canPerformAction(auditor, 'delete', 'capa')).toBe(false);
    });
  });

  // =========================================================================
  // Operator — limited permissions
  // =========================================================================
  describe('operator role', () => {
    const operator = makeUser('operator');

    it('can read documents', () => {
      expect(hasPermission(operator, 'documents.read')).toBe(true);
    });

    it('can create NCRs', () => {
      expect(hasPermission(operator, 'ncr.create')).toBe(true);
    });

    it('can create and update batch records', () => {
      expect(hasPermission(operator, 'batch.create')).toBe(true);
      expect(hasPermission(operator, 'batch.update')).toBe(true);
      expect(hasPermission(operator, 'batch.read')).toBe(true);
    });

    it('cannot delete batch records', () => {
      expect(hasPermission(operator, 'batch.delete')).toBe(false);
    });

    it('cannot release batches', () => {
      expect(hasPermission(operator, 'batch.release')).toBe(false);
    });

    it('cannot approve documents', () => {
      expect(hasPermission(operator, 'documents.approve')).toBe(false);
    });

    it('cannot access admin settings', () => {
      expect(hasPermission(operator, 'admin.users')).toBe(false);
      expect(hasPermission(operator, 'admin.settings')).toBe(false);
    });

    it('can create NCRs via canPerformAction', () => {
      expect(canPerformAction(operator, 'create', 'ncr')).toBe(true);
    });
  });

  // =========================================================================
  // hasPermission — returns false for unauthorized roles
  // =========================================================================
  describe('hasPermission returns false for unauthorized roles', () => {
    it('returns false when role has no matching permission', () => {
      const auditor = makeUser('auditor');
      expect(hasPermission(auditor, 'documents.delete')).toBe(false);
      expect(hasPermission(auditor, 'batch.release')).toBe(false);
      expect(hasPermission(auditor, 'admin.users')).toBe(false);
    });

    it('returns false for unknown permission', () => {
      const admin = makeUser('admin');
      // Casting to Permission to test edge case — in real code this would be a compile error
      expect(hasPermission(admin, 'nonexistent.permission' as Permission)).toBe(false);
    });
  });

  // =========================================================================
  // requirePermission — throws for unauthorized roles
  // =========================================================================
  describe('requirePermission throws for unauthorized roles', () => {
    it('does not throw when permission is granted', () => {
      const admin = makeUser('admin');
      expect(() => requirePermission(admin, 'documents.delete')).not.toThrow();
    });

    it('throws ComplianceError with INSUFFICIENT_PERMISSIONS code', () => {
      const auditor = makeUser('auditor');
      try {
        requirePermission(auditor, 'documents.delete');
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.INSUFFICIENT_PERMISSIONS);
      }
    });

    it('includes permission and role in error message', () => {
      const operator = makeUser('operator');
      try {
        requirePermission(operator, 'admin.settings');
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        const msg = (error as ComplianceError).message;
        expect(msg).toContain('admin.settings');
        expect(msg).toContain('operator');
      }
    });
  });

  // =========================================================================
  // canPerformAction — maps correctly
  // =========================================================================
  describe('canPerformAction maps correctly', () => {
    it('admin can delete documents', () => {
      const admin = makeUser('admin');
      expect(canPerformAction(admin, 'delete', 'document')).toBe(true);
    });

    it('auditor cannot create capas', () => {
      const auditor = makeUser('auditor');
      expect(canPerformAction(auditor, 'create', 'capa')).toBe(false);
    });

    it('operator can create NCRs', () => {
      const operator = makeUser('operator');
      expect(canPerformAction(operator, 'create', 'ncr')).toBe(true);
    });

    it('returns false for unmapped entity types', () => {
      const admin = makeUser('admin');
      expect(canPerformAction(admin, 'create', 'unknown_entity')).toBe(false);
    });

    it('returns false when action maps to null permission', () => {
      const admin = makeUser('admin');
      // 'release' action on 'document' maps to null
      expect(canPerformAction(admin, 'release', 'document')).toBe(false);
    });
  });

  // =========================================================================
  // mapActionToPermission
  // =========================================================================
  describe('mapActionToPermission', () => {
    it('maps document delete to documents.delete', () => {
      expect(mapActionToPermission('delete', 'document')).toBe('documents.delete');
    });

    it('maps batch release to batch.release', () => {
      expect(mapActionToPermission('release', 'batch')).toBe('batch.release');
    });

    it('returns null for unmapped entity types', () => {
      expect(mapActionToPermission('create', 'nonexistent')).toBeNull();
    });

    it('returns null for inapplicable actions', () => {
      // Document 'release' is not applicable
      expect(mapActionToPermission('release', 'document')).toBeNull();
    });
  });

  // =========================================================================
  // requireActionPermission
  // =========================================================================
  describe('requireActionPermission', () => {
    it('does not throw for authorized action', () => {
      const admin = makeUser('admin');
      expect(() => requireActionPermission(admin, 'delete', 'document')).not.toThrow();
    });

    it('throws for unauthorized action', () => {
      const auditor = makeUser('auditor');
      expect(() => requireActionPermission(auditor, 'delete', 'document')).toThrow(ComplianceError);
    });

    it('throws for unmapped action+entity', () => {
      const admin = makeUser('admin');
      expect(() => requireActionPermission(admin, 'release', 'document')).toThrow(ComplianceError);
    });
  });

  // =========================================================================
  // getPermissionsForRole
  // =========================================================================
  describe('getPermissionsForRole', () => {
    it('returns all permissions for admin', () => {
      const perms = getPermissionsForRole('admin');
      expect(perms.length).toBeGreaterThan(0);
      expect(perms).toContain('documents.delete');
      expect(perms).toContain('admin.users');
    });

    it('returns read-only permissions for auditor', () => {
      const perms = getPermissionsForRole('auditor');
      expect(perms).toContain('documents.read');
      expect(perms).not.toContain('documents.create');
      expect(perms).not.toContain('documents.delete');
    });

    it('returns empty array for unknown role', () => {
      const perms = getPermissionsForRole('unknown_role' as UserRole);
      expect(perms).toEqual([]);
    });
  });

  // =========================================================================
  // getActionSummary
  // =========================================================================
  describe('getActionSummary', () => {
    it('returns correct summary for admin on documents', () => {
      const admin = makeUser('admin');
      const summary = getActionSummary(admin, 'document');

      expect(summary.create).toBe(true);
      expect(summary.read).toBe(true);
      expect(summary.update).toBe(true);
      expect(summary.delete).toBe(true);
      expect(summary.approve).toBe(true);
      expect(summary.release).toBe(false); // documents have no release action
    });

    it('returns false for all actions on unknown entity', () => {
      const admin = makeUser('admin');
      const summary = getActionSummary(admin, 'nonexistent');

      expect(summary.create).toBe(false);
      expect(summary.read).toBe(false);
      expect(summary.update).toBe(false);
      expect(summary.delete).toBe(false);
      expect(summary.approve).toBe(false);
    });
  });

  // =========================================================================
  // getAccessibleEntityTypes
  // =========================================================================
  describe('getAccessibleEntityTypes', () => {
    it('returns many entity types for admin', () => {
      const admin = makeUser('admin');
      const types = getAccessibleEntityTypes(admin);
      expect(types).toContain('document');
      expect(types).toContain('capa');
      expect(types).toContain('ncr');
      expect(types).toContain('batch');
    });

    it('returns limited entity types for operator', () => {
      const operator = makeUser('operator');
      const types = getAccessibleEntityTypes(operator);
      expect(types).toContain('document');
      expect(types).toContain('ncr');
      expect(types).toContain('batch');
      // Operator should NOT have capa.create/update/delete
      // But they do have capa.read
      expect(types).toContain('capa');
    });
  });
});
