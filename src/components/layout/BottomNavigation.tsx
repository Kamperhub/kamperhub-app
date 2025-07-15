
"use client";

import { useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { NavigationContext } from './AppShell';

export function BottomNavigation() {
  const pathname = usePathname();
  const navContext = useContext(NavigationContext);
  const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || 'N/A';

  const handleNavigation = () => {
    if (navContext) {
      navContext.setIsNavigating(true);
    }
  };

  // The main dashboard nav items are too numerous for a bottom bar.
  // We'll define a specific, smaller set here.
  const bottomNavItems = [
    navItems.find(item => item.href === '/dashboard-details'),
    navItems.find(item => item.href === '/vehicles'),
    navItems.find(item => item.href === '/trip-manager'),
    navItems.find(item => item.href === '/inventory'),
    navItems.find(item => item.href === '/my-account'),
  ].filter(Boolean) as (typeof navItems);


  // New logic: Define which paths belong to the Trip Manager group
  const tripManagerPaths = ['/trip-manager', '/trip-expense-planner', '/triplog', '/trip-packing', '/journeys', '/world-map'];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-top md:hidden z-50">
      <div className="container mx-auto px-2 sm:px-4">
        <ul className="flex justify-around items-center h-16">
          {bottomNavItems.map((item) => {
            if (!item) return null; // Should not happen with the filter, but good for safety
            
            const isDashboardLink = item.href === '/dashboard-details';
            const isTripManagerLink = item.href === '/trip-manager';
            
            let isActive = false;
            if (isDashboardLink) {
              isActive = pathname === '/' || pathname === '/dashboard' || pathname === '/dashboard-details';
            } else if (isTripManagerLink) {
              // Check if the current path or its dynamic parent (e.g., /journeys/[id]) is in the group
              isActive = tripManagerPaths.some(p => pathname.startsWith(p));
            } else {
              isActive = pathname.startsWith(item.href);
            }
              
            const IconComponent = item.icon;

            return (
              <li key={item.label} className="flex-1 text-center">
                <Link
                  href={item.href}
                  onClick={handleNavigation}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-md transition-colors h-full",
                    isActive ? "text-accent" : "text-accent/50 hover:text-accent", 
                  )}
                  aria-current={isActive ? "page" : undefined}
                  title={item.label}
                >
                  <IconComponent 
                    className={cn("w-7 h-7", isActive ? "text-accent" : "text-accent opacity-50")} 
                    strokeWidth={2.5}
                  />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="text-[10px] text-center text-muted-foreground/50 pb-1">Build: {buildTimestamp}</p>
    </nav>
  );
}
