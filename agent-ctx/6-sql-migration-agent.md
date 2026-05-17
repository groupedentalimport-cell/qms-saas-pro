# Task 6 - Multi-Tenant RLS v3 & Immutable Audit Trail Migration

## Summary
Created `supabase/migrations/20240101000006_multi_tenant_rls_v3.sql` (1196 lines) that enhances multi-tenant RLS and immutable audit trail functionality.

## What Was Done

### 1. user_belongs_to_org() function
- `CREATE OR REPLACE` (idempotent) — already existed in v2 migration, recreated for completeness
- Uses `SECURITY DEFINER` so RLS policies can call it without privilege issues

### 2. organization_id columns on all 14 business tables
- Used `ADD COLUMN IF NOT EXISTS` for idempotency
- Tables: documents, capas, non_conformances, audits, risks, training, batch_records, suppliers, change_controls, deviations, form_templates, form_instances, electronic_signatures, document_prerequisites
- All already had the column from initial schema or v2 migration

### 3. RLS enabled on all 14 business tables
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` — idempotent

### 4. v3 RLS policies (60 total)
- Dropped all v2 policies by name with `DROP POLICY IF EXISTS`
- Created 4 policies per table (SELECT, INSERT, UPDATE, DELETE)
- DELETE restricted to org admins (owner/admin role) via subquery check
- Special cases:
  - electronic_signatures: UPDATE blocked (CFR Part 11)
  - audit_trails: UPDATE and DELETE blocked (append-only)

### 5. Per-table immutable audit trail triggers
- Dropped v4 `prevent_delete_*` triggers and `audit_insert_*`/`audit_update_*` triggers
- Created 41 per-table trigger functions and 43 triggers
- Pattern: AFTER INSERT (log CREATE), AFTER UPDATE (log UPDATE with old+new), BEFORE DELETE (log DELETE then RETURN OLD)
- Replaces v4's generic `audit_trigger_func()` approach with per-table functions
- Generic `audit_trigger_func()` retained for signed_records (v5 dependency)

### 6. Audit trail immutability (defense in depth)
- Created `prevent_audit_modification()` trigger function
- BEFORE UPDATE and BEFORE DELETE triggers on `audit_trails`
- Raises exception: "Audit trail records are immutable and cannot be modified or deleted"
- Supplements existing RLS-based protection from v4

## Key Design Decisions
- Dropped v4 `prevent_delete_func()` triggers to allow admin-only DELETE via RLS policies
- Kept `audit_trigger_func()` (used by signed_records in v5)
- electronic_signatures: no UPDATE audit trigger (blocked by RLS), only INSERT and DELETE
- All audit trigger functions use `SECURITY DEFINER`
- Migration is fully idempotent (CREATE OR REPLACE, DROP IF EXISTS, ADD COLUMN IF NOT EXISTS)
