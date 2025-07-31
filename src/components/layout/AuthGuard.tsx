"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ message }: { message: string }) => (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-semibold text-primary font-body">{message}</p>
    </div>
);

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authStatus, profileStatus, profileError } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const isPublicPage = pathname === '/login' || pathname === '/' || pathname === '/signup';

    if (authStatus === 'AUTHENTICATED' && profileStatus === 'SUCCESS') {
      if (isPublicPage) {
        const redirectedFrom = searchParams.get('redirectedFrom');
        const targetUrl = redirectedFrom ? decodeURIComponent(redirectedFrom) : '/dashboard';
        router.replace(targetUrl);
      }
    }
    
    if (authStatus === 'UNAUTHENTICATED') {
      if (!isPublicPage) {
        const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        router.replace(`/login?redirectedFrom=${encodeURIComponent(currentPath)}`);
      }
    }
  }, [authStatus, profileStatus, router, pathname, searchParams]);

  if (authStatus === 'LOADING' || (authStatus === 'AUTHENTICATED' && profileStatus === 'LOADING')) {
    return <LoadingScreen message={authStatus === 'LOADING' ? 'Initializing Session...' : 'Loading Your Profile...'} />;
  }
  
  if (profileStatus === 'ERROR') {
    // A simple error display, can be enhanced.
    return <LoadingScreen message={`Error: ${profileError}`} />;
  }
  
  if (authStatus === 'AUTHENTICATED' && profileStatus === 'SUCCESS') {
    return <>{children}</>;
  }
  
  const isPublicPage = pathname === '/login' || pathname === '/' || pathname === '/signup';
  if (authStatus === 'UNAUTHENTICATED' && isPublicPage) {
    return <>{children}</>;
  }
  
  // Fallback for redirecting state
  return <LoadingScreen message="Verifying session..." />;
};
