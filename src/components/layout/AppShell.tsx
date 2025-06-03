"use client";

import React from 'react';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 sm:pb-8"> {/* Add padding-bottom for bottom nav space */}
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
