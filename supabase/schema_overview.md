# Bookd Database Schema Overview

## Tables Created

### 1. users
**Purpose**: Extends Supabase auth.users with additional profile data and Google OAuth integration

**Key Fields**:
- `id` (UUID, FK to auth.users): Primary key
- `email` (TEXT): User's email address
- `full_name` (TEXT): User's full name
- `avatar_url` (TEXT): Profile picture URL
- `google_id` (TEXT): Google OAuth ID for authentication

**Relationships**:
- References `auth.users(id)` (Supabase built-in auth table)
- Referenced by `individual_profiles.user_id`
- Referenced by `org_admins.user_id`

### 2. individual_profiles
**Purpose**: Detailed profiles for individual musicians and performers

**Key Fields**:
- `id` (UUID): Primary key
- `user_id` (UUID, FK): References users table
- `stage_name` (TEXT): Professional/stage name
- `primary_instrument` (TEXT): Main instrument
- `instruments` (TEXT[]): Array of all instruments
- `genres` (TEXT[]): Musical genres
- `looking_for_gigs` (BOOLEAN): Available for bookings
- `base_rate_per_hour` (DECIMAL): Hourly rate
- `availability` (JSONB): Calendar availability data

**Relationships**:
- `user_id` → `users.id` (ONE-TO-ONE)

### 3. organization_profiles
**Purpose**: Profiles for venues, ensembles, orchestras, and other music organizations

**Key Fields**:
- `id` (UUID): Primary key
- `name` (TEXT): Organization name
- `organization_type` (TEXT): Type (venue, ensemble, orchestra, etc.)
- `address`, `city`, `state_province`, `country`: Location data
- `capacity` (INTEGER): Venue capacity
- `genres` (TEXT[]): Musical genres they work with
- `accepts_bookings` (BOOLEAN): Open for bookings
- `base_rental_rate_per_hour` (DECIMAL): Rental rate

**Relationships**:
- Referenced by `org_admins.organization_id`

### 4. org_admins
**Purpose**: Junction table managing multi-admin support for organizations

**Key Fields**:
- `id` (UUID): Primary key
- `user_id` (UUID, FK): References users table
- `organization_id` (UUID, FK): References organization_profiles table
- `role` (TEXT): Admin role (owner, admin, manager, editor)
- `is_active` (BOOLEAN): Admin status
- `invitation_accepted` (BOOLEAN): Invitation status

**Relationships**:
- `user_id` → `users.id` (MANY-TO-MANY)
- `organization_id` → `organization_profiles.id` (MANY-TO-MANY)

## Foreign Key Relationships

```
auth.users (Supabase built-in)
    ↓ (1:1)
users
    ↓ (1:1)                    ↓ (1:M)
individual_profiles        org_admins
                              ↓ (M:1)
                         organization_profiles
```

## Row Level Security (RLS) Policies

### users table
- ✅ Users can view their own profile
- ✅ Users can update their own profile
- ✅ Users can insert their own profile

### individual_profiles table
- ✅ Users can manage their own individual profile (CRUD)
- ✅ Public can view verified and available profiles

### organization_profiles table
- ✅ Authenticated users can view active organizations
- ✅ Anonymous users can view verified organizations only
- ✅ Organization admins can manage their organizations
- ✅ Authenticated users can create organizations (auto-become owner)

### org_admins table
- ✅ Admins can view other admins of their organizations
- ✅ Users can view their own admin relationships
- ✅ Owners and admins can invite new admins
- ✅ Users can accept their own invitations
- ✅ Owners can remove admins, users can remove themselves

## Helper Functions

### `is_organization_admin(org_id, user_id)`
Checks if a user is an admin of a specific organization

### `get_user_org_role(org_id, user_id)`
Returns the user's role in a specific organization

### `handle_new_organization()`
Trigger function that automatically makes the creator an owner when a new organization is created

## Indexes

### Performance Indexes
- Email and Google ID lookups on users
- Location-based searches on individual and organization profiles
- Admin relationship lookups
- Booking availability filters

### GIN Indexes
- Array fields (instruments, genres, amenities)
- JSONB fields (social_links, availability, permissions)

## Migration Files

1. `01_create_users_table.sql` - Users table with Google OAuth
2. `02_create_individual_profiles_table.sql` - Individual musician profiles
3. `03_create_organization_profiles_table.sql` - Organization profiles
4. `04_create_org_admins_table.sql` - Multi-admin junction table
5. `05_add_organization_admin_policies.sql` - Additional organization policies

## Next Steps

To apply these migrations to your Supabase instance:

1. Run each migration file in order in your Supabase SQL editor
2. Verify the tables and policies are created correctly
3. Test the RLS policies with different user roles
4. Consider adding additional indexes based on query patterns

## Security Notes

- All tables have RLS enabled
- Proper foreign key constraints prevent orphaned records
- Admin functions use SECURITY DEFINER for proper privilege escalation
- Anonymous users have limited read access to verified content only