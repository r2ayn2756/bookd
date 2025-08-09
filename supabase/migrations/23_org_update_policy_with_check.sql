-- Safely add an additional UPDATE policy that includes WITH CHECK for organization_profiles
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename = 'organization_profiles'
      AND policyname = 'Org admins can update organizations v3'
  ) THEN
    EXECUTE '
      CREATE POLICY "Org admins can update organizations v3" ON public.organization_profiles
        FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM public.org_admins oa
            WHERE oa.organization_id = organization_profiles.id
              AND oa.user_id = auth.uid()
              AND oa.role IN (''owner'',''admin'')
              AND oa.is_active = true
              AND oa.invitation_accepted = true
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.org_admins oa
            WHERE oa.organization_id = organization_profiles.id
              AND oa.user_id = auth.uid()
              AND oa.role IN (''owner'',''admin'')
              AND oa.is_active = true
              AND oa.invitation_accepted = true
          )
        )
    ';
  END IF;
END
$block$;


