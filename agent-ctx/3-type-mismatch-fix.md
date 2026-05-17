# Task 3: Fix CAPA status name mismatches across the codebase

## Summary
Fixed all type mismatches between service files and the type definitions in `src/types/qms.ts`. The type definitions are the source of truth.

## Files Modified

### 1. `src/services/capaService.ts`
- **VALID_CAPA_TRANSITIONS**: Changed `'Under Investigation'` → `'Investigation'`, `'Corrective Action'` → `'Implementation'` to match `CapaStatus` type
- **closeCapa()**: Changed `closedAt` → `closedDate`, removed `closedById` (doesn't exist on `Capa` type)

### 2. `src/services/auditEntityService.ts`
- **completeAudit()**: Removed `'Pending Report'` status check (doesn't exist in `AuditStatus`), now only checks for `'In Progress'`
- **completeAudit()**: Changed `completedAt` → `completedDate`, removed `completedById` (doesn't exist on `Audit` type)
- **VALID_AUDIT_TRANSITIONS**: Changed `'Scheduled'` → `'Planned'`, removed `'Pending Report'`, `'Cancelled'` (don't exist in `AuditStatus`)

### 3. `src/services/changeControlService.ts`
- **approveChangeControl()**: Changed `'Pending Approval'` → `'Under Review'` (matches `ChangeControlStatus`)
- **approveChangeControl()**: Changed `approvedById` → `approvedBy`, removed `approvalDate` (doesn't exist on `ChangeControl` type)
- **rejectChangeControl()**: Changed `'Pending Approval'` → `'Under Review'`
- **VALID_CC_TRANSITIONS**: Replaced `'Draft'`/`'Pending Approval'`/`'Cancelled'` with `'Requested'`/`'Under Review'` (actual `ChangeControlStatus` values)

### 4. `src/services/deviationService.ts`
- **createDeviation()**: Changed `deviation.deviationType` → `deviation.type` (field is `type`, not `deviationType`)
- **approveDeviation()**: Removed `qaApprovedById` and `qaApprovalDate` (don't exist on `Deviation` type)
- **VALID_DEVIATION_TRANSITIONS**: Removed `'Cancelled'` and `'Rejected'` (don't exist in `DeviationStatus`)

### 5. `src/services/ncrService.ts`
- **closeNCR()**: Removed `closedAt` and `closedById` (don't exist on `NonConformance` type)

### 6. `src/services/trainingService.ts`
- **updateTraining()**: Changed `'Not Started'` → `'Planned'` (matches `TrainingStatus`)
- **startTraining()**: Changed `'Not Started'` → `'Planned'`
- **completeTraining()**: Changed `orgSettings.training_completion_requires_signature` → `orgSettings.require_electronic_signatures` (field doesn't exist on `OrgSettings`)
- **completeTraining()**: Changed `completedAt` → `completedDate`, removed `completedById` (doesn't exist on `Training` type)
- **detectTrainingStatus()**: Changed `'Not Started'` → `'Planned'`
- **refreshOverdueStatuses()**: Changed `'Not Started'` → `'Planned'`

### 7. `src/services/organizationService.ts`
- **updateOrgSettings()**: Added type cast for `OrgSettings` → `Record<string, unknown>` in `logAudit` call

### 8. `src/__tests__/factories/index.ts`
- **createProfile()**: Removed `organizationId` (doesn't exist on `Profile` type)
- **createBatchRecord()**: Removed `updatedAt` (doesn't exist on `BatchRecord` type)
- **createSupplier()**: Removed `updatedAt` (doesn't exist on `Supplier` type)
- **createFormTemplate()**: Removed `updatedAt` (doesn't exist on `FormTemplate` type)
- **createFormInstance()**: Removed `updatedAt` (doesn't exist on `FormInstance` type)

## Verification
- `npx tsc --noEmit` reports zero errors for all service files and related target files
- Only pre-existing test file errors remain (unrelated vitest/jest type definition issues)

## Key Principle
Type definitions in `src/types/qms.ts` are the source of truth. Services were updated to conform to the types, not the other way around.
