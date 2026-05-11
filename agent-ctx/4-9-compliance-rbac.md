# Task 4-9: Centralized Compliance Services and RBAC System

## Summary
Created a comprehensive compliance services layer and RBAC system for the QMS SaaS Pro project. All files compile cleanly with no TypeScript errors.

## Files Created

### 1. `src/types/auth.ts`
- Defined `UserRole` type: admin, quality_manager, auditor, document_controller, executive, operator
- Defined `OrgRole` type: owner, admin, member, viewer
- Defined `Permission` union type with 30+ granular permissions across all QMS modules
- Defined `AuthUser` interface with full user profile + org context
- Defined `AuthSession` interface with re-authentication support (CFR Part 11)

### 2. `src/services/compliance/validationRules.ts`
- `ValidationResult` type: `{ valid: boolean; errors: string[] }`
- Document validation: status transitions (Draft→In Review→Approved, Approved→Obsolete), lock checks
- CAPA validation: required fields per status (5 statuses), effectiveness check requirements
- NCR validation: OOS/OOT specific validations, phase1/phase2 conclusions, lot rejection
- Batch Record validation: step sequence, lock status checks, QA release requirements
- Form Instance validation: required fields from template, lock status, field constraints
- Supplier validation: status transitions, qualification document requirements
- `enforceValidation()` helper to throw ComplianceError on validation failure

### 3. `src/services/compliance/prerequisiteEngine.ts`
- `checkPrerequisites()`: Checks if prerequisite documents exist and are Approved
- `enforcePrerequisites()`: Throws ComplianceError if mandatory prerequisites not met
- `getPrerequisiteWarnings()`: Returns warnings without throwing
- Default prerequisites per record type (CAPA, NCR, TRAINING, RISK, AUDIT, CHANGE_CONTROL, DEVIATION)
- `hasPrerequisites()` and `getPrerequisiteSummary()` utilities
- Improved over original prerequisiteService with default prerequisites, warning severity, and summary

### 4. `src/services/compliance/workflowEngine.ts`
- `canTransition()`: Check if a status transition is valid for an entity type
- `getAllowedTransitions()`: Get all valid transitions from current status
- `enforceTransition()`: Throws ComplianceError for invalid transitions
- `isLockedStatus()`: Check if a status is immutable for the entity type
- Document-specific: content lock for Approved docs (only Obsolete or new version)
- Batch record-specific: Released/Rejected = locked
- Form instance-specific: Submitted/Approved = locked
- IQ/OQ/PQ validation sequence: `validateValidationSequence()`, `getRequiredPhasesBefore()`, `getValidationSequenceStatus()`
- Supports: document, capa, ncr, batch_record, form_instance, change_control, deviation

### 5. `src/services/compliance/permissionEngine.ts`
- `hasPermission()`: Check user role has specific permission
- `requirePermission()`: Throw ComplianceError if permission denied
- `getPermissionsForRole()`: List all permissions for a role
- `mapActionToPermission()`: Maps action+entityType to Permission string
- `canPerformAction()`: Check if user can perform action on entity
- `requireActionPermission()`: Throw ComplianceError if action not permitted
- `getActionSummary()`: Returns all action permissions for a user on an entity
- `getAccessibleEntityTypes()`: Lists entities user has any access to

### 6. `src/services/compliance/signatureEngine.ts`
- `generateSignatureHash()`: SHA-256 via Web Crypto API (async), with fallback
- `generateSignatureHashSync()`: Synchronous version for non-async contexts
- `verifySignatureHash()`: Regenerate and compare hash for verification
- `createSignatureRecord()`: Full CFR Part 11 signature creation (re-auth, hash, lock, audit)
- `isRecordSigned()`: Check if record has been signed
- `lockRecord()`: Lock record after signing (idempotent, checks store entities)
- `isRecordLocked()`: Check lock status across documents, batches, forms
- `enforceRecordNotLocked()`: Throw ComplianceError if locked
- `getRecordSignatures()` and `hasSignatureType()`: Query signature records

### 7. `src/services/security/rbacService.ts`
- `hasPermission()`: RBAC permission check for AuthUser
- `requirePermission()`: Throw ComplianceError if permission denied
- `canAccessModule()`: Core modules always accessible; optional requires active modules
- `requireModuleAccess()`: Throw ComplianceError if module access denied
- `getPermissionsForRole()` and `getRolesWithPermission()`
- `isOrgAdmin()`: Check owner/admin org role
- `canManageUsers()`, `canManageSettings()`, `canViewAuditTrail()`
- Role hierarchy: `isRoleAtLeast()`, `getRoleLevel()`
- `getUserPermissionSummary()`: Comprehensive permission report for a user

### 8. `src/services/security/index.ts`
- Re-exports all security services from rbacService

## Design Decisions
- All functions throw `ComplianceError` (from `@/lib/errors`) when violations detected
- No `any` types used — strict TypeScript throughout
- Uses `useQMSStore` from `@/lib/demo-store` for data access
- Imports types from `@/types/qms` and `@/types/auth`
- Signature engine uses Web Crypto API (SubtleCrypto) for SHA-256 with fallback
- No modifications to existing files — only new files created
