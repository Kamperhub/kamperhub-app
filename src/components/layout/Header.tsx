import Link from 'next/link';
import { MountainSnow } from 'lucide-react'; // Using MountainSnow as a placeholder logo icon

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <MountainSnow className="h-8 w-8 text-accent" />
          <h1 className="text-3xl font-headline tracking-tight">KamperHub</h1>
        </Link>
        {/* Placeholder for potential future elements like user profile or settings */}
      </div>
    </header>
  );
}
