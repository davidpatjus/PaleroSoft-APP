"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute } from '@/utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoute?: string;
}

export function ProtectedRoute({ children, requiredRoute }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (requiredRoute && !canAccessRoute(user.role, requiredRoute)) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, isLoading, router, requiredRoute]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRoute && !canAccessRoute(user.role, requiredRoute)) {
    return null;
  }

  return <>{children}</>;
}