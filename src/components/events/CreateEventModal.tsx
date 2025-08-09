"use client";

import { useState } from 'react';
import { createCurrentUserPastPerformance } from '@/services/client/performances';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateEventModal({ isOpen, onClose, onSuccess }: CreateEventModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    performance_date: '',
    genre: '',
    role: '',
    ensemble_size: '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.performance_date) {
      setError('Please fill in Title and Date.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        venue: formData.venue || null,
        performance_date: formData.performance_date,
        genre: formData.genre || null,
        role: formData.role || null,
        ensemble_size: formData.ensemble_size
          ? Number.parseInt(String(formData.ensemble_size), 10)
          : null,
      } as any;
      await createCurrentUserPastPerformance(payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating event:', err);
      const message = err instanceof Error ? err.message : 'Failed to create event. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Post a New Event</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" required value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent" placeholder="e.g., Jazz Night at Blue Moon" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" required value={formData.performance_date} onChange={(e) => handleInputChange('performance_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <select
                  value={formData.genre}
                  onChange={(e) => handleInputChange('genre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                >
                  <option value="">Select genre</option>
                  <option value="Classical">Classical</option>
                  <option value="Jazz">Jazz</option>
                  <option value="Blues">Blues</option>
                  <option value="Folk">Folk</option>
                  <option value="Rock">Rock</option>
                  <option value="Pop">Pop</option>
                  <option value="Country">Country</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Hip-Hop">Hip-Hop</option>
                  <option value="R&B">R&B</option>
                  <option value="Gospel">Gospel</option>
                  <option value="Latin">Latin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <input type="text" value={formData.venue} onChange={(e) => handleInputChange('venue', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent" placeholder="e.g., Koger Center" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                >
                  <option value="">Select role</option>
                  <option value="Performer">Performer</option>
                  <option value="Soloist">Soloist</option>
                  <option value="Conductor">Conductor</option>
                  <option value="Organizer">Organizer</option>
                  <option value="Composer">Composer</option>
                  <option value="Ensemble Member">Ensemble Member</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ensemble Size</label>
                <input
                  type="number"
                  min={1}
                  value={formData.ensemble_size}
                  onChange={(e) => handleInputChange('ensemble_size', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                  placeholder="e.g., 12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={4} value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent" placeholder="Event details..." />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-[#7823E1] text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50">{isSubmitting ? 'Creating...' : 'Post Event'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


