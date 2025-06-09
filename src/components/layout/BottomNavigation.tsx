
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const pathname = usePathname();

  // No need to filter out "/stats" anymore as it's removed from navItems.
  // All items in navItems (except what might be filtered for other reasons in future) will be shown.
  const bottomNavItems = navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-top md:hidden z-50">
      <div className="container mx-auto px-2 sm:px-4">
        <ul className="flex justify-around items-center h-16">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.label} className="flex-1 text-center">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-md transition-colors",
                    isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className={cn("w-6 h-6 mb-1", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-xs">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
