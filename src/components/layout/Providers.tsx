
"use client";

import { QueryProvider } from '@/components/layout/QueryProvider';
import { AuthProvider } from '@/hooks/useAuth';
import { SubscriptionProvider } from '@/hooks/useSubscription';
import { APIProvider } from '@vis.gl/react-google-maps';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <APIProvider 
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "MISSING_API_KEY"} 
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
