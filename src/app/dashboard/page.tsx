"use client";

import React, { useMemo, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import Image from 'next/image';
import type { NavItem } from '@/lib/navigation';
import { navItems as defaultNavItems } from '@/lib/navigation';
import { updateUserPreferences, fetchAllVehicleData } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { NavigationContext } from '@/app/(protected)/layout';

import { SortableNavItemCard } from '@/components/features/dashboard/SortableNavItemCard';
import { GettingStartedGuide } from '@/components/features/dashboard/GettingStartedGuide';
import { Button } from '@/components/ui/button';
import { Car, CornerDownLeft, Loader2 } from 'lucide-react';
import { StartTripDialog } from '@/components/features/dashboard/StartTripDialog';
import { ReturnTripDialog } from '@/components/features/dashboard/ReturnTripDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import * as icons from 'lucide-react';


export default function DashboardPage() {
  const { user, userProfile: userPrefs, isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navContext = useContext(NavigationContext);

  const { data: pageData, isLoading: isLoadingData, error: dataError } = useQuery({
    queryKey: ['allVehicleData', user?.uid],
    queryFn: fetchAllVehicleData,
    enabled: !!user,
  });

  const orderedNavItems = useMemo(() => {
    const mainPageNavItems = defaultNavItems.filter(item => item.href !== '/dashboard' && item.href !== '/');
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
      
      return finalItems.map(item => ({...item, icon: icons[item.iconName as keyof typeof icons]}));
    }
    return mainPageNavItems.map(item => ({...item, icon: icons[item.iconName as keyof typeof icons]}));
  }, [userPrefs]);
  
  const updateUserPreferencesMutation = useMutation({
    mutationFn: (prefs: { dashboardLayout?: string[]; hasDismissedGettingStartedGuide?: boolean }) => updateUserPreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['allVehicleData', user?.uid] });
    },
    onError: (error) => {
      toast({ title: "Preference Save Failed", description: (error as Error).message, variant: "destructive" });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = orderedNavItems.findIndex(item => item.href === active.id);
      const newIndex = orderedNavItems.findIndex(item => item.href === over?.id);
      const newOrderedItems = arrayMove(orderedNavItems, oldIndex, newIndex);
      
      const newLayoutHrefs = newOrderedItems.map(item => item.href);
      updateUserPreferencesMutation.mutate({ dashboardLayout: newLayoutHrefs });
    }
  };
  
  const itemHrefs = useMemo(() => orderedNavItems.map(item => item.href), [orderedNavItems]);
  
  const isNewUser = (!pageData?.vehicles || pageData.vehicles.length === 0) && (!pageData?.trips || pageData.trips.length === 0);
  const showGettingStartedGuide = isNewUser && !userPrefs?.hasDismissedGettingStartedGuide;

  const handleDismissGuide = () => {
    updateUserPreferencesMutation.mutate({ hasDismissedGettingStartedGuide: true });
  };

  if (isAuthLoading || isLoadingData) {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-md"/>
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64"/>
                    <Skeleton className="h-5 w-80"/>
                </div>
            </div>
            <Skeleton className="h-48 w-full"/>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
        </div>
    );
  }

  if (dataError) {
      return (
          <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Dashboard</AlertTitle>
              <AlertDescription>{(dataError as Error).message}</AlertDescription>
          </Alert>
      );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/kamperhub-s4hc2.appspot.com/o/KamperhubMedia%2FKamperHub%20512x512.jpg?alt=media&token=85520c57-6031-4d34-a8f2-8947e4ac87d2"
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
        <div className="flex gap-2 flex-shrink-0">
          <StartTripDialog>
            <Button className="font-body animate-pulse"><Car className="mr-2 h-4 w-4"/>Start a Trip</Button>
          </StartTripDialog>
          <ReturnTripDialog>
            <Button className="font-body" variant="outline"><CornerDownLeft className="mr-2 h-4 w-4"/>Plan Return</Button>
          </ReturnTripDialog>
        </div>
      </div>
      
      {showGettingStartedGuide ? (
        <GettingStartedGuide onDismiss={handleDismissGuide} isDismissing={updateUserPreferencesMutation.isPending} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={itemHrefs} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {orderedNavItems.map((item) => (
                <SortableNavItemCard key={item.href} id={item.href} item={item} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
