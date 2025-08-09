-- Add additional RLS policies for organization_profiles that work with org_admins
-- This file adds policies that depend on the org_admins table

-- Policy for organization admins to manage their organizations
CREATE POLICY "Organization admins can manage their organizations" ON public.organization_profiles
  FOR ALL
  USING (
    public.is_organization_admin(id, auth.uid())
  )
  WITH CHECK (
    public.is_organization_admin(id, auth.uid())
  );

-- Policy for organization admins to insert new organizations
-- (Only authenticated users can create organizations, and they automatically become the owner)
CREATE POLICY "Authenticated users can create organizations" ON public.organization_profiles
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Function to automatically create owner relationship when an organization is created
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the creator as the owner of the new organization
  INSERT INTO public.org_admins (user_id, organization_id, role, is_active, invitation_accepted)
  VALUES (auth.uid(), NEW.id, 'owner', true, true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically make creator an owner
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organization_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

-- Grant execute permission on the helper functions
GRANT EXECUTE ON FUNCTION public.is_organization_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_role(UUID, UUID) TO authenticated;