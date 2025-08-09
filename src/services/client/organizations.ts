import { createClient } from '@/lib/supabase/client';
import type { OrganizationProfile } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export class OrganizationsService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async listMyOrganizationsAdmin(): Promise<OrganizationProfile[]> {
    const { data: authData } = await this.supabase.auth.getUser();
    const authUserId = authData?.user?.id;
    if (!authUserId) return [];

    // Use RPC to respect RLS and avoid complex joins on client
    const { data, error } = await (this.supabase as any).rpc('get_my_organizations_admin');
    if (error) {
      console.error('Error listing user organizations (client):', error);
      return [];
    }
    return (data || []) as OrganizationProfile[];
  }

  async createOrGetPersonalOrg(): Promise<string | null> {
    // First attempt RPC
    const { data, error } = await (this.supabase as any).rpc('create_or_get_personal_org');
    if (!error && data) return data as string;
    if (error) {
      console.error('Error create_or_get_personal_org (client):', {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
      });
    }

    // Fallback: do it client-side under RLS
    const { data: authData, error: authErr } = await this.supabase.auth.getUser();
    if (authErr || !authData?.user?.id) return null;
    const userId = authData.user.id;

    // If already owner somewhere, set active and return
    const { data: ownerRows } = await this.supabase
      .from('org_admins')
      .select('organization_id')
      .eq('user_id', userId)
      .eq('role', 'owner')
      .eq('is_active', true)
      .eq('invitation_accepted', true)
      .limit(1);
    const existingOrgId = ownerRows?.[0]?.organization_id as string | undefined;
    if (existingOrgId) {
      await this.supabase.from('users').update({ active_organization_id: existingOrgId }).eq('id', userId);
      return existingOrgId;
    }

    // Get full name for default org name
    const { data: userRow } = await this.supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();
    const defaultName = (userRow?.full_name && userRow.full_name.trim().length > 0)
      ? userRow.full_name
      : 'My Organization';

    // Create organization
    const { data: orgInsert, error: orgErr } = await this.supabase
      .from('organization_profiles')
      .insert({ name: defaultName, organization_type: 'other', active: true })
      .select('id')
      .single();
    if (orgErr || !orgInsert?.id) {
      console.error('Fallback org insert failed:', orgErr);
      return null;
    }
    const orgId = orgInsert.id as string;

    // Create owner admin link
    const { error: adminErr } = await this.supabase
      .from('org_admins')
      .insert({ user_id: userId, organization_id: orgId, role: 'owner', is_active: true, invitation_accepted: true });
    if (adminErr) {
      console.error('Fallback org_admins insert failed:', adminErr);
      return null;
    }

    // Set active organization
    await this.supabase.from('users').update({ active_organization_id: orgId }).eq('id', userId);
    return orgId;
  }

  async updateOrganization(orgId: string, updates: Partial<OrganizationProfile>): Promise<OrganizationProfile | null> {
    // Prefer RPC to bypass RLS complexity using SECURITY DEFINER
    const { data, error } = await (this.supabase as any).rpc('update_my_active_org', {
      p_name: updates.name ?? null,
      p_description: (updates as any).description ?? null,
      p_website_url: (updates as any).website_url ?? null,
      p_phone_number: (updates as any).phone_number ?? null,
      p_email: (updates as any).email ?? null,
      p_city: (updates as any).city ?? null,
      p_country: (updates as any).country ?? null,
      p_accepts_bookings: (updates as any).accepts_bookings ?? null,
      p_hiring_musicians: (updates as any).hiring_musicians ?? null,
    });
    if (error) {
      console.error('Error updating organization via RPC (client):', {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
      });
      return null;
    }
    return data as OrganizationProfile;
  }

  async listOrganizations(limit: number = 24, offset: number = 0): Promise<OrganizationProfile[]> {
    const { data, error } = await this.supabase
      .from('organization_profiles')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error listing organizations (client):', error);
      return [];
    }

    return (data || []) as OrganizationProfile[];
  }

  async searchOrganizations(query: string, limit: number = 20, offset: number = 0): Promise<OrganizationProfile[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const { data, error } = await this.supabase
      .from('organization_profiles')
      .select('*')
      .eq('active', true)
      .or(`name.ilike.%${trimmed}%,city.ilike.%${trimmed}%,state_province.ilike.%${trimmed}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error searching organizations (client):', error);
      return [];
    }

    return (data || []) as OrganizationProfile[];
  }
}

export function createOrganizationsService() {
  const supabase = createClient();
  return new OrganizationsService(supabase);
}


