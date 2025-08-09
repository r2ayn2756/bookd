-- Function: get_my_organizations_admin
-- Returns active organizations where the current user is an accepted active admin

CREATE OR REPLACE FUNCTION public.get_my_organizations_admin()
RETURNS SETOF public.organization_profiles
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT op.*
  FROM public.organization_profiles op
  WHERE op.active = true
    AND EXISTS (
      SELECT 1
      FROM public.org_admins oa
      WHERE oa.organization_id = op.id
        AND oa.user_id = auth.uid()
        AND oa.is_active = true
        AND oa.invitation_accepted = true
    );
$$;

-- Restrict execution to authenticated users
REVOKE ALL ON FUNCTION public.get_my_organizations_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_organizations_admin() TO authenticated;


