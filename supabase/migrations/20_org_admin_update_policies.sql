-- Allow owners/admins to update their organization profile rows

DROP POLICY IF EXISTS "Org admins can update organizations" ON public.organization_profiles;
CREATE POLICY "Org admins can update organizations" ON public.organization_profiles
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
  );


