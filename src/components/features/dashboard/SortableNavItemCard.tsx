
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
  
  // This state helps differentiate a click from a drag.
  const [isClicked, setIsClicked] = React.useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.75 : 1,
  };

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    // If the card was just being dragged, prevent the link from navigating.
    if (isDragging) {
      e.preventDefault();
      return;
    }
    // For a normal click, trigger the navigation loading state.
    if (navContext) {
      navContext.setIsNavigating(true);
    }
  };
  
  return (
    // This outer div is the sortable node.
    <div ref={setNodeRef} style={style} {...attributes} className="touch-none h-full">
      {/* The Card component itself gets the drag listeners, making the whole card draggable. */}
      <Card {...listeners} className="h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
        <Link href={item.href} className="flex flex-col h-full no-underline group" draggable="false" onClick={handleNavigation}>
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
        </Link>
      </Card>
    </div>
  );
}
