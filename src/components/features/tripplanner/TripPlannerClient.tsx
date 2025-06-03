
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, type SubmitHandler, Controller, type Control, type UseFormSetValue, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TripPlannerFormValues, RouteDetails, FuelEstimate, LoggedTrip } from '@/types/tripplanner';
import { TRIP_LOG_STORAGE_KEY, RECALLED_TRIP_DATA_KEY } from '@/types/tripplanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Loader2, RouteIcon, Fuel, MapPin, Save, CalendarDays } from 'lucide-react';
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

const tripPlannerSchema = z.object({
  startLocation: z.string().min(3, "Start location is required (min 3 chars)"),
  endLocation: z.string().min(3, "End location is required (min 3 chars)"),
  fuelEfficiency: z.coerce.number().positive("Fuel efficiency must be a positive number (L/100km)"),
  fuelPrice: z.coerce.number().positive("Fuel price must be a positive number (per liter)"),
  plannedStartDate: z.date().optional().nullable(),
  plannedEndDate: z.date().optional().nullable(),
}).refine(data => {
  if (data.plannedStartDate && data.plannedEndDate) {
    return data.plannedEndDate >= data.plannedStartDate;
  }
  return true;
}, {
  message: "End date cannot be before start date",
  path: ["plannedEndDate"],
});

interface GooglePlacesAutocompleteInputProps {
  control: Control<TripPlannerFormValues>;
  name: "startLocation" | "endLocation";
  label: string;
  placeholder?: string;
  errors: FieldErrors<TripPlannerFormValues>;
  setValue: UseFormSetValue<TripPlannerFormValues>;
  isGoogleApiReady: boolean;
}

const GooglePlacesAutocompleteInput: React.FC<GooglePlacesAutocompleteInputProps> = ({
  control,
  name,
  label,
  placeholder,
  errors,
  setValue,
  isGoogleApiReady,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!isGoogleApiReady || !inputRef.current) {
      console.log(`[KamperHub Autocomplete ${name}] Bailing: isGoogleApiReady=${isGoogleApiReady}, inputRef.current=${!!inputRef.current}`);
      return;
    }
    console.log(`[KamperHub Autocomplete ${name}] Attempting to init. window.google:`, typeof window.google, `window.google.maps:`, typeof window.google?.maps, `window.google.maps.places:`, typeof window.google?.maps?.places, `window.google.maps.places.Autocomplete:`, typeof window.google?.maps?.places?.Autocomplete);
    
    if (typeof window.google === 'undefined' || !window.google.maps || !window.google.maps.places || typeof window.google.maps.places.Autocomplete === 'undefined') {
      console.error('[KamperHub Autocomplete] Google Places Autocomplete service constructor is not available.');
      return;
    }

    if (autocompleteRef.current && typeof window.google.maps.event !== 'undefined') {
       window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }

    try {
      console.log(`[KamperHub Autocomplete ${name}] Instantiating Autocomplete...`);
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ["formatted_address", "geometry", "name"],
        types: ["geocode"], 
      });
      autocompleteRef.current = autocomplete;
      console.log(`[KamperHub Autocomplete ${name}] Autocomplete instantiated.`);

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        console.log(`[KamperHub Autocomplete ${name}] Place changed:`, place);
        if (place && place.formatted_address) {
          setValue(name, place.formatted_address, { shouldValidate: true, shouldDirty: true });
        } else if (inputRef.current) {
          setValue(name, inputRef.current.value, { shouldValidate: true, shouldDirty: true });
        }
      });
    } catch (error) {
      console.error(`[KamperHub Autocomplete ${name}] Error initializing Google Places Autocomplete:`, error);
    }
    
    const currentInputRef = inputRef.current; 
    const onKeyDown = (event: KeyboardEvent) => {
      const pacContainer = document.querySelector('.pac-container');
      if (event.key === 'Enter' && pacContainer && getComputedStyle(pacContainer).display !== 'none') {
        event.preventDefault(); 
      }
    };

    if (currentInputRef) {
      currentInputRef.addEventListener('keydown', onKeyDown);
    }

    return () => {
      if (currentInputRef) {
        currentInputRef.removeEventListener('keydown', onKeyDown);
      }
       if (autocompleteRef.current && typeof window.google !== 'undefined' && window.google.maps && window.google.maps.event) {
         window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
       }
       autocompleteRef.current = null; 
    };
  }, [isGoogleApiReady, name, setValue]); 

  return (
    <div>
      <Label htmlFor={name} className="font-body">
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Input
            id={name}
            ref={(el) => {
              field.ref(el); 
              inputRef.current = el; 
            }}
            onChange={(e) => field.onChange(e.target.value)} 
            onBlur={field.onBlur}
            value={field.value || ''}
            placeholder={placeholder}
            className="font-body"
            autoComplete="off"
          />
        )}
      />
      {errors[name] && (
        <p className="text-sm text-destructive font-body mt-1">
          {errors[name]?.message}
        </p>
      )}
    </div>
  );
};

interface DatePickerProps {
  control: Control<TripPlannerFormValues>;
  name: "plannedStartDate" | "plannedEndDate";
  label: string;
  errors: FieldErrors<TripPlannerFormValues>;
}

const FormDatePicker: React.FC<DatePickerProps> = ({ control, name, label, errors }) => {
  return (
    <div>
      <Label htmlFor={name} className="font-body">{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                id={name}
                className={cn(
                  "w-full justify-start text-left font-normal font-body",
                  !field.value && "text-muted-foreground"
                )}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={field.value || undefined}
                onSelect={(date) => field.onChange(date || null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
      />
      {errors[name] && (
        <p className="text-sm text-destructive font-body mt-1">
          {errors[name]?.message}
        </p>
      )}
      {name === 'plannedEndDate' && errors.root?.message && (
         <p className="text-sm text-destructive font-body mt-1">
          {errors.root.message}
        </p>
      )}
    </div>
  );
};


export function TripPlannerClient() {
  const { control, handleSubmit, formState: { errors }, setValue, getValues, reset } = useForm<TripPlannerFormValues>({
    resolver: zodResolver(tripPlannerSchema),
    defaultValues: {
      startLocation: '',
      endLocation: '',
      fuelEfficiency: 10,
      fuelPrice: 1.80,
      plannedStartDate: null,
      plannedEndDate: null,
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [fuelEstimate, setFuelEstimate] = useState<FuelEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const { toast } = useToast();
  
  const map = useMap(); 
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const isGoogleApiReady = !!map && 
                           typeof window.google !== 'undefined' && 
                           !!window.google.maps?.places?.Autocomplete && 
                           !!window.google.maps?.DirectionsService;


  useEffect(() => {
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
            plannedStartDate: recalledTrip.plannedStartDate ? parseISO(recalledTrip.plannedStartDate) : null,
            plannedEndDate: recalledTrip.plannedEndDate ? parseISO(recalledTrip.plannedEndDate) : null,
          });
          setRouteDetails(recalledTrip.routeDetails);
          setFuelEstimate(recalledTrip.fuelEstimate);
          // Future: if DirectionsResult was stored, could setDirectionsResponse here for immediate polyline.
          // For now, user would need to replan to see polyline.

          localStorage.removeItem(RECALLED_TRIP_DATA_KEY);
          toast({ title: "Trip Recalled", description: `"${recalledTrip.name}" loaded into planner.` });
        }
      } catch (e) {
        console.error("Error loading recalled trip data:", e);
        toast({ title: "Error", description: "Could not load recalled trip data.", variant: "destructive" });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, toast]); // setValue / getValues are stable, map is not part of recalled data directly


  useEffect(() => {
    if (!map) return;
  
    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  
    if (directionsResponse && directionsResponse.routes && directionsResponse.routes.length > 0) {
      const route = directionsResponse.routes[0];
      
      if (route.overview_path && route.overview_path.length > 0 && window.google && window.google.maps) {
        const newPolyline = new window.google.maps.Polyline({
          path: route.overview_path,
          strokeColor: 'hsl(var(--primary))', // Using theme color
          strokeOpacity: 0.8,
          strokeWeight: 6,
        });
        newPolyline.setMap(map);
        polylineRef.current = newPolyline; // Store reference to the new polyline
      }
  
      // Fit map to route bounds
      if (route.bounds) {
        map.fitBounds(route.bounds);
        // Adjust zoom if it's too close for a long route, or too far for a short one
        const currentZoom = map.getZoom();
        if (currentZoom && route.legs.reduce((acc, leg) => acc + (leg.distance?.value || 0), 0) > 50000 && currentZoom > 12) { // Over 50km
          map.setZoom(12); 
        } else if (currentZoom && currentZoom > 15) {
          map.setZoom(15);
        }
      }
    } else if (routeDetails?.startLocation && routeDetails.endLocation && window.google && window.google.maps) {
      // If no directionsResponse (e.g., recalled trip without full route object), fit to start/end markers
      const bounds = new window.google.maps.LatLngBounds();
      if(routeDetails.startLocation) bounds.extend(routeDetails.startLocation);
      if(routeDetails.endLocation) bounds.extend(routeDetails.endLocation);
      map.fitBounds(bounds);
      const currentZoom = map.getZoom();
       if (currentZoom && currentZoom > 15) {
         map.setZoom(15); // Don't zoom in too far
      } else if (currentZoom && currentZoom < 3 ) { // Avoid zooming out too much
         map.setZoom(3);
      } else if (currentZoom) {
         map.setZoom(Math.max(2, currentZoom -1)); // Zoom out slightly from tight bounds
      }

    } else if (routeDetails?.startLocation) {
        map.setCenter(routeDetails.startLocation);
        map.setZoom(12);
    } else if (routeDetails?.endLocation) {
        map.setCenter(routeDetails.endLocation);
        map.setZoom(12);
    }
  
    // Cleanup function to remove polyline when component unmounts or dependencies change
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, directionsResponse, routeDetails]); // Rerun when map, directionsResponse, or basic routeDetails change


  const onSubmit: SubmitHandler<TripPlannerFormValues> = async (data) => {
    console.log("[KamperHub TripPlannerClient] onSubmit called with data:", data);
    if (!map || typeof window.google === 'undefined' || !window.google.maps || !window.google.maps.DirectionsService) {
      setError("Map service is not fully available for routing. Please try again shortly.");
      console.error("[KamperHub TripPlannerClient] DirectionsService not available.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setRouteDetails(null);
    setFuelEstimate(null);
    setDirectionsResponse(null); // Clear previous full response
    console.log("[KamperHub TripPlannerClient] Attempting to call DirectionsService.route..."); // Legacy API check log

    const directionsService = new window.google.maps.DirectionsService();

    try {
      const results = await directionsService.route({
        origin: data.startLocation,
        destination: data.endLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      console.log("[KamperHub TripPlannerClient] DirectionsService.route results:", results);

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
            startLocation: leg.start_location?.toJSON(), // Store as LatLngLiteral
            endLocation: leg.end_location?.toJSON() // Store as LatLngLiteral
          };
          setRouteDetails(currentRouteDetails);
          setDirectionsResponse(results); // Store the full response for polyline and bounds
          
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
           console.warn("[KamperHub TripPlannerClient] No valid leg found in route.");
        }
      } else {
        setError("No routes found. Please check your locations.");
        console.warn("[KamperHub TripPlannerClient] No routes found in DirectionsService response.");
      }
    } catch (e: any) {
      console.error("[KamperHub TripPlannerClient] Directions request failed:", e);
      // Check for specific Google Maps API error codes if possible
      const mapsStatus = typeof google !== 'undefined' && google.maps && google.maps.DirectionsStatus;
      if (mapsStatus && e.code === mapsStatus.ZERO_RESULTS) {
        setError("No routes found for the specified locations. Please try different addresses.");
      } else if (mapsStatus && e.code === mapsStatus.NOT_FOUND) {
        setError("One or both locations could not be geocoded. Please check the addresses.");
      } else if (e.message && e.message.includes("Legacy API")) { // Check for legacy API error text
        setError("Error: You’re calling a legacy API, which is not enabled for your project. Please enable Places API (New) or Routes API in your Google Cloud Console.");
      }
      else {
        setError(`Error calculating route: ${e.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTrip = () => {
    console.log("[KamperHub TripPlannerClient] handleSaveTrip function CALLED.");
    console.log("[KamperHub TripPlannerClient] Current routeDetails:", routeDetails);
    console.log("[KamperHub TripPlannerClient] Current form values:", getValues());

    if (!routeDetails) {
      console.error("[KamperHub TripPlannerClient] Save Aborted: routeDetails is falsy.");
      toast({ title: "Cannot Save", description: "No trip details to save. Please plan a trip first.", variant: "destructive" });
      return;
    }

    console.log("[KamperHub TripPlannerClient] Prompting for trip name...");
    const tripName = window.prompt("Enter a name for this trip:", `Trip to ${getValues("endLocation")}`);
    console.log("[KamperHub TripPlannerClient] Trip name from prompt:", tripName);

    if (!tripName) {
      console.log("[KamperHub TripPlannerClient] Save Aborted: No trip name provided or prompt cancelled.");
      return; 
    }

    const currentFormData = getValues();
    const newLoggedTrip: LoggedTrip = {
      id: Date.now().toString(),
      name: tripName,
      timestamp: new Date().toISOString(),
      startLocationDisplay: currentFormData.startLocation,
      endLocationDisplay: currentFormData.endLocation,
      fuelEfficiency: currentFormData.fuelEfficiency,
      fuelPrice: currentFormData.fuelPrice,
      routeDetails: routeDetails, // This includes LatLngLiteral for start/end
      fuelEstimate: fuelEstimate,
      plannedStartDate: currentFormData.plannedStartDate ? currentFormData.plannedStartDate.toISOString() : null,
      plannedEndDate: currentFormData.plannedEndDate ? currentFormData.plannedEndDate.toISOString() : null,
    };
    
    console.log("[KamperHub TripPlannerClient] Attempting to save trip to localStorage:", newLoggedTrip);
    try {
      const existingTripsJson = localStorage.getItem(TRIP_LOG_STORAGE_KEY);
      const existingTrips: LoggedTrip[] = existingTripsJson ? JSON.parse(existingTripsJson) : [];
      localStorage.setItem(TRIP_LOG_STORAGE_KEY, JSON.stringify([...existingTrips, newLoggedTrip]));
      console.log("[KamperHub TripPlannerClient] Trip saved successfully.");
      toast({ title: "Trip Saved!", description: `"${tripName}" has been added to your Trip Log.` });
    } catch (error) {
      console.error("[KamperHub TripPlannerClient] Error saving trip to localStorage:", error);
      toast({ title: "Error Saving Trip", description: "Could not save trip.", variant: "destructive" });
    }
  };

  const mapHeight = "400px";
  const defaultMapCenter = { lat: -33.8688, lng: 151.2093 }; // Sydney
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
              isGoogleApiReady={isGoogleApiReady}
            />
            <GooglePlacesAutocompleteInput
              control={control}
              name="endLocation"
              label="End Location"
              placeholder="e.g., Melbourne, VIC"
              errors={errors}
              setValue={setValue}
              isGoogleApiReady={isGoogleApiReady}
            />
            <FormDatePicker
              control={control}
              name="plannedStartDate"
              label="Planned Start Date"
              errors={errors}
            />
            <FormDatePicker
              control={control}
              name="plannedEndDate"
              label="Planned End Date"
              errors={errors}
            />
            <div>
              <Label htmlFor="fuelEfficiency" className="font-body">Vehicle Fuel Efficiency (L/100km)</Label>
              <Controller
                name="fuelEfficiency"
                control={control}
                render={({ field }) => (
                   <Input id="fuelEfficiency" type="number" step="0.1" {...field} value={field.value || ''} className="font-body" />
                )}
              />
              {errors.fuelEfficiency && <p className="text-sm text-destructive font-body mt-1">{errors.fuelEfficiency.message}</p>}
            </div>
            <div>
              <Label htmlFor="fuelPrice" className="font-body">Fuel Price (per liter)</Label>
               <Controller
                name="fuelPrice"
                control={control}
                render={({ field }) => (
                  <Input id="fuelPrice" type="number" step="0.01" {...field} value={field.value || ''} className="font-body" />
                )}
              />
              {errors.fuelPrice && <p className="text-sm text-destructive font-body mt-1">{errors.fuelPrice.message}</p>}
            </div>
            <Button type="submit" disabled={isLoading || !isGoogleApiReady} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Calculating...' : 'Plan Trip'}
            </Button>
            {!map && <p className="text-sm text-muted-foreground text-center font-body mt-2">Map services loading...</p>}
            {map && !isGoogleApiReady && <p className="text-sm text-muted-foreground text-center font-body mt-2">Places/Directions API services loading...</p>}
          </form>
        </CardContent>
      </Card>

      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><MapPin className="mr-2 h-6 w-6 text-primary" /> Route Map</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ height: mapHeight }} className="bg-muted rounded-b-lg overflow-hidden relative">
                <Map
                  defaultCenter={defaultMapCenter}
                  defaultZoom={defaultMapZoom}
                  gestureHandling={'greedy'}
                  disableDefaultUI={true}
                  mapId={'DEMO_MAP_ID'} // Ensure you have a Map ID or remove this prop for default map
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
                  {/* Polyline is now drawn via useEffect and native Google Maps API */}
                </Map>
                {!map && ( // Show loader if map instance isn't ready
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm rounded-b-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-2 font-body">Initializing Map...</p>
                    </div>
                )}
              </div>
          </CardContent>
        </Card>
        
        {error && (
          <Alert variant="destructive">
            <AlertTitle className="font-headline">Error</AlertTitle>
            <AlertDescription className="font-body">{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && !routeDetails && ( // Show skeleton when loading and no details yet
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-headline flex items-center"><Fuel className="mr-2 h-6 w-6 text-primary" /> Trip Summary</CardTitle>
              <Button 
                onClick={() => {
                  console.log('[KamperHub Button Click Test] Save Trip button clicked directly inline.');
                  // If the above log appears, then we can be more confident handleSaveTrip will be called.
                  handleSaveTrip(); 
                }}
                variant="outline" 
                size="sm" 
                className="font-body"
              >
                <Save className="mr-2 h-4 w-4" /> Save Trip
              </Button>
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
              {getValues("plannedStartDate") && (
                <div className="font-body"><strong>Planned Start:</strong> {format(getValues("plannedStartDate")!, "PPP")}</div>
              )}
              {getValues("plannedEndDate") && (
                <div className="font-body"><strong>Planned End:</strong> {format(getValues("plannedEndDate")!, "PPP")}</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

