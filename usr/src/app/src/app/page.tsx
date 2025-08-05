// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

// This component acts as a router.
// If the user is authenticated, it redirects them to the dashboard.
// If the user is unauthenticated, it redirects them to the public landing page.
export default function AppRoot() {
  const { authStatus } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authStatus === 'AUTHENTICATED') {
      router.replace('/dashboard');
    } else if (authStatus === 'UNAUTHENTICATED') {
      router.replace('/landing');
    }
    // We don't do anything on 'LOADING' or 'ERROR' states, we wait for a definitive status.
  }, [authStatus, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
