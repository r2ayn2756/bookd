'use client';

import { GigFilters as GigFiltersType } from '@/services/client/gigs';
import { useState } from 'react';

interface GigFiltersProps {
  filters: GigFiltersType;
  onFiltersChange: (filters: GigFiltersType) => void;
  className?: string;
}

export default function GigFilters({ filters, onFiltersChange, className = '' }: GigFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key: keyof GigFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: GigFiltersType = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const instruments = [
    'Guitar', 'Piano', 'Violin', 'Drums', 'Saxophone', 'Trumpet', 
    'Oboe', 'Bass', 'Vocals', 'Cello', 'Flute', 'Clarinet', 'Viola'
  ];

  const genres = [
    'Classical', 'Jazz', 'Rock', 'Pop', 'Country', 'Blues', 
    'Folk', 'Electronic', 'Hip-Hop', 'R&B', 'Gospel', 'Latin'
  ];

  const gigTypes = [
    { value: 'one_time', label: 'One-time Gig' },
    { value: 'recurring', label: 'Recurring' },
    { value: 'residency', label: 'Residency' },
    { value: 'tour', label: 'Tour' },
    { value: 'session', label: 'Recording Session' },
    { value: 'teaching', label: 'Teaching' }
  ];

  const compensationTypes = [
    { value: 'paid', label: 'Paid' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'profit_share', label: 'Profit Share' },
    { value: 'exposure', label: 'For Exposure' }
  ];

  const payRanges = [
    { min: 0, max: 100, label: '$0-100' },
    { min: 100, max: 250, label: '$100-250' },
    { min: 250, max: 500, label: '$250-500' },
    { min: 500, max: 1000, label: '$500-1000' },
    { min: 1000, max: null, label: '$1000+' }
  ];

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search gigs..."
            value={localFilters.searchQuery || ''}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            className="w-full px-4 py-2 rounded-full text-sm border-2 border-gray-200 focus:border-[#7823E1] focus:outline-none transition-colors"
          />
        </div>

        {/* Instrument Filter */}
        <select 
          value={localFilters.instruments?.[0] || ''}
          onChange={(e) => handleFilterChange('instruments', e.target.value ? [e.target.value] : undefined)}
          className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2" 
          style={{
            backgroundColor: '#E8DFFF', 
            color: '#7823E1', 
            borderColor: '#7823E1',
            '--tw-ring-color': '#7823E1'
          } as React.CSSProperties}
        >
          <option value="" className="text-gray-700">All Instruments</option>
          {instruments.map(instrument => (
            <option key={instrument} value={instrument} className="text-gray-700">
              {instrument}
            </option>
          ))}
        </select>

        {/* Genre Filter */}
        <select 
          value={localFilters.genres?.[0] || ''}
          onChange={(e) => handleFilterChange('genres', e.target.value ? [e.target.value] : undefined)}
          className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2" 
          style={{
            backgroundColor: '#E8DFFF', 
            color: '#7823E1', 
            borderColor: '#7823E1',
            '--tw-ring-color': '#7823E1'
          } as React.CSSProperties}
        >
          <option value="" className="text-gray-700">All Genres</option>
          {genres.map(genre => (
            <option key={genre} value={genre} className="text-gray-700">
              {genre}
            </option>
          ))}
        </select>

        {/* Gig Type Filter */}
        <select 
          value={localFilters.gigType || ''}
          onChange={(e) => handleFilterChange('gigType', e.target.value || undefined)}
          className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2" 
          style={{
            backgroundColor: '#E8DFFF', 
            color: '#7823E1', 
            borderColor: '#7823E1',
            '--tw-ring-color': '#7823E1'
          } as React.CSSProperties}
        >
          <option value="" className="text-gray-700">All Types</option>
          {gigTypes.map(type => (
            <option key={type.value} value={type.value} className="text-gray-700">
              {type.label}
            </option>
          ))}
        </select>

        {/* Compensation Type Filter */}
        <select 
          value={localFilters.compensationType || ''}
          onChange={(e) => handleFilterChange('compensationType', e.target.value || undefined)}
          className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2" 
          style={{
            backgroundColor: '#E8DFFF', 
            color: '#7823E1', 
            borderColor: '#7823E1',
            '--tw-ring-color': '#7823E1'
          } as React.CSSProperties}
        >
          <option value="" className="text-gray-700">All Payment Types</option>
          {compensationTypes.map(comp => (
            <option key={comp.value} value={comp.value} className="text-gray-700">
              {comp.label}
            </option>
          ))}
        </select>

        {/* Pay Range Filter */}
        <select 
          value={`${localFilters.payRateMin || ''}-${localFilters.payRateMax || ''}`}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) {
              handleFilterChange('payRateMin', undefined);
              handleFilterChange('payRateMax', undefined);
            } else {
              const [min, max] = value.split('-');
              handleFilterChange('payRateMin', min ? parseInt(min) : undefined);
              handleFilterChange('payRateMax', max !== 'null' ? parseInt(max) : undefined);
            }
          }}
          className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2" 
          style={{
            backgroundColor: '#E8DFFF', 
            color: '#7823E1', 
            borderColor: '#7823E1',
            '--tw-ring-color': '#7823E1'
          } as React.CSSProperties}
        >
          <option value="" className="text-gray-700">All Pay Ranges</option>
          {payRanges.map(range => (
            <option 
              key={range.label} 
              value={`${range.min}-${range.max}`} 
              className="text-gray-700"
            >
              {range.label}
            </option>
          ))}
        </select>

        {/* Location Filter */}
        <input
          type="text"
          placeholder="Location"
          value={localFilters.location || ''}
          onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
          className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors focus:outline-none focus:ring-2" 
          style={{
            backgroundColor: '#E8DFFF', 
            color: '#7823E1', 
            borderColor: '#7823E1',
            '--tw-ring-color': '#7823E1'
          } as React.CSSProperties}
        />

        {/* Clear Filters Button */}
        {Object.keys(localFilters).some(key => localFilters[key as keyof GigFiltersType]) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
