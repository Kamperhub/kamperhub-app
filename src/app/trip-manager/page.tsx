
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { tripManagerItems, type NavItem } from '@/lib/navigation'; 
import { useContext } from 'react';
import { NavigationContext } from '@/components/layout/AppShell';

export default function TripManagerPage() {
  const navContext = useContext(NavigationContext);
  const handleNavigation = () => {
    navContext?.setIsNavigating(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Briefcase className="mr-3 h-8 w-8 text-primary" />
        <h1 className="text-3xl font-headline text-primary">Trip Manager</h1>
      </div>
      <p className="font-body text-lg text-muted-foreground">
        Plan your trip itineraries, manage packing lists, and review your trip history, all from one place.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tripManagerItems.map((item: NavItem) => (
          <Link key={item.href} href={item.href} className="block h-full no-underline group" onClick={handleNavigation}>
            <Card className="h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="font-headline text-xl text-primary flex items-center">
                  <item.icon className="w-6 h-6 mr-3 text-primary" />
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <CardDescription className="font-body text-sm text-muted-foreground mb-4 line-clamp-3">
                  {item.description}
                </CardDescription>
                <div
                  className="h-32 w-full bg-muted/30 rounded-md flex items-center justify-center my-2 overflow-hidden"
                  data-ai-hint={item.keywords}
                >
                  <item.icon className="w-16 h-16 text-accent opacity-50" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
