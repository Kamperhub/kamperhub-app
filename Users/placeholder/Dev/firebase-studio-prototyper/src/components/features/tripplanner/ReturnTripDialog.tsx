
'use client';

import { useState, useContext }from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { fetchTrips, createTrip } from '@/lib/api-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Rocket, ChevronRight, CornerDownLeft, PlusCircle } from 'lucide-react';
import type { LoggedTrip, ChecklistStage } from '@/types/tripplanner';
import { RECALLED_TRIP_DATA_KEY } from '@/types/tripplanner';
import { fullRigChecklist, vehicleOnlyChecklist } from '@/types/checklist';
import { useToast } from '@/hooks/use-toast';
import { NavigationContext } from '@/components/layout/AppShell';
import Link from 'next/link';
import type { BudgetCategory } from '@/types/expense';
import { format, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';

export function ReturnTripDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navContext = useContext(NavigationContext);

  const { data: trips = [], isLoading, error } = useQuery<LoggedTrip[]>({
    queryKey: ['trips', user?.uid],
    queryFn: fetchTrips,
    enabled: !!user && isOpen,
  });

  const createTripMutation = useMutation({
    mutationFn: (newTripData: Omit<LoggedTrip, 'id' | 'timestamp'>) => createTrip(newTripData),
    onSuccess: (savedTrip) => {
      queryClient.invalidateQueries({ queryKey: ['trips', user?.uid] });
      toast({ title: "Return Trip Created!", description: `"${savedTrip.name}" is ready in the Trip Planner.` });
      
      try {
        localStorage.setItem(RECALLED_TRIP_DATA_KEY, JSON.stringify(savedTrip));
        navContext?.setIsNavigating(true);
        router.push('/trip-expense-planner');
      } catch (e) {
        toast({ title: "Error", description: "Could not redirect to planner.", variant: "destructive"});
      }

      setIsOpen(false);
    },
    onError: (error: Error) => toast({ title: "Save Failed", description: error.message, variant: "destructive" }),
  });


  const handlePlanTripClick = () => {
    navContext?.setIsNavigating(true);
    setIsOpen(false);
  };

  const handleCreateReturnTrip = (trip: LoggedTrip) => {
    const newTripName = `Return: ${trip.name}`;
    
    const isVehicleOnlyReturn = trip.isVehicleOnly ?? false;

    const sourceChecklistSet: readonly ChecklistStage[] = isVehicleOnlyReturn
      ? vehicleOnlyChecklist
      : fullRigChecklist;

    const newTripChecklistSet: ChecklistStage[] = sourceChecklistSet.map(stage => ({
        ...stage,
        items: stage.items.map(item => ({ ...item, completed: false })) // Ensure items are fresh copies and unchecked
    }));

    const initialBudget: BudgetCategory[] = [];
    if (trip.fuelEstimate && trip.fuelEstimate.estimatedCost) {
      const fuelCostString = trip.fuelEstimate.estimatedCost.replace('$', '').trim();
      const fuelCost = parseFloat(fuelCostString);
      if (!isNaN(fuelCost)) {
        initialBudget.push({
          id: `fuel_${Date.now()}`,
          name: 'Fuel',
          budgetedAmount: fuelCost,
        });
      }
    }

    const newTripData: Omit<LoggedTrip, 'id' | 'timestamp'> = {
        name: newTripName,
        startLocationDisplay: trip.endLocationDisplay,
        endLocationDisplay: trip.startLocationDisplay,
        fuelEfficiency: trip.fuelEfficiency,
        fuelPrice: trip.fuelPrice,
        routeDetails: {
            ...trip.routeDetails,
            startLocation: trip.routeDetails.endLocation,
            endLocation: trip.routeDetails.startLocation,
        },
        fuelEstimate: trip.fuelEstimate,
        plannedStartDate: null,
        plannedEndDate: null,
        notes: `Return journey for trip: "${trip.name}"`,
        isCompleted: false,
        isVehicleOnly: isVehicleOnlyReturn,
        checklists: newTripChecklistSet,
        budget: initialBudget,
        expenses: [],
        occupants: (trip.occupants || []).map(occ => ({
            ...occ,
            age: occ.age ?? null,
            notes: occ.notes ?? null,
        })),
        activeCaravanIdAtTimeOfCreation: trip.activeCaravanIdAtTimeOfCreation,
        activeCaravanNameAtTimeOfCreation: trip.activeCaravanNameAtTimeOfCreation
    };

    createTripMutation.mutate(newTripData);
  };
  
  const sortedTrips = [...trips].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center"><CornerDownLeft className="mr-2 h-6 w-6 text-primary"/> Plan Return Trip</DialogTitle>
          <DialogDescription>
            Select a trip to create a reversed return journey.
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
              <p className="text-muted-foreground">No planned trips found to reverse.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
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
                    onClick={() => handleCreateReturnTrip(trip)}
                    className="w-full text-left p-3 rounded-md border hover:bg-muted transition-colors flex justify-between items-center"
                    disabled={createTripMutation.isPending}
                  >
                    <div>
                      <p className="font-semibold text-primary">{trip.name}</p>
                      <p className="text-xs text-muted-foreground">
                        From: {trip.startLocationDisplay}
                      </p>
                    </div>
                    {createTripMutation.isPending && createTripMutation.variables?.name === `Return: ${trip.name}` ? <Loader2 className="h-5 w-5 animate-spin"/> : <ChevronRight className="h-5 w-5 text-muted-foreground"/>}
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
