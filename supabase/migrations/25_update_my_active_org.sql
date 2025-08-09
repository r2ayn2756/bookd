-- Updates allowed fields on the organization set as the caller's active_organization_id
-- SECURITY DEFINER to simplify RLS interactions while scoping by active_organization_id

CREATE OR REPLACE FUNCTION public.update_my_active_org(
  p_name TEXT,
  p_description TEXT,
  p_website_url TEXT,
  p_phone_number TEXT,
  p_email TEXT,
  p_city TEXT,
  p_country TEXT,
  p_accepts_bookings BOOLEAN,
  p_hiring_musicians BOOLEAN
) RETURNS public.organization_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id UUID;
  v_updated public.organization_profiles;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT active_organization_id INTO v_org_id FROM public.users WHERE id = v_user_id;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization set';
  END IF;

  UPDATE public.organization_profiles SET
    name = COALESCE(p_name, name),
    description = p_description,
    website_url = p_website_url,
    phone_number = p_phone_number,
    email = p_email,
    city = p_city,
    country = p_country,
    accepts_bookings = COALESCE(p_accepts_bookings, accepts_bookings),
    hiring_musicians = COALESCE(p_hiring_musicians, hiring_musicians)
  WHERE id = v_org_id
  RETURNING * INTO v_updated;

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_active_org(
  TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,BOOLEAN,BOOLEAN
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_active_org(
  TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,BOOLEAN,BOOLEAN
) TO authenticated;


