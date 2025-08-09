'use client';

import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createUsersService } from '@/services/client/users';
import { createOrganizationsService } from '@/services/client/organizations';
import type { UserWithProfile, OrganizationProfile } from '@/types/database';
import { Avatar } from '@/components/profile/ProfilePictureUpload';

// Genre color mapping (inspired by demo cards)
const GENRE_COLORS: Record<string, { bg: string; text: string }> = {
  classical: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  flamenco: { bg: 'bg-red-100', text: 'text-red-700' },
  jazz: { bg: 'bg-purple-100', text: 'text-purple-700' },
  blues: { bg: 'bg-blue-100', text: 'text-blue-700' },
  folk: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  rock: { bg: 'bg-gray-100', text: 'text-gray-700' },
  pop: { bg: 'bg-pink-100', text: 'text-pink-700' },
  country: { bg: 'bg-amber-100', text: 'text-amber-700' },
  electronic: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  indie: { bg: 'bg-green-100', text: 'text-green-700' },
};

function GenrePill({ name }: { name: string }) {
  const key = name.toLowerCase();
  const colors = GENRE_COLORS[key] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  return (
    <span className={`px-2 py-1 ${colors.bg} ${colors.text} text-xs rounded-full capitalize`}>{name}</span>
  );
}

export default function NetworkPage() {
  const [user, setUser] = useState<User | null>(null);
  const [showPeople, setShowPeople] = useState(true);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<UserWithProfile[]>([]);
  const [initial, setInitial] = useState<UserWithProfile[]>([]);
  const [orgResults, setOrgResults] = useState<OrganizationProfile[]>([]);
  const [orgInitial, setOrgInitial] = useState<OrganizationProfile[]>([]);
  const [onlyConnections, setOnlyConnections] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        redirect('/');
      }
    };
    
    getUser();
  }, [supabase.auth]);

  // Load initial discovery list (users or organizations)
  useEffect(() => {
    const loadInitial = async () => {
      try {
        if (showPeople) {
          const service = createUsersService();
          const data = onlyConnections
            ? await service.listMyConnections(50, 0)
            : await service.listUsers(24, 0);
          setInitial(data.filter((u) => u.id !== user?.id));
        } else {
          const orgService = createOrganizationsService();
          const orgs = await orgService.listOrganizations(24, 0);
          setOrgInitial(orgs);
        }
      } catch (e) {
        console.error('Failed loading initial list', e);
        if (showPeople) setInitial([]); else setOrgInitial([]);
      }
    };
    loadInitial();
  }, [onlyConnections, user?.id, showPeople]);

  // Search users or organizations by query (debounced)
  useEffect(() => {
    const doSearch = async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        setResults([]);
        setOrgResults([]);
        return;
      }
      setSearching(true);
      try {
        if (showPeople) {
          const service = createUsersService();
          const data = await service.searchUsers(trimmed, 20, 0);
          setResults(data.filter((u) => u.id !== user?.id));
        } else {
          const orgService = createOrganizationsService();
          const data = await orgService.searchOrganizations(trimmed, 20, 0);
          setOrgResults(data);
        }
      } catch (e) {
        console.error('Search failed', e);
        if (showPeople) setResults([]); else setOrgResults([]);
      } finally {
        setSearching(false);
      }
    };
    const handle = setTimeout(doSearch, 300);
    return () => clearTimeout(handle);
  }, [query, user?.id, showPeople]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Network</h1>
          <p className="text-gray-600 mt-1">Connect with musicians and organizations in your area</p>
        </div>
      </div>

      {/* Search and Toggle Section */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Search Bar */}
        <div className="flex justify-center mb-6">
          <input
            type="text"
            placeholder="Search musicians and organizations..."
            className="w-80 px-6 py-3 border border-gray-300 rounded-full text-center text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7823E1] focus:border-transparent placeholder-gray-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Connections Toggle */}
        <div className="flex justify-center mb-4">
          <ToggleSwitch
            checked={onlyConnections}
            onChange={setOnlyConnections}
            label="Show only my connections"
          />
        </div>

        {/* Toggle Button */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-full p-1 flex">
            <button
              onClick={() => setShowPeople(true)}
              className={`px-8 py-3 rounded-full text-sm font-medium transition-colors ${
                showPeople
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              style={showPeople ? {backgroundColor: '#7823E1'} : {}}
            >
              Artists
            </button>
            <button
              onClick={() => setShowPeople(false)}
              className={`px-8 py-3 rounded-full text-sm font-medium transition-colors ${
                !showPeople
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              style={!showPeople ? {backgroundColor: '#7823E1'} : {}}
            >
              Organizations
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap justify-center gap-3">
          <select className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2" style={{backgroundColor: '#E8DFFF', color: '#7823E1', borderColor: '#7823E1', '--tw-ring-color': '#7823E1'} as React.CSSProperties}>
            <option className="text-gray-700">Instrument</option>
            <option className="text-gray-700">Guitar</option>
            <option className="text-gray-700">Piano</option>
            <option className="text-gray-700">Violin</option>
            <option className="text-gray-700">Drums</option>
            <option className="text-gray-700">Saxophone</option>
            <option className="text-gray-700">Trumpet</option>
            <option className="text-gray-700">Oboe</option>
            <option className="text-gray-700">Bass</option>
            <option className="text-gray-700">Vocals</option>
          </select>

          <select className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2" style={{backgroundColor: '#E8DFFF', color: '#7823E1', borderColor: '#7823E1', '--tw-ring-color': '#7823E1'} as React.CSSProperties}>
            <option className="text-gray-700">Genre</option>
            <option className="text-gray-700">Classical</option>
            <option className="text-gray-700">Jazz</option>
            <option className="text-gray-700">Rock</option>
            <option className="text-gray-700">Pop</option>
            <option className="text-gray-700">Country</option>
            <option className="text-gray-700">Blues</option>
            <option className="text-gray-700">Folk</option>
            <option className="text-gray-700">Electronic</option>
            <option className="text-gray-700">Hip-Hop</option>
          </select>

          <select className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2" style={{backgroundColor: '#E8DFFF', color: '#7823E1', borderColor: '#7823E1', '--tw-ring-color': '#7823E1'} as React.CSSProperties}>
            <option className="text-gray-700">Location</option>
            <option className="text-gray-700">Within 5 miles</option>
            <option className="text-gray-700">Within 10 miles</option>
            <option className="text-gray-700">Within 25 miles</option>
            <option className="text-gray-700">Columbia, SC</option>
            <option className="text-gray-700">Charleston, SC</option>
            <option className="text-gray-700">Greenville, SC</option>
            <option className="text-gray-700">Charlotte, NC</option>
            <option className="text-gray-700">Atlanta, GA</option>
            <option className="text-gray-700">Remote/Virtual</option>
          </select>

          <select className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2" style={{backgroundColor: '#E8DFFF', color: '#7823E1', borderColor: '#7823E1', '--tw-ring-color': '#7823E1'} as React.CSSProperties}>
            <option className="text-gray-700">Experience</option>
            <option className="text-gray-700">Beginner (0-2 years)</option>
            <option className="text-gray-700">Intermediate (3-5 years)</option>
            <option className="text-gray-700">Advanced (6-10 years)</option>
            <option className="text-gray-700">Professional (10+ years)</option>
          </select>
        </div>
      </div>

      {/* Search Results */}
      {query.trim() && (
        <div className="space-y-4">
          {searching && (
            <div className="text-center text-gray-600">Searching…</div>
          )}
          {!searching && ((showPeople && results.length === 0) || (!showPeople && orgResults.length === 0)) && (
            <div className="text-center text-gray-600">No results</div>
          )}
          {!searching && showPeople && results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((r) => (
                <UserCard key={r.id} user={r} />
              ))}
            </div>
          )}
          {!searching && !showPeople && orgResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orgResults.map((o) => (
                <OrganizationCard key={o.id} organization={o} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Default Cards Grid */}
      {!query.trim() && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initial.length > 0 && initial.map((r) => (
          <UserCard key={r.id} user={r} />
        ))}
        {showPeople ? (
          // People Cards (demo cards removed)
          <>
            {/* Demo cards removed */}
          </>
        ) : (
          // Organization Cards
          <>
            {/* Organization Card 1 */}
            <div className="bg-white rounded-lg shadow-md border-2 border-[#7823E1] overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-red-700">Music Venue</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">The Blue Note</h3>
                    <p className="text-sm text-gray-600">Live Music Venue</p>
                  </div>
                  <span className="text-sm font-medium text-green-600">Hiring</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Columbia, SC (1.5 miles)
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v.01M12 14v.01M16 14v.01" />
                    </svg>
                    150+ Events Hosted
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Intimate jazz club featuring live music 6 nights a week. Looking for talented musicians for regular gigs.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Jazz</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Blues</span>
                  </div>
                  <button className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors" style={{backgroundColor: '#7823E1'}}>
                    Connect
                  </button>
                </div>
              </div>
            </div>

            {/* Organization Card 2 */}
            <div className="bg-white rounded-lg shadow-md border-2 border-[#7823E1] overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-yellow-700">Event Company</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Harmony Events</h3>
                    <p className="text-sm text-gray-600">Wedding & Corporate Events</p>
                  </div>
                  <span className="text-sm font-medium text-green-600">Hiring</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Columbia, SC Metro Area
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v.01M12 14v.01M16 14v.01" />
                    </svg>
                    85+ Events Planned
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Full-service event planning company specializing in weddings and corporate functions. Always seeking talented musicians.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">Wedding</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Corporate</span>
                  </div>
                  <button className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors" style={{backgroundColor: '#7823E1'}}>
                    Connect
                  </button>
                </div>
              </div>
            </div>

            {/* Organization Card 3 */}
            <div className="bg-white rounded-lg shadow-md border-2 border-[#7823E1] overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-indigo-700">Music School</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Carolina Music Academy</h3>
                    <p className="text-sm text-gray-600">Private Music School</p>
                  </div>
                  <span className="text-sm font-medium text-blue-600">Recruiting</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Columbia, SC (3.2 miles)
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    200+ Students
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Established music academy offering private lessons and ensemble opportunities. Looking for qualified instructors.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Teaching</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Performance</span>
                  </div>
                  <button className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors" style={{backgroundColor: '#7823E1'}}>
                    Connect
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
}

function ConnectButton({ targetUserId }: { targetUserId: string }) {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const svc = createUsersService();
        // Cheap check: try to list connections and see if target is in first page
        const mine = await svc.listMyConnections(200, 0);
        if (mounted) {
          setIsFollowing(mine.some((u) => u.id === targetUserId));
        }
      } catch {
        if (mounted) setIsFollowing(false);
      }
    };
    check();
    return () => { mounted = false; };
  }, [targetUserId]);

  const onToggle = async () => {
    setLoading(true);
    try {
      const svc = createUsersService();
      const nowFollowing = await svc.toggleFollowUser(targetUserId);
      setIsFollowing(nowFollowing);
    } catch (e) {
      console.error('Failed to toggle follow', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={`px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-60`}
      style={{ backgroundColor: '#7823E1' }}
      type="button"
    >
      {loading ? '...' : isFollowing ? 'Connected' : 'Connect'}
    </button>
  );
}

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${checked ? 'bg-[#7823E1]' : 'bg-gray-300'}`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-1'}`}
        />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}

function UserCard({ user }: { user: UserWithProfile }) {
  const profile = user.individual_profile || ({} as any);
  const displayName = user.full_name || profile.stage_name || 'Unnamed';
  const subtitle = profile.primary_instrument ? `${profile.primary_instrument}` : 'Artist';
  const location = profile.location || '';
  const genres = (profile.genres || []) as string[];
  const statusPill = profile.available_for_hire === false ? { text: 'Busy', color: 'text-yellow-600' } : { text: 'Available', color: 'text-green-600' };
  
  const headliner: string = (() => {
    if (profile.headliner) return profile.headliner as string;
    const parts: string[] = [];
    if (profile.primary_instrument) parts.push(profile.primary_instrument);
    if (genres && genres.length > 0) parts.push(`${genres[0]}`);
    if (location) parts.push(`from ${location}`);
    return parts.length > 0 ? parts.join(' • ') : 'Musician';
  })();

  return (
    <div
      className="bg-white rounded-lg shadow-md border-2 border-[#7823E1] overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => window.location.assign(`/profile/${user.id}`)}
    >
      <div className="h-36 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2">
            <Avatar userWithProfile={user} size="xl" />
          </div>
          <span className="text-sm font-medium" style={{ color: '#7823E1' }}>{subtitle}</span>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
            {profile.stage_name && (
              <p className="text-sm text-gray-600">{profile.stage_name}</p>
            )}
          </div>
          {location && <span className={`text-sm ${statusPill.color}`}>{statusPill.text}</span>}
        </div>

        {location && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location}
          </div>
        )}

        {profile.total_performances != null && (
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v.01M12 14v.01M16 14v.01" />
            </svg>
            {profile.total_performances} Completed Gigs
          </div>
        )}

        <p className="text-sm text-gray-700 mb-4 line-clamp-2">{headliner}</p>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 3).map((g) => (
              <GenrePill key={g} name={g} />
            ))}
          </div>
          <ConnectButton targetUserId={user.id} />
        </div>
      </div>
    </div>
  );
}