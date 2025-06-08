
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { navItems as defaultNavItems, type NavItem } from '@/lib/navigation';
import { Caravan, GripVertical } from 'lucide-react';
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

const DASHBOARD_ORDER_KEY = 'kamperhub_dashboard_order';

interface SortableCardProps {
  item: NavItem;
  isDragging?: boolean;
}

function SortableCard({ item, isDragging }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({ id: item.href });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0.7 : 1,
    boxShadow: isOver ? '0 0 0 2px hsl(var(--ring))' : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Link href={item.href} passHref legacyBehavior>
        <Card 
          className="hover:shadow-xl transition-shadow duration-300 cursor-grab h-full flex flex-col active:cursor-grabbing"
          {...attributes} // Spread dnd-kit attributes here to allow dragging card content
          // listeners should be on the handle for better UX, but on whole card for now
        >
          <CardHeader className="flex flex-row items-center space-x-4 pb-2 relative">
            <button 
              {...listeners} 
              className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
              aria-label={`Drag to reorder ${item.label}`}
              onMouseDown={(e) => e.stopPropagation()} // Prevent link navigation on handle drag
            >
              <GripVertical className="w-5 h-5" />
            </button>
            <item.icon className="w-10 h-10 text-accent" />
            <CardTitle className="text-2xl font-headline">{item.label}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <p className="text-muted-foreground font-body mb-4">
              {item.href === '/subscribe'
                ? "Unlock premium features and support KamperHub."
                : `Access tools and information for ${item.label.toLowerCase()} to enhance your caravanning experience.`
              }
            </p>
            <div className="mt-auto flex justify-center items-center h-40 w-full bg-muted/20 rounded-md p-6">
              <item.icon className="w-24 h-24 text-primary opacity-75" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const [orderedNavItems, setOrderedNavItems] = useState<NavItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    const storedOrderJson = localStorage.getItem(DASHBOARD_ORDER_KEY);
    let finalItems: NavItem[];

    if (storedOrderJson) {
      try {
        const storedOrderHrefs: string[] = JSON.parse(storedOrderJson);
        const itemsMap = new Map(defaultNavItems.map(item => [item.href, item]));
        
        const orderedFromStorage: NavItem[] = [];
        storedOrderHrefs.forEach(href => {
          const item = itemsMap.get(href);
          if (item) {
            orderedFromStorage.push(item);
            itemsMap.delete(href); // Remove items that are already ordered
          }
        });
        // Add any new items from defaultNavItems not present in stored order
        finalItems = [...orderedFromStorage, ...Array.from(itemsMap.values())];
      } catch (e) {
        console.error("Error parsing stored dashboard order:", e);
        finalItems = [...defaultNavItems]; // Fallback to default
      }
    } else {
      finalItems = [...defaultNavItems];
    }
    setOrderedNavItems(finalItems);
  }, [hasMounted]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragEndEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedNavItems((items) => {
        const oldIndex = items.findIndex((item) => item.href === active.id);
        const newIndex = items.findIndex((item) => item.href === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        if (hasMounted) {
          localStorage.setItem(DASHBOARD_ORDER_KEY, JSON.stringify(newOrder.map(item => item.href)));
        }
        return newOrder;
      });
    }
  }
  
  if (!hasMounted) {
    // Show a loading state or skeleton
    return (
      <div className="space-y-8">
        <header className="text-center py-8">
          <Caravan className="h-16 w-16 mx-auto text-primary mb-4 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-headline text-primary mb-2">Welcome to KamperHub</h1>
          <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            Loading your personalized dashboard...
          </p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-[350px] animate-pulse bg-muted/50"></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="text-center py-8">
        <Caravan className="h-16 w-16 mx-auto text-primary mb-4" />
        <h1 className="text-4xl md:text-5xl font-headline text-primary mb-2">Welcome to KamperHub</h1>
        <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
          Your ultimate caravanning companion. Drag cards to reorder them!
        </p>
      </header>

      <section>
        <h2 className="text-3xl font-headline text-center mb-8 text-primary">Explore Features</h2>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedNavItems.map(item => item.href)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {orderedNavItems.map((item) => (
                <SortableCard key={item.href} item={item} isDragging={activeId === item.href} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>
    </div>
  );
}
