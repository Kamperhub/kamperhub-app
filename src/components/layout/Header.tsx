
"use client";

import Link from 'next/link';
import Image from 'next/image'; // Import next/image
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between"> {/* Adjusted padding py-3 */}
        <Link href="/" className="flex items-center gap-3"> {/* Increased gap slightly */}
          <Image
            src="/kamperhub-logo.png" 
            alt="KamperHub Logo"
            width={180} // Adjust width as needed
            height={45} // Adjust height as needed
            priority // Load logo quickly
            className="object-contain" // Ensure logo scales nicely
          />
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/" passHref>
            <Button variant="ghost" size="icon" aria-label="Go to Homepage" className="p-0 hover:bg-primary/80">
              <Home className="h-7 w-7" /> {/* Slightly adjusted size for balance */}
            </Button>
          </Link>
          {/* User-specific elements removed */}
        </div>
      </div>
    </header>
  );
}
