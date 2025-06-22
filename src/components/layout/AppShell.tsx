
"use client";

import React from 'react';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { APIProvider } from '@vis.gl/react-google-maps';

export function AppShell({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
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
  );
}
