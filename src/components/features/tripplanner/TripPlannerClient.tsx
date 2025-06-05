
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, type SubmitHandler, Controller, type Control, type UseFormSetValue, type FieldErrors, FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePathname } from 'next/navigation';
import type { TripPlannerFormValues, RouteDetails, FuelEstimate, LoggedTrip } from '@/types/tripplanner';
import { TRIP_LOG_STORAGE_KEY, RECALLED_TRIP_DATA_KEY } from '@/types/tripplanner';
import type { StoredVehicle } from '@/types/vehicle';
import { VEHICLES_STORAGE_KEY, ACTIVE_VEHICLE_ID_KEY } from '@/types/vehicle';
import { Button } from '@/components/ui/button'; // Keep for other buttons
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Loader2, RouteIcon, Fuel, MapPin, Save, CalendarDays, Navigation, Search, StickyNote } from 'lucide-react';
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

const tripPlannerSchema = z.object({
  startLocation: z.string().min(3, "Start location is required (min 3 chars)"),
  endLocation: z.string().min(3, "End location is required (min 3 chars)"),
  fuelEfficiency: z.coerce.number().positive("Fuel efficiency must be a positive number (L/100km)"),
  fuelPrice: z.coerce.number().positive("Fuel price must be a positive number (per liter)"),
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
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [fuelEstimate, setFuelEstimate] = useState<FuelEstimate | null>(null);
  const [currentTripNotes, setCurrentTripNotes] = useState<string | null | undefined>(null);
  const [error, setError] = useState<string | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const { toast } = useToast();
  const pathname = usePathname();

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


  useEffect(() => {
    let recalledTripLoaded = false;
    if (typeof window !== 'undefined') {
      try {
        const recalledTripJson = localStorage.getItem(RECALLED_TRIP_DATA_KEY);
        if (recalledTripJson) {
          const recalledTrip: LoggedTrip = JSON.parse(recalledTripJson);
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
          setCurrentTripNotes(recalledTrip.notes);
          localStorage.removeItem(RECALLED_TRIP_DATA_KEY);
          toast({ title: "Trip Recalled", description: `"${recalledTrip.name}" loaded into planner.` });
          recalledTripLoaded = true;
        }
      } catch (e) {
        console.error("Error loading recalled trip data:", e);
        toast({ title: "Error", description: "Could not load recalled trip data.", variant: "destructive" });
      }

      if (!recalledTripLoaded) {
        try {
          const activeVehicleId = localStorage.getItem(ACTIVE_VEHICLE_ID_KEY);
          const storedVehiclesJson = localStorage.getItem(VEHICLES_STORAGE_KEY);
          if (activeVehicleId && storedVehiclesJson) {
            const storedVehicles: StoredVehicle[] = JSON.parse(storedVehiclesJson);
            const activeVehicle = storedVehicles.find(v => v.id === activeVehicleId);
            if (activeVehicle && typeof activeVehicle.fuelEfficiency === 'number') {
              if (getValues('fuelEfficiency') === 10) { 
                 setValue('fuelEfficiency', activeVehicle.fuelEfficiency, { shouldValidate: false });
              }
            }
          }
        } catch (e) {
          console.error("Error loading active vehicle data for Trip Planner:", e);
        }
      }
    }
  }, [reset, setValue, toast, pathname, getValues]); 


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

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (directionsResponse && directionsResponse.routes && directionsResponse.routes.length > 0 && window.google && window.google.maps) {
      const route = directionsResponse.routes[0];

      if (route.overview_path && route.overview_path.length > 0) {
        const newPolyline = new window.google.maps.Polyline({
          path: route.overview_path,
          strokeColor: 'hsl(var(--primary))',
          strokeOpacity: 0.8,
          strokeWeight: 6,
        });
        newPolyline.setMap(map);
        polylineRef.current = newPolyline;
      }

      if (route.bounds) {
        map.fitBounds(route.bounds);
        const currentZoom = map.getZoom();
        if (currentZoom && route.legs.reduce((acc, leg) => acc + (leg.distance?.value || 0), 0) > 50000 && currentZoom > 12) {
          map.setZoom(12);
        } else if (currentZoom && currentZoom > 15) {
          map.setZoom(15);
        }
      }
    } else if (routeDetails?.startLocation && routeDetails.endLocation && window.google && window.google.maps) {
      const bounds = new window.google.maps.LatLngBounds();
      if(routeDetails.startLocation) bounds.extend(routeDetails.startLocation);
      if(routeDetails.endLocation) bounds.extend(routeDetails.endLocation);
      map.fitBounds(bounds);
      const currentZoom = map.getZoom();
       if (currentZoom && currentZoom > 15) {
         map.setZoom(15);
      } else if (currentZoom && currentZoom < 3 ) {
         map.setZoom(3);
      } else if (currentZoom) {
         map.setZoom(Math.max(2, currentZoom -1)); 
      }

    } else if (routeDetails?.startLocation) {
        map.setCenter(routeDetails.startLocation);
        map.setZoom(12);
    } else if (routeDetails?.endLocation) {
        map.setCenter(routeDetails.endLocation);
        map.setZoom(12);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, directionsResponse, routeDetails]);


  const onSubmit: SubmitHandler<TripPlannerFormValues> = async (data) => {
    if (!directionsServiceRef.current) {
      setError("Map services (Directions) are not ready. Please try again shortly.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setRouteDetails(null);
    setFuelEstimate(null);
    setCurrentTripNotes(null); 
    setDirectionsResponse(null);
    setPointsOfInterest([]); 

    try {
      const results = await directionsServiceRef.current.route({
        origin: data.startLocation,
        destination: data.endLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });

      if (results.routes && results.routes.length > 0) {
        const route = results.routes[0];
        if (route.legs && route.legs.length > 0) {
          const leg = route.legs[0];
          const distanceValue = leg.distance?.value || 0;
          const currentRouteDetails: RouteDetails = {
            distance: leg.distance?.text || 'N/A',
            duration: leg.duration?.text || 'N/A',
            distanceValue: distanceValue,
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            startLocation: leg.start_location?.toJSON(),
            endLocation: leg.end_location?.toJSON()
          };
          setRouteDetails(currentRouteDetails);
          setDirectionsResponse(results);

          if (distanceValue > 0 && data.fuelEfficiency > 0) {
            const distanceKm = distanceValue / 1000;
            const fuelNeededLitres = (distanceKm / 100) * data.fuelEfficiency;
            const cost = fuelNeededLitres * data.fuelPrice;
            setFuelEstimate({
              fuelNeeded: `${fuelNeededLitres.toFixed(1)} L`,
              estimatedCost: `$${cost.toFixed(2)}`,
            });
          }
        } else {
           setError("Could not find a valid leg for the route.");
        }
      } else {
        setError("No routes found. Please check your locations.");
      }
    } catch (e: any) {
      console.error("Directions request failed:", e);
      const mapsStatus = typeof google !== 'undefined' && google.maps && google.maps.DirectionsStatus;
      if (mapsStatus && e.code === mapsStatus.ZERO_RESULTS) {
        setError("No routes found for the specified locations. Please try different addresses.");
      } else if (mapsStatus && e.code === mapsStatus.NOT_FOUND) {
        setError("One or both locations could not be geocoded. Please check the addresses.");
      } else if (e.message && e.message.includes("Legacy API")) {
        setError("Error: You’re calling a legacy API, which is not enabled for your project. Please enable Places API (New) or Routes API in your Google Cloud Console.");
      }
      else {
        setError(`Error calculating route: ${e.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: PENDING ISSUE - This button is not triggering the onClick handler.
  // Console.log at start of handleSaveTrip is not appearing.
  // Button visually enables correctly when routeDetails are present.
  // Investigate potential event conflicts or React rendering issues.
  const handleSaveTrip = useCallback(() => {
    console.log('handleSaveTrip called. routeDetails:', routeDetails); 
    alert('handleSaveTrip function was called!'); 

    if (!routeDetails) {
      toast({ title: "Cannot Save", description: "No trip details to save. Please plan a trip first.", variant: "destructive" });
      return;
    }

    const tripName = window.prompt("Enter a name for this trip:", `Trip to ${getValues("endLocation")}`);
    if (!tripName) return;

    const tripNotesPromptResult = window.prompt("Enter any notes for this trip (optional, max 500 characters suggested):", currentTripNotes || "");
    const tripNotes = tripNotesPromptResult === null ? undefined : tripNotesPromptResult;


    const currentFormData = getValues();
    const newLoggedTrip: LoggedTrip = {
      id: Date.now().toString(),
      name: tripName,
      timestamp: new Date().toISOString(),
      startLocationDisplay: currentFormData.startLocation,
      endLocationDisplay: currentFormData.endLocation,
      fuelEfficiency: currentFormData.fuelEfficiency,
      fuelPrice: currentFormData.fuelPrice,
      routeDetails: routeDetails,
      fuelEstimate: fuelEstimate,
      plannedStartDate: currentFormData.dateRange?.from ? currentFormData.dateRange.from.toISOString() : null,
      plannedEndDate: currentFormData.dateRange?.to ? currentFormData.dateRange.to.toISOString() : null,
      notes: tripNotes,
    };

    try {
      const existingTripsJson = localStorage.getItem(TRIP_LOG_STORAGE_KEY);
      const existingTrips: LoggedTrip[] = existingTripsJson ? JSON.parse(existingTripsJson) : [];
      localStorage.setItem(TRIP_LOG_STORAGE_KEY, JSON.stringify([...existingTrips, newLoggedTrip]));
      setCurrentTripNotes(newLoggedTrip.notes); 
      toast({ title: "Trip Saved!", description: `"${tripName}" has been added to your Trip Log.` });
    } catch (error) {
      console.error("Error saving trip to localStorage:", error);
      toast({ title: "Error Saving Trip", description: "Could not save trip.", variant: "destructive" });
    }
  }, [routeDetails, getValues, fuelEstimate, currentTripNotes, toast]);

  const handleNavigateWithGoogleMaps = () => {
    if (!routeDetails) {
      toast({ title: "Cannot Navigate", description: "Route details are incomplete.", variant: "destructive" });
      return;
    }

    let originQuery: string;
    let destinationQuery: string;

    if (routeDetails.startLocation && routeDetails.endLocation) {
      originQuery = `${routeDetails.startLocation.lat},${routeDetails.startLocation.lng}`;
      destinationQuery = `${routeDetails.endLocation.lat},${routeDetails.endLocation.lng}`;
    } else if (routeDetails.startAddress && routeDetails.endAddress) { 
      originQuery = encodeURIComponent(routeDetails.startAddress);
      destinationQuery = encodeURIComponent(routeDetails.endAddress);
    } else {
      toast({ title: "Cannot Navigate", description: "Origin or destination data is missing for navigation.", variant: "destructive" });
      return;
    }

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originQuery}&destination=${destinationQuery}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
    toast({ title: "Opening Google Maps", description: "Check the new tab for navigation." });
  };

  const handleFindPOIs = useCallback(() => {
    if (!map || !placesServiceRef.current) {
        toast({ title: "Map Not Ready", description: "Places service is not available yet.", variant: "destructive"});
        return;
    }
    const center = map.getCenter();
    if (!center) {
        toast({ title: "Map Center Not Found", description: "Could not get map center.", variant: "destructive"});
        return;
    }

    setIsSearchingPOIs(true);
    setPointsOfInterest([]); 

    const request: google.maps.places.PlaceSearchRequest = {
        location: center,
        radius: 5000, 
        type: 'tourist_attraction', 
    };

    placesServiceRef.current.nearbySearch(request, (results, status) => {
        setIsSearchingPOIs(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPointsOfInterest(results);
            if (results.length === 0) {
                toast({ title: "No Attractions Found", description: "No attractions found in the current map area."});
            } else {
                 toast({ title: "Attractions Found", description: `${results.length} attractions loaded on the map.`});
            }
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            toast({ title: "No Attractions Found", description: "No attractions found in the current map area."});
        } else {
            toast({ title: "Error Finding Attractions", description: `Could not fetch attractions: ${status}`, variant: "destructive"});
            console.error("Places API error:", status);
        }
    });
  }, [map, toast]);


  const mapHeight = "400px"; 
  const defaultMapCenter = { lat: -33.8688, lng: 151.2093 }; 
  const defaultMapZoom = 6;


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><RouteIcon className="mr-2 h-6 w-6 text-primary" /> Plan Your Trip</CardTitle>
          <CardDescription className="font-body">Enter your trip details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <GooglePlacesAutocompleteInput
              control={control}
              name="startLocation"
              label="Start Location"
              placeholder="e.g., Sydney, NSW"
              errors={errors}
              setValue={setValue}
              isApiReady={isGoogleApiReady}
            />
            <GooglePlacesAutocompleteInput
              control={control}
              name="endLocation"
              label="End Location"
              placeholder="e.g., Melbourne, VIC"
              errors={errors}
              setValue={setValue}
              isApiReady={isGoogleApiReady}
            />

            <div>
              <Label htmlFor="dateRange" className="font-body">Planned Date Range</Label>
              <Controller
                name="dateRange"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="dateRange"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal font-body",
                          !field.value?.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {field.value?.from ? (
                          field.value.to ? (
                            <>
                              {format(field.value.from, "LLL dd, yyyy")} - {format(field.value.to, "LLL dd, yyyy")}
                            </>
                          ) : (
                            format(field.value.from, "LLL dd, yyyy")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={field.value?.from}
                        selected={field.value as DateRange | undefined}
                        onSelect={field.onChange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.dateRange && (
                <p className="text-sm text-destructive font-body mt-1">
                  {errors.dateRange.message || (errors.dateRange as any)?.to?.message || (errors.dateRange as any)?.from?.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="fuelEfficiency" className="font-body">Vehicle Fuel Efficiency (L/100km)</Label>
              <Controller
                name="fuelEfficiency"
                control={control}
                render={({ field }) => (
                   <Input id="fuelEfficiency" type="number" step="0.1" {...field} value={field.value ?? ''} className="font-body" />
                )}
              />
              {errors.fuelEfficiency && <p className="text-sm text-destructive font-body mt-1">{errors.fuelEfficiency.message}</p>}
            </div>
            <div>
              <Label htmlFor="fuelPrice" className="font-body">Fuel Price (per liter)</Label>               <Controller
                name="fuelPrice"
                control={control}
                render={({ field }) => (
                  <Input id="fuelPrice" type="number" step="0.01" {...field} value={field.value ?? ''} className="font-body" />
                )}
              />
              {errors.fuelPrice && <p className="text-sm text-destructive font-body mt-1">{errors.fuelPrice.message}</p>}
            </div>
            <Button type="submit" disabled={isLoading || !isGoogleApiReady} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Calculating...' : 'Plan Trip'}
            </Button>
            {!map && <p className="text-sm text-muted-foreground text-center font-body mt-2">Map services loading...</p>}
            {map && !isGoogleApiReady && <p className="text-sm text-muted-foreground text-center font-body mt-2">API services (Places/Directions) loading...</p>}
          </form>
        </CardContent>
      </Card>

      <div className="md:col-span-2 space-y-6">
        <div className="relative"> 
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-headline flex items-center"><MapPin className="mr-2 h-6 w-6 text-primary" /> Route Map</CardTitle>
                {routeDetails && ( 
                    <Button
                        onClick={handleFindPOIs}
                        variant="outline"
                        size="sm"
                        className="font-body"
                        disabled={isSearchingPOIs || !isGoogleApiReady}
                    >
                        {isSearchingPOIs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        {isSearchingPOIs ? 'Searching...' : 'Nearby Attractions'}
                    </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div style={{ height: mapHeight }} className="bg-muted rounded-b-lg overflow-hidden relative">
                    <Map
                      defaultCenter={defaultMapCenter}
                      defaultZoom={defaultMapZoom}
                      gestureHandling={'greedy'}
                      disableDefaultUI={true}
                      mapId={'DEMO_MAP_ID'} 
                      className="h-full w-full" 
                    >
                      {routeDetails?.startLocation && (
                        <AdvancedMarker position={routeDetails.startLocation} title={`Start: ${routeDetails.startAddress || ''}`}>
                          <Pin
                            background={'hsl(var(--primary))'}
                            borderColor={'hsl(var(--primary))'}
                            glyphColor={'hsl(var(--primary-foreground))'}
                          />
                        </AdvancedMarker>
                      )}
                      {routeDetails?.endLocation && (
                        <AdvancedMarker position={routeDetails.endLocation} title={`End: ${routeDetails.endAddress || ''}`}>
                          <Pin
                            background={'hsl(var(--accent))'}
                            borderColor={'hsl(var(--accent))'}
                            glyphColor={'hsl(var(--accent-foreground))'}
                          />
                        </AdvancedMarker>
                      )}
                      {pointsOfInterest.map(poi => (
                        poi.geometry?.location && (
                            <AdvancedMarker
                                key={poi.place_id}
                                position={poi.geometry.location}
                                title={poi.name ?? undefined}
                            >
                                <Pin background={'#FFBF00'} borderColor={'#B8860B'} glyphColor={'#000000'} />
                            </AdvancedMarker>
                        )
                      ))}
                    </Map>
                    {(!map || (map && !isGoogleApiReady)) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm rounded-b-lg">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2 font-body">{(map && !isGoogleApiReady) ? "Loading API Services..." : "Initializing Map..."}</p>
                        </div>
                    )}
                  </div>
              </CardContent>
            </Card>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle className="font-headline">Error</AlertTitle>
            <AlertDescription className="font-body">{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && !routeDetails && ( 
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Trip Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        )}

        {routeDetails && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-x-2">
              <CardTitle className="font-headline flex items-center"><Fuel className="mr-2 h-6 w-6 text-primary" /> Trip Summary</CardTitle>
                <div className="flex items-center gap-2 p-1 bg-yellow-300 border-2 border-yellow-500"> {/* Debugging: Visual parent */}
                    <Button
                        onClick={handleNavigateWithGoogleMaps}
                        variant="outline"
                        size="sm"
                        className="font-body"
                        disabled={!routeDetails}
                    >
                        <Navigation className="mr-2 h-4 w-4" /> Navigate
                    </Button>
                    {/* TODO: PENDING ISSUE - This button is not triggering the onClick handler. Reverted to raw HTML for testing. */}
                    <button
                        type="button" 
                        onClick={() => {
                            console.log('Raw HTML Save Trip Button Clicked! Test 3');
                            alert('Raw HTML Save Trip Button Clicked! Test 3');
                        }}
                        // disabled={!routeDetails} // Temporarily always enabled for this specific test
                        className={cn(
                            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            "h-9 px-3", 
                            "font-body bg-red-500 text-white border-4 border-red-800 hover:bg-red-600 p-2" // Debugging: Visual button with more padding
                        )}
                    >
                        <Save className="mr-2 h-4 w-4" /> Save Trip (Test)
                    </button>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-body"><strong>Distance:</strong> {routeDetails.distance}</div>
              <div className="font-body"><strong>Est. Duration:</strong> {routeDetails.duration}</div>
              {routeDetails.startAddress && <div className="font-body text-sm text-muted-foreground"><strong>From:</strong> {routeDetails.startAddress}</div>}
              {routeDetails.endAddress && <div className="font-body text-sm text-muted-foreground"><strong>To:</strong> {routeDetails.endAddress}</div>}
              {fuelEstimate && (
                <>
                  <div className="font-body"><strong>Est. Fuel Needed:</strong> {fuelEstimate.fuelNeeded}</div>
                  <div className="font-body"><strong>Est. Fuel Cost:</strong> {fuelEstimate.estimatedCost}</div>
                </>
              )}
              {getValues("dateRange")?.from && (
                <div className="font-body"><strong>Planned Start:</strong> {format(getValues("dateRange")!.from!, "PPP")}</div>
              )}
              {getValues("dateRange")?.to && (
                <div className="font-body"><strong>Planned End:</strong> {format(getValues("dateRange")!.to!, "PPP")}</div>
              )}
              {currentTripNotes && (
                <div className="font-body mt-2 pt-2 border-t">
                  <strong className="font-semibold flex items-center"><StickyNote className="mr-2 h-4 w-4 text-primary" />Notes:</strong>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-6">{currentTripNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
    