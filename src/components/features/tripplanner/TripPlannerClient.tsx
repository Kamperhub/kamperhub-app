
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePathname } from 'next/navigation';
import type { TripPlannerFormValues, RouteDetails, FuelEstimate, LoggedTrip, Occupant } from '@/types/tripplanner';
import { RECALLED_TRIP_DATA_KEY } from '@/types/tripplanner';
import type { StoredVehicle } from '@/types/vehicle';
import type { StoredCaravan } from '@/types/caravan';
import type { CaravanDefaultChecklistSet, ChecklistItem, ChecklistCategory, TripChecklistSet } from '@/types/checklist';
import { initialChecklists as globalDefaultChecklistTemplate, vehicleOnlyChecklists } from '@/types/checklist';
import type { BudgetCategory, Expense } from '@/types/expense';
import { BudgetTab } from '@/components/features/tripplanner/BudgetTab';
import { ExpenseTab } from '@/components/features/tripplanner/ExpenseTab';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Loader2, RouteIcon, Fuel, MapPin, Save, CalendarDays, Navigation, Search, StickyNote, Edit, DollarSign, Trash2, PlusCircle, Users, AlertTriangle, XCircle, Edit3, Car, Settings } from 'lucide-react';
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
import { createTrip, updateTrip, fetchUserPreferences, fetchVehicles, fetchCaravans } from '@/lib/api-client';
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

const createChecklistCopyForTrip = (items: readonly ChecklistItem[], tripId: string, categoryPrefix: string): ChecklistItem[] => {
  return items.map(item => ({ ...item, id: `trip${tripId.substring(0,4)}_${categoryPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` }));
};


export function TripPlannerClient() {
  const { control, handleSubmit, formState: { errors }, setValue, getValues, reset } = useForm<TripPlannerFormValues>({
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
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [fuelEstimate, setFuelEstimate] = useState<FuelEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const { toast } = useToast();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTrip, setActiveTrip] = useState<LoggedTrip | null>(null);
  const [tripBudget, setTripBudget] = useState<BudgetCategory[]>([]);
  const [tripExpenses, setTripExpenses] = useState<Expense[]>([]);
  const [tripOccupants, setTripOccupants] = useState<Occupant[]>([]);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);


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

  const [isSaveTripDialogOpen, setIsSaveTripDialogOpen] = useState(false);
  const [pendingTripName, setPendingTripName] = useState('');
  const [pendingTripNotes, setPendingTripNotes] = useState('');


  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const [pointsOfInterest, setPointsOfInterest] = useState<google.maps.places.PlaceResult[]>([]);
  const [isSearchingPOIs, setIsSearchingPOIs] = useState(false);


  const isGoogleApiReady = !!map &&
                           typeof window.google !== 'undefined' &&
                           !!window.google.maps?.places?.Autocomplete &&
                           !!window.google.maps?.DirectionsService &&
                           !!window.google.maps?.places?.PlacesService;

  const clearPlanner = useCallback((resetForm = true) => {
    if(resetForm) reset();
    setIsTowing(true);
    setRouteDetails(null);
    setFuelEstimate(null);
    setDirectionsResponse(null);
    setPointsOfInterest([]);
    setActiveTrip(null);
    setTripBudget([]);
    setTripExpenses([]);
    setTripOccupants([]);
    setPendingTripName('');
    setPendingTripNotes('');
  }, [reset]);

  useEffect(() => {
    let recalledTripLoaded = false;
    if (typeof window !== 'undefined') {
      try {
        const recalledTripJson = localStorage.getItem(RECALLED_TRIP_DATA_KEY);
        if (recalledTripJson) {
          const recalledTrip: LoggedTrip = JSON.parse(recalledTripJson);
          setActiveTrip(recalledTrip);
          setIsTowing(!recalledTrip.isVehicleOnly);
          setTripBudget(recalledTrip.budget || []);
          setTripExpenses(recalledTrip.expenses || []);
          setTripOccupants(recalledTrip.occupants || []);
          
          reset({
            startLocation: recalledTrip.startLocationDisplay,
            endLocation: recalledTrip.endLocationDisplay,
            fuelEfficiency: recalledTrip.fuelEfficiency,
            fuelPrice: recalledTrip.fuelPrice,
            dateRange: {
              from: recalledTrip.plannedStartDate ? parseISO(recalledTrip.plannedStartDate) : undefined,
              to: recalledTrip.plannedEndDate ? parseISO(recalledTrip.plannedEndDate) : undefined,
            }
          });
          setRouteDetails(recalledTrip.routeDetails);
          setFuelEstimate(recalledTrip.fuelEstimate);
          localStorage.removeItem(RECALLED_TRIP_DATA_KEY);
          toast({ title: "Trip Recalled", description: `"${recalledTrip.name}" loaded into planner.` });
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
  }, [reset, setValue, toast, pathname, getValues, userPrefs, allVehicles]); 


  useEffect(() => {
    if (map && typeof window.google !== 'undefined' && window.google.maps) {
        if (!directionsServiceRef.current && window.google.maps.DirectionsService) {
            directionsServiceRef.current = new window.google.maps.DirectionsService();
        }
        if (!placesServiceRef.current && window.google.maps.places && window.google.maps.places.PlacesService) {
            placesServiceRef.current = new window.google.maps.places.PlacesService(map);
        }
    }
  }, [map]);


  useEffect(() => {
    if (!map) return;
    if (polylineRef.current) polylineRef.current.setMap(null);
    if (directionsResponse?.routes?.length) {
      const route = directionsResponse.routes[0];
      if (route.overview_path) {
        const newPolyline = new window.google.maps.Polyline({ path: route.overview_path, strokeColor: 'hsl(var(--primary))', strokeOpacity: 0.8, strokeWeight: 6 });
        newPolyline.setMap(map);
        polylineRef.current = newPolyline;
      }
      if (route.bounds) map.fitBounds(route.bounds);
    }
    return () => { if (polylineRef.current) polylineRef.current.setMap(null); };
  }, [map, directionsResponse]);


  const onSubmit: SubmitHandler<TripPlannerFormValues> = async (data) => {
    if (!directionsServiceRef.current) {
      setError("Map services are not ready.");
      return;
    }

    setIsLoading(true);
    setRouteDetails(null);
    setFuelEstimate(null);
    setDirectionsResponse(null);
    setError(null);
    
    try {
      const results = await directionsServiceRef.current.route({ origin: data.startLocation, destination: data.endLocation, travelMode: window.google.maps.TravelMode.DRIVING });
      if (results.routes?.length) {
        const leg = results.routes[0].legs[0];
        const distanceValue = leg?.distance?.value || 0;
        setRouteDetails({
          distance: leg?.distance?.text || 'N/A',
          duration: leg?.duration?.text || 'N/A',
          distanceValue,
          startAddress: leg?.start_address, endAddress: leg?.end_address,
          startLocation: leg?.start_location?.toJSON(), endLocation: leg?.end_location?.toJSON()
        });
        setDirectionsResponse(results);

        if (tripOccupants.length === 0 && user) {
          const defaultDriver: Occupant = {
            id: `driver_${Date.now()}`,
            name: user.displayName || 'Driver',
            type: 'Adult',
            weight: 75,
          };
          setTripOccupants([defaultDriver]);
          toast({
            title: "Default Driver Added",
            description: "A default driver has been added. You can edit their details as needed.",
            duration: 6000,
          });
        }

        if (distanceValue > 0 && data.fuelEfficiency > 0) {
          const fuelNeeded = (distanceValue / 1000 / 100) * data.fuelEfficiency;
          const estimatedCost = fuelNeeded * data.fuelPrice;
          setFuelEstimate({ fuelNeeded: `${fuelNeeded.toFixed(1)} L`, estimatedCost: `$${estimatedCost.toFixed(2)}` });

          setTripBudget(prevBudget => {
            const newBudget = [...prevBudget];
            const fuelCategoryName = "Fuel";
            const existingFuelCategoryIndex = newBudget.findIndex(cat => cat.name.toLowerCase() === fuelCategoryName.toLowerCase());

            if (existingFuelCategoryIndex > -1) {
              newBudget[existingFuelCategoryIndex] = { ...newBudget[existingFuelCategoryIndex], budgetedAmount: estimatedCost };
            } else {
              newBudget.push({ id: `fuel_${Date.now()}`, name: fuelCategoryName, budgetedAmount: estimatedCost });
            }
            return newBudget;
          });
        }
      } else { setError("No routes found."); }
    } catch (e: any) { setError(`Error calculating route: ${e.message || 'Unknown error'}`); } 
    finally { setIsLoading(false); }
  };

  const createTripMutation = useMutation({
    mutationFn: createTrip,
    onSuccess: (savedTrip) => {
      queryClient.invalidateQueries({ queryKey: ['trips', user?.uid] });
      toast({ title: "Trip Saved!", description: `"${savedTrip.name}" has been added to your Trip Log.` });
      setIsSaveTripDialogOpen(false);
      clearPlanner();
    },
    onError: (error: Error) => toast({ title: "Save Failed", description: error.message, variant: "destructive" }),
  });
  
  const updateTripMutation = useMutation({
    mutationFn: updateTrip,
    onSuccess: (updatedTrip) => {
      queryClient.invalidateQueries({ queryKey: ['trips', user?.uid] });
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
    setPendingTripName(activeTrip?.name || `Trip to ${getValues("endLocation") || 'Destination'}`);
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
      });
      return;
    }

    const tempTripId = Date.now().toString();
    
    let sourceChecklistSet;
    if (isTowing) {
      sourceChecklistSet = userPrefs?.activeCaravanId && userPrefs.caravanDefaultChecklists?.[userPrefs.activeCaravanId]
        ? userPrefs.caravanDefaultChecklists[userPrefs.activeCaravanId]
        : globalDefaultChecklistTemplate;
    } else {
      sourceChecklistSet = vehicleOnlyChecklists;
    }

    const newTripChecklistSet: TripChecklistSet = {
      preDeparture: createChecklistCopyForTrip(sourceChecklistSet.preDeparture, tempTripId, 'pd'),
      campsiteSetup: createChecklistCopyForTrip(sourceChecklistSet.campsiteSetup, tempTripId, 'cs'),
      packDown: createChecklistCopyForTrip(sourceChecklistSet.packDown, tempTripId, 'pk'),
    };
    
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
      notes: pendingTripNotes.trim() || undefined,
      checklists: newTripChecklistSet,
      budget: tripBudget,
      expenses: tripExpenses,
      occupants: tripOccupants,
      isVehicleOnly: !isTowing,
      activeCaravanIdAtTimeOfCreation: isTowing ? (activeCaravan?.id || null) : null,
      activeCaravanNameAtTimeOfCreation: isTowing ? (activeCaravan ? `${activeCaravan.year} ${activeCaravan.make} ${activeCaravan.model}` : null) : null,
    };
    
    if (activeTrip) {
        updateTripMutation.mutate({ ...activeTrip, ...tripData });
        setIsSaveTripDialogOpen(false);
    } else {
        createTripMutation.mutate(tripData);
    }
  }, [routeDetails, getValues, fuelEstimate, toast, pendingTripName, pendingTripNotes, userPrefs, createTripMutation, updateTripMutation, activeTrip, tripBudget, tripExpenses, tripOccupants, allCaravans, isTowing]);


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
                  <CardTitle className="font-headline flex items-center"><RouteIcon className="mr-2 h-6 w-6 text-primary" /> Plan Route</CardTitle>
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
                      <Label htmlFor="towing-switch" className="font-body">Towing a caravan for this trip?</Label>
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
                    {routeDetails && tripOccupants.length === 0 && (
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
                  {(createTripMutation.isPending || updateTripMutation.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                  {activeTrip ? 'Update Trip Details' : 'Save Full Trip'}
              </Button>
              <Card><CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-headline flex items-center"><MapPin className="mr-2 h-6 w-6 text-primary" /> Route Map</CardTitle>
              </CardHeader><CardContent className="p-0"><div style={{ height: mapHeight }} className="bg-muted rounded-b-lg overflow-hidden relative">
                <Map defaultCenter={{ lat: -25.2744, lng: 133.7751 }} defaultZoom={4} gestureHandling={'greedy'} disableDefaultUI={true} mapId={'DEMO_MAP_ID'} className="h-full w-full">
                  {routeDetails?.startLocation && <AdvancedMarker position={routeDetails.startLocation} title={`Start: ${routeDetails.startAddress || ''}`}><Pin background={'hsl(var(--primary))'} borderColor={'hsl(var(--primary))'} glyphColor={'hsl(var(--primary-foreground))'} /></AdvancedMarker>}
                  {routeDetails?.endLocation && <AdvancedMarker position={routeDetails.endLocation} title={`End: ${routeDetails.endAddress || ''}`}><Pin background={'hsl(var(--accent))'} borderColor={'hsl(var(--accent))'} glyphColor={'hsl(var(--accent-foreground))'} /></AdvancedMarker>}
                </Map>
              </div></CardContent></Card>
              {error && <Alert variant="destructive"><AlertTitle className="font-headline">Error</AlertTitle><AlertDescription className="font-body">{error}</AlertDescription></Alert>}
              {isLoading && !routeDetails && <Card><CardHeader><CardTitle className="font-headline">Trip Summary</CardTitle></CardHeader><CardContent className="space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>}
              {routeDetails && <Card><CardHeader><CardTitle className="font-headline">Trip Summary</CardTitle></CardHeader><CardContent className="space-y-2">
                  <div className="font-body text-sm"><strong>Distance:</strong> {routeDetails.distance}</div>
                  <div className="font-body text-sm"><strong>Est. Duration:</strong> {routeDetails.duration}</div>
                  {fuelEstimate && <>
                    <div className="font-body text-sm"><strong>Est. Fuel Needed:</strong> {fuelEstimate.fuelNeeded}</div>
                    <div className="font-body text-sm"><strong>Est. Fuel Cost:</strong> {fuelEstimate.estimatedCost}</div>
                  </>}
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

// Occupant Manager Component
function OccupantManager({ occupants, onUpdate, disabled }: { occupants: Occupant[], onUpdate: (newOccupants: Occupant[]) => void, disabled?: boolean }) {
    const [editingOccupant, setEditingOccupant] = useState<Partial<Occupant> & { id?: string }>({});
    const [isEditing, setIsEditing] = useState(false);
    const { toast } = useToast();

    const handleEditClick = (occupant: Occupant) => {
        setEditingOccupant(occupant);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingOccupant({});
    };
    
    const handleInputChange = (field: keyof Occupant, value: any) => {
        setEditingOccupant(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveOccupant = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, type, weight } = editingOccupant;

        if (!name || !type || !weight || isNaN(Number(weight)) || Number(weight) < 0) {
            toast({ title: "Invalid Input", description: "Please provide a valid name, type, and non-negative weight.", variant: "destructive" });
            return;
        }

        const occupantData: Omit<Occupant, 'id'> = {
            name: name,
            type: type,
            weight: Number(weight),
            age: editingOccupant.age ? Number(editingOccupant.age) : null,
            notes: editingOccupant.notes || null,
        };

        if (editingOccupant.id) {
            const updatedOccupants = occupants.map(occ =>
                occ.id === editingOccupant.id ? { ...occ, ...occupantData } : occ
            );
            onUpdate(updatedOccupants);
            toast({ title: "Occupant Updated" });
        } else {
            const newOccupant: Occupant = { ...occupantData, id: Date.now().toString() };
            onUpdate([...occupants, newOccupant]);
            toast({ title: "Occupant Added" });
        }
        handleCancelEdit();
    };

    const handleDeleteOccupant = (id: string) => {
        onUpdate(occupants.filter(occ => occ.id !== id));
        toast({ title: "Occupant Removed" });
    };

    const totalWeight = useMemo(() => occupants.reduce((sum, occ) => sum + occ.weight, 0), [occupants]);

    return (
        <div className="space-y-4">
            <form onSubmit={handleSaveOccupant} className="space-y-3 p-3 border rounded-md bg-muted/20">
                <h4 className="font-semibold text-sm">{isEditing ? 'Edit Occupant' : 'Add New Occupant'}</h4>
                <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2"><Label htmlFor="occ-name" className="text-xs">Name*</Label><Input id="occ-name" value={editingOccupant.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g., Alex, Buddy" disabled={disabled} /></div>
                    <div><Label htmlFor="occ-type" className="text-xs">Type*</Label><Select value={editingOccupant.type} onValueChange={(v) => handleInputChange('type', v as Occupant['type'])} disabled={disabled}><SelectTrigger><SelectValue placeholder="Select type..."/></SelectTrigger><SelectContent><SelectItem value="Adult">Adult</SelectItem><SelectItem value="Child">Child</SelectItem><SelectItem value="Infant">Infant</SelectItem><SelectItem value="Pet">Pet</SelectItem></SelectContent></Select></div>
                    <div><Label htmlFor="occ-weight" className="text-xs">Weight (kg)*</Label><Input id="occ-weight" type="number" value={editingOccupant.weight || ''} onChange={(e) => handleInputChange('weight', e.target.value)} placeholder="e.g., 75" disabled={disabled} /></div>
                    <div><Label htmlFor="occ-age" className="text-xs">Age (Optional)</Label><Input id="occ-age" type="number" value={editingOccupant.age || ''} onChange={(e) => handleInputChange('age', e.target.value)} placeholder="e.g., 7" disabled={disabled} /></div>
                    <div className="col-span-2"><Label htmlFor="occ-notes" className="text-xs">Notes (Optional)</Label><Textarea id="occ-notes" value={editingOccupant.notes || ''} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder="e.g., Likes superheroes, Needs joint meds" disabled={disabled} /></div>
                </div>
                <div className="flex gap-2">
                    {isEditing && (<Button type="button" size="sm" variant="outline" className="w-full" onClick={handleCancelEdit} disabled={disabled}>Cancel</Button>)}
                    <Button type="submit" size="sm" className="w-full" disabled={disabled}><PlusCircle className="mr-2 h-4 w-4" /> {isEditing ? 'Update' : 'Add'}</Button>
                </div>
            </form>
            <div className="space-y-2">
                {occupants.map(occ => (
                    <div key={occ.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                        <div className="text-sm">
                            <span className="font-semibold">{occ.name}</span> <span className="text-xs">({occ.type})</span> - {occ.weight}kg
                            {occ.notes && <p className="text-xs text-muted-foreground">{occ.notes}</p>}
                        </div>
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditClick(occ)} disabled={disabled}><Edit3 className="h-4 w-4 text-blue-600" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteOccupant(occ.id)} disabled={disabled}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    </div>
                ))}
            </div>
            {totalWeight > 0 && <p className="text-sm font-semibold text-right">Total Occupant Weight: {totalWeight.toFixed(1)} kg</p>}
        </div>
    );
}
