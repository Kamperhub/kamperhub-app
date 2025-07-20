
"use client";

import React, { useState, useEffect, createContext } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { AuthGuard } from './AuthGuard';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Loader2 } from 'lucide-react';
import { initializeFirebaseAppCheck } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface NavigationContextType {
  setIsNavigating: (isNavigating: boolean) => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// A new internal component to hold the main layout structure.
// This allows AuthGuard to wrap the entire visible app.
const MainLayout = ({ children, apiKeyMissing }: { children: React.ReactNode, apiKeyMissing: boolean }) => {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 sm:pb-8">
        {apiKeyMissing && !isAuthPage && (
           <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-headline">Google Maps API Key Missing</AlertTitle>
              <AlertDescription className="font-body">
                The `NEXT_PUBLIC_FIREBASE_API_KEY` is not set in your `.env.local` file. Map-related features will not work. Please see the setup guide to fix this.
              </AlertDescription>
            </Alert>
        )}
        {children}
      </main>
      {!isAuthPage && <BottomNavigation />}
    </div>
  );
};


export function AppShell({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY; // Use the Firebase key for Maps
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Hide loader whenever the path changes, which signifies navigation is complete
    setIsNavigating(false);
  }, [pathname, searchParams]);
  
  // Initialize Firebase App Check once the component has mounted on the client.
  useEffect(() => {
    initializeFirebaseAppCheck();
  }, []);

  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/signup';
  const apiKeyMissing = !apiKey;
  
  const AppContent = () => {
    return isPublicPage ? (
      <MainLayout apiKeyMissing={apiKeyMissing}>{children}</MainLayout>
    ) : (
      <AuthGuard>
        <MainLayout apiKeyMissing={apiKeyMissing}>{children}</MainLayout>
      </AuthGuard>
    );
  }

  return (
    <NavigationContext.Provider value={{ setIsNavigating }}>
      {isNavigating && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-lg font-semibold text-primary">Loading...</p>
        </div>
      )}
       <APIProvider 
          apiKey={apiKey || "MISSING_API_KEY"} 
          solutionChannel="GMP_visgl_rgm_reactfirebase_v1"
          libraries={['places', 'routes', 'geometry']}
        >
          <AppContent/>
        </APIProvider>
    </NavigationContext.Provider>
  );
}
