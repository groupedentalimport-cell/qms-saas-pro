# Task 2 — Fix all src/services/ files

## Agent: Code Agent
## Date: 2026-05-12

## Summary

Fixed all 5 categories of issues in the QMS SaaS Pro service layer.

## Changes Made

### 1. Organization ID Filtering
Added `organizationId` filtering to ALL service query functions:
- `riskService.ts`: Added `getRisks(organizationId?)` and `getRisk(id, organizationId?)` functions; `createRisk` validates uniqueness within org; `updateRisk` validates org access
- `profileService.ts`: `getAllProfiles()` now accepts optional `organizationId` param (note: Profile type lacks organizationId field, documented)
- `deviationService.ts`: Added `getDeviations(organizationId?)`; `createDeviation` validates uniqueness within org; `updateDeviation` validates org access
- `changeControlService.ts`: Added `getChangeControls(organizationId?)`; `createChangeControl` validates uniqueness within org; `updateChangeControl` validates org access
- `auditService.ts`: `getAuditTrailStats` now requires `organizationId` (was optional); `queryAuditTrail` already had org filter
- `supplierService.ts`: Added `getSuppliers(organizationId?)`; `createSupplier` validates uniqueness within org; `updateSupplier` validates org access; `refreshAllPerformanceScores` accepts optional orgId
- `ncrService.ts`: Added `getNCRs(organizationId?)`; `updateNCR` validates org access
- `trainingService.ts`: Added `getTrainingRecords(organizationId?)`; `updateTraining` validates org access; `refreshOverdueStatuses` accepts optional orgId
- `auditEntityService.ts`: Added `getAudits(organizationId?)`; `updateAudit` validates org access
- `batchService.ts`: Added `getBatchRecords(organizationId?)`; `updateBatchRecord` validates org access

### 2. Explicit Audit Trail Logging
Added `store.logAudit()` calls with full old/new values context in:
- `riskService.ts`: `updateRisk()` — was ZERO audit logging
- `profileService.ts`: `createProfile()` and `updateProfile()` — were ZERO audit logging
- `deviationService.ts`: `updateDeviation()` — was missing explicit logging
- `changeControlService.ts`: `updateChangeControl()` — was missing explicit logging
- `trainingService.ts`: `updateTraining()` — was missing explicit logging
- `auditEntityService.ts`: `updateAudit()` — was missing explicit logging
- `batchService.ts`: `updateBatchRecord()` — was missing explicit logging
- `supplierService.ts`: `createSupplier()` — was missing explicit logging; `updateSupplier()` — was missing explicit logging
- `ncrService.ts`: `updateNCR()` — was missing explicit logging
- `capaService.ts`: `updateCapa()` — was missing explicit logging

Pattern used: Capture `oldValues = { ...existing }` before update, then call `store.logAudit('UPDATE', 'TableName', id, oldValues, updates)` after the store update.

### 3. Non-Null Assertions → Proper Null Checks
Replaced ALL `return updated!;` and `return ...find()!;` patterns (~23 occurrences) with:
```typescript
const updated = useQMSStore.getState().entity.find(e => e.id === id);
if (!updated) {
  throw new ComplianceError('ENTITY_NOT_FOUND', 'Entity not found after update');
}
return updated;
```
Added `ENTITY_NOT_FOUND` to `COMPLIANCE_CODES` in `src/lib/errors.ts`.

Files fixed: riskService, profileService, deviationService, changeControlService, supplierService, ncrService, trainingService, auditEntityService, batchService, capaService, documentService, organizationService, formService.

### 4. Deleted prerequisiteService.ts (Duplicate)
- Deleted `src/services/prerequisiteService.ts`
- Updated all imports from `@/services/prerequisiteService` to `@/services/compliance/prerequisiteEngine` in:
  - `src/services/ncrService.ts`
  - `src/services/capaService.ts`
  - `src/services/changeControlService.ts`
  - `src/services/auditEntityService.ts`
  - `src/components/modules/ChangeControlView.tsx`
  - `src/components/modules/CapaView.tsx`
- Updated `prerequisiteEngine.ts` to accept optional `organizationId` (was required) to maintain backward compatibility with existing call sites

### 5. Fixed auditService.ts Hardcoded org-001
- `logAuditEntry()`: Made `organizationId` required (was optional with `'org-001'` fallback); throws `ComplianceError` if not provided
- `getAuditTrailStats()`: Made `organizationId` required (was optional); throws `ComplianceError` if not provided
- Both functions now validate organizationId is provided and never fall back to hardcoded values

### Bonus: Type Safety Fixes
Fixed pre-existing TypeScript strict mode errors:
- `auditEntityService.ts`: Changed `completedAt` → `completedDate`; aligned `AuditStatus` transitions with type definition (`'Planned' | 'In Progress' | 'Completed'`)
- `capaService.ts`: Changed `closedAt` → `closedDate`; aligned `CapaStatus` transitions with type definition
- `ncrService.ts`: Removed `closedAt` and `closedById` from update (not in type definition)
- `trainingService.ts`: Changed `'Not Started'` → `'Planned'` to match `TrainingStatus` type; Changed `completedAt` → `completedDate`; Changed `training_completion_requires_signature` → `require_electronic_signatures` to match `OrgSettings` type

## Verification
- `bun run lint` passes with no errors
- `bunx tsc --noEmit` passes with no errors in services/ and components/modules/
