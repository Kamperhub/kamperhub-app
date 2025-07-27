
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
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
  const { user, authStatus, profileStatus, profileError } = useAuth();
  const router = useRouter();

  if (authStatus === 'LOADING' || (authStatus === 'AUTHENTICATED' && profileStatus === 'LOADING')) {
    return <LoadingScreen message={authStatus === 'LOADING' ? 'Verifying session...' : 'Loading your profile...'} />;
  }
  
  if (authStatus === 'UNAUTHENTICATED') {
    // This check is important. If we are on the server or in the initial render,
    // the router might not be ready. We should return a loading state instead of calling push.
    if (typeof window !== 'undefined') {
        router.push('/login');
    }
    return <LoadingScreen message="Redirecting to login..." />;
  }
  
  if (authStatus === 'AUTHENTICATED' && profileStatus === 'SUCCESS' && user) {
    return <>{children}</>;
  }

  // Fallback for any other state (like error states or unhandled conditions)
  // In a real app, you might show a dedicated error page.
  return <LoadingScreen message="Please wait..." />;
};
