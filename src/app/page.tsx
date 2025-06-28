
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NavItem } from '@/lib/navigation';
import { navItems as defaultNavItems } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home as HomeIcon, Loader2, LayoutDashboard, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { firebaseInitializationError } from '@/lib/firebase';
import { fetchUserPreferences, updateUserPreferences } from '@/lib/api-client';
import type { UserProfile } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/hooks/useAuth';

function NavItemCard({ item }: { item: NavItem }) {
  return (
    <Link href={item.href} className="block h-full no-underline group">
      <Card className="h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-3">
            <CardTitle className="font-headline text-xl text-primary flex items-center">
                <item.icon className="w-6 h-6 mr-3 text-primary" />
                {item.label}
            </CardTitle>
            <CardDescription className="font-body text-sm text-muted-foreground line-clamp-3">
                {item.description}
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-between pt-0">
          <div
            className="h-32 w-full bg-muted/30 rounded-md flex items-center justify-center my-2 overflow-hidden"
            data-ai-hint={item.keywords}
          >
            <item.icon className="w-16 h-16 text-accent opacity-50" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

const DashboardSkeleton = ({ loadingText }: { loadingText: string }) => (
    <div className="space-y-8">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
                <Skeleton className="mr-4 h-[60px] w-[60px] rounded-md" />
                <div>
                    <h1 className="text-3xl font-headline text-primary">Welcome to KamperHub</h1>
                    <p className="font-body text-muted-foreground">{loadingText}</p>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="pb-3">
                        <Skeleton className="h-6 w-3/5" />
                        <Skeleton className="h-4 w-4/5 mt-1" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-32 w-full rounded-md mb-2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
);

const FirebaseErrorState = ({ error }: { error: string }) => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <Alert variant="destructive" className="max-w-2xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-headline text-lg">Firebase Configuration Error</AlertTitle>
            <AlertDescription className="font-body space-y-2 mt-2">
                <p>{error}</p>
                <p>Please follow the setup instructions in <code className="bg-muted text-destructive-foreground px-1 py-0.5 rounded-sm mx-1 font-mono text-sm">FIREBASE_SETUP_CHECKLIST.md</code> to configure your <code className="bg-muted text-destructive-foreground px-1 py-0.5 rounded-sm mx-1 font-mono text-sm">.env.local</code> file.</p>
            </AlertDescription>
        </Alert>
    </div>
);

export default function DashboardPage() {
  const [orderedNavItems, setOrderedNavItems] = useState<NavItem[]>(defaultNavItems);
  const [isMounted, setIsMounted] = useState(false);

  const { user, isAuthLoading } = useAuth();
  const router = useRouter();
  
  const { data: userPrefs, error: prefsError, isLoading: isLoadingPrefs } = useQuery<Partial<UserProfile>>({
    queryKey: ['userPreferences', user?.uid],
    queryFn: fetchUserPreferences,
    enabled: !!user && !isAuthLoading,
    retry: (failureCount, error) => {
      if (error.message.includes("500") || error.message.includes("crash")) {
        return false;
      }
      return failureCount < 2;
    },
  });
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !user && !firebaseInitializationError) {
      router.push('/login');
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    const mainPageNavItems = defaultNavItems; 
    const storedLayoutHrefs = userPrefs?.dashboardLayout;

    if (storedLayoutHrefs && Array.isArray(storedLayoutHrefs) && storedLayoutHrefs.length > 0) {
      const itemsFromStorage = storedLayoutHrefs.map(href => mainPageNavItems.find(item => item.href === href)).filter(Boolean) as NavItem[];
      const currentMainPageHrefs = new Set(mainPageNavItems.map(item => item.href));
      const itemsInStorageHrefs = new Set(itemsFromStorage.map(item => item.href));

      let finalItems = [...itemsFromStorage];
      mainPageNavItems.forEach(defaultItem => {
        if (!itemsInStorageHrefs.has(defaultItem.href)) {
          finalItems.push(defaultItem);
        }
      });
      finalItems = finalItems.filter(item => currentMainPageHrefs.has(item.href));
      setOrderedNavItems(finalItems);
    } else {
      setOrderedNavItems(mainPageNavItems);
    }
  }, [userPrefs]);
  
  if (firebaseInitializationError) {
      return <FirebaseErrorState error={firebaseInitializationError} />;
  }
  
  if (isAuthLoading || (user && isLoadingPrefs) || !isMounted) {
     return <DashboardSkeleton loadingText={isAuthLoading ? 'Authenticating...' : !isMounted ? 'Preparing dashboard...' : 'Loading dashboard...'} />;
  }

  return (
    <div className="space-y-8">
      {prefsError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-headline">Error Loading Dashboard Data</AlertTitle>
          <AlertDescription className="font-body">
             <p>We couldn't load your personalized dashboard settings. This often happens if the server-side configuration is not set up correctly.</p>
             <p className="font-mono text-xs mt-2">Error details: {prefsError.message}</p>
             <p className="mt-2">Please check the environment variable status and ensure your <code className="bg-destructive-foreground/20 px-1 rounded-sm">GOOGLE_APPLICATION_CREDENTIALS_JSON</code> in <code className="bg-destructive-foreground/20 px-1 rounded-sm">.env.local</code> is correct and on a single line.</p>
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/kamperhub-s4hc2.firebasestorage.app/o/KamperHub%20512x512.jpg?alt=media&token=00bf2acd-dbca-4cc2-984e-58461f67fdbd"
            alt="KamperHub Logo"
            width={60}
            height={60}
            className="mr-4 rounded-md"
            priority
            data-ai-hint="logo brand"
          />
          <div>
            <h1 className="text-3xl font-headline text-primary">Welcome to KamperHub</h1>
            <p className="font-body text-muted-foreground">Your ultimate travelling companion for everyone.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {orderedNavItems.map((item) => (
          <NavItemCard key={item.href} item={item} />
        ))}
      </div>
    </div>
  );
}
