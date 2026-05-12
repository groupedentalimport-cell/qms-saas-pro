# Task 14: Fix Compliance Module and Verify Sidebar Module Filtering

## Summary

Fixed the Compliance module to match metaprompt requirements and verified/fixed sidebar module filtering.

## Changes Made

### 1. ComplianceView.tsx — Complete Rewrite

**File**: `src/components/modules/ComplianceView.tsx`

Restructured the Compliance module into **two tabs** as required:

**Tab 1 "Dashboard"**:
- Compliance gauge/score (circular gauge with weighted score calculation)
- Pending Signatures count (documents in "In Review" status)
- Open CAPAs count (CAPAs with status != "Closed")
- Recent Audit Activity (last 8 audit trail entries with action badges)

**Tab 2 "Audit Trail"**:
- Full audit trail viewer with filters:
  - Search (text search across email, table, record ID, values)
  - Action type filter (CREATE, UPDATE, DELETE, APPROVE, REJECT, SIGN, LOGIN, EXPORT)
  - Table name filter (dynamically populated from audit trail data)
  - Date range filter (from/to)
- CSV Export button (uses `exportAuditTrailCSV` from auditService)
- Results count summary
- Table view of audit entries with proper formatting

**Removed** (per metaprompt INTERDICTIONS):
- Compliance checklists section (clause-by-clause ISO 13485/ICH Q10 assessment)
- Compliance gaps section
- Applicable standards cards
- Quick stats that weren't directly about compliance score, signatures, CAPAs, or audit
- Report generator, CGU, Analytics references
- ClauseStatusBadge, CATEGORY_SECTIONS, standardToChecklistId functions (all clause-related)

**Kept**:
- Circular gauge component (ComplianceGauge)
- MetricBar component for sub-metrics
- Score calculation using industry-specific weights
- buildComplianceData for score calculation
- Permission check (compliance.view)

**New imports**:
- `Tabs, TabsContent, TabsList, TabsTrigger` from shadcn/ui
- `Table, TableBody, TableCell, TableHead, TableHeader, TableRow` from shadcn/ui
- `queryAuditTrail, exportAuditTrailCSV, getAuditTrailStats, TABLE_LABELS, ACTION_LABELS, ACTION_COLORS` from auditService
- `AuditTrailFilter` type from auditService
- `AuditAction` type from qms types

### 2. Sidebar.tsx — Permission & Module Filtering Fix

**File**: `src/components/layout/Sidebar.tsx`

**Changes**:
- Added `useAuth` import for permission-based visibility
- Added `permission` field to `NavItem` interface (optional `Permission` type)
- Added `CORE_MODULES` import from `@/types/qms` for cleaner core module check
- Changed `isItemVisible` function signature from `(module?: string)` to `(item: NavItem)` to combine both module and permission checks
- Added permission requirements to all navigation items:
  - Dashboard: no permission (always visible)
  - Documents/Document Hierarchy: `documents.read`
  - NCR: `ncr.read`
  - CAPA: `capa.read`
  - Audits: `audit.read`
  - Risks: `risk.read`
  - Training: `training.read`
  - Change Control: `documents.read`
  - Deviations: `ncr.read`
  - Batch Records: `batch.read`
  - Suppliers: `supplier.read`
  - OOS/OOT: `ncr.read`
  - Forms: `documents.read`
  - Reports: `reports.view`
  - Compliance: `compliance.view`
  - User Management: `admin.users`
- Fixed module filtering logic:
  - Core modules (documents, capa, ncr, audits, training, reports, compliance) are always visible
  - Optional modules (risks, hierarchy, batch_records, suppliers, forms, change_control, deviations, oos_oot) only visible if in `active_modules`
  - `hierarchy` module correctly filtered by `active_modules` (not core)
  - Removed duplicate `if (module === 'documents') return true;` line
- Updated both NAV_GROUPS filtering and SETTINGS_ITEMS filtering to use new `isItemVisible(item)` signature

### 3. AuditView.tsx — No Changes Needed

**File**: `src/components/modules/AuditView.tsx`

Verified that AuditView is already correctly focused on Quality Audits (Internal/External/Supplier audits):
- Manages audit CRUD operations
- Tracks findings with severity levels
- Supports electronic signatures for completion
- No audit trail viewing functionality (that's now in ComplianceView Tab 2)
- No overlap with the compliance module's audit trail viewer

## Lint Results
All files pass `bun run lint` with zero errors.
