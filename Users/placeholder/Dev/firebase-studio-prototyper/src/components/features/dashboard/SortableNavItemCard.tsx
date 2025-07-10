
"use client";

import React, { useContext } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { NavItem } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { NavigationContext } from '@/components/layout/AppShell';

interface SortableNavItemCardProps {
  item: NavItem;
  id: string;
}

export function SortableNavItemCard({ item, id }: SortableNavItemCardProps) {
  const navContext = useContext(NavigationContext);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.75 : 1,
  };

  const handleNavigation = (e: React.MouseEvent) => {
    // Prevent navigation if the user is just trying to drag
    if (isDragging) {
      e.preventDefault();
      return;
    }
    if (navContext) {
      navContext.setIsNavigating(true);
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <Link href={item.href} className="block h-full no-underline group" draggable="false" onClick={handleNavigation}>
        <Card className="h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="font-headline text-xl text-primary flex items-center">
              <item.icon className="w-6 h-6 mr-3 text-primary" />
              {item.label}
            </CardTitle>
            <CardDescription className="font-body text-xl text-muted-foreground line-clamp-3">
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
    </div>
  );
}
