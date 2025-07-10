
"use client"; 

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useContext } from 'react';
import { NavigationContext } from '@/components/layout/AppShell';

const TripPlannerLoadingSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-10 w-1/2" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader><Skeleton className="h-6 w-3/4"/></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader><Skeleton className="h-6 w-3/4"/></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-12 w-full"/>
            <Card>
                 <CardHeader><Skeleton className="h-6 w-1/2"/></CardHeader>
                 <CardContent className="p-0">
                    <Skeleton className="h-[400px] w-full rounded-b-lg"/>
                 </CardContent>
            </Card>
        </div>
    </div>
  </div>
);

const TripPlannerClient = dynamic(
  () => import('@/components/features/tripplanner/TripPlannerClient').then(mod => mod.TripPlannerClient),
  {
    ssr: false,
    loading: () => <TripPlannerLoadingSkeleton />,
  }
);


export default function TripPlannerPage() {
  const navContext = useContext(NavigationContext);
  const handleNavigation = () => {
    if(navContext) navContext.setIsNavigating(true);
  };

  return (
    <div className="space-y-8">
      <Button asChild variant="link" className="p-0 h-auto font-body text-muted-foreground hover:text-primary -ml-1">
        <Link href="/trip-manager" onClick={handleNavigation}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Return to Trip Manager
        </Link>
      </Button>
      <TripPlannerClient />
    </div>
  );
}
