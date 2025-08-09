-- Create org_admins junction table for multi-admin support
-- This table manages the many-to-many relationship between users and organizations
-- allowing multiple users to admin the same organization and users to admin multiple organizations

CREATE TABLE IF NOT EXISTS public.org_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organization_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Admin role and permissions
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'manager', 'editor')),
  permissions JSONB DEFAULT '{}', -- Store specific permissions as JSON
  
  -- Admin status
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES public.users(id), -- Who invited this admin
  invitation_accepted BOOLEAN DEFAULT false,
  invitation_token UUID DEFAULT gen_random_uuid(),
  invitation_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Admin activity
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique combination of user and organization
  UNIQUE(user_id, organization_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_org_admins_user_id ON public.org_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_org_admins_organization_id ON public.org_admins(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_admins_role ON public.org_admins(role);
CREATE INDEX IF NOT EXISTS idx_org_admins_is_active ON public.org_admins(is_active);
CREATE INDEX IF NOT EXISTS idx_org_admins_invitation_token ON public.org_admins(invitation_token);
CREATE INDEX IF NOT EXISTS idx_org_admins_invitation_accepted ON public.org_admins(invitation_accepted);

-- GIN index for permissions JSONB
CREATE INDEX IF NOT EXISTS idx_org_admins_permissions ON public.org_admins USING GIN(permissions);

-- Enable RLS (Row Level Security)
ALTER TABLE public.org_admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for org_admins table
-- Admins can view other admins of organizations they manage
CREATE POLICY "Admins can view org admins" ON public.org_admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_admins oa
      WHERE oa.user_id = auth.uid()
      AND oa.organization_id = org_admins.organization_id
      AND oa.is_active = true
      AND oa.invitation_accepted = true
    )
  );

-- Users can view their own admin relationships
CREATE POLICY "Users can view own admin relationships" ON public.org_admins
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only owners and admins can insert new admin relationships
CREATE POLICY "Owners and admins can invite new admins" ON public.org_admins
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_admins oa
      WHERE oa.user_id = auth.uid()
      AND oa.organization_id = org_admins.organization_id
      AND oa.role IN ('owner', 'admin')
      AND oa.is_active = true
      AND oa.invitation_accepted = true
    )
  );

-- Owners and admins can update admin relationships (except for changing ownership)
CREATE POLICY "Owners and admins can update admin relationships" ON public.org_admins
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_admins oa
      WHERE oa.user_id = auth.uid()
      AND oa.organization_id = org_admins.organization_id
      AND oa.role IN ('owner', 'admin')
      AND oa.is_active = true
      AND oa.invitation_accepted = true
    )
  );

-- Users can accept their own invitations
CREATE POLICY "Users can accept own invitations" ON public.org_admins
  FOR UPDATE
  USING (auth.uid() = user_id AND invitation_accepted = false);

-- Only owners can delete admin relationships (or users can remove themselves)
CREATE POLICY "Owners can remove admins or users can remove themselves" ON public.org_admins
  FOR DELETE
  USING (
    auth.uid() = user_id OR -- Users can remove themselves
    EXISTS (
      SELECT 1 FROM public.org_admins oa
      WHERE oa.user_id = auth.uid()
      AND oa.organization_id = org_admins.organization_id
      AND oa.role = 'owner'
      AND oa.is_active = true
      AND oa.invitation_accepted = true
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_org_admins
  BEFORE UPDATE ON public.org_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT ALL ON public.org_admins TO authenticated;

-- Create function to check if user is admin of organization
CREATE OR REPLACE FUNCTION public.is_organization_admin(org_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_admins
    WHERE organization_id = org_id
    AND org_admins.user_id = is_organization_admin.user_id
    AND is_active = true
    AND invitation_accepted = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's role in organization
CREATE OR REPLACE FUNCTION public.get_user_org_role(org_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.org_admins
  WHERE organization_id = org_id
  AND org_admins.user_id = get_user_org_role.user_id
  AND is_active = true
  AND invitation_accepted = true;
  
  RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;