'use client';

import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12 font-body bg-background text-foreground">
      <div className="w-full max-w-lg text-center shadow-xl border border-accent rounded-lg bg-card p-6">
        <header className="flex flex-col items-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4">
            <Compass className="h-10 w-10 text-accent" />
          </div>
          <h1 className="font-headline text-5xl text-accent">
            404
          </h1>
          <p className="font-headline text-2xl text-primary pt-2">
            Page Not Found
          </p>
        </header>
        <div className="mt-6 space-y-6">
          <p className="font-body text-foreground">
            Oops! It seems you've taken a wrong turn. The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" passHref>
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full sm:w-auto font-body bg-primary text-primary-foreground hover:bg-primary/90">
                <Home className="mr-2 h-5 w-5" />
                Return to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
