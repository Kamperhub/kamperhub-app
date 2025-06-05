
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
            src="https://placehold.co/180x45.png?text=KamperHub+Logo&font=belleza" // Placeholder
            // Replace with your actual logo path once added to /public: src="/kamperhub-logo.png"
            alt="KamperHub Logo"
            width={180} // Adjust width as needed
            height={45} // Adjust height as needed
            priority // Load logo quickly
            className="object-contain" // Ensure logo scales nicely
          />
          {/* The h1 for "KamperHub" can be removed if the logo image includes the text prominently enough, 
              or kept if the image is just the graphic. The placeholder includes text. 
              For this example, assuming the logo image contains the text "KamperHub".
          */}
          {/* <h1 className="text-3xl font-headline tracking-tight">KamperHub</h1> */}
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
