
"use client";

import React, { type ReactNode, useEffect } from 'react'; // Added useEffect
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const PUBLIC_ROUTES = ['/login', '/signup']; // Routes accessible without authentication

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; // Don't do anything while loading
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!currentUser && !isPublicRoute) {
      router.replace('/login');
    } else if (currentUser && isPublicRoute) {
      router.replace('/');
    }
  }, [currentUser, loading, pathname, router]); // Dependencies for the effect

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-body">Loading user...</p>
      </div>
    );
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  // If still loading or if it's a navigation scenario handled by useEffect, show a loader or null
  // This helps prevent rendering children prematurely before navigation takes effect.
  if ((!currentUser && !isPublicRoute) || (currentUser && isPublicRoute)) {
    return (
         <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg font-body">Redirecting...</p>
         </div>
    );
  }

  return <>{children}</>;
};
