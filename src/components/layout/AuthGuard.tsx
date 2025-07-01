
'use client';

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import Link from 'next/link';

// Paths that do not require any subscription access
const UNPROTECTED_PATHS = [
  '/login',
  '/signup',
  '/my-account', // Allow access to manage subscription
  '/contact',
  '/learn',
  '/subscribe/success',
  '/subscribe/cancel',
  '/api/debug/env', // Keep debug routes accessible
  '/api/debug/create-admin-user'
];

function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
      <p className="text-lg font-semibold text-primary">Verifying access...</p>
    </div>
  );
}

function Paywall() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-lg text-center shadow-xl border-accent">
        <CardHeader>
           <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4">
              <ShieldAlert className="h-10 w-10 text-accent" />
          </div>
          <CardTitle className="font-headline text-3xl text-accent">
            Your Trial Has Ended
          </CardTitle>
          <CardDescription className="font-body text-lg text-muted-foreground pt-2">
            Please subscribe to continue using KamperHub.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="font-body text-foreground">
            Thank you for trying KamperHub! To unlock all features and continue planning your adventures, please upgrade to a Pro subscription.
          </p>
          <Button asChild className="font-body bg-primary text-primary-foreground hover:bg-primary/90">
             <Link href="/my-account">
                Go to My Account to Subscribe
              </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthLoading, isProfileLoading } = useAuth();
  const { hasProAccess, isLoading: isSubscriptionLoading } = useSubscription();

  const isUnprotected = UNPROTECTED_PATHS.some(path => pathname.startsWith(path));

  if (isUnprotected) {
    return <>{children}</>;
  }

  // Use the more specific loading flags from useAuth
  if (isAuthLoading || isProfileLoading) {
    return <FullPageLoader />;
  }
  
  if (!user) {
    // This should ideally not be hit if pages have their own checks, but as a fallback
    router.push('/login');
    return <FullPageLoader />;
  }

  // Subscription check remains the same
  if (!hasProAccess) {
    return <Paywall />;
  }
  
  return <>{children}</>;
};
