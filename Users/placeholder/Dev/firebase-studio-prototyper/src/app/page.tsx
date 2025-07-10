
"use client";

import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { NavItem } from '@/lib/navigation';
import { navItems as defaultNavItems } from '@/lib/navigation';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableNavItemCard } from '@/components/features/dashboard/SortableNavItemCard';
import { Button } from '@/components/ui/button';
import { Car, CornerDownLeft } from 'lucide-react';
import Image from 'next/image';
import { updateUserPreferences } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { NavigationContext } from '@/components/layout/AppShell';
import { StartTripDialog } from '@/components/features/dashboard/StartTripDialog';
import { ReturnTripDialog } from '@/components/features/dashboard/ReturnTripDialog';

export default function DashboardPage() {
  const [orderedNavItems, setOrderedNavItems] = useState<NavItem[]>(defaultNavItems);
  const { user, userProfile: userPrefs } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  
  const updateUserPreferencesMutation = useMutation({
    mutationFn: (newLayout: string[]) => updateUserPreferences({ dashboardLayout: newLayout }),
    onError: (error) => {
      toast({ title: "Layout Save Failed", description: (error as Error).message, variant: "destructive" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.uid] });
    }
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
      setOrderedNavItems((items) => {
        const oldIndex = items.findIndex(item => item.href === active.id);
        const newIndex = items.findIndex(item => item.href === over?.id);
        const newOrderedItems = arrayMove(items, oldIndex, newIndex);
        
        // Save the new layout to user preferences
        const newLayoutHrefs = newOrderedItems.map(item => item.href);
        updateUserPreferencesMutation.mutate(newLayoutHrefs);
        
        return newOrderedItems;
      });
    }
  };
  
  const itemHrefs = useMemo(() => orderedNavItems.map(item => item.href), [orderedNavItems]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center">
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
        <div className="flex gap-2 flex-shrink-0">
          <StartTripDialog>
            <Button className="font-body animate-pulse"><Car className="mr-2 h-4 w-4"/>Start a Trip</Button>
          </StartTripDialog>
          <ReturnTripDialog>
            <Button className="font-body" variant="outline"><CornerDownLeft className="mr-2 h-4 w-4"/>Plan Return</Button>
          </ReturnTripDialog>
        </div>
      </div>
      
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemHrefs} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {orderedNavItems.map((item) => (
              <SortableNavItemCard key={item.href} id={item.href} item={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
