# QMS SaaS Pro - Worklog

## Task 4 - 2025-03-04

### TASK A: Fix AppLayout.tsx - Add missing providers
- Added `SupabaseAuthProvider`, `isSupabaseConfigured`, `QueryProvider`, `ThemeProvider` imports
- Created `AuthProviderWrapper` that conditionally uses `SupabaseAuthProvider` (when Supabase configured) or demo `AuthProvider`
- Provider tree: `ThemeProvider → QueryProvider → AuthProviderWrapper → OrganizationProvider → AppLayoutInner`

### TASK B: Create 5 missing domain directories
- Created `src/domains/risk/` with types.ts, services.ts, hooks.ts, validators.ts, index.ts
- Created `src/domains/deviation/` with types.ts, services.ts, hooks.ts, validators.ts, index.ts
- Created `src/domains/change-control/` with types.ts, services.ts, hooks.ts, validators.ts, index.ts
- Created `src/domains/training/` with types.ts, services.ts, hooks.ts, validators.ts, index.ts
- Created `src/domains/audit/` with types.ts, services.ts, hooks.ts, validators.ts, index.ts

### TASK C: Fix Sidebar.tsx
- Added Organization Settings entry to SETTINGS group with `admin.settings` permission and Building2 icon
- Added `organization-settings` to ActiveSection type
- Added `organizationSettings` translation key to en.ts, fr.ts, and types.ts
- Added route mapping in App.tsx
- Verified group labels and permission/module filtering

### TASK D: Fix ComplianceView.tsx hardcoded org-001
- Replaced both `org-001` references with `currentOrg?.id || ''`
- Added `currentOrg` from `useOrganization()` hook
- Updated useMemo dependency arrays

### Lint: All files pass ESLint with zero errors.

## Task 5 - 2025-03-04

### TASK A: Fix demo-store.ts weak hash
- Imported `generateSignatureHashSync` from `@/services/compliance/signatureEngine`
- Replaced the weak non-cryptographic hash (`((hash << 5) - hash) + char`) in `generateSignatureHash` with a call to `generateSignatureHashSync`
- The `type` parameter is passed as `passwordConfirmation` to preserve per-call differentiation
- Timestamp format changed from `Date.now()` to `new Date().toISOString()` to match signature engine

### TASK B: Wire IDataProvider into services
- Created `src/lib/data-access.ts` — transitional adapter layer with `resolveDataProvider()`, `isDemoDataMode()`, and `getStore()`
- Updated `src/services/capaService.ts` — replaced `useQMSStore` import with `getStore` from `@/lib/data-access` (6 call sites)
- Updated `src/services/ncrService.ts` — replaced `useQMSStore` import with `getStore` from `@/lib/data-access` (6 call sites)
- Updated `src/services/documentService.ts` — replaced `useQMSStore` import with `getStore` from `@/lib/data-access` (11 call sites)

### TASK C: Update SupabaseProvider.ts stubs
- Added `BACKEND_NOT_CONFIGURED` to `COMPLIANCE_CODES` in `src/lib/errors.ts`
- Updated `throwNotConfigured()` in `src/demo/SupabaseProvider.ts` to throw `ComplianceError` with `COMPLIANCE_CODES.BACKEND_NOT_CONFIGURED` instead of generic `Error`
- Removed unused `NOT_CONFIGURED_MESSAGE` constant

### Lint: All files pass ESLint with zero errors.

## Task 6 - 2025-03-04

### TASK: Fix and enhance SQL migrations for multi-tenant RLS and immutable audit trail

Created new migration file: `supabase/migrations/20240101000006_multi_tenant_rls_v3.sql` (1196 lines)

**What the migration does:**

1. **user_belongs_to_org() function** — `CREATE OR REPLACE` (idempotent) of the helper function that checks if `auth.uid()` is an active member of the given organization. Uses `SECURITY DEFINER` so RLS policies can call it.

2. **organization_id columns** — `ADD COLUMN IF NOT EXISTS organization_id` on all 14 business tables (documents, capas, non_conformances, audits, risks, training, batch_records, suppliers, change_controls, deviations, form_templates, form_instances, electronic_signatures, document_prerequisites). All already existed from initial schema or v2 migration, but this guarantees they are present.

3. **Enable RLS** — `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on all 14 business tables. Idempotent (no-op if already enabled).

4. **v3 RLS policies** — Dropped all v2 policies by name with `DROP POLICY IF EXISTS`, then created 60 new v3 policies following the specified pattern:
   - **SELECT**: `USING (user_belongs_to_org(organization_id))` — users see their org's data
   - **INSERT**: `WITH CHECK (user_belongs_to_org(organization_id))` — users insert into their org
   - **UPDATE**: `USING (user_belongs_to_org(organization_id))` — users update their org's data
   - **DELETE**: Admin-only — `USING (user_belongs_to_org(organization_id) AND EXISTS (...role IN ('owner', 'admin')))`
   - **Special cases**: electronic_signatures has UPDATE blocked (CFR Part 11), audit_trails has UPDATE/DELETE blocked (append-only)

5. **Per-table immutable audit trail triggers** — Replaced the generic `audit_trigger_func()` and `prevent_delete_func()` triggers from migration v4 with dedicated per-table trigger functions:
   - 41 `audit_{table}_{operation}()` functions (INSERT/UPDATE/DELETE per table, except electronic_signatures which only has INSERT/DELETE)
   - 43 triggers: AFTER INSERT, AFTER UPDATE, and BEFORE DELETE on each business table
   - BEFORE DELETE triggers log the deletion then `RETURN OLD` (allow the delete for RLS-authorized admins), replacing the previous `prevent_delete_func()` that blocked all deletes
   - The generic `audit_trigger_func()` is retained for use by other tables (e.g., signed_records from v5)

6. **Audit trail immutability** — Created `prevent_audit_modification()` trigger function and attached it as BEFORE UPDATE and BEFORE DELETE triggers on `audit_trail`. This provides defense-in-depth beyond the RLS policies already blocking modification. Any attempt to UPDATE or DELETE audit_trails rows raises an exception.

**Key design decisions:**
- Dropped v4 `prevent_delete_*` triggers to allow admin-only physical DELETE via RLS policies
- Kept `audit_trigger_func()` (used by signed_records in v5) — new per-table functions coexist
- electronic_signatures: no UPDATE trigger (blocked by RLS), only INSERT and DELETE audit triggers
- All trigger functions use `SECURITY DEFINER` to ensure audit logging works regardless of caller privileges
