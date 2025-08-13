// src/app/(protected)/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { fetchAllVehicleData, updateUserPreferences } from '@/lib/api-client';
import { Loader2, AlertTriangle } from 'lucide-react';
import { GettingStartedGuide } from '@/components/features/dashboard/GettingStartedGuide';
import { StartTripDialog } from '@/components/features/dashboard/StartTripDialog';
import { ReturnTripDialog } from '@/components/features/dashboard/ReturnTripDialog';
import { SortableNavItemCard } from '@/components/features/dashboard/SortableNavItemCard';
import { navItems } from '@/lib/navigation';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { NavigationContext } from '@/components/layout/AppShell';

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navContext = useContext(NavigationContext);

  const { data, isLoading, error } = useQuery({
    queryKey: ['allVehicleData', user?.uid],
    queryFn: () => fetchAllVehicleData(),
    enabled: !!user,
  });

  const { userProfile } = data || {};
  
  const [layout, setLayout] = useState<string[]>([]);

  useEffect(() => {
    if (userProfile?.dashboardLayout) {
      setLayout(userProfile.dashboardLayout);
    } else {
      // Default layout if none is saved
      const defaultLayout = navItems
        .filter(item => !['/my-account', '/contact', '/dashboard'].includes(item.href))
        .map(item => item.href);
      setLayout(defaultLayout);
    }
  }, [userProfile?.dashboardLayout]);

  const preferencesMutation = useMutation({
    mutationFn: (newLayout: string[]) => updateUserPreferences({ dashboardLayout: newLayout }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allVehicleData', user?.uid] });
    },
    onError: (err: Error) => {
      console.error("Failed to save layout:", err);
    }
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLayout((currentLayout) => {
        const oldIndex = currentLayout.indexOf(active.id as string);
        const newIndex = currentLayout.indexOf(over.id as string);
        const newLayout = arrayMove(currentLayout, oldIndex, newIndex);
        preferencesMutation.mutate(newLayout);
        return newLayout;
      });
    }
  };
  
  const handleGettingStartedDismiss = () => {
     preferencesMutation.mutate(['hasDismissedGettingStartedGuide', true]);
  };
  
  const handleNavigation = () => {
    if (navContext) {
      navContext.setIsNavigating(true);
    }
  };

  const sortedNavItems = useMemo(() => {
    return layout
      .map(href => navItems.find(item => item.href === href))
      .filter(Boolean); // Filter out any undefined items if layout is out of sync
  }, [layout]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Dashboard Data</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }
  
  const showGettingStarted = !userProfile?.hasDismissedGettingStartedGuide;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-2 text-primary">Welcome, {userProfile?.displayName || user?.displayName || 'Traveller'}!</h1>
        <p className="text-muted-foreground font-body">Your ultimate travelling companion, ready for the road ahead.</p>
      </div>
      
      {showGettingStarted && (
        <GettingStartedGuide 
          onDismiss={handleGettingStartedDismiss} 
          isDismissing={preferencesMutation.isPending}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StartTripDialog>
          <button className="w-full text-white bg-green-600 hover:bg-green-700 font-bold py-4 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 text-lg font-headline">
            Start New Trip
          </button>
        </StartTripDialog>
        <ReturnTripDialog>
          <button className="w-full text-primary bg-secondary/30 hover:bg-secondary/50 font-bold py-4 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 text-lg font-headline">
            Plan Return Trip
          </button>
        </ReturnTripDialog>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layout} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedNavItems.map(item => (
              item && <SortableNavItemCard key={item.href} id={item.href} item={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
