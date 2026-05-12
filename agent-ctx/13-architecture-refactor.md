---
Task ID: 13
Agent: Architecture Refactor Agent
Task: Ensure NO direct Supabase calls exist in React components - all DB access must go through services or hooks

Work Log:

## Phase 1: Audit & Discovery
- Searched `src/components/` and `src/contexts/` for direct Supabase imports (browser, server, supabase-js)
- Found only `SupabaseAuthContext.tsx` imports from `@/lib/supabase/browser` - this is allowed (infrastructure context, not UI component)
- Searched for direct `.from()`, `.auth.` Supabase query syntax - only in SupabaseAuthContext (allowed) and `Array.from()` (irrelevant)
- Searched for direct store mutation patterns (`store.addXxx()`, `store.updateXxx()`, `store.logAudit()`, `store.generateSignatureHash()`, `store.checkPrerequisites()`, `store.getOrgSettings()`)
- Found 50+ violations across 13 components and 1 context

## Phase 2: Create Missing Service Files
Created 10 new service files following existing patterns (like `documentService.ts`, `batchService.ts`):
1. `src/services/ncrService.ts` — createNCR, updateNCR, closeNCR with prerequisite checks, status validation
2. `src/services/capaService.ts` — createCapa, updateCapa, closeCapa with prerequisite checks
3. `src/services/riskService.ts` — createRisk, updateRisk, calculateRiskLevel, getRiskLevelColor
4. `src/services/trainingService.ts` — createTraining, updateTraining, startTraining, completeTraining, getTrainingOrgSettings
5. `src/services/changeControlService.ts` — createChangeControl, updateChangeControl, approveChangeControl, rejectChangeControl
6. `src/services/deviationService.ts` — createDeviation, updateDeviation, approveDeviation
7. `src/services/auditEntityService.ts` — createAudit, updateAudit, completeAudit, addAuditFinding, updateAuditFinding
8. `src/services/profileService.ts` — createProfile, updateProfile, getProfile, getAllProfiles
9. `src/services/organizationService.ts` — updateOrganization, updateOrgSettings, getOrganization, getOrgSettings
10. `src/services/signatureService.ts` — generateSignatureHash, logSignatureAudit, performElectronicSignature

Updated domain service re-exports:
- `src/domains/ncr/services.ts` — now exports from ncrService
- `src/domains/capa/services.ts` — now exports from capaService

## Phase 3: Fix Component Violations

### Components with direct store mutations fixed:
1. **DocumentControlView** — `store.addDocument()` → `createDocument()`, `store.updateDocument()` → `updateDocument()`
2. **NcrView** — `store.addNCR()` → `createNCR()`, `store.updateNCR()` → `updateNCR()`
3. **OosOotView** — `store.addNCR()` → `createNCR()`, `store.updateNCR()` → `updateNCR()`, `store.ncrs.length` → `ncrs.length`, `store.capas.find()` → `useQMSStore.getState().capas.find()`
4. **CapaView** — `store.addCapa()` → `createCapa()`, `store.updateCapa()` → `updateCapa()`, `store.checkPrerequisites()` → `checkPrerequisites()`
5. **RiskView** — `store.addRisk()` → `createRisk()`, `store.updateRisk()` → `updateRisk()`
6. **TrainingView** — `store.addTraining()` → `createTraining()`, `store.updateTraining()` → `updateTraining()`, `store.getOrgSettings()` → `getTrainingOrgSettings()`
7. **ChangeControlView** — `store.addChangeControl()` → `createChangeControl()`, `store.updateChangeControl()` → `updateChangeControl()`, `store.checkPrerequisites()` → `checkPrerequisites()`
8. **DeviationView** — `store.addDeviation()` → `createDeviation()`, `store.updateDeviation()` → `updateDeviation()`
9. **AuditView** — `store.addAudit()` → `createAudit()`, `store.updateAudit()` → `updateAudit()`
10. **BatchRecordView** — `store.addBatchRecord()` → `createBatchRecord()`, `store.updateBatchRecord()` → `updateBatchRecord()`
11. **SupplierView** — `store.addSupplier()` → `createSupplier()`, `store.updateSupplier()` → `updateSupplier()`
12. **FormView** — `store.addFormTemplate()` → `createFormTemplate()`, `store.addFormInstance()` → `createFormInstance()`, `store.updateFormInstance()` → `updateFormInstanceValues()`, `store.profiles.find()` → `useQMSStore.getState().profiles.find()`
13. **UserManagementView** — `store.addProfile()` → `createProfile()`, `store.updateProfile()` → `updateProfile()`
14. **ElectronicSignatureModal** — `store.generateSignatureHash()` + `store.logAudit()` → `performElectronicSignature()`

### Context violations fixed:
15. **OrganizationContext** — `storeUpdateOrganization()` → `serviceUpdateOrganization()`, `storeUpdateOrgSettings()` → `serviceUpdateOrgSettings()`
16. **AppLayout** — `storeUpdateOrganization()` → `updateOrganization()` from OrganizationContext

### Pattern: Convert `const store = useQMSStore()` to individual selectors
For all fixed components, changed from:
```tsx
const store = useQMSStore();
const docs = store.documents;
```
to:
```tsx
const documents = useQMSStore(state => state.documents);
```

### Pattern: Remove id/createdAt/updatedAt from create calls
Service functions auto-generate these fields, so removed them from call sites where components were constructing full objects.

## Phase 4: Verification
- `npx vite build` succeeds with 0 errors (1.12s)
- Final scan confirms 0 direct store mutations in components/ and contexts/
- Only SupabaseAuthContext imports from `@/lib/supabase/browser` (allowed)
- Read-only store access (e.g., `store.documents` for rendering) remains in components that don't mutate data

## Architecture Now Enforced:
**Components** → call **Services** → access **Store/Supabase**
NOT: Components → Store/Supabase directly

Components MAY:
- Read from store using `useQMSStore(state => state.xxx)` for rendering
- Use domain hooks from `@/domains/*/hooks`
- Call service functions for mutations

Components MUST NOT:
- Call `store.addDocument()`, `store.updateDocument()`, etc. directly
- Import from `@/lib/supabase/*` directly
- Make direct Supabase queries
