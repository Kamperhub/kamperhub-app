
'use client';

import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12 font-body bg-background text-foreground text-center p-4">
      <div className="w-full max-w-lg">
        <Compass className="h-20 w-20 text-accent mx-auto mb-4" />
        <h1 className="font-headline text-5xl text-accent">
          404
        </h1>
        <h2 className="font-headline text-2xl text-primary mt-2">
          Page Not Found
        </h2>
        <p className="font-body text-foreground mt-6">
          Oops! It seems you've taken a wrong turn. The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
            <Link href="/" passHref>
              <Button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 font-body bg-primary text-primary-foreground hover:bg-primary/90">
                <Home className="mr-2 h-5 w-5" />
                Return to Dashboard
              </Button>
            </Link>
        </div>
      </div>
    </div>
  )
}
