
"use client";

import React, { useContext } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { NavItem } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { NavigationContext } from '@/components/layout/AppShell';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableNavItemCardProps {
  item: NavItem;
  id: string;
}

export function SortableNavItemCard({ item, id }: SortableNavItemCardProps) {
  const navContext = useContext(NavigationContext);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } from useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.75 : 1,
  };

  const handleNavigation = (e: React.MouseEvent) => {
    // A small check to prevent navigation when dragging starts from the card content itself.
    if (isDragging) {
      e.preventDefault();
      return;
    }
    if (navContext) {
      navContext.setIsNavigating(true);
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="touch-none h-full">
      <Card
        className={cn(
          "h-full flex flex-col shadow-lg transition-shadow duration-300 relative",
          isDragging ? "shadow-2xl ring-2 ring-primary" : "hover:shadow-xl"
        )}
      >
        <div {...listeners} className="absolute top-3 left-2 p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors z-10">
            <GripVertical className="h-5 w-5" />
        </div>
        
        <Link href={item.href} className="flex flex-col h-full no-underline group" draggable="false" onClick={handleNavigation}>
          <CardHeader className="pb-3 pl-10">
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
        </Link>
      </Card>
    </div>
  );
}
