-- Additional safe policy: allow a user to update the organization that is set as their active_organization_id
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename = 'organization_profiles'
      AND policyname = 'User can update active organization'
  ) THEN
    EXECUTE '
      CREATE POLICY "User can update active organization" ON public.organization_profiles
        FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.active_organization_id = organization_profiles.id
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.active_organization_id = organization_profiles.id
          )
        )
    ';
  END IF;
END
$block$;


