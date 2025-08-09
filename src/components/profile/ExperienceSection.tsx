'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ExperienceCard } from './ExperienceCard';
import { ExperienceForm } from './ExperienceForm';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyProfileSection, ProfilePlaceholder } from './ProfilePlaceholder';
import { 
  getCurrentUserExperienceEntries,
  getUserExperienceEntries,
  createCurrentUserExperienceEntry,
  updateCurrentUserExperienceEntry,
  deleteCurrentUserExperienceEntry,
  toggleCurrentUserExperienceEntryStatus,
  reorderCurrentUserExperienceEntries
} from '@/services/client/experience';
import type { ExperienceEntry, Database } from '@/types/database';

type CreateExperienceEntry = Database['public']['Tables']['experience_entries']['Insert'];
type UpdateExperienceEntry = Database['public']['Tables']['experience_entries']['Update'];

interface ExperienceSectionProps {
  isOwner?: boolean;
  userId?: string;
}

export function ExperienceSection({ isOwner = false, userId }: ExperienceSectionProps) {
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [effectiveIsOwner, setEffectiveIsOwner] = useState<boolean>(isOwner);
  const supabase = createClient();

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<ExperienceEntry | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);

  // Confirmation dialog states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingExperienceId, setDeletingExperienceId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine ownership defensively when a specific userId is provided
  useEffect(() => {
    let mounted = true;
    const checkOwner = async () => {
      try {
        if (userId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (mounted) setEffectiveIsOwner(Boolean(user && user.id === userId));
        } else {
          if (mounted) setEffectiveIsOwner(isOwner);
        }
      } catch {
        if (mounted) setEffectiveIsOwner(false);
      }
    };
    checkOwner();
    return () => { mounted = false; };
  }, [userId, isOwner, supabase.auth]);

  // Load experiences
  const loadExperiences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = effectiveIsOwner && !userId
        ? await getCurrentUserExperienceEntries()
        : userId
        ? await getUserExperienceEntries(userId)
        : [];
      setExperiences(data);
    } catch (err) {
      console.warn('Experience entries not available:', err);
      // Don't show this as an error to the user - just silently handle it
      setExperiences([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperiences();
    // reload when viewing a different user id or ownership flag changes
  }, [effectiveIsOwner, userId]);

  // Handle form submission
  const handleFormSubmit = async (data: CreateExperienceEntry | UpdateExperienceEntry) => {
    try {
      setIsFormLoading(true);
      
      let result: ExperienceEntry | null;
      
      if (editingExperience) {
        // Update existing experience
        result = await updateCurrentUserExperienceEntry(editingExperience.id, data as UpdateExperienceEntry);
      } else {
        // Create new experience
        result = await createCurrentUserExperienceEntry(data as CreateExperienceEntry);
      }

      if (result) {
        // Refresh the list
        await loadExperiences();
        
        // Close form
        setIsFormOpen(false);
        setEditingExperience(null);
      } else {
        throw new Error('Failed to save experience');
      }
    } catch (err) {
      console.error('Error saving experience:', err);
      throw err; // Let the form handle the error display
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (experience: ExperienceEntry) => {
    setEditingExperience(experience);
    setIsFormOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingExperience(null);
    setIsFormOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteClick = (experienceId: string) => {
    setDeletingExperienceId(experienceId);
    setShowDeleteConfirm(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingExperienceId) return;

    try {
      setIsDeleting(true);
      
      const success = await deleteCurrentUserExperienceEntry(deletingExperienceId);
      
      if (success) {
        // Refresh the list
        await loadExperiences();
        
        // Close dialog
        setShowDeleteConfirm(false);
        setDeletingExperienceId(null);
      } else {
        throw new Error('Failed to delete experience');
      }
    } catch (err) {
      console.error('Error deleting experience:', err);
      setError('Failed to delete experience. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle toggle current status
  const handleToggleCurrent = async (experienceId: string) => {
    try {
      const result = await toggleCurrentUserExperienceEntryStatus(experienceId);
      
      if (result) {
        // Update the experience in the list
        setExperiences(prev => 
          prev.map(exp => 
            exp.id === experienceId 
              ? { ...exp, is_current: result.is_current, end_date: result.end_date }
              : exp
          )
        );
      }
    } catch (err) {
      console.error('Error toggling current status:', err);
      setError('Failed to update experience status');
    }
  };

  // Handle close form
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingExperience(null);
  };

  // Handle close delete confirmation
  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletingExperienceId(null);
  };

  // Get the experience being deleted for the confirmation dialog
  const deletingExperience = experiences.find(exp => exp.id === deletingExperienceId);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Experience</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-6">
                <div className="space-y-3">
                  <div className="h-5 bg-gray-200 animate-pulse rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-1/4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 animate-pulse rounded w-full"></div>
                    <div className="h-3 bg-gray-200 animate-pulse rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Experience</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            {isOwner && (
              <button
                onClick={loadExperiences}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors duration-200"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Experience</h2>
            {effectiveIsOwner && (
              <button
                onClick={handleAddNew}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Experience
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {experiences.length === 0 ? (
            effectiveIsOwner ? (
              <ProfilePlaceholder
                title="Experience"
                description={"Share your professional experience, education, and notable positions to showcase your musical journey."}
                actionText="Add Experience"
                actionHref="/profile/edit"
                icon={(
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">This user hasn't added any experience entries yet.</div>
            )
          ) : (
            <div className="space-y-4">
              {experiences.map((experience) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                    editable={effectiveIsOwner}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  onToggleCurrent={handleToggleCurrent}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Experience Form Modal */}
      <ExperienceForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        experience={editingExperience}
        isLoading={isFormLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        title="Delete Experience"
        message={
          deletingExperience
            ? `Are you sure you want to delete "${deletingExperience.title}" at ${deletingExperience.organization}? This action cannot be undone.`
            : 'Are you sure you want to delete this experience? This action cannot be undone.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
