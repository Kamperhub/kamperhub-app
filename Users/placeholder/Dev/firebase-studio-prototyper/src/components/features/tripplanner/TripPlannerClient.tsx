
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePathname, useSearchParams } from 'next/navigation';
import type { TripPlannerFormValues, RouteDetails, FuelEstimate, LoggedTrip, Occupant, FuelStation } from '@/types/tripplanner';
import { RECALLED_TRIP_DATA_KEY } from '@/types/tripplanner';
import type { Journey } from '@/types/journey';
import type { StoredVehicle } from '@/types/vehicle';
import type { StoredCaravan } from '@/types/caravan';
import type { ChecklistStage } from '@/types/checklist';
import { vehicleOnlyChecklist, fullRigChecklist } from '@/types/checklist';
import type { BudgetCategory, Expense } from '@/types/expense';
import { BudgetTab } from '@/components/features/tripplanner/BudgetTab';
import { ExpenseTab } from '@/components/features/tripplanner/ExpenseTab';
import { OccupantManager } from '@/components/features/tripplanner/OccupantManager';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { Loader2, RouteIcon, Fuel, MapPin, Save, CalendarDays, Navigation, Search, StickyNote, Edit, DollarSign, Users, AlertTriangle, XCircle, Edit3, Car, Settings, TowerControl, Home, Info, Map as MapIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DateRange } from 'react-day-picker';
import { GooglePlacesAutocompleteInput } from '@/components/shared/GooglePlacesAutocompleteInput';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { createTrip, updateTrip, fetchUserPreferences, fetchVehicles, fetchCaravans, updateUserPreferences, fetchJourneys } from '@/lib/api-client';
import type { UserProfile } from '@/types/auth';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const tripPlannerSchema = z.object({
  startLocation: z.string().min(3, "Start location is required (min 3 chars)"),
  endLocation: z.string().min(3, "End location is required (min 3 chars)"),
  fuelEfficiency: z.coerce.number().positive("Fuel efficiency must be a positive number (Litres/100km)"),
  fuelPrice: z.coerce.number().positive("Fuel price must be a positive number (per litre)"),
  dateRange: z.object({
    from: z.date().optional().nullable(),
    to: z.date().optional().nullable(),
  }).optional().nullable(),
}).refine(data => {
  if (data.dateRange?.from && data.dateRange?.to) {
    return data.dateRange.to >= data.dateRange.from;
  }
  return true;
}, {
  message: "End date cannot be before start date.",
  path: ["dateRange"],
});

const RouteRenderer = ({ routeDetails }: { routeDetails: RouteDetails | null }) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }
    if (routeDetails?.polyline && map && window.google?.maps?.geometry) {
      try {
        const decodedPath = window.google.maps.geometry.encoding.decodePath(routeDetails.polyline);
        const newPolyline = new window.google.maps.Polyline({
          path: decodedPath,
          strokeColor: 'hsl(var(--primary))',
          strokeOpacity: 0.8,
          strokeWeight: 6,
        });
        newPolyline.setMap(map);
        polylineRef.current = newPolyline;

        const bounds = new window.google.maps.LatLngBounds();
        decodedPath.forEach(point => bounds.extend(point));
        map.fitBounds(bounds);
      } catch (e) {
        console.error("Error decoding or drawing polyline:", e);
      }
    }
  }, [routeDetails, map]);

  return null; // This component does not render anything itself
};

export function TripPlannerClient() {
  const { control, handleSubmit, formState: { errors }, setValue, getValues, reset, register } = useForm<TripPlannerFormValues>({
    resolver: zodResolver(tripPlannerSchema),
    defaultValues: {
      startLocation: '',
      endLocation: '',
      fuelEfficiency: 10,
      fuelPrice: 1.80,
      dateRange: { from: undefined, to: undefined }
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTowing, setIsTowing] = useState(true);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [fuelEstimate, setFuelEstimate] = useState<FuelEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTrip, setActiveTrip] = useState<LoggedTrip | null>(null);
  const [tripBudget, setTripBudget] = useState<BudgetCategory[]>([]);
  const [tripExpenses, setTripExpenses] = useState<Expense[]>([]);
  const [tripOccupants, setTripOccupants] = useState<Occupant[]>([]);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [showFuelStations, setShowFuelStations] = useState(false);
  const [activeFuelStation, setActiveFuelStation] = useState<FuelStation | null>(null);

  const { data: userPrefs } = useQuery<Partial<UserProfile>>({
    queryKey: ['userPreferences', user?.uid],
    queryFn: fetchUserPreferences,
    enabled: !!user,
  });
  
  const { data: allVehicles = [], isLoading: isLoadingVehicles } = useQuery<StoredVehicle[]>({
    queryKey: ['vehicles', user?.uid],
    queryFn: fetchVehicles,
    enabled: !!user,
  });

  const { data: allCaravans = [] } = useQuery<StoredCaravan[]>({
    queryKey: ['caravans', user?.uid],
    queryFn: fetchCaravans,
    enabled: !!user,
  });

  const { data: allJourneys = [] } = useQuery<Journey[]>({
    queryKey: ['journeys', user?.uid],
    queryFn: fetchJourneys,
    enabled: !!user,
  });

  const sortedJourneys = useMemo(() => {
    return [...allJourneys].sort((a, b) => a.name.localeCompare(b.name));
  }, [allJourneys]);


  const [isSaveTripDialogOpen, setIsSaveTripDialogOpen] = useState(false);
  const [pendingTripName, setPendingTripName] = useState('');
  const [pendingTripNotes, setPendingTripNotes] = useState('');

  const map = useMap();

  const isGoogleApiReady = !!map &&
                           typeof window.google !== 'undefined' &&
                           !!window.google.maps?.places?.Autocomplete;

  const clearPlanner = useCallback((resetForm = true) => {
    if(resetForm) reset();
    setIsTowing(true);
    setRouteDetails(null);
    setFuelEstimate(null);
    setActiveTrip(null);
    setTripBudget([]);
    setTripExpenses([]);
    setTripOccupants([]);
    setPendingTripName('');
    setPendingTripNotes('');
    setAvoidTolls(false);
    setSelectedJourneyId(null);
  }, [reset]);

  useEffect(() => {
    const journeyIdFromQuery = searchParams.get('journeyId');
    if (journeyIdFromQuery) {
        setSelectedJourneyId(journeyIdFromQuery);
        toast({
            title: "Adding to Journey",
            description: "This new trip will be added to your selected journey.",
        });
    }
  }, [searchParams, toast]);
  
  const calculateRoute = useCallback(async (options: {
    origin: string;
    destination: string;
    shouldAvoidTolls: boolean;
    isCurrentlyTowing: boolean;
  }) => {
    setIsLoading(true);
    setError(null);

    const activeVehicle = userPrefs?.activeVehicleId ? allVehicles.find(v => v.id === userPrefs.activeVehicleId) : null;
    const activeCaravan = userPrefs?.activeCaravanId ? allCaravans.find(c => c.id === userPrefs.activeCaravanId) : null;

    let axleCount = 2;
    if (options.isCurrentlyTowing && activeCaravan?.numberOfAxles) {
      axleCount += activeCaravan.numberOfAxles;
    }
    const vehicleHeight = options.isCurrentlyTowing ? activeCaravan?.overallHeight : activeVehicle?.overallHeight;

    try {
        const response = await fetch('/api/directions/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                origin: options.origin,
                destination: options.destination,
                vehicleHeight: vehicleHeight ? vehicleHeight / 1000 : undefined,
                axleCount: axleCount,
                avoidTolls: options.shouldAvoidTolls
            }),
        });

        const result: RouteDetails = await response.json();
        if (!response.ok) {
            throw new Error((result as any).error || 'Failed to calculate route.');
        }
        
        setRouteDetails(result);
        
        if (!activeTrip && tripOccupants.length === 0 && user) {
          const defaultDriver: Occupant = { id: `driver_${Date.now()}`, name: user.displayName || 'Driver', type: 'Adult', weight: 75, notes: null, age: null };
          setTripOccupants([defaultDriver]);
          toast({ title: "Default Driver Added", description: "You can edit occupant details as needed." });
        }

        const currentFormData = getValues();
        if (result.distance.value > 0 && currentFormData.fuelEfficiency > 0) {
            const fuelNeeded = (result.distance.value / 1000 / 100) * currentFormData.fuelEfficiency;
            const estimatedCost = fuelNeeded * currentFormData.fuelPrice;
            setFuelEstimate({ fuelNeeded: `${fuelNeeded.toFixed(1)} L`, estimatedCost: `$${estimatedCost.toFixed(2)}` });
        } else {
            setFuelEstimate(null);
        }

    } catch (e: any) { 
        setError(`Error calculating route: ${e.message}`);
        setRouteDetails(null);
    } finally { 
        setIsLoading(false); 
    }
  }, [userPrefs, allVehicles, allCaravans, toast, user, getValues, activeTrip, tripOccupants]);

  const onSubmit: SubmitHandler<TripPlannerFormValues> = (data) => {
    calculateRoute({
      origin: data.startLocation,
      destination: data.endLocation,
      shouldAvoidTolls: avoidTolls,
      isCurrentlyTowing: isTowing,
    });
  };

  useEffect(() => {
    if (routeDetails) { // Only auto-recalculate if a route is already displayed
      handleSubmit(onSubmit)();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avoidTolls, isTowing]);

  useEffect(() => {
    let recalledTripLoaded = false;
    if (typeof window !== 'undefined') {
      try {
        const recalledTripJson = localStorage.getItem(RECALLED_TRIP_DATA_KEY);
        if (recalledTripJson) {
          const recalledTrip: LoggedTrip = JSON.parse(recalledTripJson);
           const sanitizedTrip: LoggedTrip = {
              ...recalledTrip,
              notes: recalledTrip.notes || null,
              occupants: (recalledTrip.occupants || []).map(occ => ({
                  ...occ,
                  age: occ.age ?? null,
                  notes: occ.notes ?? null,
              }))
          };
          setActiveTrip(sanitizedTrip);
          setIsTowing(!sanitizedTrip.isVehicleOnly);
          setTripBudget(sanitizedTrip.budget || []);
          setTripExpenses(sanitizedTrip.expenses || []);
          setTripOccupants(sanitizedTrip.occupants || []);
          setSelectedJourneyId(sanitizedTrip.journeyId || null);
          
          reset({
            startLocation: sanitizedTrip.startLocationDisplay,
            endLocation: sanitizedTrip.endLocationDisplay,
            fuelEfficiency: sanitizedTrip.fuelEfficiency,
            fuelPrice: sanitizedTrip.fuelPrice,
            dateRange: {
              from: sanitizedTrip.plannedStartDate ? parseISO(sanitizedTrip.plannedStartDate) : undefined,
              to: sanitizedTrip.plannedEndDate ? parseISO(sanitizedTrip.plannedEndDate) : undefined,
            }
          });
          setRouteDetails(sanitizedTrip.routeDetails);
          setFuelEstimate(sanitizedTrip.fuelEstimate);
          localStorage.removeItem(RECALLED_TRIP_DATA_KEY);
          toast({ title: "Trip Recalled", description: `"${sanitizedTrip.name}" loaded into planner.` });
          recalledTripLoaded = true;
        }
      } catch (e) {
        console.error("Error loading recalled trip data:", e);
        toast({ title: "Error", description: "Could not load recalled trip data.", variant: "destructive" });
      }

      if (!recalledTripLoaded) {
        if (userPrefs?.activeVehicleId && allVehicles.length > 0) {
          const activeVehicle = allVehicles.find(v => v.id === userPrefs.activeVehicleId);
          if (activeVehicle && typeof activeVehicle.fuelEfficiency === 'number') {
            if (getValues('fuelEfficiency') === 10) { 
               setValue('fuelEfficiency', activeVehicle.fuelEfficiency, { shouldValidate: false });
            }
          }
        }
      }
    }
  }, [reset, setValue, toast, userPrefs, allVehicles, getValues]); 

  const createTripMutation = useMutation({
    mutationFn: (data: Omit<LoggedTrip, 'id' | 'timestamp'>) => createTrip(data),
    onSuccess: (savedTrip) => {
      queryClient.invalidateQueries({ queryKey: ['trips', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['journeys', user?.uid] });
      toast({ title: "Trip Saved!", description: `"${savedTrip.name}" has been added to your Trip Log.` });
      setIsSaveTripDialogOpen(false);
      clearPlanner();
    },
    onError: (error: Error) => toast({ title: "Save Failed", description: error.message, variant: "destructive" }),
  });
  
  const updateTripMutation = useMutation({
    mutationFn: (data: Partial<LoggedTrip> & { id: string }) => updateTrip(data),
    onSuccess: (updatedTrip) => {
      queryClient.invalidateQueries({ queryKey: ['trips', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['journeys', user?.uid] });
      toast({ title: "Trip Updated!", description: `"${updatedTrip.trip.name}" has been updated.` });
    },
    onError: (error: Error) => toast({ title: "Update Failed", description: error.message, variant: "destructive" }),
  });
  
  const handleBudgetUpdate = useCallback((newBudget: BudgetCategory[]) => {
    setTripBudget(newBudget);
    if(activeTrip) {
      updateTripMutation.mutate({ ...activeTrip, budget: newBudget, expenses: tripExpenses, occupants: tripOccupants });
    }
  }, [activeTrip, tripExpenses, tripOccupants, updateTripMutation]);

  const handleExpensesUpdate = useCallback((newExpenses: Expense[]) => {
    setTripExpenses(newExpenses);
    if(activeTrip) {
      updateTripMutation.mutate({ ...activeTrip, budget: tripBudget, expenses: newExpenses, occupants: tripOccupants });
    }
  }, [activeTrip, tripBudget, tripOccupants, updateTripMutation]);

  const handleOccupantsUpdate = useCallback((newOccupants: Occupant[]) => {
    setTripOccupants(newOccupants);
    if(activeTrip) {
        updateTripMutation.mutate({ ...activeTrip, budget: tripBudget, expenses: tripExpenses, occupants: newOccupants });
    }
  }, [activeTrip, tripBudget, tripExpenses, updateTripMutation]);

  const handleOpenSaveTripDialog = useCallback(() => {
    if (!routeDetails) {
      toast({ title: "Cannot Save", description: "No trip details to save. Plan a trip first.", variant: "destructive" });
      return;
    }
    const start = getValues("startLocation") || 'Start';
    const end = getValues("endLocation") || 'Destination';
    setPendingTripName(activeTrip?.name || `Trip from ${start} to ${end}`);
    setPendingTripNotes(activeTrip?.notes || '');
    setIsSaveTripDialogOpen(true);
  }, [routeDetails, getValues, activeTrip, toast]);
  
  const handleConfirmSaveTrip = useCallback(() => {
    if (!pendingTripName.trim()) {
      toast({ title: "Invalid Name", description: "Trip name cannot be empty.", variant: "destructive" });
      return;
    }
    if (!routeDetails) {
      toast({ title: "Error", description: "Route details are missing.", variant: "destructive" });
      return;
    }
    if (tripOccupants.length === 0) {
      toast({
        title: "Occupant Required",
        description: "Please add at least one occupant (e.g., the driver) before saving.",
        variant: "destructive",
        duration: 6000,
      });
      return;
    }

    const newTripChecklistSet: ChecklistStage[] = isTowing
        ? fullRigChecklist.map(stage => ({ ...stage, items: [...stage.items] }))
        : vehicleOnlyChecklist.map(stage => ({ ...stage, items: [...stage.items] }));
    
    const currentFormData = getValues();
    const activeCaravan = userPrefs?.activeCaravanId ? allCaravans.find(c => c.id === userPrefs.activeCaravanId) : null;

    const tripData: Omit<LoggedTrip, 'id' | 'timestamp'> = {
      name: pendingTripName.trim(),
      startLocationDisplay: currentFormData.startLocation,
      endLocationDisplay: currentFormData.endLocation,
      fuelEfficiency: currentFormData.fuelEfficiency,
      fuelPrice: currentFormData.fuelPrice,
      routeDetails: routeDetails,
      fuelEstimate: fuelEstimate,
      plannedStartDate: currentFormData.dateRange?.from?.toISOString() || null,
      plannedEndDate: currentFormData.dateRange?.to?.toISOString() || null,
      notes: pendingTripNotes.trim() || null,
      checklists: newTripChecklistSet,
      budget: tripBudget,
      expenses: tripExpenses,
      occupants: tripOccupants.map(occ => ({
          ...occ,
          age: occ.age ?? null,
          notes: occ.notes ?? null,
      })),
      isVehicleOnly: !isTowing,
      activeCaravanIdAtTimeOfCreation: isTowing ? (activeCaravan?.id || null) : null,
      activeCaravanNameAtTimeOfCreation: isTowing ? (activeCaravan ? `${activeCaravan.year} ${activeCaravan.make} ${activeCaravan.model}` : null) : null,
      journeyId: selectedJourneyId,
    };
    
    if (activeTrip) {
        updateTripMutation.mutate({ ...activeTrip, ...tripData });
        setIsSaveTripDialogOpen(false);
    } else {
        createTripMutation.mutate(tripData);
    }
  }, [routeDetails, getValues, fuelEstimate, toast, pendingTripName, pendingTripNotes, userPrefs, createTripMutation, updateTripMutation, activeTrip, tripBudget, tripExpenses, tripOccupants, allCaravans, isTowing, selectedJourneyId]);


  const mapHeight = "400px"; 

  if (isLoadingVehicles) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <p className="font-body text-lg">Checking vehicle setup...</p>
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!isLoadingVehicles && allVehicles.length === 0) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center text-destructive">
            <AlertTriangle className="mr-3 h-6 w-6" /> Tow Vehicle Required
          </CardTitle>
          <CardDescription>
            You must add at least one tow vehicle before you can plan a trip.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Car className="h-4 w-4" />
            <AlertTitle className="font-headline">Action Required</AlertTitle>
            <AlertDescription className="font-body">
              Trip planning uses your vehicle's specifications, like fuel efficiency, for accurate calculations. Please go to the Vehicle Setup page to add your primary tow vehicle.
            </AlertDescription>
          </Alert>
          <Button asChild className="mt-6 w-full font-body">
            <Link href="/vehicles">
              <Settings className="mr-2 h-4 w-4" /> Go to Vehicle Setup
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Tabs defaultValue="itinerary" className="w-full">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between mb-6 gap-4">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="itinerary" className="font-body"><MapPin className="mr-2 h-4 w-4"/>Itinerary</TabsTrigger>
            <TabsTrigger value="budget" className="font-body"><Edit className="mr-2 h-4 w-4"/>Budget</TabsTrigger>
            <TabsTrigger value="expenses" className="font-body"><DollarSign className="mr-2 h-4 w-4"/>Expenses</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="itinerary" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline flex items-center"><RouteIcon className="mr-2 h-6 w-6 text-primary" /> Plan Trip</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <GooglePlacesAutocompleteInput control={control} name="startLocation" label="Start Location" placeholder="e.g., Sydney, NSW" errors={errors} setValue={setValue} isApiReady={isGoogleApiReady} />
                    
                    <GooglePlacesAutocompleteInput control={control} name="endLocation" label="End Location" placeholder="e.g., Melbourne, VIC" errors={errors} setValue={setValue} isApiReady={isGoogleApiReady} />
                    
                    <div>
                      <Label htmlFor="dateRange" className="font-body">Planned Date Range</Label>
                      <Controller name="dateRange" control={control} render={({ field }) => (
                          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button id="dateRange" variant={"outline"} className={cn("w-full justify-start text-left font-normal font-body", !field.value?.from && "text-muted-foreground")}>
                                <CalendarDays className="mr-2 h-4 w-4" />
                                {field.value?.from ? (field.value.to ? `${format(field.value.from, "LLL dd, yyyy")} - ${format(field.value.to, "LLL dd, yyyy")}` : format(field.value.from, "LLL dd, yyyy")) : <span>Pick a date range</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar 
                                initialFocus 
                                mode="range" 
                                defaultMonth={field.value?.from} 
                                selected={field.value as DateRange | undefined} 
                                onSelect={(range) => {
                                  field.onChange(range);
                                  if (range?.from && range?.to) {
                                    setIsDatePopoverOpen(false);
                                  }
                                }}
                                numberOfMonths={2} 
                              />
                            </PopoverContent>
                          </Popover>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fuelEfficiency" className="font-body">Fuel L/100km</Label>
                        <Controller name="fuelEfficiency" control={control} render={({ field }) => (<Input id="fuelEfficiency" type="number" step="0.1" {...field} value={field.value ?? ''} className="font-body" />)} />
                        {errors.fuelEfficiency && <p className="text-sm text-destructive font-body mt-1">{errors.fuelEfficiency.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="fuelPrice" className="font-body">Fuel Price $/L</Label>
                        <Controller name="fuelPrice" control={control} render={({ field }) => (<Input id="fuelPrice" type="number" step="0.01" {...field} value={field.value ?? ''} className="font-body" />)} />
                        {errors.fuelPrice && <p className="text-sm text-destructive font-body mt-1">{errors.fuelPrice.message}</p>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch id="towing-switch" checked={isTowing} onCheckedChange={setIsTowing} disabled={isLoading}/>
                      <Label htmlFor="towing-switch" className="font-body">Towing a caravan?</Label>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch id="avoid-tolls-switch" checked={avoidTolls} onCheckedChange={setAvoidTolls} disabled={isLoading}/>
                      <Label htmlFor="avoid-tolls-switch" className="font-body">Avoid Tolls?</Label>
                    </div>
                     <div className="flex items-center space-x-2 pt-2">
                      <Switch id="show-fuel-switch" checked={showFuelStations} onCheckedChange={setShowFuelStations} disabled={!routeDetails}/>
                      <Label htmlFor="show-fuel-switch" className="font-body">Show Fuel Stations</Label>
                    </div>
                    <div>
                        <Label htmlFor="journey-select" className="font-body">Assign to Journey (Optional)</Label>
                        <Select value={selectedJourneyId || "none"} onValueChange={(val) => setSelectedJourneyId(val === "none" ? null : val)}>
                            <SelectTrigger id="journey-select" className="font-body">
                                <SelectValue placeholder="Select a journey..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Standalone Trip</SelectItem>
                                {sortedJourneys.map(journey => (
                                    <SelectItem key={journey.id} value={journey.id}>{journey.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button type="button" variant="outline" onClick={() => clearPlanner(true)} disabled={isLoading} className="w-full font-body">
                          <XCircle className="mr-2 h-4 w-4" /> Reset
                        </Button>
                        <Button type="submit" disabled={isLoading || !isGoogleApiReady} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body">
                          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calculating...</> : 'Plan Route'}
                        </Button>
                    </div>
                    {!isGoogleApiReady && <p className="text-xs text-muted-foreground text-center font-body mt-1">Map services loading...</p>}
                  </form>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center"><Users className="mr-2 h-6 w-6 text-primary" /> Vehicle Occupants</CardTitle>
                    <CardDescription>Add travelers to account for their weight and personalize packing lists.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!routeDetails && !activeTrip && (
                        <Alert variant="default" className="mb-4 bg-muted/50">
                            <Info className="h-4 w-4" />
                            <AlertTitle className="font-headline">Plan Itinerary First</AlertTitle>
                            <AlertDescription className="font-body">
                                This section will unlock after you calculate a route.
                            </AlertDescription>
                        </Alert>
                    )}
                    {routeDetails && tripOccupants.length === 0 && !activeTrip && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="font-headline">Occupant Required</AlertTitle>
                            <AlertDescription className="font-body">
                                Please add at least one occupant before saving the trip.
                            </AlertDescription>
                        </Alert>
                    )}
                    <OccupantManager occupants={tripOccupants} onUpdate={handleOccupantsUpdate} disabled={!routeDetails && !activeTrip} />
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2 space-y-6">
              <Button
                  onClick={handleOpenSaveTripDialog}
                  variant="default"
                  size="lg"
                  className="w-full font-body bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6"
                  disabled={!routeDetails || createTripMutation.isPending || updateTripMutation.isPending}
              >
                  {(createTripMutation.isPending || updateTripMutation.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (activeTrip ? <Edit3 className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />)}
                  {activeTrip ? 'Update Trip Details' : 'Save Trip'}
              </Button>
              <Card><CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-headline flex items-center"><MapIcon className="mr-2 h-6 w-6 text-primary" /> Route Map</CardTitle>
              </CardHeader><CardContent className="p-0"><div style={{ height: mapHeight }} className="bg-muted rounded-b-lg overflow-hidden relative">
                <Map defaultCenter={{ lat: -25.2744, lng: 133.7751 }} defaultZoom={4} gestureHandling={'greedy'} disableDefaultUI={true} mapId={'DEMO_MAP_ID'} className="h-full w-full">
                  <RouteRenderer routeDetails={routeDetails} />
                  {routeDetails?.startLocation && <AdvancedMarker position={routeDetails.startLocation} title={`Start`}><Pin background={'hsl(var(--primary))'} borderColor={'hsl(var(--primary))'} glyphColor={'hsl(var(--primary-foreground))'} /></AdvancedMarker>}
                  {routeDetails?.endLocation && <AdvancedMarker position={routeDetails.endLocation} title={`End`}><Pin background={'hsl(var(--accent))'} borderColor={'hsl(var(--accent))'} glyphColor={'hsl(var(--accent-foreground))'} /></AdvancedMarker>}
                  {showFuelStations && routeDetails?.fuelStations?.map((station, index) => (
                    <AdvancedMarker key={index} position={station.location} title={station.name} onClick={() => setActiveFuelStation(station)}>
                        <div className="bg-white rounded-full p-1 border-2 border-yellow-500 shadow-md">
                            <Fuel className="h-4 w-4 text-yellow-600" />
                        </div>
                    </AdvancedMarker>
                  ))}
                  {activeFuelStation && (
                    <InfoWindow position={activeFuelStation.location} onCloseClick={() => setActiveFuelStation(null)}><p>{activeFuelStation.name}</p></InfoWindow>
                  )}
                </Map>
              </div></CardContent></Card>
              {error && <Alert variant="destructive"><AlertTitle className="font-headline">Error</AlertTitle><AlertDescription className="font-body">{error}</AlertDescription></Alert>}
              {routeDetails?.warnings && routeDetails.warnings.length > 0 && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle className="font-headline">Route Warnings</AlertTitle><AlertDescription className="font-body space-y-1">{routeDetails.warnings.map((warning, i) => <p key={i}>{warning}</p>)}</AlertDescription></Alert>}
              {isLoading && !routeDetails && <Card><CardHeader><CardTitle className="font-headline">Trip Summary</CardTitle></CardHeader><CardContent className="space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>}
              {routeDetails && <Card><CardHeader><CardTitle className="font-headline">Trip Summary</CardTitle></CardHeader><CardContent className="space-y-2">
                  <div className="font-body text-sm"><strong>Distance:</strong> {routeDetails.distance.text}</div>
                  <div className="font-body text-sm"><strong>Est. Duration:</strong> {routeDetails.duration.text}</div>
                  {fuelEstimate && <>
                    <div className="font-body text-sm"><strong>Est. Fuel Needed:</strong> {fuelEstimate.fuelNeeded}</div>
                    <div className="font-body text-sm"><strong>Est. Fuel Cost:</strong> {fuelEstimate.estimatedCost}</div>
                  </>}
                  {routeDetails.tollInfo && (
                    <div className="font-body text-sm"><strong>Est. Tolls:</strong> {routeDetails.tollInfo.text}</div>
                  )}
              </CardContent></Card>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="budget">
          <BudgetTab
            budget={tripBudget}
            onBudgetUpdate={handleBudgetUpdate}
            isTripLoaded={!!routeDetails || !!activeTrip}
            isLoading={updateTripMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="expenses">
           <ExpenseTab
            expenses={tripExpenses}
            budget={tripBudget}
            onExpensesUpdate={handleExpensesUpdate}
            isTripLoaded={!!routeDetails || !!activeTrip}
            isLoading={updateTripMutation.isPending}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isSaveTripDialogOpen} onOpenChange={setIsSaveTripDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle className="font-headline">{activeTrip ? 'Update' : 'Save'} Trip</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tripName" className="text-right font-body">Name</Label>
                <Input id="tripName" value={pendingTripName} onChange={(e) => setPendingTripName(e.target.value)} className="col-span-3 font-body" placeholder="e.g., Coastal Adventure QLD" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="tripNotes" className="text-right font-body mt-2">Notes</Label>
                <Textarea id="tripNotes" value={pendingTripNotes} onChange={(e) => setPendingTripNotes(e.target.value)} className="col-span-3 font-body" placeholder="Any specific details for this trip..." rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSaveTripDialogOpen(false)} className="font-body" disabled={createTripMutation.isPending || updateTripMutation.isPending}>Cancel</Button>
              <Button type="button" onClick={handleConfirmSaveTrip} className="bg-primary hover:bg-primary/90 text-primary-foreground font-body" disabled={createTripMutation.isPending || updateTripMutation.isPending}>
                {(createTripMutation.isPending || updateTripMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {activeTrip ? 'Update Trip' : 'Save Trip'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </>
  );
}

```
- src/components/features/vehicles/VehicleManager.tsx:
```tsx

"use client";

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { StoredVehicle, VehicleFormData, VehicleStorageLocation } from '@/types/vehicle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { VehicleForm } from './VehicleForm';
import { PlusCircle, Edit3, Trash2, CheckCircle, Fuel, Weight, Axe, Car, PackagePlus, MapPin, ArrowLeftRight, ArrowUpDown, Ruler, Backpack, Loader2, Disc, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  createVehicle, 
  updateVehicle, 
  deleteVehicle,
  updateUserPreferences,
} from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/types/auth';
import { useSubscription } from '@/hooks/useSubscription';

interface VehicleManagerProps {
    initialVehicles: StoredVehicle[];
    initialUserPrefs: Partial<UserProfile> | null;
}

export function VehicleManager({ initialVehicles, initialUserPrefs }: VehicleManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasProAccess } = useSubscription();
  const { user } = useAuth();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<StoredVehicle | null>(null);
  const [deleteDialogState, setDeleteDialogState] = useState<{ isOpen: boolean; vehicleId: string | null; vehicleName: string | null; confirmationText: string }>({
    isOpen: false,
    vehicleId: null,
    vehicleName: null,
    confirmationText: '',
  });

  const activeVehicleId = initialUserPrefs?.activeVehicleId;
  
  const invalidateAndRefetch = () => {
    queryClient.invalidateQueries({ queryKey: ['allVehicleData', user?.uid] });
  };
  
  const saveVehicleMutation = useMutation({
    mutationFn: (vehicleData: VehicleFormData | StoredVehicle) => {
      const dataToSend = editingVehicle ? { ...editingVehicle, ...vehicleData } : vehicleData;
      return 'id' in dataToSend && dataToSend.id ? updateVehicle(dataToSend as StoredVehicle) : createVehicle(dataToSend as VehicleFormData);
    },
    onSuccess: (savedVehicle) => {
      invalidateAndRefetch();
      toast({
        title: editingVehicle ? "Vehicle Updated" : "Vehicle Added",
        description: `${savedVehicle.year} ${savedVehicle.make} ${savedVehicle.model} has been saved.`,
      });
      setIsFormOpen(false);
      setEditingVehicle(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message || "Could not save the vehicle.",
        variant: "destructive",
      });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
        invalidateAndRefetch();
        toast({ title: "Vehicle Deleted" });
        setDeleteDialogState({ isOpen: false, vehicleId: null, vehicleName: null, confirmationText: '' });
    },
    onError: (err: Error) => {
      invalidateAndRefetch();
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    },
  });

  const setActiveVehicleMutation = useMutation({
    mutationFn: (vehicleId: string) => updateUserPreferences({ activeVehicleId: vehicleId }),
    onSuccess: () => {
      invalidateAndRefetch();
      toast({ title: "Active Vehicle Set" });
    },
    onError: (error: Error) => {
       toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  });

  const handleSaveVehicle = (data: VehicleFormData) => {
    saveVehicleMutation.mutate(data);
  };

  const handleEditVehicle = (vehicle: StoredVehicle) => {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  };
  
  const handleDeleteVehicle = (id: string, name: string) => {
    setDeleteDialogState({ isOpen: true, vehicleId: id, vehicleName: name, confirmationText: '' });
  };
  
  const confirmDeleteVehicle = () => {
    if (deleteDialogState.vehicleId && deleteDialogState.confirmationText === "DELETE") {
      deleteVehicleMutation.mutate(deleteDialogState.vehicleId);
    } else {
       setDeleteDialogState({ isOpen: false, vehicleId: null, vehicleName: null, confirmationText: '' });
    }
  };

  const handleSetActiveVehicle = (id: string) => {
    setActiveVehicleMutation.mutate(id);
  };
  
  const handleOpenFormForNew = () => {
    setEditingVehicle(null);
    setIsFormOpen(true);
  };
  
  const formatPositionText = (loc: VehicleStorageLocation) => {
    const longText = {
      'front-of-front-axle': 'Front of F.Axle',
      'between-axles': 'Between Axles',
      'rear-of-rear-axle': 'Rear of R.Axle',
      'roof-center': 'Roof Center'
    }[loc.longitudinalPosition];
    const latText = {
      'left': 'Left',
      'center': 'Center',
      'right': 'Right'
    }[loc.lateralPosition];
    return `${longText || loc.longitudinalPosition} / ${latText || loc.lateralPosition}`;
  };

  const formatDimension = (value: number | null | undefined, unit: string = 'kg') => {
    return typeof value === 'number' ? `${value}${unit}` : 'N/A';
  };

  const isAddButtonDisabled = !hasProAccess && initialVehicles.length >= 1;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline">Tow Vehicles</CardTitle>
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
              setIsFormOpen(isOpen);
              if (!isOpen) setEditingVehicle(null);
            }}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenFormForNew} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body" disabled={isAddButtonDisabled}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[725px]">
                <DialogHeader>
                  <DialogTitle className="font-headline">{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-6">
                  <VehicleForm
                    initialData={editingVehicle || undefined}
                    onSave={handleSaveVehicle}
                    onCancel={() => { setIsFormOpen(false); setEditingVehicle(null); }}
                    isLoading={saveVehicleMutation.isPending}
                  />
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription className="font-body">
            Manage your tow vehicles. Select one as active for trip planning.
            {!hasProAccess && " (Free tier limit: 1)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {initialVehicles.length === 0 && <p className="text-muted-foreground text-center font-body py-4">No vehicles added yet. Click "Add New Vehicle" to start.</p>}
          {initialVehicles.map(vehicle => {
            const vehiclePayload = (typeof vehicle.gvm === 'number' && typeof vehicle.kerbWeight === 'number' && vehicle.gvm > 0 && vehicle.kerbWeight > 0 && vehicle.gvm >= vehicle.kerbWeight) ? vehicle.gvm - vehicle.kerbWeight : null;
            return (
              <Card key={vehicle.id} className={`p-4 ${activeVehicleId === vehicle.id ? 'border-primary shadow-md' : ''}`}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                  <div className="flex-grow">
                    <h3 className="font-semibold font-body text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                    <div className="text-sm text-muted-foreground font-body grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                      <span>GVM: {vehicle.gvm}kg</span>
                      <span>GCM: {vehicle.gcm}kg</span>
                      <span>Tow: {vehicle.maxTowCapacity}kg</span>
                      <span>Towball: {vehicle.maxTowballMass}kg</span>
                      <span className="flex items-center"><Weight className="w-3 h-3 mr-1 text-primary/70"/> Kerb: {formatDimension(vehicle.kerbWeight)}</span>
                      {vehiclePayload !== null && <span className="flex items-center"><Backpack className="w-3 h-3 mr-1 text-primary/70"/> Payload: {vehiclePayload.toFixed(0)}kg</span>}
                      <span className="flex items-center"><Axe className="w-3 h-3 mr-1 text-primary/70 rotate-90"/> F Axle: {formatDimension(vehicle.frontAxleLimit)}</span>
                      <span className="flex items-center"><Axe className="w-3 h-3 mr-1 text-primary/70 -rotate-90"/> R Axle: {formatDimension(vehicle.rearAxleLimit)}</span>
                      <span className="flex items-center"><Ruler className="w-3 h-3 mr-1 text-primary/70"/> Wheelbase: {formatDimension(vehicle.wheelbase, 'mm')}</span>
                      <span className="flex items-center"><Ruler className="w-3 h-3 mr-1 text-primary/70"/> Height: {formatDimension(vehicle.overallHeight, 'mm')}</span>
                      <span className="flex items-center"><Fuel className="w-3 h-3 mr-1 text-primary/70"/> {vehicle.fuelEfficiency} Litres/100km</span>
                      <span className="flex items-center col-span-full sm:col-span-2"><Disc className="w-3 h-3 mr-1 text-primary/70"/> Tyre PSI: {vehicle.recommendedTyrePressureUnladenPsi ?? 'N/A'} (Unladen) / {vehicle.recommendedTyrePressureLadenPsi ?? 'N/A'} (Laden)</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center self-start sm:self-auto flex-shrink-0 mt-2 sm:mt-0">
                    {activeVehicleId !== vehicle.id && (
                      <Button variant="outline" size="sm" onClick={() => handleSetActiveVehicle(vehicle.id)} className="font-body whitespace-nowrap" disabled={setActiveVehicleMutation.isPending}>
                        {setActiveVehicleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4 text-green-500" />} Set Active
                      </Button>
                    )}
                     {activeVehicleId === vehicle.id && (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs h-8 w-full sm:w-auto flex items-center justify-center">
                        <CheckCircle className="mr-1 h-4 w-4" /> Active
                      </Badge>
                    )}
                    <div className="flex gap-1 w-full sm:w-auto">
                      <Button variant="ghost" size="sm" onClick={() => handleEditVehicle(vehicle)} className="font-body flex-grow sm:flex-grow-0">
                        <Edit3 className="h-4 w-4 sm:mr-1" /><span className="sm:hidden ml-1">Edit</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteVehicle(vehicle.id, `${vehicle.year} ${vehicle.make} ${vehicle.model}`)} className="font-body text-destructive hover:text-destructive hover:bg-destructive/10 flex-grow sm:flex-grow-0">
                        <Trash2 className="h-4 w-4 sm:mr-1" /><span className="sm:hidden ml-1">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <CardFooter className="p-0 pt-3 mt-3 border-t flex flex-col items-start space-y-3">
                  {vehicle.brakeControllerNotes && (
                    <div className="w-full">
                      <h4 className="text-sm font-semibold font-body mb-1 flex items-center"><Settings className="w-4 h-4 mr-2 text-primary"/>Brake Controller Notes:</h4>
                      <p className="text-xs font-body text-muted-foreground whitespace-pre-wrap pl-6">{vehicle.brakeControllerNotes}</p>
                    </div>
                  )}
                  {vehicle.storageLocations && vehicle.storageLocations.length > 0 && (
                  <div className="w-full">
                    <h4 className="text-sm font-semibold font-body mb-1.5 text-foreground flex items-center">
                      <PackagePlus className="w-4 h-4 mr-2 text-primary"/>Storage Locations:
                    </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                      {vehicle.storageLocations.map(loc => (
                        <div key={loc.id} className="p-3 border rounded-lg bg-card shadow-sm">
                          <h5 className="font-semibold font-body text-base flex items-center mb-1 text-primary">
                            <MapPin className="w-4 h-4 mr-2 text-accent" /> {loc.name}
                          </h5>
                          <div className="space-y-0.5 text-xs font-body text-muted-foreground">
                            <p><strong className="text-foreground/80">Position:</strong> {formatPositionText(loc)}</p>
                            <p><strong className="text-foreground/80">Max Capacity:</strong> {formatDimension(loc.maxWeightCapacityKg)}</p>
                            <p className="flex items-center"><ArrowLeftRight className="w-3 h-3 mr-1.5 text-primary/70" /> <strong className="text-foreground/80">Dist. from Rear Axle:</strong>&nbsp;{formatDimension(loc.distanceFromRearAxleMm, 'mm')}</p>
                            <p className="flex items-center"><ArrowUpDown className="w-3 h-3 mr-1.5 text-primary/70" /> <strong className="text-foreground/80">Dist. from Centerline:</strong>&nbsp;{formatDimension(loc.distanceFromCenterlineMm, 'mm')}</p>
                            <p className="flex items-center"><Ruler className="w-3 h-3 mr-1.5 text-primary/70" /> <strong className="text-foreground/80">Height from Ground:</strong>&nbsp;{formatDimension(loc.heightFromGroundMm, 'mm')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </CardFooter>
              </Card>
            )
          })}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogState.isOpen} onOpenChange={(isOpen) => setDeleteDialogState(prev => ({ ...prev, isOpen }))}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-headline text-destructive">Confirm Deletion</DialogTitle></DialogHeader>
          <div className="py-4">
            <p className="font-body">
              Are you sure you want to delete the vehicle: <strong>{deleteDialogState.vehicleName}</strong>?
              This action cannot be undone.
            </p>
            <p className="font-body mt-2">
              To confirm, please type "<strong>DELETE</strong>" in the box below.
            </p>
            <Input
              type="text"
              value={deleteDialogState.confirmationText}
              onChange={(e) => setDeleteDialogState(prev => ({ ...prev, confirmationText: e.target.value }))}
              placeholder='Type DELETE to confirm'
              className="mt-2 font-body"
              disabled={deleteVehicleMutation.isPending}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogState({ isOpen: false, vehicleId: null, vehicleName: null, confirmationText: '' })} className="font-body" disabled={deleteVehicleMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteVehicle}
              disabled={deleteDialogState.confirmationText !== "DELETE" || deleteVehicleMutation.isPending}
              className="font-body"
            >
              {deleteVehicleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

```
- src/middleware.ts:
```ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-url', request.url);

  return NextResponse.next({
    request: {
      // Apply new request headers
      headers: requestHeaders,
    },
  });
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

```
- src/types/tripplanner.ts:
```ts

import type { DateRange } from 'react-day-picker';
import type { ChecklistStage } from '@/types/checklist';
import type { BudgetCategory, Expense } from '@/types/expense';

export interface TripPlannerFormValues {
  startLocation: string;
  endLocation: string;
  fuelEfficiency: number; // Litres/100km
  fuelPrice: number; // Price per litre
  dateRange?: DateRange | null;
  maxHeight?: number;
}

export interface FuelStation {
  name: string;
  location: google.maps.LatLngLiteral;
}

export interface RouteDetails {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  startLocation?: google.maps.LatLngLiteral;
  endLocation?: google.maps.LatLngLiteral;
  polyline?: string;
  warnings?: string[];
  tollInfo?: { text: string; value: number } | null;
  fuelStations?: FuelStation[];
}

export interface FuelEstimate {
  fuelNeeded: string; // e.g., "10.0 L"
  estimatedCost: string; // e.g., "$20.00"
}

// Kept for potential future use with multi-stop routes
export interface Waypoint {
  address: string;
}

export interface Occupant {
  id: string;
  name: string;
  type: 'Adult' | 'Child' | 'Infant' | 'Pet';
  age?: number | null;
  weight: number; // in kg
  notes?: string | null;
}

export interface LoggedTrip {
  id: string;
  name: string;
  timestamp: string; // ISO string for date
  startLocationDisplay: string; // The string input by the user for start
  endLocationDisplay: string; // The string input by the user for end
  waypoints?: Waypoint[]; // Kept for future multi-stop implementation
  fuelEfficiency: number;
  fuelPrice: number;
  routeDetails: RouteDetails;
  fuelEstimate: FuelEstimate | null;
  plannedStartDate?: string | null; // Stored as ISO string
  plannedEndDate?: string | null; // Stored as ISO string
  notes?: string | null; // Optional notes field
  isCompleted?: boolean; // New field for completion status
  isVehicleOnly?: boolean; // New field to mark trips without a caravan
  checklists?: ChecklistStage[] | { preDeparture: any[]; campsiteSetup: any[]; packDown: any[]; }; // A trip can have its own checklist set, supports old and new format for migration
  
  // New fields for expense tracking
  budget?: BudgetCategory[];
  expenses?: Expense[];
  
  // New field for occupants
  occupants?: Occupant[];

  activeCaravanIdAtTimeOfCreation?: string | null;
  activeCaravanNameAtTimeOfCreation?: string | null;
  
  // New field for Journey association
  journeyId?: string | null;
}

// Key for localStorage
export const RECALLED_TRIP_DATA_KEY = 'kamperhub_recalled_trip_data';

```
- src/types/vehicle.ts:
```ts

export interface VehicleStorageLocation {
  id: string;
  name: string;
  longitudinalPosition: 'front-of-front-axle' | 'between-axles' | 'rear-of-rear-axle' | 'roof-center';
  lateralPosition: 'left' | 'center' | 'right';
  distanceFromRearAxleMm?: number | null; // Distance from rear axle: +ve towards front, -ve towards rear
  distanceFromCenterlineMm?: number | null; // Distance from centerline: +ve right, -ve left
  heightFromGroundMm?: number | null; // Height of CoG from ground
  maxWeightCapacityKg?: number | null; // Max weight this location can hold
}

export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  gvm: number; // Gross Vehicle Mass
  gcm: number; // Gross Combined Mass
  maxTowCapacity: number;
  maxTowballMass: number;
  fuelEfficiency: number; // Litres/100km
  kerbWeight?: number | null; // Weight of the vehicle with a full tank of fuel, without occupants or cargo
  frontAxleLimit?: number | null; // Max permissible load on the front axle
  rearAxleLimit?: number | null; // Max permissible load on the rear axle
  wheelbase?: number | null; // New: Vehicle wheelbase in mm
  overallHeight?: number | null;
  recommendedTyrePressureUnladenPsi?: number | null; // Pressure when not towing
  recommendedTyrePressureLadenPsi?: number | null; // Pressure when towing/loaded
  storageLocations?: VehicleStorageLocation[];
  brakeControllerNotes?: string | null; // New field for brake controller settings
}

export interface StoredVehicle extends VehicleFormData {
  id: string;
}

```
- tailwind.config.ts:
```ts
/** @type {import('tailwindcss').Config} */
import type {Config} from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        'xxs': '360px',
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1400px',
      },
    },
    fontSize: {
      xs: ['1rem', { lineHeight: '1.5rem' }],
      sm: ['1.125rem', { lineHeight: '1.75rem' }], // Changed from 0.875rem to 1.125rem (18px)
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    extend: {
      fontFamily: {
        body: ['Alegreya', 'serif'],
        headline: ['Belleza', 'sans-serif'],
        code: ['Source Code Pro', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {height: '0'},
          to: {height: 'var(--radix-accordion-content-height)'},
        },
        'accordion-up': {
          from: {height: 'var(--radix-accordion-content-height)'},
          to: {height: '0'},
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;

```
