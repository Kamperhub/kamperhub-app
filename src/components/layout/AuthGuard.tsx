
"use client";

import React, { type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const PUBLIC_ROUTES = ['/login', '/signup']; // Routes accessible without authentication

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-body">Loading user...</p>
      </div>
    );
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (!currentUser && !isPublicRoute) {
    router.replace('/login'); // Use replace to avoid adding to history stack
    return (
         <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg font-body">Redirecting to login...</p>
         </div>
    ); // Show loader while redirecting
  }
  
  if (currentUser && isPublicRoute) {
    router.replace('/'); // If user is logged in and tries to access login/signup, redirect to dashboard
    return (
         <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg font-body">Redirecting to dashboard...</p>
         </div>
    );
  }


  return <>{children}</>;
};
