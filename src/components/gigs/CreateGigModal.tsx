'use client';

import { useState } from 'react';
import { createGig } from '@/services/client/gigs';

interface CreateGigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateGigModal({ isOpen, onClose, onSuccess }: CreateGigModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    gig_type: 'one_time',
    instruments_needed: [] as string[],
    genres: [] as string[],
    experience_level: 'any',
    venue_name: '',
    venue_address: '',
    city: '',
    state_province: '',
    country: 'United States',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    compensation_type: 'paid',
    pay_rate_type: 'flat_fee',
    pay_amount_min: '',
    pay_amount_max: '',
    currency: 'USD',
    application_method: 'email',
    contact_email: '',
    contact_phone: '',
    website_url: '',
    audition_required: false,
    portfolio_required: false,
    special_requirements: '',
    tags: [] as string[],
  });

  const instruments = [
    'Guitar', 'Piano', 'Violin', 'Drums', 'Saxophone', 'Trumpet', 
    'Oboe', 'Bass', 'Vocals', 'Cello', 'Flute', 'Clarinet', 'Viola'
  ];

  const genres = [
    'Classical', 'Jazz', 'Rock', 'Pop', 'Country', 'Blues', 
    'Folk', 'Electronic', 'Hip-Hop', 'R&B', 'Gospel', 'Latin'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'instruments_needed' | 'genres' | 'tags', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.city || formData.instruments_needed.length === 0) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const gigData = {
        ...formData,
        pay_amount_min: formData.pay_amount_min ? parseFloat(formData.pay_amount_min) : undefined,
        pay_amount_max: formData.pay_amount_max ? parseFloat(formData.pay_amount_max) : undefined,
      };

      await createGig(gigData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating gig:', err);
      const message = err instanceof Error ? err.message : 'Failed to create gig. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log('CreateGigModal render - isOpen:', isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Post a New Gig</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
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

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gig Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                placeholder="e.g., Classical Duo for Wedding Ceremony"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                placeholder="Describe the gig, requirements, and what you're looking for..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gig Type
                </label>
                <select
                  value={formData.gig_type}
                  onChange={(e) => handleInputChange('gig_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                >
                  <option value="one_time">One-time Gig</option>
                  <option value="recurring">Recurring</option>
                  <option value="residency">Residency</option>
                  <option value="tour">Tour</option>
                  <option value="session">Recording Session</option>
                  <option value="teaching">Teaching</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={formData.experience_level}
                  onChange={(e) => handleInputChange('experience_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                >
                  <option value="any">Any Level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
            </div>
          </div>

          {/* Instruments and Genres */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Requirements</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instruments Needed *
              </label>
              <div className="flex flex-wrap gap-2">
                {instruments.map(instrument => (
                  <button
                    key={instrument}
                    type="button"
                    onClick={() => handleArrayChange('instruments_needed', instrument)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.instruments_needed.includes(instrument)
                        ? 'bg-[#7823E1] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {instrument}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genres
              </label>
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => handleArrayChange('genres', genre)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.genres.includes(genre)
                        ? 'bg-[#7823E1] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Location</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={formData.venue_name}
                  onChange={(e) => handleInputChange('venue_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                  placeholder="e.g., Columbia Metropolitan Convention Center"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue Address
                </label>
                <input
                  type="text"
                  value={formData.venue_address}
                  onChange={(e) => handleInputChange('venue_address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                  placeholder="Street address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                  placeholder="e.g., Columbia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <input
                  type="text"
                  value={formData.state_province}
                  onChange={(e) => handleInputChange('state_province', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                  placeholder="e.g., SC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Compensation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compensation Type
                </label>
                <select
                  value={formData.compensation_type}
                  onChange={(e) => handleInputChange('compensation_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                >
                  <option value="paid">Paid</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="profit_share">Profit Share</option>
                  <option value="exposure">For Exposure</option>
                </select>
              </div>

              {formData.compensation_type === 'paid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pay Rate Type
                  </label>
                  <select
                    value={formData.pay_rate_type}
                    onChange={(e) => handleInputChange('pay_rate_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="per_gig">Per Gig</option>
                    <option value="flat_fee">Flat Fee</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
              )}
            </div>

            {formData.compensation_type === 'paid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Pay Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.pay_amount_min}
                    onChange={(e) => handleInputChange('pay_amount_min', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Pay Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.pay_amount_max}
                    onChange={(e) => handleInputChange('pay_amount_max', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Application & Contact</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Method
              </label>
              <select
                value={formData.application_method}
                onChange={(e) => handleInputChange('application_method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="website">Website</option>
                <option value="in_app">In-App</option>
                <option value="audition">Audition</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.audition_required}
                  onChange={(e) => handleInputChange('audition_required', e.target.checked)}
                  className="rounded border-gray-300 text-[#7823E1] focus:ring-[#7823E1]"
                />
                <span className="ml-2 text-sm text-gray-700">Audition Required</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.portfolio_required}
                  onChange={(e) => handleInputChange('portfolio_required', e.target.checked)}
                  className="rounded border-gray-300 text-[#7823E1] focus:ring-[#7823E1]"
                />
                <span className="ml-2 text-sm text-gray-700">Portfolio Required</span>
              </label>
            </div>
          </div>

          {/* Special Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Requirements or Notes
            </label>
            <textarea
              rows={3}
              value={formData.special_requirements}
              onChange={(e) => handleInputChange('special_requirements', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7823E1] focus:border-transparent"
              placeholder="Any additional requirements, dress code, equipment needs, etc."
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#7823E1] text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Post Gig'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
