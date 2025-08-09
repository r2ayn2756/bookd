'use client';

import { useState, useEffect } from 'react';
import { GigCard, GigFilters, GigLoadingSkeleton, CreateGigModal } from '@/components/gigs';
import { getGigs, type GigWithAuthor, type GigFilters as GigFiltersType } from '@/services/client/gigs';

interface GigsPageClientProps {
  userId: string;
}

export function GigsPageClient({ userId }: GigsPageClientProps) {
  const [gigs, setGigs] = useState<GigWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GigFiltersType>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Removed test modal

  // Debug the modal state
  useEffect(() => {
    console.log('showCreateModal state changed:', showCreateModal);
  }, [showCreateModal]);


  useEffect(() => {
    console.log('GigsPageClient component mounted');
  }, []);

  const fetchGigs = async (filtersToApply: GigFiltersType = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGigs(filtersToApply, 50, 0); // Fetch up to 50 gigs
      setGigs(data);
    } catch (err) {
      console.error('Error fetching gigs:', err);
      setError('Failed to load gigs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs(filters);
  }, [filters]);

  const handleFiltersChange = (newFilters: GigFiltersType) => {
    setFilters(newFilters);
  };

  const handleGigApply = (gigId: string) => {
    // TODO: Show success notification
    console.log('Applied to gig:', gigId);
  };

  const handleGigCreated = () => {
    // Refresh the gigs list
    fetchGigs(filters);
  };

  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gigs</h1>
            <p className="text-gray-600 mt-1">Find and post music gig opportunities</p>
          </div>
          <button 
            onClick={() => {
              console.log('Post New Gig button clicked (error state)');
              setShowCreateModal(true);
            }}
            className="px-6 py-3 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors" 
            style={{backgroundColor: '#7823E1'}}
          >
            Post New Gig
          </button>
        </div>

        {/* Error State */}
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Gigs</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => fetchGigs(filters)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>

        {/* Create Gig Modal - ensure available in error state */}
        <CreateGigModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleGigCreated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gigs</h1>
          <p className="text-gray-600 mt-1">Find and post music gig opportunities</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowCreateModal(true);
            }}
            onMouseEnter={() => console.log('Post New Gig button hover')}
            className="px-6 py-3 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors" 
            style={{backgroundColor: '#7823E1'}}
            type="button"
          >
            Post New Gig
          </button>
          {/* Counter removed */}
        </div>
      </div>

      {/* Debug Info removed */}

      {/* Filters */}
      <GigFilters 
        filters={filters} 
        onFiltersChange={handleFiltersChange}
      />

      {/* Gigs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, index) => (
            <GigLoadingSkeleton key={index} />
          ))
        ) : gigs.length === 0 ? (
          // Empty state
          <div className="col-span-full text-center py-12">
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 max-w-md mx-auto">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v.01M12 14v.01M16 14v.01" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Gigs Found</h3>
              <p className="text-gray-600 mb-4">
                {Object.keys(filters).some(key => filters[key as keyof GigFiltersType]) 
                  ? 'Try adjusting your filters to find more gigs.' 
                  : 'There are no gigs available at the moment.'}
              </p>
              {Object.keys(filters).some(key => filters[key as keyof GigFiltersType]) && (
                <button 
                  onClick={() => setFilters({})}
                  className="px-4 py-2 bg-[#7823E1] text-white rounded-lg hover:opacity-90 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          // Gig cards
          gigs.map((gig) => (
            <GigCard 
              key={gig.id} 
              gig={gig} 
              onApply={handleGigApply}
            />
          ))
        )}
      </div>

      {/* Load More Button */}
      {!loading && gigs.length > 0 && gigs.length >= 20 && (
        <div className="text-center py-6">
          <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Load More Gigs
          </button>
        </div>
      )}

      {/* Test Modal removed */}

      {/* Create Gig Modal */}
      {(() => {
        console.log('Rendering CreateGigModal with isOpen:', showCreateModal);
        return null;
      })()}
      <CreateGigModal
        isOpen={showCreateModal}
        onClose={() => {
          console.log('Modal close requested');
          setShowCreateModal(false);
        }}
        onSuccess={handleGigCreated}
      />
    </div>
  );
}
