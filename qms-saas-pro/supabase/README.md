# QMS SaaS Pro - Supabase Migrations

This directory contains PostgreSQL migration files for setting up the QMS SaaS Pro database on Supabase.

## Migration Files

| File | Description |
|------|-------------|
| `20240101000000_initial_schema.sql` | Complete database schema with 19 tables, indexes, and triggers |
| `20240101000001_rls_policies.sql` | Row Level Security policies for multi-tenant access |
| `20240101000002_seed_data.sql` | Demo/development seed data |

## Prerequisites

- A Supabase project (create one at [supabase.com](https://supabase.com))
- Supabase CLI installed (optional, for CLI-based deployment)

## Environment Variables

Set the following environment variables in your application:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required for auth.users integration
SUPABASE_AUTH_URL=https://your-project.supabase.co/auth/v1
```

## Applying Migrations

### Option 1: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Or apply individual migrations
supabase db push --include 20240101000000_initial_schema.sql
supabase db push --include 20240101000001_rls_policies.sql
supabase db push --include 20240101000002_seed_data.sql
```

### Option 2: Supabase Dashboard (SQL Editor)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the migration SQL content
4. Run each migration in order:
   - First: `20240101000000_initial_schema.sql` (schema)
   - Second: `20240101000001_rls_policies.sql` (RLS policies)
   - Third: `20240101000002_seed_data.sql` (seed data)

### Option 3: Direct PostgreSQL Connection

```bash
# Using psql
psql "postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres" \
  -f 20240101000000_initial_schema.sql
psql "postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres" \
  -f 20240101000001_rls_policies.sql
psql "postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres" \
  -f 20240101000002_seed_data.sql
```

## Important Notes

### Profile IDs and auth.users

The `profiles` table references `auth.users(id)` via a foreign key. Before inserting seed data:
- Create matching users in Supabase Auth, or
- Use the **service_role key** to bypass the FK constraint during initial setup, or
- Temporarily disable the FK constraint

### RLS Policies

- The service_role key bypasses all RLS policies - use it for API routes and backend operations
- The anon key respects RLS policies - use it for client-side operations
- Audit trail entries can only be inserted via the service_role (no user UPDATE/DELETE allowed)

### UUID Mapping

Seed data uses hardcoded UUIDs for cross-table consistency:

| Mock ID | UUID |
|---------|------|
| org-001 | `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11` |
| user-001 | `b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01` |
| user-002 | `b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02` |
| user-003 | `b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03` |
| user-004 | `b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04` |
| user-005 | `b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05` |
| user-006 | `b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06` |

### Column Name Mapping (TypeScript camelCase → PostgreSQL snake_case)

The PostgreSQL schema uses `snake_case` column names while the TypeScript types use `camelCase`. Use a transform layer (e.g., Supabase client with `toCamelCase` utility) to map between them.

### Resetting the Database

To start fresh:

```sql
-- WARNING: This will delete all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then re-apply migrations in order.
