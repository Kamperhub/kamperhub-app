
"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { fetchAllVehicleData } from '@/lib/api-client';
import { VehicleManager } from '@/components/features/vehicles/VehicleManager';
import { CaravanManager } from '@/components/features/vehicles/CaravanManager';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingSkeleton = () => (
  <div className="space-y-8">
    <Skeleton className="h-12 w-1/3" />
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
);

export default function VehiclesPage() {
  const { user, isAuthLoading } = useAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['allVehicleData', user?.uid],
    queryFn: fetchAllVehicleData,
    enabled: !!user && !isAuthLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const pageIsLoading = isLoading || isAuthLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary">Vehicle & Caravan Setup</h1>
        <p className="text-muted-foreground font-body mb-6">
          Manage your tow vehicles and caravans. Set one of each as active for use in trip planning and inventory calculations. Weight Distribution Hitch (WDH) details are now part of the caravan setup.
        </p>
      </div>

      {pageIsLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{(error as Error).message || "An unexpected error occurred while fetching your vehicle and caravan data."}</AlertDescription>
        </Alert>
      ) : (
        <>
          <VehicleManager 
            vehicles={data?.vehicles || []} 
            userPrefs={data?.userProfile || null}
          />
          <CaravanManager 
            caravans={data?.caravans || []} 
            userPrefs={data?.userProfile || null}
          />
        </>
      )}
    </div>
  );
}
