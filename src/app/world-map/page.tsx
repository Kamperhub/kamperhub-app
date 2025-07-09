
"use client";

import React, { useState, useMemo, useEffect, useRef, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { fetchTrips } from '@/lib/api-client';
import type { LoggedTrip } from '@/types/tripplanner';
import { Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { Globe as WorldMapIcon, Loader2, AlertTriangle, Route, ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NavigationContext } from '@/components/layout/AppShell';

const TripPolyline = ({ polyline }: { polyline: string }) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }
    if (map && window.google?.maps?.geometry) {
      try {
        const decodedPath = window.google.maps.geometry.encoding.decodePath(polyline);
        polylineRef.current = new window.google.maps.Polyline({
          path: decodedPath,
          strokeColor: `hsl(var(--accent))`,
          strokeOpacity: 0.7,
          strokeWeight: 4,
          clickable: false,
        });
        polylineRef.current.setMap(map);
      } catch (e) {
        console.error("Error drawing polyline:", e);
      }
    }
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [polyline, map]);

  return null;
};

export default function WorldMapPage() {
  const { user } = useAuth();
  const navContext = useContext(NavigationContext);
  const { data: trips = [], isLoading, error } = useQuery<LoggedTrip[]>({
    queryKey: ['trips', user?.uid],
    queryFn: fetchTrips,
    enabled: !!user,
  });

  const [activeTrip, setActiveTrip] = useState<LoggedTrip | null>(null);

  const handleNavigation = () => {
    if(navContext) navContext.setIsNavigating(true);
  };

  const handleMarkerClick = (trip: LoggedTrip) => {
    setActiveTrip(trip);
  };
  
  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/3 mb-4" />
            <Skeleton className="h-6 w-2/3 mb-6" />
            <Skeleton className="w-full h-[calc(100vh-300px)] min-h-[500px]" />
        </div>
    );
  }

  if (error) {
    return (
         <div className="space-y-8">
            <h1 className="text-3xl font-headline mb-2 text-primary flex items-center">
                <WorldMapIcon className="mr-3 h-8 w-8" /> World Map
            </h1>
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Trips</AlertTitle>
                <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
        </div>
    )
  }

  return (
    <div className="space-y-8">
        <Button asChild variant="link" className="p-0 h-auto font-body text-muted-foreground hover:text-primary -ml-1">
            <Link href="/trip-manager" onClick={handleNavigation}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Return to Trip Manager
            </Link>
        </Button>
        <h1 className="text-3xl font-headline mb-2 text-primary flex items-center">
            <WorldMapIcon className="mr-3 h-8 w-8" /> World Map
        </h1>
        <p className="text-muted-foreground font-body">
            An overview of all your logged trips. Click a marker to see details.
        </p>
        
        {trips.length === 0 ? (
            <Alert className="text-center py-10">
                <Route className="mx-auto h-12 w-12 text-muted-foreground"/>
                <AlertTitle className="mt-4 font-headline text-lg">No Trips to Display</AlertTitle>
                <AlertDescription className="mt-2">
                    Once you plan and save trips, they will appear here on your global map.
                    <Button asChild variant="link" className="mt-2">
                        <Link href="/trip-expense-planner" onClick={handleNavigation}>Plan Your First Trip</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        ) : (
            <Card className="w-full h-[calc(100vh-300px)] min-h-[500px] overflow-hidden">
                <Map defaultCenter={{ lat: -25.2744, lng: 133.7751 }} defaultZoom={4} gestureHandling={'greedy'} disableDefaultUI={true} mapId={'WORLD_MAP_ID'} className="h-full w-full rounded-lg">
                    {trips.map(trip => (
                        <React.Fragment key={trip.id}>
                            {trip.routeDetails?.polyline && <TripPolyline polyline={trip.routeDetails.polyline} />}
                            {trip.routeDetails?.startLocation && (
                                <AdvancedMarker position={trip.routeDetails.startLocation} onClick={() => handleMarkerClick(trip)}>
                                    <Pin />
                                </AdvancedMarker>
                            )}
                        </React.Fragment>
                    ))}

                    {activeTrip && activeTrip.routeDetails.startLocation && (
                        <InfoWindow position={activeTrip.routeDetails.startLocation} onCloseClick={() => setActiveTrip(null)} minWidth={200}>
                            <div className="p-1 font-body">
                                <h3 className="font-bold font-headline text-lg text-primary">{activeTrip.name}</h3>
                                <p className="text-sm text-muted-foreground">{activeTrip.startLocationDisplay} to {activeTrip.endLocationDisplay}</p>
                                <p className="text-xs mt-1">{activeTrip.routeDetails.distance.text} | {activeTrip.routeDetails.duration.text}</p>
                            </div>
                        </InfoWindow>
                    )}
                </Map>
            </Card>
        )}
    </div>
  );
}
