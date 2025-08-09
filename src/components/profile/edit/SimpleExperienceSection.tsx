'use client';

import { useState, useEffect } from 'react';
import { 
  getCurrentUserExperienceEntries, 
  createCurrentUserExperienceEntry, 
  updateCurrentUserExperienceEntry, 
  deleteCurrentUserExperienceEntry 
} from '@/services/client/experience';
import type { UserWithProfile, ExperienceEntry } from '@/types/database';

interface SimpleExperienceSectionProps {
  userWithProfile: UserWithProfile;
}

interface ExperienceFormData {
  title: string;
  organization: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export function SimpleExperienceSection({ userWithProfile }: SimpleExperienceSectionProps) {
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ExperienceFormData>({
    title: '',
    organization: '',
    start_date: '',
    end_date: '',
    is_current: false
  });

  // Load experiences from database
  useEffect(() => {
    const loadExperiences = async () => {
      try {
        setLoading(true);
        const data = await getCurrentUserExperienceEntries();
        setExperiences(data);
      } catch (error) {
        console.warn('Could not load experiences:', error);
        setExperiences([]);
      } finally {
        setLoading(false);
      }
    };

    loadExperiences();
  }, []);

  const handleAddNew = () => {
    setFormData({
      title: '',
      organization: '',
      start_date: '',
      end_date: '',
      is_current: false
    });
    setEditingId(null);
    setIsFormVisible(true);
  };

  const handleEdit = (experience: ExperienceEntry) => {
    // Convert YYYY-MM-DD format back to YYYY-MM for month inputs
    const formatDateForForm = (dateString: string | null) => {
      if (!dateString) return '';
      return dateString.substring(0, 7); // Get YYYY-MM from YYYY-MM-DD
    };

    setFormData({
      title: experience.title,
      organization: experience.organization,
      start_date: formatDateForForm(experience.start_date),
      end_date: formatDateForForm(experience.end_date),
      is_current: experience.is_current
    });
    setEditingId(experience.id);
    setIsFormVisible(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.organization) {
      alert('Please fill in the required fields');
      return;
    }

    try {
      setSaving(true);
      
      // Convert YYYY-MM format to YYYY-MM-01 for database (first day of month)
      const formatDateForDB = (monthString: string) => {
        if (!monthString) return null;
        return `${monthString}-01`; // Convert YYYY-MM to YYYY-MM-01
      };

      const experienceData = {
        title: formData.title,
        organization: formData.organization,
        start_date: formatDateForDB(formData.start_date),
        end_date: formData.is_current ? null : formatDateForDB(formData.end_date),
        is_current: formData.is_current,
        description: null // Not used in simple form
      };

      if (editingId) {
        // Update existing experience
        const updated = await updateCurrentUserExperienceEntry(editingId, experienceData);
        if (updated) {
          setExperiences(prev => prev.map(exp => 
            exp.id === editingId ? updated : exp
          ));
        }
      } else {
        // Create new experience
        const created = await createCurrentUserExperienceEntry(experienceData);
        if (created) {
          setExperiences(prev => [...prev, created]);
        }
      }
      
      setIsFormVisible(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving experience:', error);
      
      // Show more detailed error information
      let errorMessage = 'Failed to save experience. ';
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check your connection and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this experience?')) {
      try {
        await deleteCurrentUserExperienceEntry(id);
        setExperiences(prev => prev.filter(exp => exp.id !== id));
      } catch (error) {
        console.error('Error deleting experience:', error);
        alert('Failed to delete experience. Please try again.');
      }
    }
  };

  const formatDateRange = (startDate: string | null, endDate: string | null, isCurrent: boolean) => {
    if (!startDate) return '';
    
    const start = new Date(startDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    
    if (isCurrent) return `${start} - Present`;
    if (!endDate) return start;
    
    const end = new Date(endDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    
    return `${start} - ${end}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Work Experience</h3>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Experience
        </button>
      </div>

      {/* Experience List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading experiences...</p>
        </div>
      ) : experiences.length === 0 && !isFormVisible ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No work experience added yet</p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Your First Experience
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {experiences.map((experience) => (
            <div key={experience.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{experience.title}</h4>
                  <p className="text-gray-600">{experience.organization}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDateRange(experience.start_date, experience.end_date, experience.is_current)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(experience)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(experience.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simple Form */}
      {isFormVisible && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="e.g., Principal Violinist"
                  required
                />
              </div>
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization *
                </label>
                <input
                  type="text"
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="e.g., Metropolitan Opera"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="month"
                  id="start_date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="month"
                  id="end_date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  disabled={formData.is_current}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_current"
                checked={formData.is_current}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  is_current: e.target.checked,
                  end_date: e.target.checked ? '' : prev.end_date
                }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_current" className="ml-2 text-sm text-gray-700">
                I currently work here
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {saving ? 'Saving...' : (editingId ? 'Update' : 'Add')} {saving ? '' : 'Experience'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
