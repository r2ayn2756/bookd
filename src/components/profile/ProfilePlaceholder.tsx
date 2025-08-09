'use client';

import Link from 'next/link';

interface ProfilePlaceholderProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}

export function ProfilePlaceholder({ 
  title, 
  description, 
  actionText = "Complete Profile", 
  actionHref = "/profile/edit",
  icon
}: ProfilePlaceholderProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 text-center">{title}</h2>
      </div>
      <div className="p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            {icon || (
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No {title} Yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {description}
          </p>
          <Link
            href={actionHref}
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
            style={{backgroundColor: '#7823E1'}}
          >
            {actionText}
          </Link>
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  type: 'performances' | 'experience' | 'featured';
}

export function EmptyProfileSection({ type }: EmptyStateProps) {
  const configs = {
    performances: {
      title: "Performances",
      description: "Share your past and upcoming performances to showcase your experience.",
      icon: (
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      )
    },
    experience: {
      title: "Experience",
      description: "Add your musical background, education, and professional experience.",
      icon: (
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v.01M12 14v.01M16 14v.01" />
        </svg>
      )
    },
    featured: {
      title: "Featured Performances",
      description: "Highlight your best performances with videos or recordings.",
      icon: (
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    }
  };

  const config = configs[type];

  return <ProfilePlaceholder {...config} />;
}