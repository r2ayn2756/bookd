"use client";

import { useState } from 'react';
import { createCurrentUserPastPerformance } from '@/services/client/performances';
import { useRouter } from 'next/navigation';

export default function CreateEventPageClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    performance_date: '',
    start_time: '',
    genre: '',
    role: '',
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
      } as any;

      const created = await createCurrentUserPastPerformance(payload);
      if (!created) {
        throw new Error('Failed to create event');
      }
      router.push('/events');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
          <p className="text-gray-600 mt-1">Publish a musical performance or event</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" required value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent" placeholder="e.g., Jazz Night at Blue Moon" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={4} value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent" placeholder="Event details..." />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input type="text" value={formData.venue} onChange={(e) => handleInputChange('venue', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent" placeholder="e.g., Koger Center" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input type="text" value={formData.role} onChange={(e) => handleInputChange('role', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent" placeholder="e.g., Performer" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" required value={formData.performance_date} onChange={(e) => handleInputChange('performance_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" value={formData.start_time} onChange={(e) => handleInputChange('start_time', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
              <input type="text" value={formData.genre} onChange={(e) => handleInputChange('genre', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent" placeholder="e.g., Jazz" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button type="button" onClick={() => router.push('/events')} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-[#7823E1] text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50">{isSubmitting ? 'Creating...' : 'Create Event'}</button>
        </div>
      </form>
    </div>
  );
}


