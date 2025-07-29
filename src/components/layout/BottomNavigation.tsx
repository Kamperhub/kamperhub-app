
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

  const handleNavigation = () => {
    if (navContext) {
      navContext.setIsNavigating(true);
    }
  };

  const bottomNavItems = [
    navItems.find(item => item.href === '/dashboard'),
    navItems.find(item => item.href === '/vehicles'),
    navItems.find(item => item.href === '/trip-manager'),
    navItems.find(item => item.href === '/inventory'),
    navItems.find(item => item.href === '/my-account'),
  ].filter(Boolean) as (typeof navItems);


  const tripManagerPaths = ['/trip-manager', '/trip-expense-planner', '/triplog', '/trip-packing', '/journeys', '/world-map', '/checklists'];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-top md:hidden z-50">
      <div className="container mx-auto px-2 sm:px-4">
        <ul className="flex justify-around items-center h-12">
          {bottomNavItems.map((item) => {
            if (!item) return null;
            
            const IconComponent = item.icon;
            const isDashboardLink = item.href === '/dashboard';
            const isTripManagerLink = item.href === '/trip-manager';
            
            let isActive = false;
            if (isDashboardLink) {
              isActive = pathname === '/' || pathname === '/dashboard' || pathname === '/dashboard-details';
            } else if (isTripManagerLink) {
              isActive = tripManagerPaths.some(p => pathname.startsWith(p));
            } else {
              isActive = pathname.startsWith(item.href);
            }
              
            return (
              <li key={item.label} className="flex-1 text-center">
                <Link
                  href={item.href}
                  onClick={handleNavigation}
                  className={cn(
                    "flex flex-col items-center justify-center p-1 rounded-md transition-colors h-full",
                    isActive ? "text-accent" : "text-accent/50 hover:text-accent", 
                  )}
                  aria-current={isActive ? "page" : undefined}
                  title={item.label}
                >
                  <IconComponent 
                    className={cn("w-6 h-6", isActive ? "text-accent" : "text-accent opacity-50")} 
                    strokeWidth={2.5}
                  />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
