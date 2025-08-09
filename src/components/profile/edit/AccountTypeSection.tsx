"use client";
import { useEffect, useMemo, useState } from 'react';
import { createUsersService } from '@/services/client/users';
import type { User, OrganizationProfile } from '@/types/database';
import { createOrganizationsService } from '@/services/client/organizations';

type Props = {
  user: User;
  onSaved?: (payload: { account_type: 'artist' | 'organization'; active_organization_id: string | null }) => void;
  onChange?: (account_type: 'artist' | 'organization') => void;
  hideOrganizationPicker?: boolean;
};

export function AccountTypeSection({ user, onSaved, onChange, hideOrganizationPicker }: Props) {
  const [accountType, setAccountType] = useState<'artist' | 'organization'>(user.account_type ?? 'artist');
  const [activeOrgId, setActiveOrgId] = useState<string | null>(user.active_organization_id ?? null);
  const [organizations, setOrganizations] = useState<OrganizationProfile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // When switching to organization, fetch organizations the user admins
    async function loadOrganizations() {
      try {
        const orgService = createOrganizationsService();
        const orgs = await orgService.listMyOrganizationsAdmin();
        setOrganizations(orgs);
      } catch (e: any) {
        console.error('Failed to load organizations', e);
      }
    }
    if (accountType === 'organization') {
      loadOrganizations();
    }
  }, [accountType, user.id]);

  const canSave = useMemo(() => {
    if (accountType === 'artist') return true;
    if (hideOrganizationPicker) return true;
    return Boolean(activeOrgId);
  }, [accountType, activeOrgId, hideOrganizationPicker]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const usersService = createUsersService();
      const updates: Partial<User> = {
        account_type: accountType,
        active_organization_id: accountType === 'organization' ? activeOrgId : null,
      } as any;
      await usersService.updateCurrentUser(updates);
      if (onSaved) {
        onSaved({ account_type: accountType, active_organization_id: accountType === 'organization' ? (activeOrgId ?? null) : null });
      }
      setSuccess('Saved');
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Type</h2>
      <p className="text-sm text-gray-500 mb-6">Choose how you appear across Bookd. Switch between Artist and Organization. More organization subdivisions coming soon.</p>

      <div className="flex gap-4 mb-4">
        <button
          type="button"
          onClick={() => { setAccountType('artist'); onChange?.('artist'); }}
          className={`px-4 py-2 rounded border ${accountType === 'artist' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
        >
          Artist
        </button>
        <button
          type="button"
          onClick={() => { setAccountType('organization'); onChange?.('organization'); }}
          className={`px-4 py-2 rounded border ${accountType === 'organization' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
        >
          Organization
        </button>
      </div>

      {accountType === 'organization' && !hideOrganizationPicker && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Active Organization</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={activeOrgId ?? ''}
            onChange={(e) => setActiveOrgId(e.target.value || null)}
          >
            <option value="">Select an organization…</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
          <div className="text-sm text-gray-500">Don’t see your organization? You’ll be able to create one soon.</div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className={`px-4 py-2 rounded ${!canSave || saving ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white'}`}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
        {success && <span className="text-sm text-green-600">{success}</span>}
      </div>
    </div>
  );
}


