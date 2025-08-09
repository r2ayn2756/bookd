'use client';

import { useState, useEffect } from 'react';
import { 
  getCurrentUserPastPerformances, 
  createCurrentUserPastPerformance, 
  updateCurrentUserPastPerformance, 
  deleteCurrentUserPastPerformance 
} from '@/services/client/performances';
import type { UserWithProfile, PastPerformance } from '@/types/database';

interface SimplePerformanceSectionProps {
  userWithProfile: UserWithProfile;
}

interface PerformanceFormData {
  title: string;
  venue: string;
  role: string;
  performance_date: string;
}

export function SimplePerformanceSection({ userWithProfile }: SimplePerformanceSectionProps) {
  const [performances, setPerformances] = useState<PastPerformance[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PerformanceFormData>({
    title: '',
    venue: '',
    role: '',
    performance_date: ''
  });

  // Load performances from database
  useEffect(() => {
    const loadPerformances = async () => {
      try {
        setLoading(true);
        const data = await getCurrentUserPastPerformances();
        setPerformances(data);
      } catch (error) {
        console.warn('Could not load performances:', error);
        setPerformances([]);
      } finally {
        setLoading(false);
      }
    };

    loadPerformances();
  }, []);

  const handleAddNew = () => {
    setFormData({
      title: '',
      venue: '',
      role: '',
      performance_date: ''
    });
    setEditingId(null);
    setIsFormVisible(true);
  };

  const handleEdit = (performance: PastPerformance) => {
    setFormData({
      title: performance.title,
      venue: performance.venue || '',
      role: performance.role || '',
      performance_date: performance.performance_date || ''
    });
    setEditingId(performance.id);
    setIsFormVisible(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      alert('Please fill in the performance title');
      return;
    }

    try {
      setSaving(true);
      
      const performanceData = {
        title: formData.title,
        venue: formData.venue || null,
        role: formData.role || null,
        performance_date: formData.performance_date || null, // Already in YYYY-MM-DD format from date input
        description: null // Not used in simple form
      };

      if (editingId) {
        // Update existing performance
        const updated = await updateCurrentUserPastPerformance(editingId, performanceData);
        if (updated) {
          setPerformances(prev => prev.map(perf => 
            perf.id === editingId ? updated : perf
          ));
        }
      } else {
        // Create new performance
        const created = await createCurrentUserPastPerformance(performanceData);
        if (created) {
          setPerformances(prev => [...prev, created]);
        }
      }
      
      setIsFormVisible(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving performance:', error);
      alert('Failed to save performance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this performance?')) {
      try {
        await deleteCurrentUserPastPerformance(id);
        setPerformances(prev => prev.filter(perf => perf.id !== id));
      } catch (error) {
        console.error('Error deleting performance:', error);
        alert('Failed to delete performance. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Past Performances</h3>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Performance
        </button>
      </div>

      {/* Performance List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading performances...</p>
        </div>
      ) : performances.length === 0 && !isFormVisible ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No performances added yet</p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Your First Performance
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {performances.map((performance) => (
            <div key={performance.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{performance.title}</h4>
                  {performance.role && (
                    <p className="text-gray-600">{performance.role}</p>
                  )}
                  {performance.venue && (
                    <p className="text-gray-600">{performance.venue}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(performance.performance_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(performance)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(performance.id)}
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
                  Performance Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="e.g., Mozart Requiem"
                  required
                />
              </div>
              <div>
                <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
                  Venue
                </label>
                <input
                  type="text"
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="e.g., Carnegie Hall"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="e.g., Solo Violin, Conductor"
                />
              </div>
              <div>
                <label htmlFor="performance_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="performance_date"
                  value={formData.performance_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, performance_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
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
                {saving ? 'Saving...' : (editingId ? 'Update' : 'Add')} {saving ? '' : 'Performance'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
