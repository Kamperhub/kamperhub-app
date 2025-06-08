
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { NavItem } from '@/lib/navigation';
import { navItems } from '@/lib/navigation';
import { GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DASHBOARD_CARD_ORDER_KEY = 'kamperhub_dashboard_card_order_v2';

interface SortableNavItemCardProps {
  item: NavItem;
}

function SortableNavItemCard({ item }: SortableNavItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.href }); // Use a unique, stable ID like href

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <Card className="h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 relative">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Drag ${item.label} card`}
          className="absolute top-2 right-2 p-1 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 focus:opacity-100 focus:ring-2 focus:ring-ring rounded"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <Link href={item.href} className="flex flex-col h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <item.icon className="w-8 h-8 text-primary" />
              <CardTitle className="font-headline text-2xl text-primary">{item.label}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-between">
            <CardDescription className="font-body text-sm mb-4">
              Access tools and information for {item.label.toLowerCase()} to enhance your caravanning experience.
            </CardDescription>
            <div className="mt-auto opacity-10 flex justify-center">
              <item.icon className="w-24 h-24 text-primary" />
            </div>
          </CardContent>
        </Link>
      </Card>
    </div>
  );
}


export default function DashboardPage() {
  const [orderedNavItems, setOrderedNavItems] = useState<NavItem[]>(() => {
    // Initialize with default navItems, order will be applied in useEffect
    return [...navItems];
  });
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    try {
      const savedOrderJson = localStorage.getItem(DASHBOARD_CARD_ORDER_KEY);
      if (savedOrderJson) {
        const savedOrderHrefs: string[] = JSON.parse(savedOrderJson);
        // Reconstruct orderedNavItems based on saved hrefs, ensuring all navItems are present
        // and new ones are appended if not in saved order
        const newOrderedItems: NavItem[] = [];
        const navItemsMap = new Map(navItems.map(item => [item.href, item]));

        savedOrderHrefs.forEach(href => {
          const item = navItemsMap.get(href);
          if (item) {
            newOrderedItems.push(item);
            navItemsMap.delete(href); // Remove from map to track remaining items
          }
        });
        // Add any new navItems that weren't in the saved order
        navItemsMap.forEach(item => newOrderedItems.push(item));
        setOrderedNavItems(newOrderedItems);
      } else {
        // No saved order, use the default from navItems.ts
        setOrderedNavItems([...navItems]);
      }
    } catch (error) {
        console.error("Error loading card order from localStorage:", error);
        setOrderedNavItems([...navItems]); // Fallback to default
    }
  }, [hasMounted]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      setOrderedNavItems((items) => {
        const oldIndex = items.findIndex((item) => item.href === active.id);
        const newIndex = items.findIndex((item) => item.href === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        if (hasMounted) {
            try {
                const newOrderHrefs = newOrder.map(item => item.href);
                localStorage.setItem(DASHBOARD_CARD_ORDER_KEY, JSON.stringify(newOrderHrefs));
            } catch (error) {
                console.error("Error saving card order to localStorage:", error);
            }
        }
        return newOrder;
      });
    }
  }, [hasMounted]);

  if (!hasMounted) {
    // Optional: Render a loading state or null
    return (
         <div className="space-y-8">
            <header className="text-center py-8">
              <Card className="animate-pulse h-16 w-1/2 mx-auto bg-muted" />
              <CardTitle className="text-4xl md:text-5xl font-headline text-primary mb-2 mt-4">
                <div className="h-10 bg-muted rounded w-3/4 mx-auto"></div>
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground font-body max-w-xl mx-auto">
                <div className="h-4 bg-muted rounded w-full mb-1"></div>
                <div className="h-4 bg-muted rounded w-2/3 mx-auto"></div>
              </CardDescription>
            </header>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-64 animate-pulse">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted rounded-full"></div>
                            <div className="h-8 bg-muted rounded w-1/2"></div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-between">
                        <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-full"></div>
                            <div className="h-4 bg-muted rounded w-5/6"></div>
                        </div>
                         <div className="mt-auto opacity-10 flex justify-center">
                           <div className="w-24 h-24 bg-muted rounded-md"></div>
                        </div>
                    </CardContent>
                </Card>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="text-center py-8">
        <Link href="/" passHref>
          <img
            src="/kamperhub-logo.png"
            alt="KamperHub Logo"
            className="h-16 w-auto mx-auto mb-4 transition-transform hover:scale-105"
          />
        </Link>
        <h1 className="text-4xl md:text-5xl font-headline text-primary mb-2">Welcome to KamperHub</h1>
        <p className="text-lg text-muted-foreground font-body max-w-xl mx-auto">
          Your ultimate caravanning companion. Arrange your dashboard for quick access to features.
        </p>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedNavItems.map(item => item.href)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orderedNavItems.map((item) => (
              <SortableNavItemCard key={item.href} item={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
