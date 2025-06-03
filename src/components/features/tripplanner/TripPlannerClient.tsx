
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TripPlannerFormValues, RouteDetails, FuelEstimate } from '@/types/tripplanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Loader2, RouteIcon, Fuel, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const tripPlannerSchema = z.object({
  startLocation: z.string().min(3, "Start location is required (min 3 chars)"),
  endLocation: z.string().min(3, "End location is required (min 3 chars)"),
  fuelEfficiency: z.coerce.number().positive("Fuel efficiency must be a positive number (L/100km)"),
  fuelPrice: z.coerce.number().positive("Fuel price must be a positive number (per liter)"),
});

export function TripPlannerClient() {
  const { register, handleSubmit, formState: { errors } } = useForm<TripPlannerFormValues>({
    resolver: zodResolver(tripPlannerSchema),
    defaultValues: {
      fuelEfficiency: 10, // Default to 10 L/100km
      fuelPrice: 1.80,   // Default to $1.80 per liter
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [fuelEstimate, setFuelEstimate] = useState<FuelEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: -33.8688, lng: 151.2093 }); // Default to Sydney
  const [mapZoom, setMapZoom] = useState<number>(6);

  const map = useMap();

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.google !== 'undefined') {
      setMapReady(true);
    }
  }, []);

  useEffect(() => {
    if (routeDetails?.startLocation && routeDetails?.endLocation && map) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(routeDetails.startLocation);
      bounds.extend(routeDetails.endLocation);
      map.fitBounds(bounds);
      // Adjust zoom if points are too close
      const currentZoom = map.getZoom();
      if (currentZoom && currentZoom > 15) {
        map.setZoom(15);
      } else if (currentZoom) {
        map.setZoom(Math.max(2, currentZoom -1)); // Zoom out slightly to ensure visibility
      }

    } else if (routeDetails?.startLocation && map) {
        map.setCenter(routeDetails.startLocation);
        map.setZoom(12);
    } else if (routeDetails?.endLocation && map) {
        map.setCenter(routeDetails.endLocation);
        map.setZoom(12);
    }
  }, [routeDetails, map]);


  const onSubmit: SubmitHandler<TripPlannerFormValues> = async (data) => {
    if (!mapReady || !window.google || !window.google.maps || !window.google.maps.DirectionsService) {
      setError("Map service is not available. Please try again shortly.");
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
          const distanceValue = leg.distance?.value || 0; // in meters
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
          
          // Calculate fuel
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
            <div>
              <Label htmlFor="startLocation" className="font-body">Start Location</Label>
              <Input id="startLocation" {...register("startLocation")} placeholder="e.g., Sydney, NSW" className="font-body" />
              {errors.startLocation && <p className="text-sm text-destructive font-body mt-1">{errors.startLocation.message}</p>}
            </div>
            <div>
              <Label htmlFor="endLocation" className="font-body">End Location</Label>
              <Input id="endLocation" {...register("endLocation")} placeholder="e.g., Melbourne, VIC" className="font-body" />
              {errors.endLocation && <p className="text-sm text-destructive font-body mt-1">{errors.endLocation.message}</p>}
            </div>
            <div>
              <Label htmlFor="fuelEfficiency" className="font-body">Vehicle Fuel Efficiency (L/100km)</Label>
              <Input id="fuelEfficiency" type="number" step="0.1" {...register("fuelEfficiency")} className="font-body" />
              {errors.fuelEfficiency && <p className="text-sm text-destructive font-body mt-1">{errors.fuelEfficiency.message}</p>}
            </div>
            <div>
              <Label htmlFor="fuelPrice" className="font-body">Fuel Price (per liter)</Label>
              <Input id="fuelPrice" type="number" step="0.01" {...register("fuelPrice")} className="font-body" />
              {errors.fuelPrice && <p className="text-sm text-destructive font-body mt-1">{errors.fuelPrice.message}</p>}
            </div>
            <Button type="submit" disabled={isLoading || !mapReady} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Calculating...' : 'Plan Trip'}
            </Button>
            {!mapReady && <p className="text-sm text-muted-foreground text-center font-body mt-2">Map services loading...</p>}
          </form>
        </CardContent>
      </Card>

      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><MapPin className="mr-2 h-6 w-6 text-primary" /> Route Map</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {mapReady ? (
              <div style={{ height: mapHeight }} className="bg-muted rounded-b-lg overflow-hidden">
                <Map
                  defaultCenter={mapCenter}
                  defaultZoom={mapZoom}
                  gestureHandling={'greedy'}
                  disableDefaultUI={true}
                  mapId={'DEMO_MAP_ID'} // Required for AdvancedMarker
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
