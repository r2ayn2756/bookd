'use client';

import { GigWithAuthor } from '@/services/client/gigs';
import { applyToGig } from '@/services/client/gigs';
import { useState } from 'react';

interface GigCardProps {
  gig: GigWithAuthor;
  onApply?: (gigId: string) => void;
}

export default function GigCard({ gig, onApply }: GigCardProps) {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (isApplying) return;
    
    setIsApplying(true);
    try {
      await applyToGig(gig.id);
      onApply?.(gig.id);
      // TODO: Show success notification
    } catch (error) {
      console.error('Error applying to gig:', error);
      // TODO: Show error notification
    } finally {
      setIsApplying(false);
    }
  };

  const formatDate = (dateString: string, timeString?: string | null) => {
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (timeString) {
      const [hours, minutes] = timeString.split(':');
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes));
      const timeFormatted = time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return `${dateFormatted} at ${timeFormatted}`;
    }
    
    return dateFormatted;
  };

  const formatPayRange = () => {
    if (gig.compensation_type === 'volunteer') return 'Volunteer';
    if (gig.compensation_type === 'exposure') return 'For Exposure';
    if (gig.compensation_type === 'profit_share') return 'Profit Share';
    
    if (gig.pay_amount_min && gig.pay_amount_max) {
      return `$${gig.pay_amount_min}-${gig.pay_amount_max}`;
    } else if (gig.pay_amount_min) {
      return `$${gig.pay_amount_min}+`;
    } else if (gig.pay_amount_max) {
      return `Up to $${gig.pay_amount_max}`;
    }
    
    return 'Negotiable';
  };

  const getGigTypeIcon = () => {
    switch (gig.gig_type) {
      case 'one_time':
        if (gig.description.toLowerCase().includes('wedding')) {
          return (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          );
        }
        return (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
          </svg>
        );
      case 'session':
        return (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        );
      case 'teaching':
        return (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
        );
    }
  };

  const getGigTypeColor = () => {
    switch (gig.gig_type) {
      case 'one_time':
        if (gig.description.toLowerCase().includes('wedding')) {
          return 'from-pink-100 to-pink-200';
        }
        return 'from-blue-100 to-blue-200';
      case 'session':
        return 'from-yellow-100 to-yellow-200';
      case 'teaching':
        return 'from-indigo-100 to-indigo-200';
      case 'recurring':
        return 'from-green-100 to-green-200';
      default:
        return 'from-gray-100 to-gray-200';
    }
  };

  const getGigTypeIconColor = () => {
    switch (gig.gig_type) {
      case 'one_time':
        if (gig.description.toLowerCase().includes('wedding')) {
          return 'bg-pink-500';
        }
        return 'bg-blue-500';
      case 'session':
        return 'bg-yellow-500';
      case 'teaching':
        return 'bg-indigo-500';
      case 'recurring':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getGigTypeLabel = () => {
    switch (gig.gig_type) {
      case 'one_time':
        if (gig.description.toLowerCase().includes('wedding')) {
          return 'Wedding';
        }
        if (gig.description.toLowerCase().includes('corporate')) {
          return 'Corporate Event';
        }
        if (gig.description.toLowerCase().includes('private')) {
          return 'Private Party';
        }
        return 'One-time Gig';
      case 'session':
        return 'Recording Session';
      case 'teaching':
        return 'Teaching';
      case 'recurring':
        return 'Recurring Gig';
      case 'residency':
        return 'Residency';
      case 'tour':
        return 'Tour';
      default:
        return 'Gig';
    }
  };

  const calculateDuration = () => {
    if (gig.start_time && gig.end_time) {
      const start = new Date(`2000-01-01T${gig.start_time}`);
      const end = new Date(`2000-01-01T${gig.end_time}`);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0 && minutes > 0) {
        return `${hours} hours ${minutes} min`;
      } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      } else if (minutes > 0) {
        return `${minutes} min`;
      }
    }
    
    if (gig.gig_type === 'teaching') {
      return '1 hour weekly (ongoing)';
    }
    
    return 'Duration TBD';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-[#7823E1] overflow-hidden">
      <div className={`h-48 bg-gradient-to-br ${getGigTypeColor()} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 ${getGigTypeIconColor()} rounded-full flex items-center justify-center mx-auto mb-2`}>
            {getGigTypeIcon()}
          </div>
          <span className={`text-sm font-medium ${gig.gig_type === 'one_time' && gig.description.toLowerCase().includes('wedding') 
            ? 'text-pink-700' : 
            gig.gig_type === 'session' ? 'text-yellow-700' :
            gig.gig_type === 'teaching' ? 'text-indigo-700' :
            gig.gig_type === 'recurring' ? 'text-green-700' :
            'text-gray-700'
          }`}>
            {getGigTypeLabel()}
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{gig.title}</h3>
            <p className="text-sm text-gray-600">{gig.author?.name || 'Anonymous'}</p>
          </div>
          <span className="text-sm font-medium text-green-600">{formatPayRange()}</span>
        </div>
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(gig.start_date, gig.start_time)}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {gig.venue_name ? `${gig.venue_name}, ${gig.city} ${gig.state_province || ''}` : `${gig.city}, ${gig.state_province || ''}`}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {calculateDuration()}
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-4 line-clamp-3">
          {gig.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex space-x-2 flex-wrap">
            {gig.genres?.slice(0, 2).map((genre, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {genre}
              </span>
            ))}
            {gig.instruments_needed?.slice(0, 1).map((instrument, index) => (
              <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                {instrument}
              </span>
            ))}
            {gig.tags && gig.tags.length > 0 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {gig.tags[0]}
              </span>
            )}
          </div>
          <button 
            onClick={handleApply}
            disabled={isApplying}
            className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50" 
            style={{backgroundColor: '#7823E1'}}
          >
            {isApplying ? 'Applying...' : 'Apply Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
