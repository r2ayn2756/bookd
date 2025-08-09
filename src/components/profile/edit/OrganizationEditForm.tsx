"use client";
import { useEffect, useState } from 'react';
import type { OrganizationProfile, UserWithProfile } from '@/types/database';
import { createOrganizationsService } from '@/services/client/organizations';

type Props = {
  userWithProfile: UserWithProfile;
};

export function OrganizationEditForm({ userWithProfile }: Props) {
  const [org, setOrg] = useState<OrganizationProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function ensureOrg() {
      setError(null);
      setSuccess(null);
      try {
        const orgService = createOrganizationsService();
        // If no active org, create or get personal and reload
        let activeOrgId = userWithProfile.active_organization_id ?? null;
        if (!activeOrgId) {
          activeOrgId = await orgService.createOrGetPersonalOrg();
        }
        if (!activeOrgId) return;
        const { data, error } = await (orgService as any)["supabase"]
          .from('organization_profiles')
          .select('*')
          .eq('id', activeOrgId)
          .single();
        if (error) throw error;
        setOrg(data as OrganizationProfile);
      } catch (e: any) {
        console.error('Failed to load organization', e);
        setError('Failed to load organization');
      }
    }
    ensureOrg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!org) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const orgService = createOrganizationsService();
      const updates = {
        name: org.name,
        description: org.description ?? null,
        website_url: org.website_url ?? null,
        phone_number: org.phone_number ?? null,
        email: org.email ?? null,
        city: org.city ?? null,
        country: org.country ?? null,
        accepts_bookings: Boolean(org.accepts_bookings),
        hiring_musicians: Boolean(org.hiring_musicians),
      } as Partial<OrganizationProfile>;
      const updated = await orgService.updateOrganization(org.id, updates);
      if (!updated) throw new Error('Update failed');
      setOrg(updated);
      setSuccess('Saved');
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (!org) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900">Organization Settings</h2>
        <p className="text-gray-600 mt-2">Loading organization…</p>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Organization Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input className="mt-1 w-full border rounded px-3 py-2" value={org.name}
                 onChange={(e) => setOrg({ ...org, name: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea className="mt-1 w-full border rounded px-3 py-2" rows={4} value={org.description ?? ''}
                    onChange={(e) => setOrg({ ...org, description: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Website</label>
          <input className="mt-1 w-full border rounded px-3 py-2" value={org.website_url ?? ''}
                 onChange={(e) => setOrg({ ...org, website_url: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={org.phone_number ?? ''}
                   onChange={(e) => setOrg({ ...org, phone_number: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={org.email ?? ''}
                   onChange={(e) => setOrg({ ...org, email: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={org.city ?? ''}
                   onChange={(e) => setOrg({ ...org, city: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={org.country ?? ''}
                   onChange={(e) => setOrg({ ...org, country: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Accepts bookings</label>
            <select className="mt-1 w-full border rounded px-3 py-2" value={org.accepts_bookings ? 'yes' : 'no'}
                    onChange={(e) => setOrg({ ...org, accepts_bookings: e.target.value === 'yes' })}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hiring musicians</label>
            <select className="mt-1 w-full border rounded px-3 py-2" value={org.hiring_musicians ? 'yes' : 'no'}
                    onChange={(e) => setOrg({ ...org, hiring_musicians: e.target.value === 'yes' })}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`px-4 py-2 rounded ${saving ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white'}`}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
        {success && <span className="text-sm text-green-600">{success}</span>}
      </div>
    </div>
  );
}


