'use client';

import { useState } from 'react';
import { formatDateRange, calculateDuration } from '@/lib/utils/date';
import type { ExperienceEntry } from '@/types/database';

interface ExperienceCardProps {
  experience: ExperienceEntry;
  editable?: boolean;
  onEdit?: (experience: ExperienceEntry) => void;
  onDelete?: (experienceId: string) => void;
  onToggleCurrent?: (experienceId: string) => void;
}

export function ExperienceCard({ 
  experience, 
  editable = false, 
  onEdit, 
  onDelete,
  onToggleCurrent 
}: ExperienceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Format dates using utility functions
  const dateRange = formatDateRange(
    experience.start_date,
    experience.end_date,
    experience.is_current
  );

  const duration = calculateDuration(
    experience.start_date,
    experience.end_date,
    experience.is_current
  );

  // Truncate description for collapsed view
  const TRUNCATE_LENGTH = 150;
  const shouldTruncate = experience.description && experience.description.length > TRUNCATE_LENGTH;
  const displayDescription = shouldTruncate && !isExpanded 
    ? experience.description?.substring(0, TRUNCATE_LENGTH) + '...'
    : experience.description;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header with title and actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {experience.title}
          </h3>
          <p className="text-base text-gray-700 font-medium truncate">
            {experience.organization}
          </p>
        </div>
        
        {editable && (
          <div className="flex items-center gap-2 ml-4">
            {/* Current position toggle */}
            <button
              onClick={() => onToggleCurrent?.(experience.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
                experience.is_current
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
              title={experience.is_current ? 'Mark as past position' : 'Mark as current position'}
            >
              {experience.is_current ? 'Current' : 'Past'}
            </button>
            
            {/* Edit button */}
            <button
              onClick={() => onEdit?.(experience)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              title="Edit experience"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            {/* Delete button */}
            <button
              onClick={() => onDelete?.(experience.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
              title="Delete experience"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Date range and duration */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{dateRange}</span>
        {duration && <span className="text-gray-500">{duration}</span>}
      </div>

      {/* Description */}
      {experience.description && (
        <div className="text-gray-700">
          <p className="leading-relaxed whitespace-pre-wrap">
            {displayDescription}
          </p>
          
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Empty state for missing description */}
      {!experience.description && editable && (
        <div className="text-gray-400 italic text-sm">
          No description provided.{' '}
          <button
            onClick={() => onEdit?.(experience)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Add description
          </button>
        </div>
      )}
    </div>
  );
}
