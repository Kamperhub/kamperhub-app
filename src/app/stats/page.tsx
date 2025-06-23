"use client";

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { LoggedTrip } from '@/types/tripplanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Home, Route as RouteIcon, CalendarDays, CheckCircle, Award, Trophy, TrendingUp, AlertCircle, BarChart3, Loader2 } from 'lucide-react';
import { parseISO, differenceInCalendarDays, isValid } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { fetchTrips } from '@/lib/api-client';
import { auth } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

interface TripStats {
  totalTrips: number;
  totalKilometers: number;
  totalDaysOnRoad: number;
  completedTrips: number;
  averageDistancePerTrip: number;
  averageDurationPerTrip: number; // in days
  longestTripByDistance: LoggedTrip | null;
  longestTripByDuration: LoggedTrip | null;
}

export default function StatsPage() {
  const user = auth.currentUser;

  const { data: loggedTrips = [], isLoading, error } = useQuery<LoggedTrip[]>({
    queryKey: ['trips', user?.uid],
    queryFn: fetchTrips,
    enabled: !!user,
  });

  const stats: TripStats | null = useMemo(() => {
    if (!loggedTrips || loggedTrips.length === 0) {
      return {
        totalTrips: 0, totalKilometers: 0, totalDaysOnRoad: 0, completedTrips: 0,
        averageDistancePerTrip: 0, averageDurationPerTrip: 0,
        longestTripByDistance: null, longestTripByDuration: null,
      };
    }

    let totalKilometers = 0;
    let totalDaysOnRoad = 0;
    let completedTrips = 0;
    let longestDist = 0;
    let longestTripByDist: LoggedTrip | null = null;
    let longestDur = 0;
    let longestTripByDur: LoggedTrip | null = null;

    loggedTrips.forEach(trip => {
      totalKilometers += trip.routeDetails?.distanceValue / 1000 || 0;
      if (trip.isCompleted) {
        completedTrips++;
      }

      let durationDays = 0;
      if (trip.plannedStartDate && trip.plannedEndDate) {
        const startDate = parseISO(trip.plannedStartDate);
        const endDate = parseISO(trip.plannedEndDate);
        if (isValid(startDate) && isValid(endDate) && endDate >= startDate) {
          durationDays = differenceInCalendarDays(endDate, startDate) + 1;
          totalDaysOnRoad += durationDays;
        }
      } else if (trip.plannedStartDate) {
        durationDays = 1;
        totalDaysOnRoad += durationDays;
      }

      const currentDistance = trip.routeDetails?.distanceValue / 1000 || 0;
      if (currentDistance > longestDist) {
        longestDist = currentDistance;
        longestTripByDist = trip;
      }
      if (durationDays > longestDur) {
        longestDur = durationDays;
        longestTripByDur = trip;
      }
    });

    return {
      totalTrips: loggedTrips.length,
      totalKilometers: totalKilometers,
      totalDaysOnRoad: totalDaysOnRoad,
      completedTrips: completedTrips,
      averageDistancePerTrip: loggedTrips.length > 0 ? totalKilometers / loggedTrips.length : 0,
      averageDurationPerTrip: loggedTrips.length > 0 ? totalDaysOnRoad / loggedTrips.length : 0,
      longestTripByDistance: longestTripByDist,
      longestTripByDuration: longestTripByDur,
    };
  }, [loggedTrips]);

  const StatCard = ({ title, value, icon: Icon, unit = '', description }: { title: string, value: string | number, icon: React.ElementType, unit?: string, description?: string }) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium font-body">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-headline text-primary">{value}{unit && <span className="text-lg"> {unit}</span>}</div>
        {description && <p className="text-xs text-muted-foreground font-body">{description}</p>}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-headline mb-6 text-primary flex items-center">
          <BarChart3 className="mr-3 h-8 w-8" /> Travel Statistics
        </h1>
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 font-body text-lg">Loading trip stats from server...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[120px]" />)}
        </div>
        <Skeleton className="h-[200px] mt-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-headline mb-6 text-primary flex items-center">
           <BarChart3 className="mr-3 h-8 w-8" /> Travel Statistics
        </h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Stats</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats || stats.totalTrips === 0) {
    return (
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-headline mb-6 text-primary flex items-center justify-center">
          <BarChart3 className="mr-3 h-8 w-8" /> Travel Statistics
        </h1>
        <Card className="py-10">
            <CardContent className="flex flex-col items-center justify-center">
                <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-xl font-semibold font-body text-muted-foreground mb-2">No Trip Data Yet</p>
                <p className="text-sm text-muted-foreground font-body mb-4">
                    It looks like you haven't logged any trips. <br/>Start planning your adventures to see your stats here!
                </p>
                <Link href="/tripplanner" passHref>
                    <Button className="font-body bg-accent text-accent-foreground hover:bg-accent/90">
                        <RouteIcon className="mr-2 h-4 w-4" /> Plan Your First Trip
                    </Button>
                </Link>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-2 text-primary flex items-center">
          <BarChart3 className="mr-3 h-8 w-8" /> Travel Statistics
        </h1>
        <p className="text-muted-foreground font-body">
          A summary of your caravanning adventures logged in KamperHub.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Trips Logged" value={stats.totalTrips} icon={RouteIcon} />
        <StatCard title="Total Kilometers Travelled" value={stats.totalKilometers.toFixed(0)} unit="km" icon={TrendingUp} />
        <StatCard title="Total Days On Road" value={stats.totalDaysOnRoad} unit="days" icon={CalendarDays} />
        <StatCard title="Completed Trips" value={stats.completedTrips} icon={CheckCircle} description={`${stats.totalTrips > 0 ? ((stats.completedTrips / stats.totalTrips) * 100).toFixed(0) : 0}% of total`} />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title="Avg. Distance / Trip" value={stats.averageDistancePerTrip.toFixed(0)} unit="km" icon={RouteIcon} />
        <StatCard title="Avg. Duration / Trip" value={stats.averageDurationPerTrip.toFixed(1)} unit="days" icon={CalendarDays} />
      </div>

      { (stats.longestTripByDistance || stats.longestTripByDuration) &&
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary flex items-center"><Award className="mr-2 h-6 w-6" />Trip Milestones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.longestTripByDistance && (
              <div>
                <h3 className="text-md font-semibold font-body text-foreground">Longest Trip by Distance:</h3>
                <p className="text-sm text-muted-foreground font-body">
                  "{stats.longestTripByDistance.name}" - {stats.longestTripByDistance.routeDetails.distance} ({stats.longestTripByDistance.routeDetails.duration})
                </p>
              </div>
            )}
            {stats.longestTripByDuration && (
              <div>
                <h3 className="text-md font-semibold font-body text-foreground">Longest Trip by Duration:</h3>
                <p className="text-sm text-muted-foreground font-body">
                  "{stats.longestTripByDuration.name}" - 
                  {stats.longestTripByDuration.plannedStartDate && stats.longestTripByDuration.plannedEndDate && isValid(parseISO(stats.longestTripByDuration.plannedEndDate)) && isValid(parseISO(stats.longestTripByDuration.plannedStartDate)) ? 
                    `${differenceInCalendarDays(parseISO(stats.longestTripByDuration.plannedEndDate), parseISO(stats.longestTripByDuration.plannedStartDate)) + 1} days`
                    : "Duration details incomplete"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      }
    </div>
  );
}
