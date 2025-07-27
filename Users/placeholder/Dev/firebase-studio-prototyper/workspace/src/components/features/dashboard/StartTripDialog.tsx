
'use client';

import { useState, useContext }from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { fetchTrips } from '@/lib/api-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Rocket, ChevronRight, PlusCircle } from 'lucide-react';
import type { LoggedTrip } from '@/types/tripplanner';
import { NavigationContext } from '@/components/layout/AppShell';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';

export function StartTripDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const navContext = useContext(NavigationContext);

  const { data: trips = [], isLoading, error } = useQuery<LoggedTrip[]>({
    queryKey: ['trips', user?.uid],
    queryFn: fetchTrips,
    enabled: !!user && isOpen, // Only fetch when the dialog is open
  });

  const handleTripSelect = (tripId: string) => {
    navContext?.setIsNavigating(true);
    router.push(`/trip-manager/checklists?tripId=${tripId}`);
    setIsOpen(false);
  };

  const handlePlanTripClick = () => {
    navContext?.setIsNavigating(true);
    setIsOpen(false);
  };
  
  const sortedTrips = [...trips].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center"><Rocket className="mr-2 h-6 w-6 text-primary"/> Start a Trip</DialogTitle>
          <DialogDescription>
            Select a planned trip to begin your pre-departure checklists, or create a new one.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Button asChild onClick={handlePlanTripClick} className="w-full font-body mb-4">
            <Link href="/trip-expense-planner">
              <PlusCircle className="mr-2 h-4 w-4" /> Create a New Trip
            </Link>
          </Button>
          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-xs text-muted-foreground">OR</span>
          </div>
          
          <p className="text-sm text-muted-foreground text-center mb-2">Select an existing trip</p>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading trips...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Trips</AlertTitle>
              <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
          ) : trips.length === 0 ? (
            <div className="text-center space-y-4 pt-4">
              <p className="text-muted-foreground">No planned trips found.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {sortedTrips.map(trip => {
                const renderDateRange = () => {
                  if (trip.plannedStartDate && trip.plannedEndDate) {
                    const start = format(parseISO(trip.plannedStartDate), "PP");
                    const end = format(parseISO(trip.plannedEndDate), "PP");
                    return start === end ? start : `${start} to ${end}`;
                  }
                  if (trip.plannedStartDate) {
                    return `Starts: ${format(parseISO(trip.plannedStartDate), "PP")}`;
                  }
                  return "Date not set";
                };

                return (
                  <button
                    key={trip.id}
                    onClick={() => handleTripSelect(trip.id)}
                    className="w-full text-left p-3 rounded-md border hover:bg-muted transition-colors flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-primary">{trip.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {renderDateRange()}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground"/>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    