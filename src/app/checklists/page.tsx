
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChecklistTabContent } from '@/components/features/checklists/ChecklistTabContent';
import type { ChecklistItem, ChecklistCategory, CaravanDefaultChecklistSet } from '@/types/checklist';
import { initialChecklists as globalDefaultTemplate } from '@/types/checklist';
import type { LoggedTrip } from '@/types/tripplanner';
import type { StoredCaravan } from '@/types/caravan';
import type { UserProfile } from '@/types/auth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Loader2, Info, ListChecks, Home, Route, PlusCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  fetchTrips, 
  updateTrip, 
  fetchCaravans, 
  fetchUserPreferences, 
  updateUserPreferences 
} from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';

type ManagementMode = 'trip' | 'caravanDefault';

// Helper to create deep copies of checklist items with new unique IDs
const createChecklistCopyWithNewIds = (items: readonly ChecklistItem[], prefix: string = 'item'): ChecklistItem[] => {
  return items.map(item => ({ ...item, id: `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` }));
};


export default function ChecklistsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { user, isAuthLoading } = useAuth();

  const [managementMode, setManagementMode] = useState<ManagementMode>('trip');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedCaravanIdForDefaults, setSelectedCaravanIdForDefaults] = useState<string | null>(null);
  
  // --- Data Fetching from API ---
  const { data: loggedTrips = [], isLoading: isLoadingTrips, error: tripsError } = useQuery<LoggedTrip[]>({
    queryKey: ['trips', user?.uid],
    queryFn: fetchTrips,
    enabled: !!user && !isAuthLoading,
  });

  const { data: storedCaravans = [], isLoading: isLoadingCaravans, error: caravansError } = useQuery<StoredCaravan[]>({
    queryKey: ['caravans', user?.uid],
    queryFn: fetchCaravans,
    enabled: !!user && !isAuthLoading,
  });

  const { data: userPrefs = {}, isLoading: isLoadingPrefs, error: prefsError } = useQuery<Partial<UserProfile>>({
    queryKey: ['userPreferences', user?.uid],
    queryFn: fetchUserPreferences,
    enabled: !!user && !isAuthLoading,
  });

  const isLoading = isAuthLoading || isLoadingTrips || isLoadingCaravans || isLoadingPrefs;
  const queryError = tripsError || caravansError || prefsError;

  // --- Derived State from Queries ---
  const sortedTrips = useMemo(() => 
    [...loggedTrips].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), 
    [loggedTrips]
  );
  
  const selectedTrip = useMemo(() => sortedTrips.find(trip => trip.id === selectedTripId), [sortedTrips, selectedTripId]);
  const selectedCaravanForDefaults = useMemo(() => storedCaravans.find(cv => cv.id === selectedCaravanIdForDefaults), [storedCaravans, selectedCaravanIdForDefaults]);

  const currentTripChecklistSet = useMemo(() => {
    if (managementMode !== 'trip' || !selectedTrip) return null;
    return selectedTrip.checklists ? { ...selectedTrip.checklists, tripName: selectedTrip.name } : null;
  }, [managementMode, selectedTrip]);

  const allCaravanDefaultChecklists = useMemo(() => userPrefs?.caravanDefaultChecklists || {}, [userPrefs]);

  const currentCaravanDefaultChecklistSet = useMemo(() => {
    if (managementMode !== 'caravanDefault' || !selectedCaravanIdForDefaults) return null;
    return allCaravanDefaultChecklists[selectedCaravanIdForDefaults] || null;
  }, [managementMode, selectedCaravanIdForDefaults, allCaravanDefaultChecklists]);
  
  const checklistSource = useMemo(() => {
    if (!selectedTrip) return null;
    if (selectedTrip.activeCaravanNameAtTimeOfCreation) {
        return `Based on: ${selectedTrip.activeCaravanNameAtTimeOfCreation} defaults`;
    }
    return 'Based on: Global Template';
  }, [selectedTrip]);

  // --- Mutations ---
  const updateTripMutation = useMutation({
    mutationFn: updateTrip,
    onMutate: async (updatedTrip: LoggedTrip) => {
      await queryClient.cancelQueries({ queryKey: ['trips', user?.uid] });
      const previousTrips = queryClient.getQueryData<LoggedTrip[]>(['trips', user?.uid]);
      queryClient.setQueryData<LoggedTrip[]>(['trips', user?.uid], (old) =>
        old?.map(t => t.id === updatedTrip.id ? updatedTrip : t) ?? []
      );
      return { previousTrips };
    },
    onError: (err, updatedTrip, context) => {
      if (context?.previousTrips) {
        queryClient.setQueryData(['trips', user?.uid], context.previousTrips);
      }
      toast({ title: "Error Saving Trip Checklist", description: (err as Error).message, variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', user?.uid] });
    },
    onSuccess: () => {
      toast({ title: "Checklist Saved", description: "Your trip checklist has been updated on the server." });
    },
  });

  const updateUserPrefsMutation = useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.uid] });
      toast({ title: "Default Checklist Saved", description: "Your caravan's default checklist has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error Saving Default Checklist", description: error.message, variant: "destructive" });
    }
  });


  useEffect(() => {
    const tripIdFromQuery = searchParams.get('tripId');
    if (tripIdFromQuery && loggedTrips.length > 0 && loggedTrips.some(trip => trip.id === tripIdFromQuery)) {
      if (selectedTripId !== tripIdFromQuery) {
        setSelectedTripId(tripIdFromQuery);
        setManagementMode('trip');
        toast({ title: "Trip Selected", description: "Checklist loaded for the trip from your log." });
      }
    }
  }, [searchParams, loggedTrips, toast, selectedTripId]);
  
  // --- Event Handlers ---
  const handleInitializeCaravanDefault = () => {
    if (!selectedCaravanIdForDefaults) return;
    const caravanPrefix = selectedCaravanIdForDefaults.substring(0,4);
    const newDefaultSet: CaravanDefaultChecklistSet = {
      preDeparture: createChecklistCopyWithNewIds(globalDefaultTemplate.preDeparture, `cv${caravanPrefix}_pd`),
      campsiteSetup: createChecklistCopyWithNewIds(globalDefaultTemplate.campsiteSetup, `cv${caravanPrefix}_cs`),
      packDown: createChecklistCopyWithNewIds(globalDefaultTemplate.packDown, `cv${caravanPrefix}_pk`),
    };
    const updatedDefaults = { ...allCaravanDefaultChecklists, [selectedCaravanIdForDefaults]: newDefaultSet };
    updateUserPrefsMutation.mutate({ caravanDefaultChecklists: updatedDefaults });
  };

  const handleTripChecklistChange = useCallback((category: ChecklistCategory, newItems: ChecklistItem[]) => {
    if (!selectedTrip) return;
    const updatedTrip = {
      ...selectedTrip,
      checklists: {
        ...(selectedTrip.checklists || { preDeparture: [], campsiteSetup: [], packDown: [] }),
        [category]: newItems,
      }
    };
    updateTripMutation.mutate(updatedTrip);
  }, [selectedTrip, updateTripMutation]);

  const handleCaravanDefaultChecklistChange = useCallback((category: ChecklistCategory, newItems: ChecklistItem[]) => {
    if (!selectedCaravanIdForDefaults || !currentCaravanDefaultChecklistSet) return;
    const updatedSet = { ...currentCaravanDefaultChecklistSet, [category]: newItems };
    const updatedDefaults = { ...allCaravanDefaultChecklists, [selectedCaravanIdForDefaults]: updatedSet };
    updateUserPrefsMutation.mutate({ caravanDefaultChecklists: updatedDefaults });
  }, [selectedCaravanIdForDefaults, currentCaravanDefaultChecklistSet, allCaravanDefaultChecklists, updateUserPrefsMutation]);


  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-headline mb-6 text-primary flex items-center"><ListChecks className="mr-3 h-8 w-8" /> Checklists</h1>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <p className="font-body text-lg">Loading checklist data...</p>
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (queryError) {
    return (
        <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>{queryError.message}</AlertDescription>
        </Alert>
    );
  }

  const tabTriggerStyles = "font-body whitespace-normal h-auto py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary flex items-center">
          <ListChecks className="mr-3 h-8 w-8" /> Checklists
        </h1>
        <Alert variant="default" className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-700 dark:text-blue-300" />
          <AlertTitle className="font-headline text-blue-800 dark:text-blue-200">How Checklists Work Now</AlertTitle>
          <AlertDescription className="font-body text-blue-700 dark:text-blue-300 space-y-1">
            <p>Checklist data is now stored on the server for access across your devices.</p>
            <ul className="list-disc pl-5">
              <li><strong>Trip-Specific Checklists:</strong> When you save a trip, a checklist is created based on your active caravan's default (or a global template if none is set). Modifications here only affect this specific trip.</li>
              <li><strong>Caravan Default Checklists:</strong> Define a default template for each of your caravans.</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>

      <Tabs value={managementMode} onValueChange={(value) => setManagementMode(value as ManagementMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="trip" className="font-body"><Route className="mr-2 h-4 w-4" />Manage Trip Checklists</TabsTrigger>
          <TabsTrigger value="caravanDefault" className="font-body" disabled={storedCaravans.length === 0}>
            <Home className="mr-2 h-4 w-4" />Manage Caravan Defaults
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trip">
          <h2 className="text-2xl font-headline text-primary mb-4">Manage Trip-Specific Checklists</h2>
          {loggedTrips.length === 0 ? (
            <p className="text-muted-foreground text-center font-body py-6">No saved trips found. Plan a trip to manage its checklist.</p>
          ) : (
            <div className="mb-6">
              <Label htmlFor="trip-select" className="font-body text-base text-foreground mb-2 block">Select a Trip:</Label>
              <Select onValueChange={setSelectedTripId} value={selectedTripId || "none"}>
                <SelectTrigger id="trip-select" className="w-full md:w-[400px] font-body">
                  <SelectValue placeholder="Choose a trip..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="font-body">-- Select a Trip --</SelectItem>
                  {sortedTrips.map(trip => (
                    <SelectItem key={trip.id} value={trip.id} className="font-body">
                      {trip.name} (Saved: {format(parseISO(trip.timestamp), "PP")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedTripId && currentTripChecklistSet && (
            <>
              <Alert variant="default" className="mb-6 bg-secondary/30 border-secondary/50">
                <ListChecks className="h-4 w-4 text-foreground" />
                <AlertTitle className="font-headline font-bold text-foreground">Checklists for Trip: {currentTripChecklistSet.tripName}</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">{checklistSource}</AlertDescription>
              </Alert>
              <Tabs defaultValue="preDeparture" className="w-full">
                <TabsList className="grid w-full grid-cols-3 gap-2 mb-4 bg-background p-0">
                  <TabsTrigger value="preDeparture" className={tabTriggerStyles}>Pre-Departure</TabsTrigger>
                  <TabsTrigger value="campsiteSetup" className={tabTriggerStyles}>Campsite Setup</TabsTrigger>
                  <TabsTrigger value="packDown" className={tabTriggerStyles}>Pack-Down</TabsTrigger>
                </TabsList>
                { (['preDeparture', 'campsiteSetup', 'packDown'] as ChecklistCategory[]).map(cat => (
                  <TabsContent key={cat} value={cat}>
                    <ChecklistTabContent 
                      category={cat} 
                      initialItems={currentTripChecklistSet[cat]}
                      onChecklistChange={handleTripChecklistChange}
                      entityName={currentTripChecklistSet.tripName}
                      isDisabled={updateTripMutation.isPending}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
          {selectedTripId && !currentTripChecklistSet && !isLoading && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle className="font-headline">Checklist Not Found for Trip</AlertTitle>
              <AlertDescription className="font-body">Could not find a checklist for "{selectedTrip?.name}". This might be an older trip or an error occurred.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="caravanDefault">
          <h2 className="text-2xl font-headline text-primary mb-4">Manage Caravan Default Checklists</h2>
          {storedCaravans.length === 0 ? (
            <p className="text-muted-foreground text-center font-body py-6">No caravans found. Add a caravan in 'Vehicles' to set up its default checklist.</p>
          ) : (
            <div className="mb-6">
              <Label htmlFor="caravan-select" className="font-body text-base text-foreground mb-2 block">Select a Caravan:</Label>
              <Select onValueChange={setSelectedCaravanIdForDefaults} value={selectedCaravanIdForDefaults || "none"}>
                <SelectTrigger id="caravan-select" className="w-full md:w-[400px] font-body">
                  <SelectValue placeholder="Choose a caravan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="font-body">-- Select a Caravan --</SelectItem>
                  {storedCaravans.map(cv => (
                    <SelectItem key={cv.id} value={cv.id} className="font-body">
                      {cv.year} {cv.make} {cv.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedCaravanIdForDefaults && !currentCaravanDefaultChecklistSet && !isLoading && (
            <div className="text-center py-6">
              <p className="font-body text-muted-foreground mb-4">No default checklist found for {selectedCaravanForDefaults?.make} {selectedCaravanForDefaults?.model}.</p>
              <Button onClick={handleInitializeCaravanDefault} className="font-body" disabled={updateUserPrefsMutation.isPending}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Default Checklist
              </Button>
            </div>
          )}

          {selectedCaravanIdForDefaults && currentCaravanDefaultChecklistSet && (
             <>
              <Alert variant="default" className="mb-6 bg-secondary/30 border-secondary/50">
                <ListChecks className="h-4 w-4 text-foreground" />
                <AlertTitle className="font-headline font-bold text-foreground">Default Checklists for: {selectedCaravanForDefaults?.year} {selectedCaravanForDefaults?.make} {selectedCaravanForDefaults?.model}</AlertTitle>
              </Alert>
              <Tabs defaultValue="preDeparture" className="w-full">
                <TabsList className="grid w-full grid-cols-3 gap-2 mb-4 bg-background p-0">
                  <TabsTrigger value="preDeparture" className={tabTriggerStyles}>Pre-Departure</TabsTrigger>
                  <TabsTrigger value="campsiteSetup" className={tabTriggerStyles}>Campsite Setup</TabsTrigger>
                  <TabsTrigger value="packDown" className={tabTriggerStyles}>Pack-Down</TabsTrigger>
                </TabsList>
                {(['preDeparture', 'campsiteSetup', 'packDown'] as ChecklistCategory[]).map(cat => (
                  <TabsContent key={cat} value={cat}>
                    <ChecklistTabContent 
                      category={cat} 
                      initialItems={currentCaravanDefaultChecklistSet[cat]}
                      onChecklistChange={handleCaravanDefaultChecklistChange}
                      entityName={`${selectedCaravanForDefaults?.make} ${selectedCaravanForDefaults?.model} (Default)`}
                      isDisabled={updateUserPrefsMutation.isPending}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </TabsContent>
      </Tabs>
      
      {(managementMode === 'trip' && !selectedTripId && loggedTrips.length > 0) || (managementMode === 'caravanDefault' && !selectedCaravanIdForDefaults && storedCaravans.length > 0) ? (
        <p className="text-muted-foreground text-center font-body py-6">Please select an item above to view its checklists.</p>
      ): null}

    </div>
  );
}
