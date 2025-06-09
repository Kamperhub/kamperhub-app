
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { NavItem } from '@/lib/navigation';
import { navItems as defaultNavItems } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Added Button import
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowRight, Home as HomeIcon } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

const DASHBOARD_LAYOUT_STORAGE_KEY = 'kamperhub_dashboard_layout_v2';

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
    <div ref={setNodeRef} style={style} className="touch-manipulation">
      <Card className="h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-3 flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
                <CardTitle className="font-headline text-xl text-primary flex items-center">
                    <item.icon className="w-6 h-6 mr-3 text-primary" />
                    {item.label}
                </CardTitle>
                <CardDescription className="font-body text-sm text-muted-foreground line-clamp-2">
                    Access tools and information for {item.label.toLowerCase()} to enhance your caravanning experience.
                    {item.href === '/subscribe' && ' Unlock premium features and support KamperHub!'}
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
            data-ai-hint={item.keywords || item.label.toLowerCase().split(' ')[0]}
          >
            <item.icon className="w-16 h-16 text-primary opacity-20" />
          </div>
          <Link href={item.href} className="mt-auto">
            <Button variant="outline" className="w-full font-body text-primary hover:bg-primary/5">
              Go to {item.label} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const [orderedNavItems, setOrderedNavItems] = useState<NavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768); // md breakpoint
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      try {
        const storedLayout = localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);
        if (storedLayout) {
          const storedItemOrder: string[] = JSON.parse(storedLayout);
          const itemsFromStorage = storedItemOrder.map(href => defaultNavItems.find(item => item.href === href)).filter(Boolean) as NavItem[];
          // Ensure all default items are present, add new ones if any
          const currentDefaultHrefs = new Set(defaultNavItems.map(item => item.href));
          const itemsInStorageHrefs = new Set(itemsFromStorage.map(item => item.href));

          let finalItems = [...itemsFromStorage];
          defaultNavItems.forEach(defaultItem => {
            if (!itemsInStorageHrefs.has(defaultItem.href)) {
              finalItems.push(defaultItem); // Add new items from defaultNavItems not in storage
            }
          });
          // Filter out items that might have been removed from defaultNavItems but are still in storage
          finalItems = finalItems.filter(item => currentDefaultHrefs.has(item.href));

          setOrderedNavItems(finalItems);
        } else {
          setOrderedNavItems(defaultNavItems);
        }
      } catch (error) {
        console.error("Error loading dashboard layout from localStorage:", error);
        setOrderedNavItems(defaultNavItems); // Fallback to default order
      }
      setIsLoading(false);
    }
  }, [hasMounted]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require pointer to move 8px before activating drag
      },
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedNavItems((items) => {
        const oldIndex = items.findIndex((item) => item.href === active.id);
        const newIndex = items.findIndex((item) => item.href === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        try {
          localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, JSON.stringify(newOrder.map(item => item.href)));
        } catch (error) {
          console.error("Error saving dashboard layout to localStorage:", error);
        }
        return newOrder;
      });
    }
  }, []);

  if (!hasMounted || isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <HomeIcon className="mr-3 h-8 w-8 text-primary" />
            <h1 className="text-3xl font-headline text-primary">Welcome to KamperHub</h1>
          </div>
          <Skeleton className="h-12 w-48" /> {/* Placeholder for logo */}
        </div>
        <p className="font-body text-lg text-muted-foreground">
          Your ultimate caravanning companion. Loading your personalized dashboard...
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/5" />
                <Skeleton className="h-4 w-4/5 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full rounded-md mb-2" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <Image
            src="/kamperhub-logo.png"
            alt="KamperHub Logo Icon"
            width={60}
            height={60}
            className="object-contain rounded-md mr-3"
          />
          <div>
            <h1 className="text-3xl font-headline text-primary">Welcome to KamperHub</h1>
            <p className="font-body text-muted-foreground">Your ultimate caravanning companion. Drag to reorder cards.</p>
          </div>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={isMobileView ? undefined : handleDragEnd}>
        <SortableContext items={orderedNavItems.map(item => item.href)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {orderedNavItems.map((item) => (
              <SortableNavItem key={item.href} id={item.href} item={item} isMobile={isMobileView} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
