// Auth Types - RBAC and authentication type definitions
// Supports CFR Part 11 electronic signature compliance

// User Roles
export type UserRole = 'admin' | 'quality_manager' | 'auditor' | 'document_controller' | 'executive' | 'operator';

// Organization Roles
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

// Permissions - granular
export type Permission =
  | 'documents.create' | 'documents.read' | 'documents.update' | 'documents.delete' | 'documents.approve'
  | 'capa.create' | 'capa.read' | 'capa.update' | 'capa.delete' | 'capa.approve'
  | 'ncr.create' | 'ncr.read' | 'ncr.update' | 'ncr.delete' | 'ncr.approve'
  | 'audit.create' | 'audit.read' | 'audit.update' | 'audit.delete'
  | 'training.create' | 'training.read' | 'training.update' | 'training.delete'
  | 'risk.create' | 'risk.read' | 'risk.update' | 'risk.delete'
  | 'batch.create' | 'batch.read' | 'batch.update' | 'batch.delete' | 'batch.release'
  | 'supplier.create' | 'supplier.read' | 'supplier.update' | 'supplier.delete'
  | 'reports.view' | 'reports.export'
  | 'compliance.view' | 'compliance.manage'
  | 'admin.users' | 'admin.settings' | 'admin.audit_trail';

// Auth User interface
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  jobTitle?: string;
  avatarUrl?: string;
  organizationId: string;
  orgRole: OrgRole;
}

// Session with re-auth support (CFR Part 11)
export interface AuthSession {
  user: AuthUser;
  isAuthenticated: boolean;
  lastAuthenticated: string; // ISO timestamp
  requiresReAuth: boolean;
}
