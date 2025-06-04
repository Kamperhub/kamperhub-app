
"use client";

import Link from 'next/link';
import { Caravan, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Caravan className="h-8 w-8 text-primary-foreground" />
          <h1 className="text-3xl font-headline tracking-tight">KamperHub</h1>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/" passHref>
            <Button variant="ghost" size="icon" aria-label="Go to Homepage" className="p-0 hover:bg-primary/80">
              <Home className="h-8 w-8" />
            </Button>
          </Link>
          {/* User-specific elements removed */}
        </div>
      </div>
    </header>
  );
}
