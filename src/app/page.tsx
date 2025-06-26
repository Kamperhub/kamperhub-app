
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NavItem } from '@/lib/navigation';
import { navItems as defaultNavItems } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Home as HomeIcon, Loader2, LayoutDashboard, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth, firebaseInitializationError } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { fetchUserPreferences, updateUserPreferences } from '@/lib/api-client';
import type { UserProfile } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface SortableNavItemProps {
  id: string;
  item: NavItem;
  isMobile: boolean;
}

function SortableNavItem({ id, item, isMobile }: SortableNavItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="touch-manipulation h-full">
      <Card className="h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-3 flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
                <CardTitle className="font-headline text-xl text-primary flex items-center">
                    <item.icon className="w-6 h-6 mr-3 text-primary" />
                    {item.label}
                </CardTitle>
                <CardDescription className="font-body text-sm text-muted-foreground line-clamp-3">
                    {item.description}
                </CardDescription>
            </div>
            {!isMobile && (
                <div {...attributes} {...listeners} className="cursor-grab p-2 text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-5 w-5" />
                </div>
            )}
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
                <p>
                    Please go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">Firebase Console</a>, 
                    find your Web API Key, and paste it into the file: 
                    <code className="bg-muted text-destructive-foreground px-1 py-0.5 rounded-sm mx-1 font-mono text-sm">src/lib/firebase.ts</code>
                </p>
            </AlertDescription>
        </Alert>
    </div>
);


export default function DashboardPage() {
  const [orderedNavItems, setOrderedNavItems] = useState<NavItem[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: userPrefs, isLoading: isLoadingLayout, error: prefsError } = useQuery<Partial<UserProfile>>({
    queryKey: ['userPreferences', firebaseUser?.uid],
    queryFn: fetchUserPreferences,
    enabled: !!firebaseUser,
  });

  const updateUserPrefsMutation = useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', firebaseUser?.uid] });
    },
    onError: (error: Error) => {
      toast({ title: "Could Not Save Layout", description: error.message, variant: "destructive" });
    }
  });


  useEffect(() => {
    setHasMounted(true);
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    if (firebaseInitializationError) {
        setIsAuthLoading(false);
        return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsAuthLoading(false);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (hasMounted && !isAuthLoading && !firebaseUser && !firebaseInitializationError) {
      router.push('/login');
    }
  }, [hasMounted, isAuthLoading, firebaseUser, router]);

  useEffect(() => {
    if (userPrefs) {
      const mainPageNavItems = defaultNavItems; 
      const storedLayoutHrefs = userPrefs.dashboardLayout;

      if (storedLayoutHrefs && storedLayoutHrefs.length > 0) {
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
    } else if (!isLoadingLayout) {
      setOrderedNavItems(defaultNavItems);
    }
  }, [userPrefs, isLoadingLayout]);


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const newOrder = arrayMove(orderedNavItems, 
        orderedNavItems.findIndex((item) => item.href === active.id),
        orderedNavItems.findIndex((item) => item.href === over.id)
      );
      
      setOrderedNavItems(newOrder); 
      
      const newLayoutHrefs = newOrder.map(item => item.href);
      updateUserPrefsMutation.mutate({ dashboardLayout: newLayoutHrefs });
    }
  }, [orderedNavItems, updateUserPrefsMutation]); 

  if (firebaseInitializationError) {
      return <FirebaseErrorState error={firebaseInitializationError} />;
  }

  if (!hasMounted || isAuthLoading || (!isAuthLoading && !firebaseUser)) {
    return <DashboardSkeleton loadingText={isAuthLoading ? 'Authenticating...' : 'Redirecting...'} />;
  }
  
  if (isLoadingLayout) {
     return <DashboardSkeleton loadingText="Loading your personalized dashboard..." />;
  }

  return (
    <div className="space-y-8">
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={isMobileView ? undefined : handleDragEnd}>
        <SortableContext items={orderedNavItems.map(item => item.href)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {orderedNavItems.map((item) => (
              <Link key={item.href} href={item.href} className="block h-full no-underline group">
                <SortableNavItem id={item.href} item={item} isMobile={isMobileView} />
              </Link>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
