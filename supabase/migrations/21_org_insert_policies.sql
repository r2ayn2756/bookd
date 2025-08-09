-- Allow authenticated users to create new organizations
DROP POLICY IF EXISTS "Authenticated can insert organizations" ON public.organization_profiles;
CREATE POLICY "Authenticated can insert organizations" ON public.organization_profiles
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow users to assign themselves as owner admin for an organization
DROP POLICY IF EXISTS "User can insert self as owner admin" ON public.org_admins;
CREATE POLICY "User can insert self as owner admin" ON public.org_admins
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'owner'
  );


