"use client";
import { useEffect, useState } from 'react';
import type { OrganizationProfile, UserWithProfile, OrganizationPerformance } from '@/types/database';
import { createOrganizationsService } from '@/services/client/organizations';

type Props = {
  userWithProfile: UserWithProfile;
};

export function OrganizationEditForm({ userWithProfile }: Props) {
  const [org, setOrg] = useState<OrganizationProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [performances, setPerformances] = useState<OrganizationPerformance[]>([]);
  const [newPerf, setNewPerf] = useState<{ title: string; performance_date: string; venue: string; description: string }>({ title: '', performance_date: '', venue: '', description: '' });

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
        try {
          const perfs = await orgService.listOrganizationPerformances(activeOrgId);
          setPerformances(perfs);
        } catch {
          setPerformances([]);
        }
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
        headliner: (org as any).headliner ?? null,
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

  async function addPerformance(e: React.FormEvent) {
    e.preventDefault();
    if (!org || !newPerf.title.trim()) return;
    try {
      const orgService = createOrganizationsService();
      const created = await orgService.createOrganizationPerformance(org.id, {
        title: newPerf.title.trim(),
        performance_date: newPerf.performance_date ? newPerf.performance_date : null,
        venue: newPerf.venue || null,
        description: newPerf.description || null,
      });
      if (created) {
        setPerformances((prev) => [created, ...prev]);
        setNewPerf({ title: '', performance_date: '', venue: '', description: '' });
      }
    } catch (e) {
      console.error('Failed to add performance', e);
    }
  }

  async function deletePerformance(id: string) {
    try {
      const orgService = createOrganizationsService();
      const ok = await orgService.deleteOrganizationPerformance(id);
      if (ok) setPerformances((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error('Failed to delete performance', e);
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
          <label className="block text-sm font-medium text-gray-700">Headliner</label>
          <input className="mt-1 w-full border rounded px-3 py-2" value={(org as any).headliner ?? ''}
                 onChange={(e) => setOrg({ ...org, headliner: e.target.value } as any)} />
          <p className="text-xs text-gray-500 mt-1">A short tagline that appears under the organization name.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea className="mt-1 w-full border rounded px-3 py-2" rows={4} value={org.description ?? ''}
                    onChange={(e) => setOrg({ ...org, description: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input className="mt-1 w-full border rounded px-3 py-2" value={[org.address, org.city, org.state_province, org.postal_code, org.country].filter(Boolean).join(', ')}
                 onChange={(e) => setOrg({ ...org, address: e.target.value })} placeholder="Street, City, State, ZIP, Country" />
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

        {/* City/Country removed in favor of single address line above (kept values in state) */}

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

      {/* Major Performances */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Major Performances</h3>
        <form onSubmit={addPerformance} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input
            type="text"
            placeholder="Title"
            className="border rounded px-3 py-2"
            value={newPerf.title}
            onChange={(e) => setNewPerf({ ...newPerf, title: e.target.value })}
            required
          />
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={newPerf.performance_date}
            onChange={(e) => setNewPerf({ ...newPerf, performance_date: e.target.value })}
          />
          <input
            type="text"
            placeholder="Venue"
            className="border rounded px-3 py-2"
            value={newPerf.venue}
            onChange={(e) => setNewPerf({ ...newPerf, venue: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Description"
              className="flex-1 border rounded px-3 py-2"
              value={newPerf.description}
              onChange={(e) => setNewPerf({ ...newPerf, description: e.target.value })}
            />
            <button type="submit" className="px-4 py-2 bg-[#7823E1] text-white rounded">Add</button>
          </div>
        </form>

        {performances.length === 0 ? (
          <p className="text-sm text-gray-600">No performances yet.</p>
        ) : (
          <ul className="divide-y">
            {performances.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{p.title}</div>
                  <div className="text-sm text-gray-600">
                    {[p.performance_date ? new Date(p.performance_date).toLocaleDateString() : null, p.venue]
                      .filter(Boolean)
                      .join(' • ')}
                  </div>
                  {p.description && <div className="text-sm text-gray-600">{p.description}</div>}
                </div>
                <button onClick={() => deletePerformance(p.id)} className="text-red-600 hover:text-red-700 text-sm">Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


