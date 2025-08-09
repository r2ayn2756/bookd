'use client';

import { useState, useEffect } from 'react';
import { validateDate, validateDateRange, validatePastDate } from '@/lib/utils/date';
import type { ExperienceEntry, Database } from '@/types/database';

type CreateExperienceEntry = Database['public']['Tables']['experience_entries']['Insert'];
type UpdateExperienceEntry = Database['public']['Tables']['experience_entries']['Update'];

interface ExperienceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateExperienceEntry | UpdateExperienceEntry) => Promise<void>;
  experience?: ExperienceEntry | null;
  isLoading?: boolean;
}

interface FormData {
  title: string;
  organization: string;
  description: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface FormErrors {
  title?: string;
  organization?: string;
  start_date?: string;
  end_date?: string;
  general?: string;
}

export function ExperienceForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  experience, 
  isLoading = false 
}: ExperienceFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    organization: '',
    description: '',
    start_date: '',
    end_date: '',
    is_current: false
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when experience changes
  useEffect(() => {
    if (experience) {
      setFormData({
        title: experience.title || '',
        organization: experience.organization || '',
        description: experience.description || '',
        start_date: experience.start_date || '',
        end_date: experience.end_date || '',
        is_current: experience.is_current || false
      });
    } else {
      setFormData({
        title: '',
        organization: '',
        description: '',
        start_date: '',
        end_date: '',
        is_current: false
      });
    }
    setErrors({});
    setHasChanges(false);
  }, [experience, isOpen]);

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.organization.trim()) {
      newErrors.organization = 'Organization is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    // Start date validation
    if (formData.start_date) {
      const startValidation = validateDate(formData.start_date);
      if (!startValidation.isValid) {
        newErrors.start_date = startValidation.error;
      } else if (!formData.is_current) {
        // Only validate past date for non-current positions
        const pastValidation = validatePastDate(formData.start_date);
        if (!pastValidation.isValid) {
          newErrors.start_date = pastValidation.error;
        }
      }
    }

    // Date range validation
    if (formData.start_date && formData.end_date && !formData.is_current) {
      const rangeValidation = validateDateRange(formData.start_date, formData.end_date, false);
      if (!rangeValidation.isValid) {
        newErrors.end_date = rangeValidation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData: CreateExperienceEntry | UpdateExperienceEntry = {
        title: formData.title.trim(),
        organization: formData.organization.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date || null,
        end_date: formData.is_current ? null : (formData.end_date || null),
        is_current: formData.is_current
      };

      // Add user_id for create operations (when experience is null)
      if (!experience) {
        (submitData as CreateExperienceEntry).user_id = ''; // Will be set by the service
      }

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting experience form:', error);
      setErrors({ general: 'Failed to save experience. Please try again.' });
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Clear end date when marking as current
      if (field === 'is_current' && value === true) {
        newData.end_date = '';
      }
      
      return newData;
    });
    
    setHasChanges(true);
    
    // Clear related errors
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    if (hasChanges && !isLoading) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {experience ? 'Edit Experience' : 'Add Experience'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* General error */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Principal Violinist, Music Teacher"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isLoading}
              maxLength={100}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Organization */}
          <div>
            <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
              Organization *
            </label>
            <input
              type="text"
              id="organization"
              value={formData.organization}
              onChange={(e) => handleInputChange('organization', e.target.value)}
              placeholder="e.g., Symphony Orchestra, Music School"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.organization ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isLoading}
              maxLength={100}
            />
            {errors.organization && <p className="mt-1 text-sm text-red-600">{errors.organization}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your role, responsibilities, and achievements..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={isLoading}
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              id="start_date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.start_date ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
          </div>

          {/* Current Position Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_current"
              checked={formData.is_current}
              onChange={(e) => handleInputChange('is_current', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isLoading}
            />
            <label htmlFor="is_current" className="text-sm font-medium text-gray-700">
              This is my current position
            </label>
          </div>

          {/* End Date (only if not current) */}
          {!formData.is_current && (
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="end_date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.end_date ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (experience ? 'Update' : 'Add')} Experience
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
