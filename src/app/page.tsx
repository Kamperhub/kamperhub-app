
"use client";

import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { NavItem } from '@/lib/navigation';
import { navItems as defaultNavItems } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home as HomeIcon, Loader2, CornerDownLeft, Car } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { updateUserPreferences } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { NavigationContext } from '@/components/layout/AppShell';
import { StartTripDialog } from '@/components/features/dashboard/StartTripDialog';
import { ReturnTripDialog } from '@/components/features/dashboard/ReturnTripDialog';

function NavItemCard({ item }: { item: NavItem }) {
  const navContext = useContext(NavigationContext);
  const handleNavigation = () => {
    navContext?.setIsNavigating(true);
  };

  return (
    <Link href={item.href} className="block h-full no-underline group" draggable="false" onClick={handleNavigation}>
      <Card className="h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
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

export default function DashboardPage() {
  const [orderedNavItems, setOrderedNavItems] = useState<NavItem[]>(defaultNavItems);
  const { user, userProfile: userPrefs } = useAuth(); 
  
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {orderedNavItems.map((item) => (
          <NavItemCard key={item.href} item={item} />
        ))}
      </div>
    </div>
  );
}
