import { createClient } from '@/lib/supabase/client';
import type { OrganizationProfile, OrganizationPerformance } from '@/types/database';

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
    // Try RPC first (uses active_organization_id)
    const rpc = await (this.supabase as any).rpc('update_my_active_org', {
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

    if (!(rpc as any).error && (rpc as any).data) {
      let updated = (rpc as any).data as OrganizationProfile;
      // Apply supplemental fields (like address or headliner) directly if provided
      const supplemental: any = {};
      if (Object.prototype.hasOwnProperty.call(updates, 'address')) supplemental.address = (updates as any).address ?? null;
      if (Object.prototype.hasOwnProperty.call(updates, 'headliner')) supplemental.headliner = (updates as any).headliner ?? null;
      if (Object.keys(supplemental).length > 0) {
        const { data: row, error: supErr } = await this.supabase
          .from('organization_profiles')
          .update(supplemental)
          .eq('id', orgId)
          .select('*')
          .single();
        if (!supErr && row) updated = row as OrganizationProfile;
      }
      return updated;
    }

    // Fallback: Direct update by orgId (works if user is an org admin under RLS)
    const directPayload: any = {};
    const fields = ['name','description','website_url','phone_number','email','city','country','accepts_bookings','hiring_musicians','address','headliner'] as const;
    for (const key of fields) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        (directPayload as any)[key] = (updates as any)[key as keyof OrganizationProfile] as any;
      }
    }
    const { data: directRow, error: directErr } = await this.supabase
      .from('organization_profiles')
      .update(directPayload)
      .eq('id', orgId)
      .select('*')
      .single();
    if (directErr) {
      console.warn('Direct organization update failed:', {
        message: (directErr as any)?.message,
        details: (directErr as any)?.details,
      });
      return null;
    }
    return directRow as OrganizationProfile;
  }

  async listOrganizationPerformances(orgId: string): Promise<OrganizationPerformance[]> {
    const { data, error } = await this.supabase
      .from('organization_performances')
      .select('*')
      .eq('organization_id', orgId)
      .order('performance_date', { ascending: false });
    if (error) {
      // Avoid noisy overlay when table not yet migrated
      console.warn('Org performances unavailable:', (error as any)?.message || error);
      return [];
    }
    return (data || []) as OrganizationPerformance[];
  }

  async createOrganizationPerformance(orgId: string, payload: {
    title: string;
    performance_date?: string | null;
    venue?: string | null;
    description?: string | null;
  }): Promise<OrganizationPerformance | null> {
    const { data, error } = await this.supabase
      .from('organization_performances')
      .insert([{ organization_id: orgId, ...payload }])
      .select('*')
      .single();
    if (error) {
      console.warn('Error creating org performance (client):', error);
      return null;
    }
    return data as OrganizationPerformance;
  }

  async deleteOrganizationPerformance(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('organization_performances')
      .delete()
      .eq('id', id);
    if (error) {
      console.warn('Error deleting org performance (client):', error);
      return false;
    }
    return true;
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


