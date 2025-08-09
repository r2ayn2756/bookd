import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FeedDebug } from '@/components/feed/FeedDebug';
import { FeedFallback } from '@/components/feed/FeedFallback';
import { getServerUserWithProfile } from '@/lib/auth/utils';

export default async function HomePage() {
  // Get authenticated user with profile (auto-creates profile if needed)
  const userWithProfile = await getServerUserWithProfile();

  if (!userWithProfile) {
    redirect('/');
  }

  // Skip additional server-side data loading for now - let client handle it

  return (
    <div className="space-y-6">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar - Quick Actions */}
        <div className="lg:col-span-3">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-3">
              <Link 
                href="/gigs"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#7823E1] transition-colors"
              >
                <div className="p-2 rounded-lg" style={{backgroundColor: '#E8DFFF'}}>
                  <svg className="w-4 h-4" style={{color: '#7823E1'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v.01M12 14v.01M16 14v.01" />
                  </svg>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-900">Browse Gigs</span>
              </Link>

              <Link 
                href="/network"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-900">Find People</span>
              </Link>

              <Link 
                href="/events"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-900">Discover Events</span>
              </Link>

              <div className="flex items-center w-full p-3 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors cursor-pointer">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-900">Create Post</span>
              </div>
            </div>
          </div>
        </div>

        {/* Central Feed */}
        <div className="lg:col-span-6">
          <FeedDebug />
          <FeedFallback currentUserId={userWithProfile.id} />
        </div>

        {/* Right Sidebar - Events */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Nearby Events</h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Event 1 */}
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-red-600">15</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">Jazz Night at Blue Moon</h3>
                    <p className="text-xs text-gray-500">Dec 15, 8:00 PM</p>
                    <p className="text-xs text-gray-600 mt-1">Live jazz performances, open mic</p>
                    <span className="text-xs text-green-600 font-medium">2.1 miles away</span>
                  </div>
                </div>
              </div>

              {/* Event 2 */}
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-blue-600">18</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">Classical Concert Series</h3>
                    <p className="text-xs text-gray-500">Dec 18, 7:30 PM</p>
                    <p className="text-xs text-gray-600 mt-1">USC Symphony Orchestra</p>
                    <span className="text-xs text-green-600 font-medium">0.8 miles away</span>
                  </div>
                </div>
              </div>

              {/* Event 3 */}
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-purple-600">22</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">Holiday Music Festival</h3>
                    <p className="text-xs text-gray-500">Dec 22, 6:00 PM</p>
                    <p className="text-xs text-gray-600 mt-1">Multiple artists, food trucks</p>
                    <span className="text-xs text-green-600 font-medium">3.4 miles away</span>
                  </div>
                </div>
              </div>

              {/* Event 4 */}
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-yellow-600">28</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">New Year's Eve Gala</h3>
                    <p className="text-xs text-gray-500">Dec 28, 9:00 PM</p>
                    <p className="text-xs text-gray-600 mt-1">Formal dinner and dancing</p>
                    <span className="text-xs text-green-600 font-medium">1.7 miles away</span>
                  </div>
                </div>
              </div>

              {/* View More */}
              <div className="pt-2">
                <Link 
                  href="/events" 
                  className="block text-center text-sm font-medium hover:text-gray-900 transition-colors"
                  style={{color: '#7823E1'}}
                >
                  View All Events →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}