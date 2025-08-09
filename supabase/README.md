# Supabase Database Setup for Bookd

## Overview

This directory contains the SQL migration files to set up the core database schema for the Bookd application. The schema supports Google OAuth authentication, individual musician profiles, organization profiles (venues/ensembles), and multi-admin support for organizations.

## Migration Files

Run these files in order in your Supabase SQL editor:

### 1. `01_create_users_table.sql`
- Creates the main users table that extends Supabase auth
- Includes Google OAuth fields
- Sets up basic RLS policies
- Creates the `handle_updated_at()` trigger function

### 2. `02_create_individual_profiles_table.sql`
- Creates detailed profiles for individual musicians
- Includes instruments, genres, availability, rates
- Sets up comprehensive indexing for search performance
- Implements RLS for privacy and public visibility

### 3. `03_create_organization_profiles_table.sql`
- Creates profiles for venues, ensembles, orchestras, etc.
- Supports location-based searches with lat/lng
- Includes venue-specific and ensemble-specific fields
- Sets up basic RLS policies

### 4. `04_create_org_admins_table.sql`
- Creates junction table for multi-admin support
- Includes invitation system with tokens and expiration
- Implements role-based permissions (owner, admin, manager, editor)
- Creates helper functions for admin checks

### 5. `05_add_organization_admin_policies.sql`
- Adds advanced RLS policies that work with the admin system
- Creates auto-ownership trigger for new organizations
- Grants proper permissions on helper functions

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Copy and paste each migration file content in order
4. Run each migration by clicking "Run"
5. Verify each migration completes without errors before proceeding

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db reset --linked
```

### Option 3: psql (Advanced)
```bash
# Connect to your Supabase database
psql "postgresql://[your-connection-string]"

# Run each file in order
\i 01_create_users_table.sql
\i 02_create_individual_profiles_table.sql
\i 03_create_organization_profiles_table.sql
\i 04_create_org_admins_table.sql
\i 05_add_organization_admin_policies.sql
```

## Verification

After running all migrations, verify the setup:

### 1. Check Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'individual_profiles', 'organization_profiles', 'org_admins');
```

### 2. Check RLS is Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'individual_profiles', 'organization_profiles', 'org_admins');
```

### 3. Check Helper Functions
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_organization_admin', 'get_user_org_role', 'handle_updated_at');
```

## Environment Variables

Make sure your `.env.local` file includes:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Google OAuth Setup

After setting up the database:

1. Configure Google OAuth in Supabase Auth settings
2. Add your Google Client ID and Secret
3. Set up redirect URLs for your application
4. Test the authentication flow

## Next Steps

1. **Apply the migrations** to your Supabase instance
2. **Set up Google OAuth** in Supabase dashboard
3. **Test the authentication flow** with a test user
4. **Create test data** to verify the relationships work correctly
5. **Implement the frontend components** that interact with these tables

## TypeScript Support

The database types are defined in `src/types/database.ts` and can be used with the Supabase TypeScript client:

```typescript
import { Database } from '@/types/database'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Make sure you're authenticated when testing queries
2. **Foreign Key Violations**: Ensure parent records exist before creating child records
3. **Permission Denied**: Check that RLS policies allow the operation for your user role

### Testing RLS Policies

```sql
-- Test as authenticated user
SET request.jwt.claims TO '{"sub": "test-user-id", "role": "authenticated"}';

-- Test your queries here

-- Reset to default
RESET request.jwt.claims;
```

## Schema Diagram

```
auth.users (Supabase)
    ↓ (1:1)
users
    ↓ (1:1)                    ↓ (1:M)
individual_profiles        org_admins
                              ↓ (M:1)
                         organization_profiles
```

For detailed schema information, see `schema_overview.md`.