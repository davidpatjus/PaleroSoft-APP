"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface NotificationsLayoutProps {
  children: React.ReactNode;
}

export default function NotificationsLayout({ children }: NotificationsLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for auth to load
    if (isLoading || !user) return;

    const isAdminPath = pathname.startsWith('/notifications/admin');
    const isUserAdmin = user.role === 'ADMIN';

    // Redirect logic based on user role and current path
    if (isAdminPath && !isUserAdmin) {
      // Non-admin trying to access admin panel - redirect to user notifications
      router.push('/notifications');
      return;
    }

    if (!isAdminPath && isUserAdmin && pathname === '/notifications') {
      // Admin accessing base notifications - redirect to admin panel
      router.push('/notifications/admin');
      return;
    }
  }, [user, isLoading, pathname, router]);

  // Show loading while auth is loading or during redirects
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-palero-blue1" />
          <p className="text-sm text-palero-navy2">Loading notifications...</p>
        </div>
      </div>
    );
  }

  // Additional check during render to prevent flash of wrong content
  const isAdminPath = pathname.startsWith('/notifications/admin');
  const isUserAdmin = user.role === 'ADMIN';

  if (isAdminPath && !isUserAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-palero-blue1" />
          <p className="text-sm text-palero-navy2">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!isAdminPath && isUserAdmin && pathname === '/notifications') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-palero-blue1" />
          <p className="text-sm text-palero-navy2">Redirecting to admin panel...</p>
        </div>
      </div>
    );
  }

  // Render children if everything is valid
  return <>{children}</>;
}