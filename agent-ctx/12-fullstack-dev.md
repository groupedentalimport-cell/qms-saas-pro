# Task 12 - Enforce TypeScript Strict Mode

## Agent: Z.ai Code (Fullstack Dev)
## Date: 2025-03-05
## Status: COMPLETED

## Summary
Enforced TypeScript strict mode across the entire QMS SaaS Pro project. Fixed all `any` types, `as any` casts, `@ts-ignore` directives, and improved type safety across 30+ files. The project now builds successfully with `noImplicitAny: true`, `strictNullChecks: true`, `strictFunctionTypes: true`, and `noImplicitThis: true` enabled.

## Changes Made

### 1. tsconfig.json - Strict Mode Enabled
- Set `noImplicitAny: true` (was `false`)
- Added `strictNullChecks: true`
- Added `strictFunctionTypes: true`
- Added `noImplicitThis: true`

### 2. Type Guard Utilities Added (`src/types/qms.ts`)
- `isUserRole(value: string): value is UserRole` - validates UserRole strings
- `asUserRole(value: string, fallback?): UserRole` - safe cast with fallback
- `isIndustryType(value: string): value is IndustryType` - validates IndustryType strings
- `asIndustryType(value: string, fallback?): IndustryType` - safe cast with fallback
- `isSignatureType(value: string): value is SignatureType` - validates SignatureType strings
- `asString(value: unknown, fallback?): string` - safe unknown-to-string conversion
- `DEFAULT_ORG_SETTINGS: OrgSettings` - complete default settings object
- `parseOrgSettings(json: string): OrgSettings` - validates JSON parse with defaults

### 3. Auth Contexts Fixed
- **AuthContext.tsx**: Removed unnecessary `as UserRole` cast (Profile.role is already UserRole)
- **SupabaseAuthContext.tsx**: 
  - Removed `as UserRole` cast
  - Added `SupabaseProfileRow` interface for typed Supabase response
  - Used `isUserRole()` type guard for safe role validation from Supabase data

### 4. Sidebar.tsx - Translation Key Resolution
- Created `TranslationRecord` type alias
- Consolidated double-cast `t as unknown as Record<string, unknown>` into single `tRecord` variable
- Replaced `orgSettings?.industry_type as IndustryType` with `isIndustryType()` type guard

### 5. Organization Context & Demo Store
- Replaced `JSON.parse(...) as OrgSettings` with `parseOrgSettings()` utility (with validation + defaults)
- **useOrgSettings.ts**: Replaced `{} as OrgSettings` with `DEFAULT_ORG_SETTINGS`

### 6. Base Service & Supabase Services
- **base-service.ts**:
  - Changed `null as unknown as SupabaseClient` → `undefined as unknown as SupabaseClient` with documented rationale
  - Added `toPlainRecord<T>()` helper for audit trail conversion
  - Renamed protected methods to avoid subclass collision: `getById→fetchById`, `create→insertRecord`, `update→updateRecord`, `softDelete→softDeleteRecord`
  - Updated `create<T>` to accept `Partial<T>` directly (eliminating need for casts in subclasses)
  - Added `extends { id?: string }` constraint removed (simplified to just `<T>`)
- **All 13 supabase service files**: Removed `as Record<string, unknown>` casts from create/update calls

### 7. Workflow Engine
- Added `isEntityType()` type guard function
- Replaced all `entityType as EntityType` casts with type guard checks
- Replaced `Object.keys(WORKFLOW_TRANSITIONS) as EntityType[]` with `[...ENTITY_TYPES]`

### 8. RBAC Service
- Imported `isUserRole` type guard
- Replaced `role as UserRole` with `isUserRole(role)` check

### 9. Permission Engine
- Added `isEntityAction()` type guard
- Replaced `Object.keys(entityMap) as EntityAction[]` with filtered iteration using type guard

### 10. Signature Engine
- Imported `asString()` and `isSignatureType()` type guards
- Replaced unsafe `as string` and `as SignatureType` casts on audit trail values with type-safe access

### 11. Dashboard Views
- **DashboardView.tsx**: Used `isIndustryType()` instead of `as IndustryType`
- **ComplianceView.tsx**: Used `isIndustryType()` instead of `as IndustryType`
- **PlaceholderView.tsx**: 
  - Created `PlaceholderItem` interface for polymorphic entity display
  - Replaced `Record<string, unknown>` item typing with typed `PlaceholderItem`
  - Made callback functions accept `PlaceholderItem` for consistent typing

### 12. Module Views
- **UserManagementView.tsx**: 
  - Replaced `'operator' as UserRole` with explicit `useState<{...}>` typing
  - Used `isUserRole()` in Select onValueChange handlers
- **ChangeControlView.tsx**: Used `as Record<string, string>` for status color lookup on linked doc

### 13. API Client
- Added documentation for `as unknown as T` double cast (unavoidable for generic text response pattern)

### 14. Additional Fixes (exposed by strictNullChecks)
- **NcrView.tsx**: Added `dueDate?: string` to NonConformance type (component was using it)
- **TrainingView.tsx**: Removed redundant status comparison (dead code after early return)
- **DocumentControlView.tsx**: Removed impossible `next === 'Approved'` check (after early return for Approved)
- **documentService.ts**: Fixed possibly-undefined `current` with explicit typing and non-null assertion

## Verification
- `npx tsc --noEmit` → 0 errors (excluding __tests__)
- `npx vite build` → successful
- Zero `: any` annotations in src/
- Zero `as any` casts in src/
- Zero `@ts-ignore`/`@ts-expect-error` directives in src/

## Remaining Acceptable Patterns
- `as unknown as T` in api-client.ts (generic text→typed response, documented)
- `as Record<string, unknown>` in base-service.ts toPlainRecord (internal audit trail conversion)
- `(result as Record<string, unknown>).id as string` in base-service.ts (generic ID access)
- `as unknown as SupabaseClient` in base-service.ts (lazy initialization pattern, documented)
- Various `as SpecificType` in Select onValueChange handlers (shadcn/ui pattern, constrained by Select options)
- `as const` assertions (correct TypeScript pattern)
