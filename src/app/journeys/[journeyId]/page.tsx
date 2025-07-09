"use client";

import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { fetchJourneys, fetchTrips } from '@/lib/api-client';
import type { Journey } from '@/types/journey';
import type { LoggedTrip } from '@/types/tripplanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Map as MapIcon, Route, DollarSign, Fuel, Calendar, Edit, ChevronLeft, PlusCircle, Wand2, Loader2 } from 'lucide-react';
import { Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useMemo, useRef, useEffect, useContext, useState } from 'react';
import { NavigationContext } from '@/components/layout/AppShell';
import { 
  generateJourneyPackingPlan, 
  type JourneyPackingPlannerInput, 
  type JourneyPackingPlannerOutput 
} from '@/ai/flows/journey-packing-planner-flow';
import { useToast } from '@/hooks/use-toast';

const RouteRenderer = ({ polyline }: { polyline: string | null | undefined }) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }
    if (polyline && map && window.google?.maps?.geometry) {
      try {
        const decodedPath = window.google.maps.geometry.encoding.decodePath(polyline);
        const newPolyline = new window.google.maps.Polyline({
          path: decodedPath,
          strokeColor: `hsl(var(--primary))`,
          strokeOpacity: 0.7,
          strokeWeight: 5,
        });
        newPolyline.setMap(map);
        polylineRef.current = newPolyline;
      } catch (e) {
        console.error("Error decoding or drawing polyline:", e);
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

export default function JourneyDetailsPage() {
  const params = useParams();
  const journeyId = params.journeyId as string;
  const { user } = useAuth();
  const map = useMap();
  const router = useRouter();
  const navContext = useContext(NavigationContext);
  const { toast } = useToast();
  
  const [strategicPlan, setStrategicPlan] = useState<string | null>(null);

  const { data: journeys = [], isLoading: isLoadingJourneys } = useQuery<Journey[]>({
    queryKey: ['journeys', user?.uid],
    queryFn: fetchJourneys,
    enabled: !!user,
  });

  const { data: allTrips = [], isLoading: isLoadingTrips } = useQuery<LoggedTrip[]>({
    queryKey: ['trips', user?.uid],
    queryFn: fetchTrips,
    enabled: !!user,
  });

  const journey = useMemo(() => journeys.find(j => j.id === journeyId), [journeys, journeyId]);
  const tripsInJourney = useMemo(() => {
    if (!journey) return [];
    return allTrips.filter(trip => journey.tripIds.includes(trip.id)).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [journey, allTrips]);

  const { totalDistance, totalSpend, totalBudget } = useMemo(() => {
    let distance = 0;
    let spend = 0;
    let budget = 0;
    tripsInJourney.forEach(trip => {
      distance += trip.routeDetails?.distance?.value || 0;
      spend += trip.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      budget += trip.budget?.reduce((sum, cat) => sum + cat.budgetedAmount, 0) || 0;
    });
    return {
      totalDistance: (distance / 1000).toFixed(1),
      totalSpend: spend.toFixed(2),
      totalBudget: budget.toFixed(2),
    };
  }, [tripsInJourney]);
  
  const generatePlanMutation = useMutation({
    mutationFn: generateJourneyPackingPlan,
    onSuccess: (data: JourneyPackingPlannerOutput) => {
        setStrategicPlan(data.strategicAdvice);
        toast({ title: "Strategic Plan Generated!" });
    },
    onError: (error: Error) => {
        toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleGenerateStrategicPlan = () => {
    if (!journey || tripsInJourney.length === 0) {
        toast({ title: "Cannot Generate Plan", description: "Journey details are incomplete.", variant: "destructive" });
        return;
    }
    const firstTrip = tripsInJourney[0];
    const lastTrip = tripsInJourney[tripsInJourney.length - 1];
    if (!firstTrip.plannedStartDate || !lastTrip.plannedEndDate) {
      toast({ title: "Cannot Generate Plan", description: "The first and last trips in the journey must have planned dates.", variant: "destructive" });
      return;
    }
    const input: JourneyPackingPlannerInput = {
        journeyName: journey.name,
        journeyStartDate: firstTrip.plannedStartDate,
        journeyEndDate: lastTrip.plannedEndDate,
        locations: [
            firstTrip.startLocationDisplay,
            ...tripsInJourney.map(t => t.endLocationDisplay)
        ],
    };
    generatePlanMutation.mutate(input);
  };


   useEffect(() => {
    if (map && tripsInJourney.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidPoints = false;
      tripsInJourney.forEach(trip => {
        if (trip.routeDetails.polyline) {
          try {
            const decodedPath = window.google.maps.geometry.encoding.decodePath(trip.routeDetails.polyline);
            decodedPath.forEach(point => bounds.extend(point));
            if(decodedPath.length > 0) hasValidPoints = true;
          } catch(e) {
            console.error("Could not decode path for bounds calculation", e);
          }
        }
      });
      if (hasValidPoints) {
        map.fitBounds(bounds, 100); // 100px padding
      }
    }
  }, [map, tripsInJourney]);

  const handleAddTripToJourney = () => {
    navContext?.setIsNavigating(true);
    router.push(`/trip-expense-planner?journeyId=${journeyId}`);
  };


  if (isLoadingJourneys || isLoadingTrips) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/3 mb-4" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    );
  }

  if (!journey) {
    return <div>Journey not found.</div>;
  }
  
  return (
    <div className="space-y-8">
      <Button asChild variant="link" className="p-0 h-auto font-body text-muted-foreground hover:text-primary -ml-1">
        <Link href="/journeys">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to All Journeys
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-headline mb-2 text-primary flex items-center">
          <MapIcon className="mr-3 h-8 w-8" /> {journey.name}
        </h1>
        <p className="text-muted-foreground font-body">
          {journey.description}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Journey Map</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div style={{ height: '450px' }} className="bg-muted rounded-b-lg overflow-hidden">
             <Map defaultCenter={{ lat: -25.2744, lng: 133.7751 }} defaultZoom={4} gestureHandling={'greedy'} disableDefaultUI={true} mapId={'JOURNEY_MAP_ID'} className="h-full w-full">
              {tripsInJourney.map(trip => (
                <RouteRenderer key={trip.id} polyline={trip.routeDetails.polyline} />
              ))}
              {tripsInJourney[0]?.routeDetails.startLocation && <AdvancedMarker position={tripsInJourney[0].routeDetails.startLocation}><Pin/></AdvancedMarker>}
            </Map>
          </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader><CardTitle>Journey Stats</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground flex items-center"><Route className="h-4 w-4 mr-2"/>Total Distance</p>
                <p className="text-2xl font-bold">{totalDistance} km</p>
            </div>
             <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground flex items-center"><Calendar className="h-4 w-4 mr-2"/>Total Trips</p>
                <p className="text-2xl font-bold">{journey.tripIds.length}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground flex items-center"><DollarSign className="h-4 w-4 mr-2"/>Total Spent</p>
                <p className="text-2xl font-bold">${totalSpend}</p>
            </div>
             <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground flex items-center"><Fuel className="h-4 w-4 mr-2"/>Total Budget</p>
                <p className="text-2xl font-bold">${totalBudget}</p>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wand2 className="mr-2 h-5 w-5 text-primary" />
            AI Strategic Packing Planner
          </CardTitle>
          <CardDescription>
            Get high-level advice on how to pack for your entire multi-leg journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerateStrategicPlan} disabled={generatePlanMutation.isPending}>
            {generatePlanMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            {generatePlanMutation.isPending ? 'Generating...' : 'Generate Strategic Plan'}
          </Button>
          
          {generatePlanMutation.isPending && (
            <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
          )}

          {strategicPlan && (
            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-body whitespace-pre-wrap">{strategicPlan}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Trips in this Journey</CardTitle>
                <Button variant="outline" size="sm" onClick={handleAddTripToJourney}>
                  <PlusCircle className="h-4 w-4 mr-2"/>Add New Trip to this Journey
                </Button>
            </div>
        </CardHeader>
        <CardContent>
           <div className="space-y-2">
            {tripsInJourney.length > 0 ? tripsInJourney.map((trip, index) => (
              <div key={trip.id} className="p-3 border rounded-md">
                <p className="font-semibold">{index + 1}. {trip.name}</p>
                <p className="text-sm text-muted-foreground">{trip.startLocationDisplay} to {trip.endLocationDisplay}</p>
              </div>
            )) : (
              <p className="text-center text-muted-foreground p-4">No trips have been added to this journey yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
