
"use client";

import React, 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm text-foreground p-4">
    <div className="flex flex-col items-center justify-center text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg font-semibold text-primary font-body">{message}</p>
    </div>
  </div>
);

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authStatus, profileStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (authStatus === 'UNAUTHENTICATED') {
      const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      // Prevent redirecting to login from the login page itself or base path if it's public
      if (pathname !== '/login' && pathname !== '/') {
        router.push(`/login?redirectedFrom=${encodeURIComponent(currentPath)}`);
      } else {
        router.push('/login');
      }
    }
  }, [authStatus, router, pathname, searchParams]);

  if (authStatus === 'LOADING' || (authStatus === 'AUTHENTICATED' && profileStatus !== 'SUCCESS')) {
    return <LoadingScreen message={authStatus === 'LOADING' ? 'Initializing Session...' : 'Loading Your Profile...'} />;
  }
  
  if (authStatus === 'AUTHENTICATED' && profileStatus === 'SUCCESS') {
    return <>{children}</>;
  }
  
  // This will catch the UNAUTHENTICATED state while the useEffect redirect is firing
  return <LoadingScreen message="Redirecting..." />;
};
