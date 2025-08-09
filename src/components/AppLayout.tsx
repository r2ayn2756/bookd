'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  
  // Pages that should not show the header (unauthenticated pages)
  const noHeaderPages = ['/', '/auth/callback'];
  const shouldShowHeader = !noHeaderPages.includes(pathname);

  if (!shouldShowHeader) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}