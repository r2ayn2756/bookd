'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { getCurrentUserPastPerformances, getUserPastPerformances } from '@/services/client/performances';
import type { PastPerformance } from '@/types/database';

interface PerformanceSectionProps {
  isOwner?: boolean;
  userId?: string;
}

export function PerformanceSection({ isOwner = false, userId }: PerformanceSectionProps) {
  const [performances, setPerformances] = useState<PastPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [effectiveIsOwner, setEffectiveIsOwner] = useState<boolean>(isOwner);
  const supabase = createClient();

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

  useEffect(() => {
    const loadPerformances = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = effectiveIsOwner && !userId
          ? await getCurrentUserPastPerformances()
          : userId
          ? await getUserPastPerformances(userId)
          : [];
        setPerformances(data);
      } catch (err) {
        console.warn('Could not load performances:', err);
        setError('Failed to load performances');
        setPerformances([]);
      } finally {
        setLoading(false);
      }
    };

    loadPerformances();
  }, [effectiveIsOwner, userId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Performances</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Loading performances...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Performances</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (performances.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Performances</h2>
            {isOwner && (
              <Link
                href="/profile/edit"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Add Performance
              </Link>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Performances Yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Share your past and upcoming performances to showcase your experience.
            </p>
            {isOwner && (
              <Link
                href="/profile/edit"
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
                style={{backgroundColor: '#7823E1'}}
              >
                Add Your First Performance
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Performances</h2>
            {effectiveIsOwner && (
            <Link
              href="/profile/edit"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Manage Performances
            </Link>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {performances.map((performance) => (
            <div 
              key={performance.id} 
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {performance.title}
                  </h3>
                  
                  <div className="mt-2 space-y-1">
                    {performance.role && (
                      <p className="text-gray-700">
                        <span className="font-medium">Role:</span> {performance.role}
                      </p>
                    )}
                    
                    {performance.venue && (
                      <p className="text-gray-700">
                        <span className="font-medium">Venue:</span> {performance.venue}
                      </p>
                    )}
                    
                    {performance.performance_date && (
                      <p className="text-gray-500 text-sm">
                        {formatDate(performance.performance_date)}
                      </p>
                    )}
                    
                    {performance.description && (
                      <p className="text-gray-600 mt-2">
                        {performance.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {effectiveIsOwner && performances.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add More Performances
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
