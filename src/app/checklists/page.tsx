
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChecklistTabContent } from '@/components/features/checklists/ChecklistTabContent';
import type { ChecklistItem, ChecklistCategory, AllTripChecklists, TripChecklistSet, CaravanDefaultChecklistSet, AllCaravanDefaultChecklists } from '@/types/checklist';
import { TRIP_CHECKLISTS_STORAGE_KEY, CARAVAN_DEFAULT_CHECKLISTS_STORAGE_KEY, initialChecklists as globalDefaultTemplate } from '@/types/checklist';
import type { LoggedTrip } from '@/types/tripplanner';
import { TRIP_LOG_STORAGE_KEY } from '@/types/tripplanner';
import type { StoredCaravan } from '@/types/caravan';
import { CARAVANS_STORAGE_KEY } from '@/types/caravan';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Info, ListChecks, Home, Route, PlusCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type ManagementMode = 'trip' | 'caravanDefault';

const createChecklistCopyWithNewIds = (items: readonly ChecklistItem[], prefix: string = 'item'): ChecklistItem[] => {
  return items.map(item => ({ ...item, id: `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` }));
};

export default function ChecklistsPage() {
  const searchParams = useSearchParams(); // For reading URL query parameters
  const [managementMode, setManagementMode] = useState<ManagementMode>('trip');
  
  const [loggedTrips, setLoggedTrips] = useState<LoggedTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [currentTripChecklistSet, setCurrentTripChecklistSet] = useState<TripChecklistSet | null>(null);
  
  const [storedCaravans, setStoredCaravans] = useState<StoredCaravan[]>([]);
  const [selectedCaravanIdForDefaults, setSelectedCaravanIdForDefaults] = useState<string | null>(null);
  const [currentCaravanDefaultChecklistSet, setCurrentCaravanDefaultChecklistSet] = useState<CaravanDefaultChecklistSet | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLocalStorageReady, setIsLocalStorageReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsLocalStorageReady(true);
  }, []);

  useEffect(() => {
    if (isLocalStorageReady && typeof window !== 'undefined') {
      setIsLoading(true);
      try {
        const storedTripsJson = localStorage.getItem(TRIP_LOG_STORAGE_KEY);
        const loadedTrips = storedTripsJson ? JSON.parse(storedTripsJson).sort((a: LoggedTrip, b: LoggedTrip) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : [];
        setLoggedTrips(loadedTrips);
        
        const storedCaravansJson = localStorage.getItem(CARAVANS_STORAGE_KEY);
        setStoredCaravans(storedCaravansJson ? JSON.parse(storedCaravansJson) : []);

        // Check for tripId from URL query parameters
        const tripIdFromQuery = searchParams.get('tripId');
        if (tripIdFromQuery && loadedTrips.some((trip: LoggedTrip) => trip.id === tripIdFromQuery)) {
          setSelectedTripId(tripIdFromQuery);
          setManagementMode('trip'); // Ensure correct tab is active
          toast({ title: "Trip Selected", description: "Checklist loaded for the trip from your log." });
        }

      } catch (e) {
        console.error("Error loading initial data for Checklists:", e);
        toast({ title: "Error loading data", variant: "destructive" });
      }
      setIsLoading(false);
    }
  }, [isLocalStorageReady, toast, searchParams]);

  useEffect(() => {
    if (managementMode === 'trip' && selectedTripId && isLocalStorageReady) {
      try {
        const allTripChecklistsJson = localStorage.getItem(TRIP_CHECKLISTS_STORAGE_KEY);
        const allChecklists: AllTripChecklists = allTripChecklistsJson ? JSON.parse(allTripChecklistsJson) : {};
        setCurrentTripChecklistSet(allChecklists[selectedTripId] || null);
      } catch (e) {
        console.error(`Error loading checklist for trip ${selectedTripId}:`, e);
        setCurrentTripChecklistSet(null);
        toast({ title: "Error loading trip checklist", variant: "destructive" });
      }
    } else if (managementMode === 'trip' && !selectedTripId) {
      setCurrentTripChecklistSet(null);
    }
  }, [managementMode, selectedTripId, isLocalStorageReady, toast]);

  useEffect(() => {
    if (managementMode === 'caravanDefault' && selectedCaravanIdForDefaults && isLocalStorageReady) {
      try {
        const allDefaultsJson = localStorage.getItem(CARAVAN_DEFAULT_CHECKLISTS_STORAGE_KEY);
        const allDefaults: AllCaravanDefaultChecklists = allDefaultsJson ? JSON.parse(allDefaultsJson) : {};
        setCurrentCaravanDefaultChecklistSet(allDefaults[selectedCaravanIdForDefaults] || null);
      } catch (e) {
        console.error(`Error loading default checklist for caravan ${selectedCaravanIdForDefaults}:`, e);
        setCurrentCaravanDefaultChecklistSet(null);
        toast({ title: "Error loading caravan default checklist", variant: "destructive" });
      }
    } else if (managementMode === 'caravanDefault' && !selectedCaravanIdForDefaults) {
      setCurrentCaravanDefaultChecklistSet(null);
    }
  }, [managementMode, selectedCaravanIdForDefaults, isLocalStorageReady, toast]);

  const handleInitializeCaravanDefault = () => {
    if (!selectedCaravanIdForDefaults || !isLocalStorageReady) return;

    const newDefaultSet: CaravanDefaultChecklistSet = {
      preDeparture: createChecklistCopyWithNewIds(globalDefaultTemplate.preDeparture, `cv${selectedCaravanIdForDefaults.substring(0,3)}_pd`),
      campsiteSetup: createChecklistCopyWithNewIds(globalDefaultTemplate.campsiteSetup, `cv${selectedCaravanIdForDefaults.substring(0,3)}_cs`),
      packDown: createChecklistCopyWithNewIds(globalDefaultTemplate.packDown, `cv${selectedCaravanIdForDefaults.substring(0,3)}_pk`),
    };
    
    try {
      const allDefaultsJson = localStorage.getItem(CARAVAN_DEFAULT_CHECKLISTS_STORAGE_KEY);
      const allDefaults: AllCaravanDefaultChecklists = allDefaultsJson ? JSON.parse(allDefaultsJson) : {};
      allDefaults[selectedCaravanIdForDefaults] = newDefaultSet;
      localStorage.setItem(CARAVAN_DEFAULT_CHECKLISTS_STORAGE_KEY, JSON.stringify(allDefaults));
      setCurrentCaravanDefaultChecklistSet(newDefaultSet);
      toast({ title: "Default Checklist Created", description: `Default checklist initialized for the selected caravan.` });
    } catch (e) {
      console.error("Error initializing caravan default checklist:", e);
      toast({ title: "Error creating default checklist", variant: "destructive" });
    }
  };

  const handleTripChecklistChange = useCallback((category: ChecklistCategory, newItems: ChecklistItem[]) => {
    if (!selectedTripId || !currentTripChecklistSet || !isLocalStorageReady) return;
    
    const updatedSet = { ...currentTripChecklistSet, [category]: newItems };
    setCurrentTripChecklistSet(updatedSet);

    try {
      const allTripChecklistsJson = localStorage.getItem(TRIP_CHECKLISTS_STORAGE_KEY);
      const allChecklists: AllTripChecklists = allTripChecklistsJson ? JSON.parse(allTripChecklistsJson) : {};
      allChecklists[selectedTripId] = updatedSet;
      localStorage.setItem(TRIP_CHECKLISTS_STORAGE_KEY, JSON.stringify(allChecklists));
    } catch (e) {
      console.error("Error saving trip checklist:", e);
      toast({ title: "Error saving trip checklist", variant: "destructive" });
    }
  }, [selectedTripId, currentTripChecklistSet, isLocalStorageReady, toast]);

  const handleCaravanDefaultChecklistChange = useCallback((category: ChecklistCategory, newItems: ChecklistItem[]) => {
    if (!selectedCaravanIdForDefaults || !currentCaravanDefaultChecklistSet || !isLocalStorageReady) return;

    const updatedSet = { ...currentCaravanDefaultChecklistSet, [category]: newItems };
    setCurrentCaravanDefaultChecklistSet(updatedSet);

    try {
      const allDefaultsJson = localStorage.getItem(CARAVAN_DEFAULT_CHECKLISTS_STORAGE_KEY);
      const allDefaults: AllCaravanDefaultChecklists = allDefaultsJson ? JSON.parse(allDefaultsJson) : {};
      allDefaults[selectedCaravanIdForDefaults] = updatedSet;
      localStorage.setItem(CARAVAN_DEFAULT_CHECKLISTS_STORAGE_KEY, JSON.stringify(allDefaults));
    } catch (e) {
      console.error("Error saving caravan default checklist:", e);
      toast({ title: "Error saving caravan default", variant: "destructive" });
    }
  }, [selectedCaravanIdForDefaults, currentCaravanDefaultChecklistSet, isLocalStorageReady, toast]);


  if (!isLocalStorageReady || isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-headline mb-6 text-primary flex items-center"><ListChecks className="mr-3 h-8 w-8" /> Checklists</h1>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <p className="font-body text-lg">Loading data...</p>
        </div>
      </div>
    );
  }
  
  const selectedTrip = loggedTrips.find(trip => trip.id === selectedTripId);
  const selectedCaravanForDefaults = storedCaravans.find(cv => cv.id === selectedCaravanIdForDefaults);

  const tabTriggerStyles = "font-body whitespace-normal h-auto py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary flex items-center">
          <ListChecks className="mr-3 h-8 w-8" /> Checklists
        </h1>
        <Alert variant="default" className="mb-6 bg-accent text-accent-foreground border-accent/70">
          <Info className="h-4 w-4 text-accent-foreground" />
          <AlertTitle className="font-headline text-accent-foreground">How Checklists Work Now</AlertTitle>
          <AlertDescription className="font-body text-accent-foreground/90 space-y-1">
            <p>You can manage two types of checklists:</p>
            <ul className="list-disc pl-5">
              <li><strong>Trip-Specific Checklists:</strong> When you save a trip from the Trip Planner, a checklist is created for it. This checklist is copied from the active caravan's default (if set) or a global template. Modifications here only affect this specific trip.</li>
              <li><strong>Caravan Default Checklists:</strong> You can define a default checklist template for each of your caravans. This template will be used for new trips planned with that caravan.</li>
            </ul>
             <p className="pt-1">All checklist data is stored locally in your browser.</p>
          </AlertDescription>
        </Alert>
      </div>

      <Tabs value={managementMode} onValueChange={(value) => setManagementMode(value as ManagementMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="trip" className="font-body"><Route className="mr-2 h-4 w-4" />Manage Trip Checklists</TabsTrigger>
          <TabsTrigger value="caravanDefault" className="font-body"><Home className="mr-2 h-4 w-4" />Manage Caravan Defaults</TabsTrigger>
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
                  {loggedTrips.map(trip => (
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
              <Button onClick={handleInitializeCaravanDefault} className="font-body">
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
