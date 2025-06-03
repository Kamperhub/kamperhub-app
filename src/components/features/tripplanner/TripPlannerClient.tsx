
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler, Controller, type Control, type UseFormSetValue, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TripPlannerFormValues, RouteDetails, FuelEstimate } from '@/types/tripplanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Loader2, RouteIcon, Fuel, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const tripPlannerSchema = z.object({
  startLocation: z.string().min(3, "Start location is required (min 3 chars)"),
  endLocation: z.string().min(3, "End location is required (min 3 chars)"),
  fuelEfficiency: z.coerce.number().positive("Fuel efficiency must be a positive number (L/100km)"),
  fuelPrice: z.coerce.number().positive("Fuel price must be a positive number (per liter)"),
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
    console.log(`[KamperHub Autocomplete ${name}] useEffect triggered. isGoogleApiReady: ${isGoogleApiReady}, inputRef.current: ${!!inputRef.current}`);

    if (!isGoogleApiReady || !inputRef.current) {
      if (!isGoogleApiReady) console.log(`[KamperHub Autocomplete ${name}] Google API not ready yet.`);
      if (!inputRef.current) console.log(`[KamperHub Autocomplete ${name}] Input ref not available yet.`);
      return;
    }
    
    console.log('[KamperHub Autocomplete] Checking Google Maps API objects:');
    console.log('  window.google:', typeof window.google);
    if (typeof window.google !== 'undefined') {
      console.log('  window.google.maps:', typeof window.google.maps);
      if (typeof window.google.maps !== 'undefined') {
        console.log('  window.google.maps.places:', typeof window.google.maps.places);
        if (typeof window.google.maps.places !== 'undefined') {
          console.log('  window.google.maps.places.Autocomplete:', typeof window.google.maps.places.Autocomplete);
        }
      }
    }

    if (typeof window.google === 'undefined' || !window.google.maps || !window.google.maps.places || typeof window.google.maps.places.Autocomplete === 'undefined') {
        console.error('[KamperHub Autocomplete] Google Places Autocomplete service constructor is not available. Ensure "Places API" is enabled and the library (places) is loaded correctly via APIProvider.');
        return;
    }

    if (autocompleteRef.current) {
      console.log(`[KamperHub Autocomplete ${name}] Autocomplete instance already exists. Clearing listeners.`);
       if (typeof window.google.maps.event !== 'undefined' && autocompleteRef.current) {
           window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
       }
    }

    try {
      console.log(`[KamperHub Autocomplete ${name}] Initializing Google Places Autocomplete.`);
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ["formatted_address", "geometry", "name"],
        types: ["geocode"], 
      });
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        console.log(`[KamperHub Autocomplete ${name}] Place changed:`, place);
        if (place && place.formatted_address) {
          setValue(name, place.formatted_address, { shouldValidate: true, shouldDirty: true });
        } else if (inputRef.current) {
          setValue(name, inputRef.current.value, { shouldValidate: true, shouldDirty: true });
        }
      });
      console.log(`[KamperHub Autocomplete ${name}] Autocomplete initialized and listener added.`);

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
      console.log(`[KamperHub Autocomplete ${name}] Cleanup effect.`);
      if (currentInputRef) {
        currentInputRef.removeEventListener('keydown', onKeyDown);
      }
       if (autocompleteRef.current && typeof window.google !== 'undefined' && window.google.maps && window.google.maps.event) {
         console.log(`[KamperHub Autocomplete ${name}] Clearing instance listeners on cleanup.`);
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


export function TripPlannerClient() {
  const { control, handleSubmit, formState: { errors }, setValue } = useForm<TripPlannerFormValues>({
    resolver: zodResolver(tripPlannerSchema),
    defaultValues: {
      startLocation: '',
      endLocation: '',
      fuelEfficiency: 10,
      fuelPrice: 1.80,
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [fuelEstimate, setFuelEstimate] = useState<FuelEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const map = useMap(); 
  const isGoogleApiReady = !!map && typeof window.google !== 'undefined' && !!window.google.maps?.places && !!window.google.maps?.DirectionsService;

  useEffect(() => {
    console.log(`[KamperHub TripPlannerClient] isGoogleApiReady status: ${isGoogleApiReady}`);
  }, [isGoogleApiReady]);


  useEffect(() => {
    if (map && routeDetails?.startLocation && routeDetails.endLocation && typeof window.google !== 'undefined' && window.google.maps) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(routeDetails.startLocation);
      bounds.extend(routeDetails.endLocation);
      map.fitBounds(bounds);
      const currentZoom = map.getZoom();
      if (currentZoom && currentZoom > 15) {
        map.setZoom(15);
      } else if (currentZoom) {
         map.setZoom(Math.max(2, currentZoom -1)); 
      }
    } else if (map && routeDetails?.startLocation) {
        map.setCenter(routeDetails.startLocation);
        map.setZoom(12);
    } else if (map && routeDetails?.endLocation) {
        map.setCenter(routeDetails.endLocation);
        map.setZoom(12);
    }
  }, [routeDetails, map]);


  const onSubmit: SubmitHandler<TripPlannerFormValues> = async (data) => {
    if (!map || typeof window.google === 'undefined' || !window.google.maps || !window.google.maps.DirectionsService) {
      setError("Map service is not fully available for routing. Please try again shortly.");
      console.error("[KamperHub TripPlannerClient] DirectionsService not available for onSubmit.");
      return;
    }
    console.log("[KamperHub TripPlannerClient] Attempting to calculate route using DirectionsService for:", data);
    setIsLoading(true);
    setError(null);
    setRouteDetails(null);
    setFuelEstimate(null);

    const directionsService = new window.google.maps.DirectionsService();

    try {
      const results = await directionsService.route({
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
      console.error("[KamperHub TripPlannerClient] Directions request failed:", e);
      if (e.code && typeof google !== 'undefined' && google.maps && google.maps.DirectionsStatus && e.code === google.maps.DirectionsStatus.ZERO_RESULTS) {
        setError("No routes found for the specified locations. Please try different addresses.");
      } else if (e.code && typeof google !== 'undefined' && google.maps && google.maps.DirectionsStatus && e.code === google.maps.DirectionsStatus.NOT_FOUND) {
        setError("One or both locations could not be geocoded. Please check the addresses.");
      } else {
        setError(`Error calculating route: ${e.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
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
                  mapId={'DEMO_MAP_ID'}
                  className="h-full w-full"
                >
                  {routeDetails?.startLocation && (
                    <AdvancedMarker position={routeDetails.startLocation} title={`Start: ${routeDetails.startAddress || ''}`}>
                      <Pin
                        background={'var(--accent)'}
                        borderColor={'var(--accent)'}
                        glyphColor={'white'}
                      />
                    </AdvancedMarker>
                  )}
                  {routeDetails?.endLocation && (
                    <AdvancedMarker position={routeDetails.endLocation} title={`End: ${routeDetails.endAddress || ''}`}>
                      <Pin
                        background={'var(--primary)'}
                        borderColor={'var(--primary)'}
                        glyphColor={'white'}
                      />
                    </AdvancedMarker>
                  )}
                </Map>
                {!map && (
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
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Fuel className="mr-2 h-6 w-6 text-primary" /> Trip Summary</CardTitle>
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
