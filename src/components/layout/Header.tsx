
import Link from 'next/link';
import { Caravan, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Caravan className="h-8 w-8 text-primary-foreground" />
          <h1 className="text-3xl font-headline tracking-tight">KamperHub</h1>
        </Link>

        <Link href="/" passHref>
          <Button variant="ghost" size="icon" aria-label="Go to Homepage" className="p-0">
            <Home className="h-12 w-12" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
