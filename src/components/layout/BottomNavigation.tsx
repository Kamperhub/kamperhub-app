
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
            const isActive = item.href === '/dashboard-details' 
              ? (pathname === '/' || pathname === '/dashboard-details') 
              : pathname === item.href;
              
            return (
              <li key={item.label} className="flex-1 text-center">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-md transition-colors h-full", // Added h-full for better vertical alignment
                    isActive ? "text-accent" : "text-accent/50 hover:text-accent", // Changed: active is accent, inactive is accent/50
                  )}
                  aria-current={isActive ? "page" : undefined}
                  title={item.label} // Add title attribute for accessibility
                >
                  <item.icon className={cn("w-7 h-7", isActive ? "text-accent" : "text-accent opacity-50")} /> {/* Changed: applied accent and opacity */}
                  {/* The span with item.label has been removed */}
                  <span className="sr-only">{item.label}</span> {/* Keep label for screen readers */}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
