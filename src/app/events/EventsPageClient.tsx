"use client";

import { useState, useCallback, useEffect } from 'react';
import CreateEventModal from '@/components/events/CreateEventModal';
import { createClientPerformancesService } from '@/services/client/performances';

interface EventsPageClientProps {
  userId: string;
}

export default function EventsPageClient({ userId }: EventsPageClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events, setEvents] = useState<Array<{
    id: string;
    title: string;
    venue: string | null;
    performance_date: string | null;
    genre: string | null;
    description: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleOpenModal = useCallback(() => setShowCreateModal(true), []);
  const handleCloseModal = useCallback(() => setShowCreateModal(false), []);
  const handleCreated = useCallback(() => {
    // For now we just close and rely on future data integration for Events
    // The UI remains as designed while enabling posting via the existing modal
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const service = createClientPerformancesService();
        const recent = await service.getRecentPerformances({ limit: 9 });
        setEvents((recent || []) as any);
      } catch (e) {
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Discover performances and musical events near you</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="px-6 py-3 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
          style={{ backgroundColor: '#7823E1' }}
          type="button"
        >
          Post New Event
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Performance Type Filter */}
          <select
            className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2"
            style={{ backgroundColor: '#E8DFFF', color: '#7823E1', borderColor: '#7823E1', ['--tw-ring-color' as any]: '#7823E1' }}
          >
            <option className="text-gray-700">Performance Type</option>
            <option className="text-gray-700">Concert</option>
            <option className="text-gray-700">Recital</option>
            <option className="text-gray-700">Opera</option>
            <option className="text-gray-700">Musical Theater</option>
            <option className="text-gray-700">Jazz Performance</option>
            <option className="text-gray-700">Chamber Music</option>
            <option className="text-gray-700">Orchestra</option>
            <option className="text-gray-700">Solo Performance</option>
            <option className="text-gray-700">Open Mic</option>
            <option className="text-gray-700">Festival</option>
          </select>

          {/* Genre Filter */}
          <select
            className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2"
            style={{ backgroundColor: '#E8DFFF', color: '#7823E1', borderColor: '#7823E1', ['--tw-ring-color' as any]: '#7823E1' }}
          >
            <option className="text-gray-700">Genre</option>
            <option className="text-gray-700">Classical</option>
            <option className="text-gray-700">Jazz</option>
            <option className="text-gray-700">Blues</option>
            <option className="text-gray-700">Folk</option>
            <option className="text-gray-700">Rock</option>
            <option className="text-gray-700">Pop</option>
            <option className="text-gray-700">Country</option>
            <option className="text-gray-700">Electronic</option>
            <option className="text-gray-700">World Music</option>
            <option className="text-gray-700">Contemporary</option>
          </select>

          {/* Date Filter */}
          <select
            className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2"
            style={{ backgroundColor: '#E8DFFF', color: '#7823E1', borderColor: '#7823E1', ['--tw-ring-color' as any]: '#7823E1' }}
          >
            <option className="text-gray-700">Date</option>
            <option className="text-gray-700">Today</option>
            <option className="text-gray-700">This Week</option>
            <option className="text-gray-700">This Weekend</option>
            <option className="text-gray-700">Next Week</option>
            <option className="text-gray-700">This Month</option>
            <option className="text-gray-700">Next Month</option>
            <option className="text-gray-700">Custom Date Range</option>
          </select>

          {/* Location Filter */}
          <select
            className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2"
            style={{ backgroundColor: '#E8DFFF', color: '#7823E1', borderColor: '#7823E1', ['--tw-ring-color' as any]: '#7823E1' }}
          >
            <option className="text-gray-700">Location</option>
            <option className="text-gray-700">Within 5 miles</option>
            <option className="text-gray-700">Within 10 miles</option>
            <option className="text-gray-700">Within 25 miles</option>
            <option className="text-gray-700">Columbia, SC</option>
            <option className="text-gray-700">Charleston, SC</option>
            <option className="text-gray-700">Greenville, SC</option>
            <option className="text-gray-700">Charlotte, NC</option>
            <option className="text-gray-700">Atlanta, GA</option>
            <option className="text-gray-700">Virtual/Online</option>
          </select>

          {/* Venue Type Filter */}
          <select
            className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2"
            style={{ backgroundColor: '#E8DFFF', color: '#7823E1', borderColor: '#7823E1', ['--tw-ring-color' as any]: '#7823E1' }}
          >
            <option className="text-gray-700">Venue Type</option>
            <option className="text-gray-700">Concert Hall</option>
            <option className="text-gray-700">Theater</option>
            <option className="text-gray-700">Club/Bar</option>
            <option className="text-gray-700">Church</option>
            <option className="text-gray-700">University</option>
            <option className="text-gray-700">Museum</option>
            <option className="text-gray-700">Outdoor Venue</option>
            <option className="text-gray-700">Private Venue</option>
            <option className="text-gray-700">Community Center</option>
          </select>

          {/* Price Filter */}
          <select
            className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2"
            style={{ backgroundColor: '#E8DFFF', color: '#7823E1', borderColor: '#7823E1', ['--tw-ring-color' as any]: '#7823E1' }}
          >
            <option className="text-gray-700">Price</option>
            <option className="text-gray-700">Free</option>
            <option className="text-gray-700">Under $10</option>
            <option className="text-gray-700">$10 - $25</option>
            <option className="text-gray-700">$25 - $50</option>
            <option className="text-gray-700">$50 - $100</option>
            <option className="text-gray-700">Over $100</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && (
          <div className="col-span-full text-center text-gray-600">Loading events...</div>
        )}
        {!loading && error && (
          <div className="col-span-full text-center text-red-600">{error}</div>
        )}
        {!loading && !error && events.length === 0 && (
          <div className="col-span-full text-center text-gray-600">No events yet.</div>
        )}
        {!loading && !error && events.map((ev) => (
          <div key={ev.id} className="bg-white rounded-lg shadow-md border-2 border-[#7823E1] overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M13.243 8.757a1 1 0 011.414 0A5.978 5.978 0 0116 12a5.978 5.978 0 01-1.343 3.243 1 1 0 11-1.414-1.414A3.982 3.982 0 0014 12a3.982 3.982 0 00-.757-2.243 1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-blue-700">{ev.genre || 'Performance'}</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{ev.title}</h3>
                  <p className="text-sm text-gray-600">{ev.venue || 'Venue TBA'}</p>
                </div>
                <span className="text-sm font-medium text-green-600">{ev.performance_date ? new Date(ev.performance_date).toLocaleDateString() : ''}</span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {ev.performance_date ? new Date(ev.performance_date).toLocaleDateString() : ''}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {ev.venue || 'Location TBA'}
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4 line-clamp-3">{ev.description || ''}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">&nbsp;</span>
                <button className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors" style={{ backgroundColor: '#7823E1' }}>
                  Learn More
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={handleCreated}
      />
    </div>
  );
}


