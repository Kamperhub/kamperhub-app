
"use client";

import React, { useState, useEffect, createContext } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Loader2 } from 'lucide-react';
import { AuthGuard } from './AuthGuard';

interface NavigationContextType {
  setIsNavigating: (isNavigating: boolean) => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function AppShell({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Hide loader whenever the path changes, which signifies navigation is complete
    setIsNavigating(false);
  }, [pathname, searchParams]);

  return (
    <NavigationContext.Provider value={{ setIsNavigating }}>
      {isNavigating && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-lg font-semibold text-primary">Loading...</p>
        </div>
      )}
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 pb-24 sm:pb-8">
           {apiKey ? (
              <APIProvider 
                apiKey={apiKey} 
                solutionChannel="GMP_visgl_rgm_reactfirebase_v1"
                libraries={['places', 'routes']}
              >
                {children}
              </APIProvider>
            ) : (
              children 
            )}
        </main>
        <BottomNavigation />
      </div>
    </NavigationContext.Provider>
  );
}
