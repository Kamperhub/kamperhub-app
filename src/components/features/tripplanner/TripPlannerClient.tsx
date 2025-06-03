
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
  mapServicesReady: boolean;
}

const GooglePlacesAutocompleteInput: React.FC<GooglePlacesAutocompleteInputProps> = ({
  control,
  name,
  label,
  placeholder,
  errors,
  setValue,
  mapServicesReady,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!mapServicesReady || !inputRef.current || typeof window.google === 'undefined' || !window.google.maps.places) {
      return;
    }

    if (autocompleteRef.current) {
      // Already initialized
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry", "name"],
      types: ["geocode"],
    });
    autocompleteRef.current = autocomplete;

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place && place.formatted_address) {
        setValue(name, place.formatted_address, { shouldValidate: true, shouldDirty: true });
      } else if (inputRef.current) {
        setValue(name, inputRef.current.value, { shouldValidate: true, shouldDirty: true });
      }
    });
    
    const onKeyDown = (event: KeyboardEvent) => {
        // Check if the Pacman container (autocomplete dropdown) is visible
        const pacContainer = document.querySelector('.pac-container');
        if (event.key === 'Enter' && pacContainer && getComputedStyle(pacContainer).display !== 'none') {
          event.preventDefault();
        }
      };
  
      const currentInputRef = inputRef.current;
      if (currentInputRef) {
        currentInputRef.addEventListener('keydown', onKeyDown);
      }
  
      return () => {
        if (currentInputRef) {
          currentInputRef.removeEventListener('keydown', onKeyDown);
        }
        // Clean up Google Maps event listeners if autocomplete was initialized
        if (autocompleteRef.current && typeof window.google !== 'undefined') {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };

  }, [name, setValue, mapServicesReady]);

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
            autoComplete="off" // Important for Google Places Autocomplete to work correctly
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
  const [mapServicesReady, setMapServicesReady] = useState(false);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: -33.8688, lng: 151.2093 });
  const [mapZoom, setMapZoom] = useState<number>(6);

  const map = useMap(); // Get map instance

  useEffect(() => {
    // Check if Google Maps API, DirectionsService and PlacesService are available
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.DirectionsService && window.google.maps.places) {
      setMapServicesReady(true);
    }
  }, []);

  useEffect(() => {
    if (map && routeDetails?.startLocation && routeDetails.endLocation) {
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
    if (!mapServicesReady || !map) {
      setError("Map service is not fully available. Please try again shortly.");
      return;
    }

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
      console.error("Directions request failed:", e);
      if (e.code === google.maps.DirectionsStatus.ZERO_RESULTS) {
        setError("No routes found for the specified locations. Please try different addresses.");
      } else if (e.code === google.maps.DirectionsStatus.NOT_FOUND) {
        setError("One or both locations could not be geocoded. Please check the addresses.");
      } else {
        setError(`Error calculating route: ${e.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const mapHeight = "400px";

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
              mapServicesReady={mapServicesReady}
            />
            <GooglePlacesAutocompleteInput
              control={control}
              name="endLocation"
              label="End Location"
              placeholder="e.g., Melbourne, VIC"
              errors={errors}
              setValue={setValue}
              mapServicesReady={mapServicesReady}
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
            <Button type="submit" disabled={isLoading || !mapServicesReady || !map} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Calculating...' : 'Plan Trip'}
            </Button>
            {(!mapServicesReady || !map) && <p className="text-sm text-muted-foreground text-center font-body mt-2">Map services loading...</p>}
          </form>
        </CardContent>
      </Card>

      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><MapPin className="mr-2 h-6 w-6 text-primary" /> Route Map</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {mapServicesReady && map ? (
              <div style={{ height: mapHeight }} className="bg-muted rounded-b-lg overflow-hidden">
                <Map
                  map={map} // Pass the map instance here
                  defaultCenter={mapCenter}
                  defaultZoom={mapZoom}
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
              </div>
            ) : (
              <div style={{ height: mapHeight }} className="flex items-center justify-center bg-muted rounded-b-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 <p className="ml-2 font-body">Loading map...</p>
              </div>
            )}
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
