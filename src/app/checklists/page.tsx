
"use client";

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation'; // Keep for potential re-render on nav
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChecklistTabContent } from '@/components/features/checklists/ChecklistTabContent';
import type { ChecklistItem, ChecklistCategory, AllTripChecklists, TripChecklistSet } from '@/types/checklist';
import { TRIP_CHECKLISTS_STORAGE_KEY, initialChecklists as defaultGlobalChecklistTemplate } from '@/types/checklist';
import type { LoggedTrip } from '@/types/tripplanner';
import { TRIP_LOG_STORAGE_KEY } from '@/types/tripplanner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Info, ListChecks } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function ChecklistsPage() {
  const [loggedTrips, setLoggedTrips] = useState<LoggedTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [currentTripChecklistSet, setCurrentTripChecklistSet] = useState<TripChecklistSet | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLocalStorageReady, setIsLocalStorageReady] = useState(false);
  const pathname = usePathname(); // To potentially re-trigger effects if needed

  useEffect(() => {
    setIsLocalStorageReady(true);
  }, []);

  // Load logged trips
  useEffect(() => {
    if (isLocalStorageReady && typeof window !== 'undefined') {
      setIsLoading(true);
      try {
        const storedTripsJson = localStorage.getItem(TRIP_LOG_STORAGE_KEY);
        if (storedTripsJson) {
          const parsedTrips: LoggedTrip[] = JSON.parse(storedTripsJson);
          setLoggedTrips(parsedTrips.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())); // Sort newest first
        } else {
          setLoggedTrips([]);
        }
      } catch (e) {
        console.error("Error loading trips for Checklists:", e);
        setLoggedTrips([]);
      }
      setIsLoading(false);
    }
  }, [isLocalStorageReady, pathname]);

  // Load checklist for the selected trip
  useEffect(() => {
    if (isLocalStorageReady && selectedTripId && typeof window !== 'undefined') {
      setIsLoading(true); // Indicate loading checklist for the selected trip
      try {
        const allTripChecklistsJson = localStorage.getItem(TRIP_CHECKLISTS_STORAGE_KEY);
        if (allTripChecklistsJson) {
          const allChecklists: AllTripChecklists = JSON.parse(allTripChecklistsJson);
          const checklistForTrip = allChecklists[selectedTripId];
          if (checklistForTrip) {
            setCurrentTripChecklistSet(checklistForTrip);
          } else {
            // This case should ideally not happen if checklists are created on trip save.
            // For robustness, we could offer to create one here or show an error.
            console.warn(`No checklist found for trip ID: ${selectedTripId}. This might indicate an issue or an old trip.`);
            setCurrentTripChecklistSet(null); // Or initialize a default one and save it
          }
        } else {
          setCurrentTripChecklistSet(null);
        }
      } catch (e) {
        console.error(`Error loading checklist for trip ${selectedTripId}:`, e);
        setCurrentTripChecklistSet(null);
      }
      setIsLoading(false);
    } else if (!selectedTripId) {
      setCurrentTripChecklistSet(null); // Clear checklist if no trip is selected
    }
  }, [isLocalStorageReady, selectedTripId]);

  const handleTripSelectionChange = (tripId: string) => {
    setSelectedTripId(tripId === "none" ? null : tripId);
  };

  if (!isLocalStorageReady || isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-headline mb-6 text-primary flex items-center">
            <ListChecks className="mr-3 h-8 w-8" /> Trip Checklists
        </h1>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <p className="font-body text-lg">Loading data...</p>
        </div>
      </div>
    );
  }
  
  const selectedTrip = loggedTrips.find(trip => trip.id === selectedTripId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary flex items-center">
            <ListChecks className="mr-3 h-8 w-8" /> Trip Checklists
        </h1>
        <Alert variant="default" className="mb-6 bg-primary/10 border-primary/30">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="font-headline text-primary">Trip-Specific Checklists</AlertTitle>
          <AlertDescription className="font-body text-primary/80">
            Checklists are now associated with your saved trips. Select a trip below to view or manage its checklists. 
            When you save a new trip from the Trip Planner, a default checklist will be automatically created for it.
            All checklist data is stored locally in your browser.
          </AlertDescription>
        </Alert>
      </div>

      {loggedTrips.length === 0 ? (
        <p className="text-muted-foreground text-center font-body py-6">
          No saved trips found. Please plan and save a trip first to create and manage its checklists.
        </p>
      ) : (
        <div className="mb-6">
          <Label htmlFor="trip-select" className="font-body text-base text-foreground mb-2 block">Select a Trip:</Label>
          <Select onValueChange={handleTripSelectionChange} value={selectedTripId || "none"}>
            <SelectTrigger id="trip-select" className="w-full md:w-[400px] font-body">
              <SelectValue placeholder="Choose a trip to manage its checklist" />
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
            <AlertTitle className="font-headline font-bold text-foreground">Managing Checklists for: {currentTripChecklistSet.tripName}</AlertTitle>
         </Alert>
        <Tabs defaultValue="preDeparture" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-4">
            <TabsTrigger value="preDeparture" className="font-body">Pre-Departure</TabsTrigger>
            <TabsTrigger value="campsiteSetup" className="font-body">Campsite Setup</TabsTrigger>
            <TabsTrigger value="packDown" className="font-body">Pack-Down</TabsTrigger>
          </TabsList>
          <TabsContent value="preDeparture">
            <ChecklistTabContent 
              category="preDeparture" 
              itemsForCategory={currentTripChecklistSet.preDeparture}
              selectedTripId={selectedTripId}
            />
          </TabsContent>
          <TabsContent value="campsiteSetup">
            <ChecklistTabContent 
              category="campsiteSetup" 
              itemsForCategory={currentTripChecklistSet.campsiteSetup}
              selectedTripId={selectedTripId}
            />
          </TabsContent>
          <TabsContent value="packDown">
            <ChecklistTabContent 
              category="packDown" 
              itemsForCategory={currentTripChecklistSet.packDown}
              selectedTripId={selectedTripId}
            />
          </TabsContent>
        </Tabs>
        </>
      )}
      {selectedTripId && !currentTripChecklistSet && !isLoading && (
         <Alert variant="destructive" className="mt-4">
            <AlertTitle className="font-headline">Checklist Not Found</AlertTitle>
            <AlertDescription className="font-body">
                Could not find a checklist for the selected trip "{selectedTrip?.name}". This might be an older trip saved before checklist auto-creation was implemented.
                You might need to save the trip again from the Trip Planner to generate its checklist.
            </AlertDescription>
        </Alert>
      )}
       {!selectedTripId && loggedTrips.length > 0 && (
        <p className="text-muted-foreground text-center font-body py-6">Please select a trip above to view its checklists.</p>
      )}
    </div>
  );
}
