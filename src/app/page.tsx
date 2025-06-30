
"use client";

import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NavItem } from '@/lib/navigation';
import { navItems as defaultNavItems } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home as HomeIcon, Loader2, LayoutDashboard, AlertTriangle, Rocket, CornerDownLeft } from 'lucide-react';
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
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { NavigationContext } from '@/components/layout/AppShell';
import { StartTripDialog } from '@/components/features/dashboard/StartTripDialog';
import { ReturnTripDialog } from '@/components/features/dashboard/ReturnTripDialog';


function NavItemCard({ item }: { item: NavItem }) {
  const navContext = useContext(NavigationContext);
  const handleNavigation = () => {
    navContext?.setIsNavigating(true);
  };

  return (
    <Link href={item.href} className="block h-full no-underline group" draggable="false" onClick={handleNavigation}>
      <Card className="h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-grab active:cursor-grabbing">
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

function SortableNavItemCard({ item }: { item: NavItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.href });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'none',
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <NavItemCard item={item} />
    </div>
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: userPrefs, error: prefsError, isLoading: isLoadingPrefs } = useQuery<Partial<UserProfile>>({
    queryKey: ['userPreferences', user?.uid],
    queryFn: fetchUserPreferences,
    enabled: !!user && !isAuthLoading,
    retry: (failureCount, error: Error) => {
      if (error.message.includes("500") || error.message.includes("crash")) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const updateUserPrefsMutation = useMutation({
    mutationFn: (layout: string[]) => updateUserPreferences({ dashboardLayout: layout }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.uid] });
      toast({ title: "Layout Saved", description: "Your dashboard layout has been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error Saving Layout", description: error.message, variant: "destructive" });
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
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // User must drag for 10px before drag starts, preventing accidental drags on click
      },
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedNavItems((items) => {
        const oldIndex = items.findIndex(item => item.href === active.id);
        const newIndex = items.findIndex(item => item.href === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Persist the new order
        const newLayoutHrefs = newOrder.map(item => item.href);
        updateUserPrefsMutation.mutate(newLayoutHrefs);

        return newOrder;
      });
    }
  }, [updateUserPrefsMutation]);

  const navItemHrefs = useMemo(() => orderedNavItems.map(item => item.href), [orderedNavItems]);

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
          <AlertDescription className="font-body space-y-2">
             <p>We couldn't load your personalized dashboard settings. The server reported the following issue:</p>
             <pre className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded-md font-mono whitespace-pre-wrap">
              {prefsError.message}
             </pre>
             {prefsError.message.includes('404') ? (
                <div className="mt-4 border-t border-destructive-foreground/20 pt-2">
                    <p className="font-bold">This is a common environment setup issue.</p>
                    <p>
                        A '404 Not Found' error for an API route usually means the server failed to start correctly. This is almost always caused by an issue with the <code className="bg-destructive-foreground/20 px-1 rounded-sm">GOOGLE_APPLICATION_CREDENTIALS_JSON</code> in your <code className="bg-destructive-foreground/20 px-1 rounded-sm">.env.local</code> file.
                    </p>
                    <p className="mt-2">
                        Please use the updated diagnostic tool at <a href="/api/debug/env" target="_blank" rel="noopener noreferrer" className="underline font-bold">/api/debug/env</a> to see the exact server-side error, then follow the <code className="bg-destructive-foreground/20 px-1 rounded-sm">FIREBASE_SETUP_CHECKLIST.md</code> to fix it.
                    </p>
                </div>
            ) : (prefsError.message.includes('Database Not Found') || prefsError.message.includes('Could not find the database')) ? (
                <div className="mt-4 border-t border-destructive-foreground/20 pt-2">
                    <p className="font-bold">This is an environment setup issue, not a code problem.</p>
                    <p>Please follow the updated instructions in <code className="bg-destructive-foreground/20 px-1 rounded-sm">FIREBASE_SETUP_CHECKLIST.md</code>, especially <strong>Step 5</strong>, which guides you to use the built-in diagnostic tool to verify your project setup.</p>
                </div>
            ) : (
                <p className="mt-2">Please check your server-side configuration in <code className="bg-destructive-foreground/20 px-1 rounded-sm">.env.local</code>.</p>
            )}
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
      
      <div className="text-center my-6 flex justify-center items-center gap-4">
        <StartTripDialog>
            <Button size="lg" className="h-14 px-10 text-xl font-headline bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg animate-pulse">
                <Rocket className="mr-3 h-6 w-6" />
                Start a Trip!
            </Button>
        </StartTripDialog>
        <ReturnTripDialog>
            <Button size="lg" variant="outline" className="h-14 px-10 text-xl font-headline shadow-lg">
                <CornerDownLeft className="mr-3 h-6 w-6" />
                Plan Return
            </Button>
        </ReturnTripDialog>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={navItemHrefs} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {orderedNavItems.map((item) => (
              <SortableNavItemCard key={item.href} item={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
