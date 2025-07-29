"use client";

import { QueryProvider } from '@/components/layout/QueryProvider';
import { AuthProvider } from '@/hooks/useAuth';
import { SubscriptionProvider } from '@/hooks/useSubscription';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useEffect, type ReactNode } from 'react';
import { initializeFirebaseAppCheck } from '@/lib/firebase';

export function Providers({ children }: { children: ReactNode }) {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // Initialize Firebase App Check once the component has mounted on the client.
    // This is the correct place for client-side initialization.
    initializeFirebaseAppCheck();
  }, []);

  if (!mapsApiKey) {
    console.error("FATAL: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set in your .env.local file. Maps and location services will fail. Please follow the setup guide to configure this key.");
  }

  return (
    <APIProvider 
        apiKey={mapsApiKey || ""} 
        solutionChannel="GMP_visgl_rgm_reactfirebase_v1"
        libraries={['places', 'routes', 'geometry']}
    >
      <QueryProvider>
        <SubscriptionProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SubscriptionProvider>
      </QueryProvider>
    </APIProvider>
  );
}
