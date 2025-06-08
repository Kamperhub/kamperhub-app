
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Caravan, Route, History, CheckSquare, BarChart3 } from 'lucide-react';
import type { LoggedTrip } from '@/types/tripplanner';
import { TRIP_LOG_STORAGE_KEY } from '@/types/tripplanner';
import { Button } from '@/components/ui/button';

interface TripStats {
  totalTrips: number;
  totalDistanceKm: number;
  completedTripsCount: number;
}

export default function DashboardPage() {
  const [tripStats, setTripStats] = useState<TripStats | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    setIsLoadingStats(true);
    try {
      const storedTripsJson = localStorage.getItem(TRIP_LOG_STORAGE_KEY);
      if (storedTripsJson) {
        const loggedTrips: LoggedTrip[] = JSON.parse(storedTripsJson);
        
        const totalTrips = loggedTrips.length;
        const totalDistanceKm = loggedTrips.reduce((sum, trip) => {
          const distance = trip.routeDetails?.distanceValue || 0;
          return sum + (distance / 1000); // Convert meters to km
        }, 0);
        const completedTripsCount = loggedTrips.filter(trip => trip.isCompleted).length;

        setTripStats({
          totalTrips,
          totalDistanceKm,
          completedTripsCount,
        });
      } else {
        setTripStats({ // Default stats if no trips logged
          totalTrips: 0,
          totalDistanceKm: 0,
          completedTripsCount: 0,
        });
      }
    } catch (e) {
      console.error("Error processing trip stats:", e);
      setTripStats(null); // Indicate error or allow fallback
    } finally {
      setIsLoadingStats(false);
    }
  }, [hasMounted]);
  
  if (!hasMounted) {
    // Show a basic loading state for initial mount
    return (
      <div className="space-y-8">
        <header className="text-center py-8">
          <Caravan className="h-16 w-16 mx-auto text-primary mb-4 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-headline text-primary mb-2">Welcome to KamperHub</h1>
          <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            Loading your dashboard...
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="text-center py-8">
        <Caravan className="h-16 w-16 mx-auto text-primary mb-4" />
        <h1 className="text-4xl md:text-5xl font-headline text-primary mb-2">Welcome to KamperHub</h1>
        <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
          Your ultimate caravanning companion. See your trip achievements below!
        </p>
      </header>

      <section>
        <h2 className="text-3xl font-headline text-center mb-8 text-primary flex items-center justify-center">
            <BarChart3 className="w-8 h-8 mr-3 text-accent" />
            Your Journey So Far
        </h2>
        {isLoadingStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-10 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mt-2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoadingStats && tripStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-body">Total Trips Logged</CardTitle>
                <History className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-headline text-primary">{tripStats.totalTrips}</div>
                <p className="text-xs text-muted-foreground font-body">
                  Keep exploring and logging your adventures!
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-body">Total Kilometers Travelled</CardTitle>
                <Route className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-headline text-primary">{tripStats.totalDistanceKm.toFixed(0)} km</div>
                <p className="text-xs text-muted-foreground font-body">
                  Every kilometer tells a story.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-body">Trips Completed</CardTitle>
                <CheckSquare className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-headline text-primary">{tripStats.completedTripsCount}</div>
                <p className="text-xs text-muted-foreground font-body">
                  Successfully concluded adventures.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {!isLoadingStats && tripStats?.totalTrips === 0 && (
            <Card className="col-span-full text-center py-10 shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-primary">Ready for Adventure?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="font-body text-muted-foreground">
                        You haven't logged any trips yet. It's time to start planning your first journey!
                    </p>
                    <Link href="/tripplanner" passHref>
                        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-body">
                            <Route className="mr-2 h-4 w-4" /> Plan Your First Trip
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        )}

        {!isLoadingStats && !tripStats && (
            <Card className="col-span-full text-center py-10 shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-destructive">Oops!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="font-body text-muted-foreground">
                        Could not load your trip statistics at the moment. Please try again later.
                    </p>
                </CardContent>
            </Card>
        )}
      </section>
    </div>
  );
}
