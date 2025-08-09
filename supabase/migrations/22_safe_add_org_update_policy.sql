-- Safely add an update policy for organization_profiles without dropping existing ones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'organization_profiles' 
      AND policyname = 'Org admins can update organizations v2'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Org admins can update organizations v2" ON public.organization_profiles
        FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM public.org_admins oa
            WHERE oa.organization_id = organization_profiles.id
              AND oa.user_id = auth.uid()
              AND oa.role IN ('owner','admin')
              AND oa.is_active = true
              AND oa.invitation_accepted = true
          )
        )
    $$;
  END IF;
END$$;


