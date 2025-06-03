
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { LoggedTrip } from '@/types/tripplanner';
import { TRIP_LOG_STORAGE_KEY, RECALLED_TRIP_DATA_KEY } from '@/types/tripplanner';
import { TripLogItem } from '@/components/features/triplog/TripLogItem';
// import { Button } from '@/components/ui/button'; // No longer needed for clear all
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, History } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function TripLogPage() {
  const [loggedTrips, setLoggedTrips] = useState<LoggedTrip[]>([]);
  const [isLocalStorageReady, setIsLocalStorageReady] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLocalStorageReady(true);
      try {
        const storedTrips = localStorage.getItem(TRIP_LOG_STORAGE_KEY);
        if (storedTrips) {
          setLoggedTrips(JSON.parse(storedTrips));
        }
      } catch (error) {
        console.error("Error reading trip logs from localStorage:", error);
        toast({
          title: "Error Loading Trips",
          description: "Could not load saved trips from your browser's storage.",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const handleDeleteTrip = useCallback((id: string) => {
    if (!isLocalStorageReady) return;
    try {
      const updatedTrips = loggedTrips.filter(trip => trip.id !== id);
      setLoggedTrips(updatedTrips);
      localStorage.setItem(TRIP_LOG_STORAGE_KEY, JSON.stringify(updatedTrips));
      toast({ title: "Trip Deleted", description: "The selected trip has been removed from your log." });
    } catch (error) {
      console.error("Error deleting trip from localStorage:", error);
      toast({
        title: "Error Deleting Trip",
        description: "Could not delete the trip. Please try again.",
        variant: "destructive",
      });
    }
  }, [loggedTrips, toast, isLocalStorageReady]);

  const handleRecallTrip = useCallback((trip: LoggedTrip) => {
    if (!isLocalStorageReady) return;
    try {
      localStorage.setItem(RECALLED_TRIP_DATA_KEY, JSON.stringify(trip));
      toast({ title: "Trip Recalled", description: `"${trip.name}" is ready in the Trip Planner.` });
      router.push('/tripplanner');
    } catch (error) {
      console.error("Error recalling trip to localStorage:", error);
      toast({
        title: "Error Recalling Trip",
        description: "Could not recall the trip. Please try again.",
        variant: "destructive",
      });
    }
  }, [router, toast, isLocalStorageReady]);

  if (!isLocalStorageReady) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-headline mb-6 text-primary flex items-center">
          <History className="mr-3 h-8 w-8" /> Trip Log
        </h1>
        <p className="font-body">Loading saved trips...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-2 text-primary flex items-center">
          <History className="mr-3 h-8 w-8" /> Trip Log
        </h1>
        <p className="text-muted-foreground font-body mb-6">
          Review your saved trips. You can recall them to the Trip Planner or delete them.
        </p>
        <Alert variant="default" className="mb-6 bg-primary/10 border-primary/30">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <AlertTitle className="font-headline text-primary">LocalStorage Notice</AlertTitle>
          <AlertDescription className="font-body text-primary/80">
            Trip data is stored locally in your browser using LocalStorage. Clearing your browser data will remove saved trips. For persistent storage, a backend database would be used in a full application.
          </AlertDescription>
        </Alert>
      </div>

      {loggedTrips.length === 0 ? (
        <p className="text-center text-muted-foreground font-body py-10">
          You haven't saved any trips yet. Plan a trip and save it to see it here!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loggedTrips.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(trip => (
            <TripLogItem
              key={trip.id}
              trip={trip}
              onDelete={handleDeleteTrip}
              onRecall={handleRecallTrip}
            />
          ))}
        </div>
      )}
    </div>
  );
}
