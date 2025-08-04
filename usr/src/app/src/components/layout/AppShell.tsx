"use client";

import React, { useState, useEffect, createContext } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface NavigationContextType {
  isNavigating: boolean;
  setIsNavigating: (isNavigating: boolean) => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const publicRoutes = ['/', '/login', '/signup', '/learn', '/contact'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  const apiKeyMissing = !apiKey;
  const isPublicPage = publicRoutes.includes(pathname);

  const MainLayout = (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 sm:pb-8">
        {apiKeyMissing && !isPublicPage && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-headline">Google Maps API Key Missing</AlertTitle>
            <AlertDescription className="font-body">
              The `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is not set. Map-related features will not work.
            </AlertDescription>
          </Alert>
        )}
        {children}
      </main>
      {!isPublicPage && <BottomNavigation />}
    </div>
  );

  return (
    <NavigationContext.Provider value={{ isNavigating, setIsNavigating }}>
      {isNavigating && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-lg font-semibold text-primary">Loading...</p>
        </div>
      )}

      {isPublicPage ? (
        MainLayout
      ) : (
        <AuthGuard>
          {MainLayout}
        </AuthGuard>
      )}
    </NavigationContext.Provider>
  );
}
