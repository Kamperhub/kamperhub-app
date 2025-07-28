"use client";

import { QueryProvider } from '@/components/layout/QueryProvider';
import { AuthProvider } from '@/hooks/useAuth';
import { SubscriptionProvider } from '@/hooks/useSubscription';
import { APIProvider } from '@vis.gl/react-google-maps';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!mapsApiKey) {
    console.error("FATAL: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Maps will not load.");
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
