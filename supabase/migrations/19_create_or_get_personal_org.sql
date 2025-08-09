-- Creates (or returns) a personal organization for the current user and sets it as active_organization_id

CREATE OR REPLACE FUNCTION public.create_or_get_personal_org()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id UUID;
  v_full_name TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Try to find an existing organization where the user is owner
  SELECT oa.organization_id INTO v_org_id
  FROM public.org_admins oa
  WHERE oa.user_id = v_user_id
    AND oa.role = 'owner'
    AND oa.is_active = true
    AND oa.invitation_accepted = true
  LIMIT 1;

  IF v_org_id IS NOT NULL THEN
    -- Ensure on users
    UPDATE public.users SET active_organization_id = v_org_id WHERE id = v_user_id;
    RETURN v_org_id;
  END IF;

  -- Get user name for default organization name
  SELECT full_name INTO v_full_name FROM public.users WHERE id = v_user_id;
  IF v_full_name IS NULL OR length(trim(v_full_name)) = 0 THEN
    v_full_name := 'My Organization';
  END IF;

  -- Create organization
  INSERT INTO public.organization_profiles (name, description, organization_type, active)
  VALUES (v_full_name, NULL, 'other', true)
  RETURNING id INTO v_org_id;

  -- Create admin relationship as owner
  INSERT INTO public.org_admins (user_id, organization_id, role, permissions, is_active, invitation_accepted)
  VALUES (v_user_id, v_org_id, 'owner', '{}', true, true);

  -- Set as user's active organization
  UPDATE public.users SET active_organization_id = v_org_id WHERE id = v_user_id;

  RETURN v_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_or_get_personal_org() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_or_get_personal_org() TO authenticated;


