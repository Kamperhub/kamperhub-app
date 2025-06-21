
"use client";

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LoggedTrip } from '@/types/tripplanner';
import { RECALLED_TRIP_DATA_KEY } from '@/types/tripplanner';
import { TripLogItem } from '@/components/features/triplog/TripLogItem';
import { useToast } from '@/hooks/use-toast';
import { History, Info, Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { format, parseISO, addDays } from 'date-fns';
import { fetchTrips, deleteTrip, updateTrip } from '@/lib/api-client';
import { auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function TripLogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = auth.currentUser;

  const { data: loggedTrips = [], isLoading, error } = useQuery<LoggedTrip[]>({
    queryKey: ['trips', user?.uid],
    queryFn: fetchTrips,
    enabled: !!user,
  });

  const deleteTripMutation = useMutation({
    mutationFn: deleteTrip,
    onSuccess: (_, tripId) => {
      queryClient.invalidateQueries({ queryKey: ['trips', user?.uid] });
      toast({ title: "Trip Deleted", description: "The selected trip has been removed from your log." });
    },
    onError: (error: Error) => {
      toast({ title: "Error Deleting Trip", description: error.message, variant: "destructive" });
    },
  });

  const updateTripMutation = useMutation({
    mutationFn: updateTrip,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips', user?.uid] });
      toast({ 
        title: "Trip Status Updated", 
        description: `"${data.trip.name}" marked as ${data.trip.isCompleted ? 'completed' : 'incomplete'}.`
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error Updating Trip", description: error.message, variant: "destructive" });
    },
  });

  const handleDeleteTrip = useCallback((id: string) => {
    if (window.confirm("Are you sure you want to delete this trip? This action cannot be undone.")) {
        deleteTripMutation.mutate(id);
    }
  }, [deleteTripMutation]);

  const handleRecallTrip = useCallback((trip: LoggedTrip) => {
    try {
      localStorage.setItem(RECALLED_TRIP_DATA_KEY, JSON.stringify(trip));
      toast({ title: "Trip Recalled", description: `"${trip.name}" is ready in the Trip Planner.` });
      router.push('/tripplanner');
    } catch (error: any) {
      console.error("Error recalling trip to localStorage:", error);
      toast({
        title: "Error Recalling Trip",
        description: "Could not recall the trip. Please try again.",
        variant: "destructive",
      });
    }
  }, [router, toast]);

  const handleAddToCalendar = useCallback((trip: LoggedTrip) => {
    if (!trip.plannedStartDate) {
      toast({
        title: "Cannot Add to Calendar",
        description: "This trip does not have a planned start date.",
        variant: "destructive",
      });
      return;
    }
    const title = encodeURIComponent(trip.name);
    const details = encodeURIComponent(`Trip from ${trip.startLocationDisplay} to ${trip.endLocationDisplay}.\nDistance: ${trip.routeDetails.distance}, Duration: ${trip.routeDetails.duration}.`);
    const location = encodeURIComponent(trip.endLocationDisplay);
    const startDateFormatted = format(parseISO(trip.plannedStartDate), "yyyyMMdd");
    let endDateFormatted: string;
    if (trip.plannedEndDate) {
      const actualEndDate = parseISO(trip.plannedEndDate);
      endDateFormatted = format(addDays(actualEndDate, 1), "yyyyMMdd");
    } else {
      endDateFormatted = format(addDays(parseISO(trip.plannedStartDate), 1), "yyyyMMdd");
    }
    const dates = `${startDateFormatted}/${endDateFormatted}`;
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    window.open(calendarUrl, '_blank');
    toast({ title: "Opening Google Calendar", description: "Check the new tab to add the event."});
  }, [toast]);

  const handleStartTrip = useCallback((tripId: string) => {
    router.push(`/checklists?tripId=${tripId}`);
    toast({ title: "Opening Trip Checklists", description: "Navigating to checklists..." });
  }, [router, toast]);

  const handleToggleCompleteTrip = useCallback((tripId: string) => {
    const tripToUpdate = loggedTrips.find(t => t.id === tripId);
    if (tripToUpdate) {
      updateTripMutation.mutate({ ...tripToUpdate, isCompleted: !tripToUpdate.isCompleted });
    }
  }, [loggedTrips, updateTripMutation]);
  
  const sortedTrips = [...loggedTrips].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-2 text-primary flex items-center">
          <History className="mr-3 h-8 w-8" /> Trip Log
        </h1>
        <p className="text-muted-foreground font-body mb-6">
          Review your saved trips. You can recall them, start them (go to checklists), add to calendar, mark as completed, or delete. All trip data is now stored on the server.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error Loading Trips</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && sortedTrips.length === 0 && (
        <p className="text-center text-muted-foreground font-body py-10">
          You haven't saved any trips yet. Plan a trip and save it to see it here!
        </p>
      )}

      {!isLoading && !error && sortedTrips.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTrips.map(trip => (
            <TripLogItem
              key={trip.id}
              trip={trip}
              onDelete={handleDeleteTrip}
              onRecall={handleRecallTrip}
              onAddToCalendar={handleAddToCalendar}
              onStartTrip={handleStartTrip}
              onToggleComplete={handleToggleCompleteTrip}
            />
          ))}
        </div>
      )}
    </div>
  );
}
