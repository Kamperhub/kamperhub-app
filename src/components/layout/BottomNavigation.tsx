
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const pathname = usePathname();

  const bottomNavItems = navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-top md:hidden z-50">
      <div className="container mx-auto px-2 sm:px-4">
        <ul className="flex justify-around items-center h-16">
          {bottomNavItems.map((item) => {
            const isDashboardLink = item.href === '/dashboard-details';
            const isActive = isDashboardLink
              ? pathname === '/' || pathname === '/dashboard-details'
              : pathname === item.href;
              
            return (
              <li key={item.label} className="flex-1 text-center">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-md transition-colors h-full",
                    isActive ? "text-accent" : "text-accent/50 hover:text-accent", 
                  )}
                  aria-current={isActive ? "page" : undefined}
                  title={item.label}
                >
                  <item.icon 
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
    </nav>
  );
}
