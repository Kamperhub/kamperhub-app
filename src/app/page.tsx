
"use client";

import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { NavItem } from '@/lib/navigation';
import { navItems as defaultNavItems } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home as HomeIcon, Loader2, LayoutDashboard, AlertTriangle, CornerDownLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { updateUserPreferences } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/hooks/useAuth';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { NavigationContext } from '@/components/layout/AppShell';
import { StartTripDialog } from '@/components/features/dashboard/StartTripDialog';
import { ReturnTripDialog } from '@/components/features/dashboard/ReturnTripDialog';

const CarAndCaravanIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
        <path d="M5.613 11.395A3.492 3.492 0 0 1 8.875 9H13.5"/>
        <path d="M13.5 9V7.125c0-.982.684-1.808 1.637-2.052a3.5 3.5 0 0 1 3.425.404L21.5 7.5V11h-1.5"/>
        <path d="M8.875 9H3.5a2 2 0 0 0-2 2v7h1.938"/>
        <path d="m20.5 11-1.407 1.407a2 2 0 0 1-1.414.593H16.5v6H22v-3.5a2 2 0 0 0-2-2Z"/>
        <circle cx="6.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
);


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

export default function DashboardPage() {
  const [orderedNavItems, setOrderedNavItems] = useState<NavItem[]>(defaultNavItems);
  const [isMounted, setIsMounted] = useState(false);

  // The AuthGuard handles loading/error states for these.
  // We can trust they are available here.
  const { user, userProfile: userPrefs } = useAuth(); 
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const updateUserPrefsMutation = useMutation({
    mutationFn: (layout: string[]) => updateUserPreferences({ dashboardLayout: layout }),
    onSuccess: () => {
      // Optimistically update the userPrefs in the main auth context to prevent layout flicker
      queryClient.setQueryData(['userPreferences', user?.uid], (oldData: any) => ({
        ...oldData,
        dashboardLayout: orderedNavItems.map(item => item.href)
      }));
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
  
  // The AuthGuard handles the main loading/error state. We just show a simple skeleton if not mounted.
  if (!isMounted) {
     return (
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Skeleton className="mr-4 h-[60px] w-[60px] rounded-md" />
                    <div>
                        <h1 className="text-3xl font-headline text-primary">Welcome to KamperHub</h1>
                        <p className="font-body text-muted-foreground">Loading dashboard...</p>
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
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center mb-6">
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
      
      <div className="my-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
        <StartTripDialog>
            <Button size="lg" className="h-14 px-10 text-xl font-headline bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg animate-pulse">
                <CarAndCaravanIcon className="mr-3 h-6 w-6" />
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
